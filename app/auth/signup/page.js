'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  
  const handleSignUp = (e) => {
    e.preventDefault();
    localStorage.setItem('demo_user', 'true');
    localStorage.setItem('user_email', email);
    localStorage.setItem('user_name', 'New User');
    alert('Signup complete! (Demo mode)');
    router.push('/dashboard');
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Sign Up</h1>
      <form onSubmit={handleSignUp}>
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <button type="submit">Sign Up</button>
      </form>
      <a href="/auth/login">Already have an account? Login</a>
    </div>
  );
}
