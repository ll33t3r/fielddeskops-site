'use server'
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export async function createJob(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  const rawData = {
    title: formData.get('title') as string,
    price: formData.get('price') as string,
    customer_id: formData.get('customer_id') as string,
    user_id: user.id,
    status: 'Pending'
  };

  const { error } = await supabase.from('jobs').insert(rawData);
  if (error) throw new Error('Failed to create job');

  redirect('/jobs');
}
