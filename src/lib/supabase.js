import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://skueamqrkjakigmtnpuu.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrdWVhbXFya2pha2lnbXRucHV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4MDQ2NzIsImV4cCI6MjEwNzM4MDY3Mn0.eUKPWrKiHwApfwglY8grbncF3mWbDtL-q3Bqm8X2JQw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
