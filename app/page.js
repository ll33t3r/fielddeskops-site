'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../utils/supabase/client';
import { 
  Calculator, Package, Camera, PenTool, 
  LogOut, Sun, Moon, Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const supabase = createClient();
  const router = useRouter();

  // STATE
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('HELLO');
  const [metrics, setMetrics] = useState({ revenue: 0, jobs: 0, alerts: 0 });
  const [theme, setTheme] = useState('dark');
  
  useEffect(() => {
    // 1. Theme Logic
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    // 2. Greeting
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'GOOD MORNING' : h < 18 ? 'GOOD AFTERNOON' : 'GOOD EVENING');
    
    // 3. Load Data
    loadDashboardData();
  }, []);

  // --- THEME TOGGLE ---
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const loadDashboardData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace('/auth/login'); return; }

    const { data: bids } = await supabase.from('bids').select('sale_price');
    const revenue = bids ? bids.reduce((acc, b) => acc + (Number(b.sale_price) || 0), 0) : 0;
    const jobs = bids ? bids.length : 0;

    setMetrics({ revenue, jobs, alerts: 0 });
    setLoading(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.replace('/auth/login'); };

  if (loading) return <div className='min-h-screen bg-[var(--bg-main)] flex items-center justify-center'><Loader2 className='animate-spin text-[#FF6700]' size={40}/></div>;

  return (
    // h-screen locks the height to the viewport (no scrolling)
    <div className='h-screen flex flex-col relative selection:bg-[#FF6700] selection:text-black bg-[var(--bg-main)] overflow-hidden'>
      
      {/* HEADER */}
      <header className='px-6 pt-6 pb-2 shrink-0'>
        <div className='flex justify-between items-start'>
            <div>
                <p className='text-[#FF6700] font-bold text-[10px] tracking-[0.2em] uppercase mb-1'>FIELDDESKOPS</p>
                <h1 className='text-2xl md:text-3xl font-bold tracking-wide'>{greeting}.</h1>
            </div>
            <div className='flex gap-3'>
                <button onClick={toggleTheme} className='p-3 rounded-full industrial-card hover:text-[#FF6700] transition'>
                    {theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}
                </button>
                <button onClick={handleLogout} className='p-3 rounded-full industrial-card hover:bg-red-500/20 hover:text-red-500 transition'>
                    <LogOut size={20}/>
                </button>
            </div>
        </div>

        {/* METRICS BAR */}
        <div className='grid grid-cols-3 gap-4 mt-6'>
            <div className='industrial-card rounded-xl p-3 text-center'>
                <p className='text-[10px] text-gray-400 uppercase font-bold tracking-wider'>Revenue</p>
                <p className='text-[#22c55e] font-bold text-lg tracking-tight'>${metrics.revenue}</p>
            </div>
            <div className='industrial-card rounded-xl p-3 text-center'>
                <p className='text-[10px] text-gray-400 uppercase font-bold tracking-wider'>Jobs</p>
                <p className='font-bold text-lg tracking-tight'>{metrics.jobs}</p>
            </div>
            <div className='industrial-card rounded-xl p-3 text-center'>
                <p className='text-[10px] text-gray-400 uppercase font-bold tracking-wider'>System</p>
                <p className='font-bold text-lg tracking-tight'>OK</p>
            </div>
        </div>
      </header>

      {/* APPS GRID (The Command Center) */}
      <main className='flex-1 p-6 min-h-0'>
         <div className='grid grid-cols-2 grid-rows-2 gap-4 h-full w-full max-w-2xl mx-auto'>
            <AppCard href='/apps/profitlock' label='PROFITLOCK' sub='Bids & Invoices' icon={<Calculator size={32}/>} color="group-hover:text-green-500" />
            <AppCard href='/apps/loadout' label='LOADOUT' sub='Inventory' icon={<Package size={32}/>} color="group-hover:text-blue-500" />
            <AppCard href='/apps/sitesnap' label='SITESNAP' sub='Photos' icon={<Camera size={32}/>} color="group-hover:text-purple-500" />
            <AppCard href='/apps/signoff' label='SIGNOFF' sub='Contracts' icon={<PenTool size={32}/>} color="group-hover:text-[#FF6700]" />
         </div>
      </main>

      {/* FOOTER */}
      <div className='pb-4 text-center shrink-0'>
            <p className='text-[10px] font-bold uppercase tracking-widest text-gray-600 opacity-40'>
                POWERED BY FIELDDESKOPS
            </p>
      </div>
    </div>
  );
}

// Reusable Card Component (Expanded for 2x2 Grid)
function AppCard({ href, label, sub, icon, color }) {
    return (
        <Link href={href} className={`
            industrial-card flex flex-col items-center justify-center text-center
            rounded-2xl transition-all duration-300 group relative overflow-hidden
            hover:bg-gray-800/80 active:scale-95 border-2 border-transparent hover:border-gray-700
        `}>
            {/* Background Glow */}
            <div className='absolute top-0 right-0 p-20 bg-gradient-to-br from-white/5 to-transparent rounded-full translate-x-10 -translate-y-10 pointer-events-none'></div>
            
            <div className={`mb-3 p-4 rounded-full bg-black/20 ${color} transition-colors duration-300`}>
                {icon}
            </div>
            
            <h2 className='text-lg md:text-2xl font-bold tracking-widest mb-1 group-hover:text-white transition-colors'>{label}</h2>
            <p className='text-[10px] md:text-xs text-gray-400 uppercase tracking-widest font-bold'>{sub}</p>
        </Link>
    );
}
