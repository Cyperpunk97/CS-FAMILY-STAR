/**
 * Minimal in-process sliding-window rate limiter.
 *
 * Honest about what this is: state lives in one server instance's memory, so on a
 * serverless platform each instance counts separately and a restart clears it. It
 * stops casual spam (someone holding down "Submit"), not a determined attacker.
 * The durable guards are the CHECK constraints and RLS policies in
 * `supabase/schema.sql`.
 */

const buckets = new Map<string, number[]>();

/** Stop the map growing without bound on a long-lived server. */
const MAX_TRACKED_KEYS = 10_000;

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;

  const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff);

  if (hits.length >= limit) {
    const retryAfterMs = hits[0] + windowMs - now;
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
  }

  hits.push(now);
  buckets.set(key, hits);

  if (buckets.size > MAX_TRACKED_KEYS) {
    for (const [k, times] of buckets) {
      if (times.every((t) => t <= cutoff)) buckets.delete(k);
    }
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Best-effort client identifier. `x-forwarded-for` is trivially spoofable, so this
 * is a throttle, not an identity — never use it for authorization.
 */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}
