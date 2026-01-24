'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../utils/supabase/client';
import { 
  Calculator, Package, Camera, PenTool, Clock, ShieldAlert, 
  AlertTriangle, Wrench, Users, LogOut, Plus, Loader2, X, 
  FilePlus, Play, RefreshCw, Trash2, CheckCircle2,
  Sun, Moon
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
  
  // POPUPS
  const [showSpeedDial, setShowSpeedDial] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [alertList, setAlertList] = useState([]); 
  const [refreshing, setRefreshing] = useState(false);

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

    // Mock Alerts for Display
    const allAlerts = []; 
    setAlertList(allAlerts);
    setMetrics({ revenue, jobs, alerts: allAlerts.length });
    setLoading(false);
  };

  const manualRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.replace('/auth/login'); };

  if (loading) return <div className='min-h-screen bg-[var(--bg-main)] flex items-center justify-center'><Loader2 className='animate-spin text-[#FF6700]' size={40}/></div>;

  return (
    <div className='min-h-screen flex flex-col relative selection:bg-[#FF6700] selection:text-black'>
      
      {/* HEADER */}
      <header className='px-5 pt-8 pb-4'>
        <div className='flex justify-between items-start'>
            <div>
                <p className='text-[#FF6700] font-bold text-[10px] tracking-[0.2em] uppercase mb-1'>FIELDDESKOPS</p>
                <h1 className='text-3xl font-bold tracking-wide'>{greeting}.</h1>
            </div>
            <div className='flex gap-2'>
                <button onClick={toggleTheme} className='p-2 rounded-full industrial-card hover:text-[#FF6700] transition'>
                    {theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}
                </button>
                <button onClick={handleLogout} className='p-2 rounded-full industrial-card hover:bg-red-500/20 hover:text-red-500 transition'>
                    <LogOut size={18}/>
                </button>
            </div>
        </div>

        {/* METRICS BAR */}
        <div className='grid grid-cols-3 gap-3 mt-6'>
            <div className='industrial-card rounded-xl p-3 text-center'>
                <p className='text-[10px] text-gray-400 uppercase font-bold tracking-wider'>Revenue</p>
                <p className='text-[#22c55e] font-bold text-lg tracking-tight'>\${metrics.revenue}</p>
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

      {/* APPS GRID */}
      <main className='flex-1 overflow-y-auto px-5 pb-32'>
         <div className='grid grid-cols-2 gap-3 max-w-md mx-auto'>
            <AppCard href='/apps/profitlock' label='PROFITLOCK' sub='Bids & Invoices' icon={<Calculator size={20}/>} />
            <AppCard href='/apps/loadout' label='LOADOUT' sub='Inventory' icon={<Package size={20}/>} />
            <AppCard href='/apps/sitesnap' label='SITESNAP' sub='Photos' icon={<Camera size={20}/>} />
            <AppCard href='/apps/signoff' label='SIGNOFF' sub='Contracts' icon={<PenTool size={20}/>} />
            <AppCard href='/apps/crewclock' label='CREWCLOCK' sub='Timesheets' icon={<Clock size={20}/>} />
            <AppCard href='/apps/safetybrief' label='SAFETYBRIEF' sub='Compliance' icon={<ShieldAlert size={20}/>} />
            <AppCard href='/apps/toolshed' label='TOOLSHED' sub='Asset Tracker' icon={<Wrench size={20}/>} />
            <AppCard href='/apps/subhub' label='SUBHUB' sub='Subcontractors' icon={<Users size={20}/>} />
         </div>

         {/* LEGAL FOOTER */}
         <div className='mt-12 mb-6 text-center'>
            <p className='text-[10px] font-bold uppercase tracking-widest text-gray-600 opacity-40 mb-2'>
                POWERED BY FIELDDESKOPS
            </p>
         </div>
      </main>
    </div>
  );
}

// Reusable Card Component
function AppCard({ href, label, sub, icon }) {
    return (
        <Link href={href} className='industrial-card p-4 rounded-xl hover:bg-gray-800 active:scale-95 transition-all group relative overflow-hidden'>
            <div className='absolute top-0 right-0 p-12 bg-gradient-to-br from-white/5 to-transparent rounded-full translate-x-4 -translate-y-4 pointer-events-none'></div>
            <div className='flex justify-between items-start mb-3 relative z-10'>
                <div className='p-2.5 rounded-lg transition-colors'>
                    {icon}
                </div>
            </div>
            <h2 className='text-sm font-bold group-hover:text-[#FF6700] transition-colors'>{label}</h2>
            <p className='text-[10px] text-gray-400 uppercase tracking-wide'>{sub}</p>
        </Link>
    );
}
