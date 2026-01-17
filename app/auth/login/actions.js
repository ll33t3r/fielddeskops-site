'use server'

// CHANGED: Pointing to 'lib' instead of 'utils'
import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

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

  revalidatePath('/', 'layout')
  redirect('/')
}
