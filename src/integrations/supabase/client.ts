// Supabase client configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get Supabase credentials from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://commvqgpjibmtwwpissd.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvbW12cWdwamlibXR3d3Bpc3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMzc2MzMsImV4cCI6MjA2MTkxMzYzM30.z5qIDU337Y60zmyzNL8ZH2zlSZ4g_POOQWW447rnX6k";
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvbW12cWdwamlibXR3d3Bpc3NkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjMzNzYzMywiZXhwIjoyMDYxOTEzNjMzfQ.y7e3OYj4cGzRbkZGKKfG7dB8a5LMFeMEeVOK4ifG-IM";

// Log to help with debugging
console.log("Using Supabase URL:", SUPABASE_URL);
console.log("Using Supabase Key:", SUPABASE_ANON_KEY ? "Key is set (not showing full key)" : "Key is not set");

// Create the Supabase client with options
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

// Create an admin client with service role key for privileged operations
export const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Connection test removed to prevent creating test records on each load

// End of initialization