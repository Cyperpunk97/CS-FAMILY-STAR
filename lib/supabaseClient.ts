import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ufzroumxehomggrxsoin.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_p5XoEKQBWvIQ-OH0Zg7Ymw_Ed02JCok';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);