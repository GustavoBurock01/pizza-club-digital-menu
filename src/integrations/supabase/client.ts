
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

// Use direct values for development, environment variables for production
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xpgsfovrxguphlvncgwn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwZ3Nmb3ZyeGd1cGhsdm5jZ3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NDU5MjgsImV4cCI6MjA2NTAyMTkyOH0.oAeHjwZ-JzP3OG_WebpFXb5tP3n9K3IdfHY4e6DLaTE';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  console.log('VITE_SUPABASE_URL:', supabaseUrl);
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '[PRESENT]' : '[MISSING]');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
