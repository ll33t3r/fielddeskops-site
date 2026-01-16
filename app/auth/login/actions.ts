'use server'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Validate input
  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  try {
    const cookieStore = cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    })

    if (error) {
      console.error('Login error:', error.message)
      
      // User-friendly error messages
      if (error.message.includes('Invalid login credentials')) {
        return { error: 'Invalid email or password. Please try again.' }
      } else if (error.message.includes('Email not confirmed')) {
        return { error: 'Please confirm your email address before logging in.' }
      } else if (error.message.includes('rate limit')) {
        return { error: 'Too many attempts. Please try again in a moment.' }
      } else {
        return { error: `Login failed: ${error.message}` }
      }
    }

    // Successful login - redirect to dashboard
    redirect('/dashboard')
    
  } catch (error) {
    console.error('Unexpected login error:', error)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const fullName = formData.get('fullName') as string

  // Validate input
  if (!email || !password || !confirmPassword) {
    return { error: 'All fields are required' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters' }
  }

  try {
    const cookieStore = cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: {
          full_name: fullName || '',
          subscription_tier: 'free',
          trial_start: new Date().toISOString(),
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })

    if (error) {
      console.error('Signup error:', error.message)
      
      if (error.message.includes('already registered')) {
        return { error: 'This email is already registered. Try logging in instead.' }
      } else if (error.message.includes('weak password')) {
        return { error: 'Password is too weak. Please use a stronger password.' }
      } else {
        return { error: `Signup failed: ${error.message}` }
      }
    }

    // Check if email confirmation is required
    if (data?.user?.identities?.length === 0) {
      return { error: 'This email is already registered.' }
    }

    if (data.user && !data.user.email_confirmed_at) {
      // Email confirmation sent
      return { 
        success: true, 
        message: 'Please check your email to confirm your account.' 
      }
    }

    // User is already confirmed or auto-confirmed
    redirect('/dashboard')
    
  } catch (error) {
    console.error('Unexpected signup error:', error)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}
