'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simple demo login
    if (email === 'demo@fielddeskops.com' && password === 'demo12345') {
      localStorage.setItem('demo_user', 'true');
      localStorage.setItem('user_email', email);
      localStorage.setItem('user_name', 'Demo User');
      localStorage.setItem('subscription_tier', 'pro_trial');
      localStorage.setItem('trial_start', new Date().toISOString());
      localStorage.setItem('credits_remaining', '9999');
      
      alert('Demo login successful!');
      window.location.href = '/dashboard';
      return;
    }
    
    alert('Invalid credentials. Use demo@fielddeskops.com / demo12345');
    setLoading(false);
  };

  const handleDemoLogin = () => {
    setEmail('demo@fielddeskops.com');
    setPassword('demo12345');
    
    setTimeout(() => {
      handleLogin(new Event('submit'));
    }, 100);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#1a1a1a',
      color: 'white',
      padding: '1rem'
    }}>
      <div style={{ 
        maxWidth: '400px', 
        width: '100%',
        backgroundColor: '#262626',
        border: '1px solid #404040',
        borderRadius: '1rem',
        padding: '2rem'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '1rem' }}>FieldDeskOps Login</h1>
        
        <button 
          onClick={handleDemoLogin}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#FF6700',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            cursor: 'pointer'
          }}
        >
          Try Demo Account
        </button>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#1a1a1a',
                border: '1px solid #404040',
                color: 'white',
                borderRadius: '0.5rem'
              }}
              placeholder="demo@fielddeskops.com"
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#1a1a1a',
                border: '1px solid #404040',
                color: 'white',
                borderRadius: '0.5rem'
              }}
              placeholder="demo12345"
            />
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#1a1a1a',
              color: 'white',
              border: '1px solid #404040',
              borderRadius: '0.5rem',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '1rem', color: '#666' }}>
          Don't have an account? <a href="/auth/signup" style={{ color: '#FF6700' }}>Sign up</a>
        </p>
      </div>
    </div>
  );
}
