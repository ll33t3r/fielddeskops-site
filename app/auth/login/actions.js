'use server'

import { createClient } from '../../../lib/supabase/server'

export async function login(formData) {
  const supabase = createClient()
  
  const data = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  // We return SUCCESS instead of redirecting. 
  // Let the client handle the navigation.
  return { success: true }
}
