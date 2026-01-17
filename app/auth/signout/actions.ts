'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function signout() {
  try {
    const cookieStore = cookies()
    
    // Create Supabase client with your actual credentials
    const supabase = createServerClient(
      'https://itfjpyzywllsjipjtfrk.supabase.co',
      'sb_publishable_l2NVlaleo2vsHPUf4nTXIQ_URedDg2N',
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              console.error('Cookie set error:', error)
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              console.error('Cookie remove error:', error)
            }
          },
        },
      }
    )

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Supabase sign out error:', error.message)
      // Continue with cleanup even if there's an error
    }

    // Clear client-side demo user data
    // This will be handled client-side by the LogoutButton
    
    // Revalidate all pages to clear cached user data
    revalidatePath('/', 'layout')
    
    // Redirect to login page
    redirect('/auth/login')
    
  } catch (error) {
    console.error('Unexpected sign out error:', error)
    // Fallback redirect
    redirect('/auth/login')
  }
}

// Alternative: Form action for progressive enhancement
export async function signoutForm(formData: FormData) {
  await signout()
}
