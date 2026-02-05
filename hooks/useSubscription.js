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
          logError("Subscription status auth failed", userError);
          return;
        }

        const user = userData?.user;
        if (!user) {
          return;
        }

        // Check the subscriptions table
        const { data, error } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          logError("Subscription status check failed", error);
          return;
        }

        // If status is 'pro' (or 'active'/'trialing' depending on your webhook logic), they are Pro.
        if (data && (data.status === 'pro' || data.status === 'active' || data.status === 'trialing')) {
          if (isMounted) setIsPro(true);
        } else {
          if (isMounted) setIsPro(false);
        }
      } catch (error) {
        logError("Subscription status check failed", error);
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
