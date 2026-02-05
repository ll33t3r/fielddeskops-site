import { createClient } from './client'
import { logError } from '../../utils/logger'

export async function signUpNewUser(email, password, fullName, company, plan) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company: company,
          subscription_tier: plan,
          trial_start: plan === 'pro_trial' ? new Date().toISOString() : null,
          credits_remaining: plan === 'pro_trial' ? 9999 : 10
        }
      }
    })

    if (error) throw error

    // RLS: ensure policies restrict `users` rows to auth.uid() access.
    // Create user profile in public.users table
    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          full_name: fullName,
          company: company,
          subscription_tier: plan,
          trial_start: plan === 'pro_trial' ? new Date().toISOString() : null,
          credits_remaining: plan === 'pro_trial' ? 9999 : 10,
          created_at: new Date().toISOString()
        })

      if (profileError) {
        logError('User profile creation failed', profileError, {
          userId: data.user.id
        })
      }
    }

    return data
  } catch (error) {
    logError('User signup failed', error, { email })
    throw error
  }
}

export async function signInUser(email, password) {
  const supabase = createClient()
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  } catch (error) {
    logError('User sign-in failed', error, { email })
    throw error
  }
}

export async function signOutUser() {
  const supabase = createClient()
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error) {
    logError('User sign-out failed', error)
    throw error
  }
}

export async function getCurrentUser() {
  const supabase = createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch (error) {
    logError('Get current user failed', error)
    return null
  }
}

export async function getUserProfile(userId) {
  const supabase = createClient()
  try {
    // RLS: policies must enforce access by authenticated user id.
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, company, subscription_tier, trial_start, credits_remaining, created_at')
      .eq('id', userId)
      .single()

    if (error) return null
    return data
  } catch (error) {
    logError('Get user profile failed', error, { userId })
    return null
  }
}

export async function updateUserCredits(userId, newCreditAmount) {
  const supabase = createClient()
  try {
    // RLS: policies must enforce access by authenticated user id.
    const { error } = await supabase
      .from('users')
      .update({ credits_remaining: newCreditAmount })
      .eq('id', userId)

    if (error) throw error
  } catch (error) {
    logError('Update user credits failed', error, { userId })
    throw error
  }
}
