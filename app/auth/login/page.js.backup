'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { signInUser } from '../../../lib/supabase/utils';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // For demo account
      if (email === 'demo@fielddeskops.com' && password === 'demo12345') {
        localStorage.setItem('demo_user', 'true');
        localStorage.setItem('user_email', email);
        localStorage.setItem('user_name', 'Demo User');
        localStorage.setItem('subscription_tier', 'pro_trial');
        localStorage.setItem('trial_start', new Date().toISOString());
        localStorage.setItem('credits_remaining', '9999');
        
        console.log('Demo login successful');
        window.location.href = '/dashboard';
        return;
      }
      
      // Try Supabase login
      const { user, session } = await signInUser(email, password);
      
      if (user && session) {
        console.log('Supabase login successful:', user.email);
        
        // Also store in localStorage for compatibility
        localStorage.setItem('demo_user', 'true');
        localStorage.setItem('user_email', user.email);
        localStorage.setItem('user_name', user.user_metadata?.full_name || user.email.split('@')[0]);
        localStorage.setItem('subscription_tier', 'pro_trial');
        localStorage.setItem('credits_remaining', '9999');
        
        window.location.href = '/dashboard';
      } else {
        setError('Invalid credentials. Try demo@fielddeskops.com / demo12345');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid credentials. Try demo@fielddeskops.com / demo12345');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setEmail('demo@fielddeskops.com');
    setPassword('demo12345');
    
    // Use setTimeout to ensure state is updated
    setTimeout(() => {
      handleLogin();
    }, 100);
  };

  const handleTrialSignup = () => {
    router.push('/auth/signup?plan=pro_trial');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6700] to-orange-500 mb-4">
            <span className="text-2xl font-bold text-white">FD</span>
          </div>
          <h1 className="font-oswald text-3xl text-white mb-2">FieldDeskOps</h1>
          <p className="text-gray-400">Sign in to your field operations platform</p>
        </div>

        <div className="bg-[#262626] border border-[#404040] rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-oswald text-2xl text-white">Welcome back</h2>
            <a href="/" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm">
              <ArrowLeft size={16} />
              Back to site
            </a>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-xl">
              <div className="flex items-center gap-2 text-red-300">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <button 
            onClick={handleDemoLogin} 
            className="w-full mb-6 py-3 bg-gradient-to-r from-[#FF6700] to-orange-500 text-white font-semibold rounded-xl hover:opacity-90"
          >
            Try Demo Account
          </button>
          <button 
            onClick={handleTrialSignup} 
            className="w-full mb-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:opacity-90"
          >
            Start 7-Day Free Trial
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#404040]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#262626] text-gray-500">Or continue with</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm block mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="w-full bg-[#1a1a1a] border border-[#404040] text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-[#FF6700]" 
                  placeholder="your@email.com" 
                />
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-sm block mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="w-full bg-[#1a1a1a] border border-[#404040] text-white rounded-xl pl-12 pr-12 py-3 focus:outline-none focus:border-[#FF6700]" 
                  placeholder="••••••••" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-3 bg-gradient-to-r from-[#1a1a1a] to-[#262626] border border-[#404040] text-white font-semibold rounded-xl hover:border-[#FF6700] disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#404040]">
            <p className="text-gray-400 text-center text-sm">
              Don't have an account?{' '}
              <a href="/auth/signup" className="text-[#FF6700] hover:underline font-semibold">Sign up now</a>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            By signing in, you agree to our <a href="/terms" className="text-gray-400 hover:text-white">Terms</a> and <a href="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
