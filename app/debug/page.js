'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../lib/supabase/client';

export default function DebugPage() {
  const [authState, setAuthState] = useState({});
  const [localStorageState, setLocalStorageState] = useState({});

  const supabase = createClient();

  useEffect(() => {
    checkAuth();
    
    // Get localStorage state
    const demoUser = localStorage.getItem('demo_user');
    const userEmail = localStorage.getItem('user_email');
    
    setLocalStorageState({
      demo_user: demoUser,
      user_email: userEmail,
      allItems: { ...localStorage }
    });
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      
      setAuthState({
        user: user,
        error: null,
        hasUser: !!user
      });
    } catch (error) {
      setAuthState({
        user: null,
        error: error.message,
        hasUser: false
      });
    }
  };

  const clearAll = () => {
    localStorage.clear();
    supabase.auth.signOut();
    setAuthState({});
    setLocalStorageState({});
    alert('Cleared all auth data');
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Authentication Debug</h1>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#262626] p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4">Supabase Auth State</h2>
          <pre className="bg-[#1a1a1a] p-4 rounded-lg overflow-auto">
            {JSON.stringify(authState, null, 2)}
          </pre>
        </div>
        
        <div className="bg-[#262626] p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4">LocalStorage State</h2>
          <pre className="bg-[#1a1a1a] p-4 rounded-lg overflow-auto">
            {JSON.stringify(localStorageState, null, 2)}
          </pre>
        </div>
      </div>
      
      <div className="mt-6 space-y-4">
        <button 
          onClick={checkAuth}
          className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Refresh Auth State
        </button>
        
        <button 
          onClick={clearAll}
          className="ml-4 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700"
        >
          Clear All Auth Data
        </button>
        
        <div className="mt-6">
          <a href="/dashboard" className="text-[#FF6700] hover:underline">Go to Dashboard</a> | 
          <a href="/auth/login" className="ml-4 text-[#FF6700] hover:underline">Go to Login</a> | 
          <a href="/auth/signup" className="ml-4 text-[#FF6700] hover:underline">Go to Signup</a>
        </div>
      </div>
    </div>
  );
}
