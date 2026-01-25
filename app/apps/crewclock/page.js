'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../../utils/supabase/client';
import { 
  Clock, Play, Square, MapPin, ArrowLeft, History, Briefcase, 
  Loader2, AlertTriangle, Smartphone 
} from 'lucide-react';
import Link from 'next/link';

export default function CrewClock() {
  const supabase = createClient();

  /* ----  STATE  ---- */
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [history, setHistory] = useState([]);
  const [jobs, setJobs] = useState([]);
  
  const [selectedJob, setSelectedJob] = useState('General Shop Time');
  const [elapsed, setElapsed] = useState(0);
  const [gpsStatus, setGpsStatus] = useState('WAITING');
  const [gpsError, setGpsError] = useState('');

  /* ----  EFFECTS  ---- */
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/auth/login'; return; }
      fetchData(user);
      checkGPS();
    };
    init();
  }, []);

  // Timer Logic
  useEffect(() => {
    if (!activeSession) { setElapsed(0); return; }
    const interval = setInterval(() => {
      const start = new Date(activeSession.start_time).getTime();
      const now = new Date().getTime();
      const seconds = Math.floor((now - start) / 1000);
      setElapsed(seconds > 0 ? seconds : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  /* ----  FUNCTIONS  ---- */
  const checkGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatus('UNSUPPORTED');
      setGpsError('Device does not support GPS.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => setGpsStatus('LOCKED'),
      (err) => { setGpsStatus('ERROR'); setGpsError(err.message); },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const fetchData = async (user) => {
    // 1. Check Active
    const { data: active } = await supabase.from('time_logs').select('*').eq('user_id', user.id).eq('status', 'RUNNING').maybeSingle();
    if (active) setActiveSession(active);

    // 2. History
    const { data: logs } = await supabase.from('time_logs').select('*').eq('user_id', user.id).eq('status', 'COMPLETED').order('start_time', { ascending: false }).limit(10);
    if (logs) setHistory(logs);

    // 3. Jobs
    const { data: bids } = await supabase.from('bids').select('project_name');
    if (bids) setJobs(bids.map((b) => b.project_name));
    setLoading(false);
  };

  const getPosition = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) reject(new Error('No GPS support'));
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
    });

  const handleClockIn = async (forceNoGps = false) => {
    setProcessing(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (activeSession) { alert('Error: You are already clocked in.'); setProcessing(false); return; }
    
    try {
      let lat = null, lng = null, verified = false;
      if (!forceNoGps) {
        try {
          const pos = await getPosition();
          lat = pos.coords.latitude; lng = pos.coords.longitude; verified = true; setGpsStatus('LOCKED');
        } catch (err) {
          setGpsStatus('ERROR'); setGpsError(err.message);
          if (!confirm('GPS Signal Failed. Clock in anyway? (This will be flagged)')) { setProcessing(false); return; }
          verified = false;
        }
      }

      const { data, error } = await supabase.from('time_logs').insert({
          user_id: user.id, job_name: selectedJob, status: 'RUNNING', start_time: new Date().toISOString(),
          start_lat: lat, start_lng: lng, gps_verified: verified, device_info: navigator.userAgent
        }).select().single();

      if (error) throw error;
      setActiveSession(data);
    } catch (err) { alert('System Error: ' + err.message); } 
    finally { setProcessing(false); }
  };

  const handleClockOut = async () => {
    if (!activeSession) return;
    setProcessing(true);
    try {
      let endLat = null, endLng = null;
      try { const pos = await getPosition(); endLat = pos.coords.latitude; endLng = pos.coords.longitude; } catch (e) { console.log('End GPS failed'); }
      
      const endTime = new Date();
      const startTime = new Date(activeSession.start_time);
      const duration = Math.round((endTime - startTime) / 60000);
      
      const { error } = await supabase.from('time_logs').update({
          status: 'COMPLETED', end_time: endTime.toISOString(), duration_minutes: duration, end_lat: endLat, end_lng: endLng
        }).eq('id', activeSession.id);

      if (!error) {
        setHistory([{ ...activeSession, end_time: endTime.toISOString(), duration_minutes: duration, end_lat: endLat, end_lng: endLng }, ...history]);
        setActiveSession(null);
      }
    } catch (err) { alert('Error clocking out: ' + err.message); } 
    finally { setProcessing(false); }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#FF6700]" size={40} /></div>;

  return (
    <div className="flex flex-col p-4 max-w-lg mx-auto space-y-6">
      
      {/* 1. FLUSH HEADER */}
      <div className="flex items-center gap-4">
        <Link href="/" className="industrial-card p-2 rounded-lg hover:text-[#FF6700] transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wide">CrewClock</h1>
          <p className="text-xs text-gray-400 font-bold tracking-widest opacity-60">TIMESHEETS & GPS</p>
        </div>
      </div>

      {/* 2. MAIN CLOCK CARD */}
      <div className={`industrial-card rounded-2xl p-8 border-2 transition-all relative overflow-hidden ${activeSession ? 'border-[#22c55e] bg-green-900/10' : ''}`}>
          
          {activeSession ? (
            <>
              <p className="text-sm font-bold text-[#22c55e] uppercase tracking-widest mb-2 animate-pulse text-center">● On The Clock</p>
              <div className="text-6xl font-oswald font-bold text-[var(--text-main)] mb-2 tabular-nums text-center">{formatTime(elapsed)}</div>
              <p className="text-[var(--text-sub)] text-lg flex items-center justify-center gap-2 mb-6"><Briefcase size={16} /> {activeSession.job_name}</p>

              <div className="flex justify-center mb-6">
                {activeSession.gps_verified ? (
                  <a href={`http://maps.google.com/?q=${activeSession.start_lat},${activeSession.start_lng}`} target="_blank" className="text-xs bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/50 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-[#22c55e]/30">
                    <MapPin size={12} /> GPS VERIFIED
                  </a>
                ) : (
                  <span className="text-xs bg-red-900/40 text-red-500 border border-red-500 px-3 py-1 rounded-full flex items-center gap-1">
                    <AlertTriangle size={12} /> GPS NOT VERIFIED
                  </span>
                )}
              </div>

              <button onClick={handleClockOut} disabled={processing} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-5 rounded-xl flex items-center justify-center gap-3 transition active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                {processing ? <Loader2 className="animate-spin" /> : <Square fill="currentColor" />} STOP CLOCK
              </button>
            </>
          ) : (
            <>
              <p className="text-[var(--text-sub)] text-sm uppercase tracking-widest mb-6 text-center">Ready to Work?</p>

              <div className="mb-6 bg-black/20 border border-white/10 rounded-lg p-2 flex items-center gap-2">
                <Briefcase size={18} className="text-[#FF6700] ml-2" />
                <select 
                    value={selectedJob} 
                    onChange={(e) => setSelectedJob(e.target.value)} 
                    className="bg-transparent w-full text-[var(--text-main)] outline-none py-2 text-sm"
                >
                  <option value="General Shop Time" className="text-black">General Shop Time</option>
                  {jobs.map((j) => <option key={j} value={j} className="text-black">{j}</option>)}
                </select>
              </div>

              <button onClick={() => handleClockIn(false)} disabled={processing} className="w-full bg-[#22c55e] hover:bg-green-600 text-black font-bold py-5 rounded-xl flex items-center justify-center gap-3 transition active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.4)] text-xl">
                {processing ? <Loader2 className="animate-spin" /> : <Play fill="currentColor" />} START CLOCK
              </button>

              {gpsStatus === 'ERROR' && !processing && (
                <button onClick={() => handleClockIn(true)} className="mt-4 text-xs text-yellow-600 hover:text-yellow-500 underline flex items-center justify-center gap-1 w-full">
                  <AlertTriangle size={12} /> GPS failed? Clock In Anyway
                </button>
              )}
            </>
          )}
      </div>

      {/* 3. HISTORY LIST */}
      <div>
        <h2 className="font-oswald text-lg text-[var(--text-sub)] mb-3 flex items-center gap-2"><History size={18} /> RECENT ACTIVITY</h2>
        <div className="space-y-3">
          {history.map((log) => (
            <div key={log.id} className="industrial-card rounded-xl p-4 flex justify-between items-center group hover:border-[#FF6700] transition">
              <div>
                <p className="font-bold text-[var(--text-main)] flex items-center gap-2">
                  {log.job_name}
                  {!log.gps_verified && <AlertTriangle size={12} className="text-red-500" title="No GPS" />}
                </p>
                <div className="text-xs text-[var(--text-sub)] flex items-center gap-2 mt-1">
                  <span>{new Date(log.start_time).toLocaleDateString()}</span>
                  <span className="opacity-30">|</span>
                  {log.start_lat ? (
                    <a href={`http://maps.google.com/?q=${log.start_lat},${log.start_lng}`} target="_blank" className="flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline">
                      <MapPin size={10} /> Map
                    </a>
                  ) : (
                    <span className="text-red-500 flex items-center gap-1"><Smartphone size={10} /> No Loc</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="block font-oswald text-xl text-[#FF6700]">{log.duration_minutes}m</span>
                <span className="text-[10px] text-[var(--text-sub)] uppercase">Duration</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 text-center opacity-40">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-sub)]">
              POWERED BY FIELDDESKOPS
          </p>
      </div>
    </div>
  );
}
