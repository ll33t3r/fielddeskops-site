'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Mail, Lock, Eye, EyeOff, ArrowLeft, User, Building } from 'lucide-react';
import { signUpNewUser } from '../../../lib/supabase/utils';

export default function SignUpPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    fullName: '',
    company: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('free');

  // Get plan from URL without useSearchParams (to avoid build errors)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const planFromUrl = urlParams.get('plan');
      if (planFromUrl) {
        setSelectedPlan(planFromUrl);
      }
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      // FIRST: Try Supabase signup
      console.log("Attempting Supabase signup...");
      const { user, session, error } = await signUpNewUser(
        formData.email,
        formData.password,
        formData.fullName,
        formData.company,
        selectedPlan
      );

      if (error) {
        console.error("Supabase signup error:", error);
        throw error;
      }

      console.log("Supabase signup successful:", user?.email);
      
      // SECOND: Also store in localStorage for immediate access
      localStorage.setItem('demo_user', 'true');
      localStorage.setItem('user_email', formData.email);
      localStorage.setItem('user_name', formData.fullName || 'New User');
      localStorage.setItem('user_company', formData.company || '');
      localStorage.setItem('signup_date', new Date().toISOString());
      localStorage.setItem('supabase_user', 'true'); // Mark as Supabase user
      
      if (selectedPlan === 'pro_trial') {
        localStorage.setItem('subscription_tier', 'pro_trial');
        localStorage.setItem('trial_start', new Date().toISOString());
        localStorage.setItem('credits_remaining', '9999');
        localStorage.setItem('trial_plan', 'true');
        alert('🎉 Pro trial started! Enjoy 7 days of unlimited access!');
      } else {
        localStorage.setItem('subscription_tier', 'free');
        localStorage.setItem('credits_remaining', '10');
      }
      
      // Check if email confirmation is needed
      if (user && user.identities && user.identities.length === 0) {
        // Email confirmation required
        alert('✅ Account created! Please check your email to confirm your account.');
        window.location.href = '/auth/login';
      } else if (session) {
        // User is logged in immediately (email confirmation might be disabled)
        alert('✅ Account created and logged in!');
        window.location.href = '/dashboard';
      } else {
        // Fallback to localStorage
        alert('✅ Account created! Redirecting to dashboard...');
        window.location.href = '/dashboard';
      }
    } catch (err) {
      console.error('Signup error:', err);
      
      // Fallback to localStorage if Supabase fails
      if (err.message.includes('User already registered')) {
        setError('This email is already registered. Please try logging in.');
      } else {
        setError(err.message || 'Error creating account. Please try again.');
        
        // Fallback to localStorage demo account
        localStorage.setItem('demo_user', 'true');
        localStorage.setItem('user_email', formData.email);
        localStorage.setItem('user_name', formData.fullName || 'New User');
        localStorage.setItem('signup_date', new Date().toISOString());
        
        if (selectedPlan === 'pro_trial') {
          localStorage.setItem('subscription_tier', 'pro_trial');
          localStorage.setItem('trial_start', new Date().toISOString());
          localStorage.setItem('credits_remaining', '9999');
        } else {
          localStorage.setItem('subscription_tier', 'free');
          localStorage.setItem('credits_remaining', '10');
        }
        
        alert('⚠️ Using fallback demo account (Supabase had an issue).');
        window.location.href = '/dashboard';
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6700] to-orange-500 mb-4">
            <UserPlus size={24} className="text-white" />
          </div>
          <h1 className="font-oswald text-3xl text-white mb-2">Join FieldDeskOps</h1>
          <p className="text-gray-400">Start your field operations transformation</p>
        </div>

        <div className="bg-[#262626] border border-[#404040] rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-oswald text-2xl text-white">Create account</h2>
            <a href="/auth/login" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm">
              <ArrowLeft size={16} />
              Back to login
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

          <div className="mb-6">
            <h3 className="text-white font-semibold mb-4">Choose your plan:</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button" 
                onClick={() => setSelectedPlan('free')} 
                className={`p-4 rounded-xl text-left ${selectedPlan === 'free' ? 'bg-[#1a1a1a] border-2 border-green-500' : 'bg-[#1a1a1a] border border-[#404040]'}`}
              >
                <div className="text-green-400 font-bold text-lg">Free</div>
                <div className="text-gray-400 text-sm mt-2">• 10 free credits/month<br/>• 1 active project<br/>• Basic features</div>
                <div className="text-white font-bold mt-2">$0/month</div>
              </button>
              
              <button 
                type="button" 
                onClick={() => setSelectedPlan('pro_trial')} 
                className={`p-4 rounded-xl text-left ${selectedPlan === 'pro_trial' ? 'bg-[#1a1a1a] border-2 border-[#FF6700]' : 'bg-[#1a1a1a] border border-[#404040]'}`}
              >
                <div className="text-[#FF6700] font-bold text-lg">Pro Suite</div>
                <div className="text-gray-400 text-sm mt-2">• Unlimited credits<br/>• 10 active projects<br/>• All premium features</div>
                <div className="text-white font-bold mt-2"><span className="line-through text-gray-500 text-sm">$19.99</span> $9.99/month</div>
                <div className="text-[#FF6700] text-xs mt-1">✨ 7-day free trial</div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm block mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="w-full bg-[#1a1a1a] border border-[#404040] text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-[#FF6700]" placeholder="John Smith" />
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-sm block mb-2">Company (Optional)</label>
              <div className="relative">
                <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" name="company" value={formData.company} onChange={handleChange} className="w-full bg-[#1a1a1a] border border-[#404040] text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-[#FF6700]" placeholder="Smith Construction" />
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-sm block mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full bg-[#1a1a1a] border border-[#404040] text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-[#FF6700]" placeholder="you@company.com" />
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-sm block mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required className="w-full bg-[#1a1a1a] border border-[#404040] text-white rounded-xl pl-12 pr-12 py-3 focus:outline-none focus:border-[#FF6700]" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-gray-500 text-xs mt-2">Must be at least 8 characters</p>
            </div>

            <div>
              <label className="text-gray-400 text-sm block mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input type={showPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="w-full bg-[#1a1a1a] border border-[#404040] text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-[#FF6700]" placeholder="••••••••" />
              </div>
            </div>

            <div className="flex items-center">
              <input type="checkbox" id="terms" required className="w-4 h-4 bg-[#1a1a1a] border-[#404040] rounded focus:ring-[#FF6700] focus:ring-2" />
              <label htmlFor="terms" className="ml-2 text-gray-400 text-sm">
                I agree to the <a href="/terms" className="text-[#FF6700] hover:underline">Terms</a> and <a href="/privacy" className="text-[#FF6700] hover:underline">Privacy Policy</a>
              </label>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-[#FF6700] to-orange-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50">
              {loading ? 'Creating account...' : `Sign Up ${selectedPlan === 'pro_trial' ? 'with 7-Day Trial' : ''}`}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#404040]">
            <p className="text-gray-400 text-center text-sm">
              Already have an account? <a href="/auth/login" className="text-[#FF6700] hover:underline font-semibold">Sign in here</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
