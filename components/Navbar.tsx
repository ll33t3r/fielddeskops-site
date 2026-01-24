'use client';

import Link from
'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname?.startsWith(path) ? 'text-blue-600' : 'text-gray-500';

  return (
    <div className='fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-6 flex justify-between items-center z-50 shadow-lg md:relative md:border-t-0 md:shadow-none md:bg-transparent'>
      <Link href='/customers' className={'flex flex-col items-center ' + isActive('/customers')}>
        <span className='text-2xl'>👥</span>
        <span className='text-xs font-medium mt-1'>Rolodex</span>
      </Link>
      <Link href='/jobs' className={'flex flex-col items-center ' + isActive('/jobs')}>
        <span className='text-2xl'>📋</span>
        <span className='text-xs font-medium mt-1'>Jobs</span>
      </Link>
      <Link href='/account' className={'flex flex-col items-center ' + isActive('/account')}>
        <span className='text-2xl'>⚙️</span>
        <span className='text-xs font-medium mt-1'>Account</span>
      </Link>
    </div>
  );
}
