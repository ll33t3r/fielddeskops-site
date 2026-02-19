import { useEffect, useMemo, useState } from 'react';
import { createClient } from '../utils/supabase/client';
import { logError } from '../utils/logger';

export function useSubscription() {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let isMounted = true;

    const checkStatus = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError) {
          logError('Subscription status auth failed', userError);
          return;
        }

        const user = userData?.user;
        if (!user) {
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('subscription_status, subscription_tier')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          logError('Subscription status check failed', error);
          return;
        }

        const status = profile?.subscription_status || profile?.subscription_tier || 'free';
        const pro = status === 'paid' || status === 'pro' || status === 'trial';
        if (isMounted) setIsPro(pro);
      } catch (error) {
        logError('Subscription status check failed', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkStatus();
    return () => {
      isMounted = false;
    };
  }, [supabase]);

  return { isPro, loading };
}
