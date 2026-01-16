import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Only create client on the client side
  if (typeof window === 'undefined') {
    console.log('Supabase: Running on server, returning null');
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    console.log('URL exists:', !!supabaseUrl);
    console.log('Key exists:', !!supabaseKey);
    return null;
  }

  try {
    const client = createBrowserClient(supabaseUrl, supabaseKey);
    console.log('Supabase client created successfully');
    return client;
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    return null;
  }
}
