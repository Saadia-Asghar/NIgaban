import { createClient } from "@supabase/supabase-js";

export const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = supabaseEnabled
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

