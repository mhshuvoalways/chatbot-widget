import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://rwxwoirsbpctwitawfsj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3eHdvaXJzYnBjdHdpdGF3ZnNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3OTIxNTEsImV4cCI6MjA2NDM2ODE1MX0.jpCLXhW7oLUH7_YYWzmpI3wEmAYgD1CG4Tp4cr1EMG0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
