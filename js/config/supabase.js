const SUPABASE_URL =
  "https://vshebymjzqobsotedyfg.supabase.co";

const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzaGVieW1qenFvYnNvdGVkeWZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NzU1NjAsImV4cCI6MjA5NzQ1MTU2MH0.mZPgqQ45FAh_gGwutoeKflHH-4sHqRBm2yoSILLEdMk";

export const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);