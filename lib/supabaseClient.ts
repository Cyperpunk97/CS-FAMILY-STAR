import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getCleanUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ufzroumxehomggrxsoin.supabase.co";
  // Strip outer quotes and extra whitespace if present
  let cleaned = raw.replace(/^['"]|['"]$/g, "").trim();
  if (!cleaned.startsWith("http://") && !cleaned.startsWith("https://")) {
    cleaned = `https://${cleaned}`;
  }
  return cleaned;
}

function getCleanKey(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
  return raw.replace(/^['"]|['"]$/g, "").trim();
}

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!clientInstance) {
    clientInstance = createClient(getCleanUrl(), getCleanKey());
  }
  return clientInstance;
}

// Proxy exported as `supabase` so existing code like `supabase.from(...)` continues to work seamlessly
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop: keyof SupabaseClient) {
    const client = getSupabaseClient();
    const value = client[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export function createServerSupabase(): SupabaseClient {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || getCleanKey();
  const cleanServiceKey = serviceKey.replace(/^['"]|['"]$/g, "").trim();
  return createClient(getCleanUrl(), cleanServiceKey);
}
