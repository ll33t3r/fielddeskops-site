"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../utils/supabase/client";
import { Clock, Play, Square, MapPin, Briefcase, Loader2, Navigation, AlertTriangle, Smartphone } from "lucide-react";
import Header from "../../components/Header";

export default function CrewClock() {
  const supabase = createClient();
  
  // STATE
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [history, setHistory] = useState([]);
  const [jobs, setJobs] = useState([]); 
  
  const [selectedJob, setSelectedJob] = useState("General Shop Time");
  const [elapsed, setElapsed] = useState(0); 
  const [gpsStatus, setGpsStatus] = useState("WAITING");
  const [gpsError, setGpsError] = useState("");

  useEffect(() => {
    const init = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { window.location.href = "/auth/login"; return; }
        fetchData(user);
        checkGPS(); 
    };
    init();
  }, []);

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

  const checkGPS = () => {
    if (!navigator.geolocation) { setGpsStatus("UNSUPPORTED"); return; }
    navigator.geolocation.getCurrentPosition(
        () => setGpsStatus("LOCKED"),
        (err) => { setGpsStatus("ERROR"); setGpsError(err.message); },
        { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const fetchData = async (user) => {
    const { data: active } = await supabase.from("time_logs").select("*").eq("user_id", user.id).eq("status", "RUNNING").maybeSingle();
    if (active) setActiveSession(active);

    const { data: logs } = await supabase.from("time_logs").select("*").eq("user_id", user.id).eq("status", "COMPLETED").order("start_time", { ascending: false }).limit(10);
    if (logs) setHistory(logs);

    const { data: bids } = await supabase.from("bids").select("project_name");
    if (bids) setJobs(bids.map(b => b.project_name));
    setLoading(false);
  };

  const getPosition = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) reject(new Error("No GPS"));
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
    });
  };

  const handleClockIn = async (forceNoGps = false) => {
    setProcessing(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (activeSession) { alert("Already clocked in."); setProcessing(false); return; }

    try {
        let lat = null, lng = null, verified = false;
        if (!forceNoGps) {
            try {
                const pos = await getPosition();
                lat = pos.coords.latitude; lng = pos.coords.longitude; verified = true; setGpsStatus("LOCKED");
            } catch (err) {
                if (!confirm("GPS Failed. Clock in anyway?")) { setProcessing(false); return; }
                verified = false;
            }
        }
        const { data, error } = await supabase.from("time_logs").insert({
            user_id: user.id, job_name: selectedJob, status: "RUNNING", start_time: new Date().toISOString(),
            start_lat: lat, start_lng: lng, gps_verified: verified, device_info: navigator.userAgent
        }).select().single();
        if (error) throw error;
        setActiveSession(data);
    } catch (err) { alert("Error: " + err.message); } 
    finally { setProcessing(false); }
  };

  const handleClockOut = async () => {
    if (!activeSession) return;
    setProcessing(true);
    try {
        let endLat = null, endLng = null;
        try { const pos = await getPosition(); endLat = pos.coords.latitude; endLng = pos.coords.longitude; } catch (e) {}
        const endTime = new Date();
        const duration = Math.round((endTime - new Date(activeSession.start_time)) / 60000); 

        const { error } = await supabase.from("time_logs").update({ 
            status: "COMPLETED", end_time: endTime.toISOString(), duration_minutes: duration, end_lat: endLat, end_lng: endLng
        }).eq("id", activeSession.id);

        if (!error) {
            setHistory([{ ...activeSession, end_time: endTime.toISOString(), duration_minutes: duration, end_lat: endLat, end_lng: endLng }, ...history]);
            setActiveSession(null);
        }
    } catch (err) { alert("Error: " + err.message); } 
    finally { setProcessing(false); }
  };

  const formatTime = (s) => {
    const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sec = s % 60;
    return `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${sec.toString().padStart(2,"0")}`;
  };

  if(loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center"><Loader2 className="animate-spin text-[#FF6700]" size={40}/></div>;

  return (
    <div className="min-h-screen bg-[#121212] text-white font-inter pb-20">
      <Header title="CREWCLOCK" backLink="/" />
      <main className="max-w-xl mx-auto px-6 space-y-6 pt-4">
        <div className={`glass-panel rounded-2xl p-8 border transition-all relative overflow-hidden ${activeSession ? "border-[#22c55e] bg-green-900/10" : "border-white/10"}`}>
            {activeSession ? (
                <div className="text-center">
                    <p className="text-sm font-bold text-[#22c55e] uppercase tracking-widest mb-2 animate-pulse">● On The Clock</p>
                    <div className="text-6xl font-oswald font-bold text-white mb-2 tabular-nums">{formatTime(elapsed)}</div>
                    <p className="text-gray-400 text-lg flex items-center justify-center gap-2 mb-6"><Briefcase size={16}/> {activeSession.job_name}</p>
                    <div className="flex justify-center mb-6">
                        {activeSession.gps_verified ? 
                            <span className="text-xs bg-[#22c55e]/20 text-[#22c55e] px-3 py-1 rounded-full flex items-center gap-1"><MapPin size={12}/> GPS VERIFIED</span> : 
                            <span className="text-xs bg-red-900/40 text-red-500 px-3 py-1 rounded-full flex items-center gap-1"><AlertTriangle size={12}/> NO GPS</span>}
                    </div>
                    <button onClick={handleClockOut} disabled={processing} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-5 rounded-xl flex items-center justify-center gap-3 shadow-lg">STOP CLOCK</button>
                </div>
            ) : (
                <div className="text-center">
                    <p className="text-gray-500 text-sm uppercase tracking-widest mb-6">Ready to Work?</p>
                    <div className="mb-6 input-field rounded-lg p-2 flex items-center gap-2">
                        <Briefcase size={18} className="text-[#FF6700] ml-2"/>
                        <select value={selectedJob} onChange={(e) => setSelectedJob(e.target.value)} className="bg-transparent w-full text-white outline-none py-2 text-sm">
                            <option value="General Shop Time">General Shop Time</option>
                            {jobs.map(j => <option key={j} value={j}>{j}</option>)}
                        </select>
                    </div>
                    <button onClick={() => handleClockIn(false)} disabled={loading || processing} className="w-full bg-[#22c55e] hover:bg-green-600 text-black font-bold py-5 rounded-xl flex items-center justify-center gap-3 shadow-lg text-xl">START CLOCK</button>
                    {gpsStatus === "ERROR" && <button onClick={() => handleClockIn(true)} className="mt-4 text-xs text-yellow-600 underline w-full">GPS Failed? Clock In Anyway</button>}
                </div>
            )}
        </div>
        <div>
            <h2 className="font-oswald text-lg text-gray-400 mb-3 flex items-center gap-2"><History size={18}/> RECENT</h2>
            <div className="space-y-3">
                {history.map(log => (
                    <div key={log.id} className="glass-panel p-4 rounded-xl flex justify-between items-center">
                        <div>
                            <p className="font-bold text-white flex items-center gap-2">{log.job_name}</p>
                            <div className="text-xs text-gray-500 mt-1">{new Date(log.start_time).toLocaleDateString()}</div>
                        </div>
                        <span className="font-oswald text-xl text-[#FF6700]">{log.duration_minutes}m</span>
                    </div>
                ))}
            </div>
        </div>
      </main>
    </div>
  );
}
