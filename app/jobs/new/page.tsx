import { createClient } from '@/utils/supabase/server';
import { createJob } from '../actions';
import { redirect } from 'next/navigation';

export default async function NewJobPage() {
  const supabase = await createClient();

  // 1. Get the customers for the dropdown
  const { data: customers } = await supabase.from('customers').select('id, full_name').order('full_name');

  return (
    <div className='max-w-md mx-auto p-4'>
      <h1 className='text-2xl font-bold mb-6'>🔨 Create New Job</h1>
      
      <form action={createJob} className='space-y-4 bg-white p-6 rounded-lg shadow'>
        
        {/* The Magic Dropdown */}
        <div>
          <label className='block text-sm font-medium text-gray-700'>Select Customer</label>
          <select name='customer_id' required className='mt-1 block w-full rounded-md border border-gray-300 p-2 bg-white'>
            <option value=''>-- Choose a Customer --</option>
            {customers?.map((c) => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </select>
        </div>

        {/* Job Title */}
        <div>
          <label className='block text-sm font-medium text-gray-700'>Job Title</label>
          <input name='title' required placeholder='e.g. Install Ceiling Fan' 
            className='mt-1 block w-full rounded-md border border-gray-300 p-2' />
        </div>

        {/* Price */}
        <div>
          <label className='block text-sm font-medium text-gray-700'>Estimated Price ($)</label>
          <input name='price' type='number' placeholder='150.00' 
            className='mt-1 block w-full rounded-md border border-gray-300 p-2' />
        </div>

        {/* Save Button */}
        <button type='submit' className='w-full py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium'>
          Create Job
        </button>

      </form>
    </div>
  );
}
