import { createBrowserClient } from '@supabase/ssr'
import { logError, logInfo } from '../../utils/logger'

export function createClient() {
  // Only create client on the client side
  if (typeof window === 'undefined') {
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    logError('Supabase client missing env vars', null, {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
    });
    return null;
  }

  try {
    const client = createBrowserClient(supabaseUrl, supabaseKey);
    logInfo('Supabase client created');
    return client;
  } catch (error) {
    logError('Supabase client creation failed', error);
    return null;
  }
}
