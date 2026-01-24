import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function CustomerList() {
  // Connect to the Database
  const supabase = await createClient();

  // Check if you are logged in
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect('/login');
  }

  // Get the Customers
  const { data: customers, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return <div className='p-4 text-red-500'>Error loading customers</div>;
  }

  return (
    <div className='max-w-md mx-auto p-4'>
      <h1 className='text-2xl font-bold mb-4'> Digital Rolodex</h1>
      
      <div className='space-y-4'>
        {customers?.map((customer) => (
          <div key={customer.id} className='p-4 border rounded-lg shadow-sm bg-white'>
            <h2 className='text-xl font-semibold'>{customer.full_name}</h2>
            <p className='text-gray-600'> {customer.phone}</p>
            <p className='text-gray-500 text-sm mt-1'> {customer.address}</p>
            {customer.notes && (
              <div className='mt-2 p-2 bg-yellow-50 text-sm rounded'>
                 {customer.notes}
              </div>
            )}
          </div>
        ))}

        {customers?.length === 0 && (
          <div className='text-center text-gray-500 py-8'>
            No customers found. Time to add some!
          </div>
        )}
      </div>
    </div>
  );
}
