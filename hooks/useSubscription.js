import { useState, useEffect } from 'react';
import { createClient } from '../utils/supabase/client';

export function useSubscription() {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Check the subscriptions table
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .single();

      // If status is 'pro' (or 'active'/'trialing' depending on your webhook logic), they are Pro.
      if (data && (data.status === 'pro' || data.status === 'active' || data.status === 'trialing')) {
        setIsPro(true);
      } else {
        setIsPro(false);
      }
      
      setLoading(false);
    };

    checkStatus();
  }, []);

  return { isPro, loading };
}
