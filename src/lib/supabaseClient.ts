import { createClient } from "@supabase/supabase-js";

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Dev-only warnings to surface misconfig quickly
if (process.env.NODE_ENV !== "production") {
  if (!url)  console.warn("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!key)  console.warn("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabase = createClient(url, key);
