import { createClient } from './client'

export async function signUpNewUser(email, password, fullName, company, plan) {
  const supabase = createClient()
  
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
    
    if (profileError) console.error('Profile creation error:', profileError)
  }
  
  return data
}

export async function signInUser(email, password) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw error
  return data
}

export async function signOutUser() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserProfile(userId) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) return null
  return data
}

export async function updateUserCredits(userId, newCreditAmount) {
  const supabase = createClient()
  const { error } = await supabase
    .from('users')
    .update({ credits_remaining: newCreditAmount })
    .eq('id', userId)
  
  if (error) throw error
}
