'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import { logError } from '../../../utils/logger'

export async function signout() {
  const supabase = createClient()

  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      logError('Supabase sign out failed', error)
    }
  } catch (error) {
    logError('Unexpected sign out error', error)
  }

  revalidatePath('/', 'layout')
  redirect('/auth/login')
}

// Alternative: Form action for progressive enhancement
export async function signoutForm(formData: FormData) {
  await signout()
}
