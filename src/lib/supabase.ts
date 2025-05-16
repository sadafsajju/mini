'use client';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Make sure we have the required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your .env.local file.');
}

// Create a single supabase client for the entire application
export const supabase = createClient(
  supabaseUrl || 'https://vpuscntiyoimhernxigs.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwdXNjbnRpeW9pbWhlcm54aWdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MDU5NDksImV4cCI6MjA2Mjk4MTk0OX0.s-BhbKrjivci8sDfE176eBHKccFHVjoQRt3QRe7aUvA',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
