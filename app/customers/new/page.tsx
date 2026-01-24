import { addCustomer } from '../actions';

export default function NewCustomerPage() {
  return (
    <div className='max-w-md mx-auto p-4'>
      <h1 className='text-2xl font-bold mb-6'>➕ New Customer</h1>
      
      <form action={addCustomer} className='space-y-4 bg-white p-6 rounded-lg shadow'>
        
        {/* Name */}
        <div>
          <label className='block text-sm font-medium text-gray-700'>Full Name</label>
          <input name='full_name' required placeholder='John Doe' 
            className='mt-1 block w-full rounded-md border border-gray-300 p-2' />
        </div>

        {/* Phone */}
        <div>
          <label className='block text-sm font-medium text-gray-700'>Phone Number</label>
          <input name='phone' type='tel' required placeholder='(555) 123-4567' 
            className='mt-1 block w-full rounded-md border border-gray-300 p-2' />
        </div>

        {/* Address */}
        <div>
          <label className='block text-sm font-medium text-gray-700'>Address</label>
          <input name='address' placeholder='123 Main St...' 
            className='mt-1 block w-full rounded-md border border-gray-300 p-2' />
        </div>

        {/* Notes */}
        <div>
          <label className='block text-sm font-medium text-gray-700'>Notes / Gate Code</label>
          <textarea name='notes' rows={3} placeholder='Gate code: 1234...' 
            className='mt-1 block w-full rounded-md border border-gray-300 p-2' />
        </div>

        {/* Buttons */}
        <div className='pt-4 flex gap-3'>
          <a href='/customers' className='w-1/3 text-center py-2 border rounded-md text-gray-600 hover:bg-gray-50'>
            Cancel
          </a>
          <button type='submit' className='w-2/3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium'>
            Save Customer
          </button>
        </div>

      </form>
    </div>
  );
}
