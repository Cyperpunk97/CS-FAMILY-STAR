import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || url.trim() === "") {
    return "https://ufzroumxehomggrxsoin.supabase.co";
  }
  return url.startsWith("http") ? url : `https://${url}`;
}

function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key || key.trim() === "") {
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmenJvdW14ZWhvbWdncnhzb2luIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzczMDAwMDAsImV4cCI6MjA5MjY3NjAwMH0.placeholder";
  }
  return key;
}

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export function createServerSupabase(): SupabaseClient {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
  return createClient(supabaseUrl, serviceRoleKey);
}
