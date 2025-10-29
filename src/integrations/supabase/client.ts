import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dufbtyqoxhhpomgirrsv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1ZmJ0eXFveGhocG9tZ2lycnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNzY4NzQsImV4cCI6MjA3Njc1Mjg3NH0.kYWXqVhO3f_JZqH1qNY_EG6qM7xGq3pD_p7K6fF-KjI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
});
