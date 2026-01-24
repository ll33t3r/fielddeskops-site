'use client';
import { createClient } from '@/utils/supabase/client'; // Uses the client connection
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <button 
      onClick={handleLogout}
      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg font-medium transition-colors text-white"
    >
      Sign Out
    </button>
  );
}
