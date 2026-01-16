'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../lib/supabase/client';

export default function SupabaseTestPage() {
  const [supabaseStatus, setSupabaseStatus] = useState('Checking...');
  const [envVars, setEnvVars] = useState({});

  useEffect(() => {
    // Check environment variables
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    setEnvVars({
      hasUrl: !!url,
      hasKey: !!key,
      urlLength: url?.length || 0,
      keyLength: key?.length || 0
    });

    if (!url || !key) {
      setSupabaseStatus('❌ Missing environment variables');
      return;
    }

    // Try to create Supabase client
    try {
      const supabase = createClient();
      if (supabase) {
        setSupabaseStatus('✅ Supabase client created successfully');
      } else {
        setSupabaseStatus('❌ Failed to create Supabase client');
      }
    } catch (error) {
      setSupabaseStatus(`❌ Error: ${error.message}`);
    }
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Supabase Test Page</h1>
      
      <h2>Status: {supabaseStatus}</h2>
      
      <h3>Environment Variables:</h3>
      <pre>{JSON.stringify(envVars, null, 2)}</pre>
      
      <h3>Next Steps:</h3>
      <ol>
        <li>Check if environment variables are set in Vercel</li>
        <li>Verify Supabase URL and Key are correct</li>
        <li>Test Supabase client creation</li>
      </ol>
      
      <a href="/">Back to Home</a>
    </div>
  );
}
