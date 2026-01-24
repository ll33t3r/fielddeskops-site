'use server'

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export async function addCustomer(formData: FormData) {
  const supabase = await createClient();

  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect('/login');
  }

  // Extract data from the form
  const rawData = {
    full_name: formData.get('full_name') as string,
    phone: formData.get('phone') as string,
    email: formData.get('email') as string,
    address: formData.get('address') as string,
    notes: formData.get('notes') as string,
    user_id: user.id,
  };

  // Save to Supabase
  const { error } = await supabase.from('customers').insert(rawData);

  if (error) {
    console.error('Error adding customer:', error);
    throw new Error('Failed to add customer');
  }

  // Go back to the list
  redirect('/customers');
}
