"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../utils/supabase/client";
import { 
  Clock, Play, Square, MapPin, ArrowLeft, 
  History, Briefcase, Loader2, Navigation, AlertTriangle, Smartphone
} from "lucide-react";
import Link from "next/link";

export default function CrewClock() {
  const supabase = createClient();
  
  // STATE
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false); // Validating GPS/Saving
  const [activeSession, setActiveSession] = useState(null);
  const [history, setHistory] = useState([]);
  const [jobs, setJobs] = useState([]); 
  
  // FORM
  const [selectedJob, setSelectedJob] = useState("General Shop Time");
  const [elapsed, setElapsed] = useState(0); 
  const [gpsStatus, setGpsStatus] = useState("WAITING"); // WAITING, LOCKED, ERROR
  const [gpsError, setGpsError] = useState("");

  // 1. INITIALIZE & AUTH CHECK
  useEffect(() => {
    const init = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = "/auth/login"; // Hard redirect for safety
            return;
        }
        fetchData(user);
        checkGPS(); 
    };
    init();
  }, []);

  // 2. DRIFT-PROOF TIMER (Perplexity Logic #4)
  useEffect(() => {
    if (!activeSession) {
        setElapsed(0);
        return;
    }
    // Calculate seconds difference between NOW and START TIME
    const interval = setInterval(() => {
        const start = new Date(activeSession.start_time).getTime();
        const now = new Date().getTime();
        const seconds = Math.floor((now - start) / 1000);
        setElapsed(seconds > 0 ? seconds : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  // 3. CHECK GPS
  const checkGPS = () => {
    if (!navigator.geolocation) {
        setGpsStatus("UNSUPPORTED");
        setGpsError("Device does not support GPS.");
        return;
    }
    navigator.geolocation.getCurrentPosition(
        () => setGpsStatus("LOCKED"),
        (err) => {
            setGpsStatus("ERROR");
            setGpsError(err.message);
        },
        { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  // 4. FETCH DATA (Scoped by User - Perplexity Logic #1)
  const fetchData = async (user) => {
    // A. Check Active Clock
    const { data: active } = await supabase
        .from("time_logs")
        .select("*")
        .eq("user_id", user.id) // SECURITY SCOPE
        .eq("status", "RUNNING")
        .maybeSingle(); // Prevents crashes if multiple exist (rare)
    
    if (active) setActiveSession(active);

    // B. Load History
    const { data: logs } = await supabase
        .from("time_logs")
        .select("*")
        .eq("user_id", user.id) // SECURITY SCOPE
        .eq("status", "COMPLETED")
        .order("start_time", { ascending: false })
        .limit(10);
    
    if (logs) setHistory(logs);

    // C. Load Jobs
    const { data: bids } = await supabase.from("bids").select("project_name");
    if (bids) setJobs(bids.map(b => b.project_name));
    
    setLoading(false);
  };

  // Helper: Get GPS Promise
  const getPosition = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) reject(new Error("No GPS support"));
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
    });
  };

  // 5. CLOCK IN LOGIC (With Fallback - Perplexity Logic #3)
  const handleClockIn = async (forceNoGps = false) => {
    setProcessing(true);
    const { data: { user } } = await supabase.auth.getUser();

    // A. Prevent Double Clock-In (Perplexity Logic #7)
    if (activeSession) {
        alert("Error: You are already clocked in.");
        setProcessing(false);
        return;
    }

    try {
        let lat = null, lng = null, verified = false;

        // B. Try GPS unless forced off
        if (!forceNoGps) {
            try {
                const pos = await getPosition();
                lat = pos.coords.latitude;
                lng = pos.coords.longitude;
                verified = true;
                setGpsStatus("LOCKED");
            } catch (err) {
                setGpsStatus("ERROR");
                setGpsError(err.message);
                // Don't auto-fail, let user decide to force
                if (!confirm("GPS Signal Failed. Clock in anyway? (This will be flagged)")) {
                    setProcessing(false);
                    return;
                }
                verified = false;
            }
        }

        // C. Database Insert (With Audit Fields - Perplexity Logic #9)
        const { data, error } = await supabase.from("time_logs").insert({
            user_id: user.id,
            job_name: selectedJob,
            status: "RUNNING",
            start_time: new Date().toISOString(),
            start_lat: lat,
            start_lng: lng,
            gps_verified: verified,
            device_info: navigator.userAgent // Audit Trail
        }).select().single();

        if (error) throw error;
        setActiveSession(data);

    } catch (err) {
        alert("System Error: " + err.message);
    } finally {
        setProcessing(false);
    }
  };

  // 6. CLOCK OUT LOGIC
  const handleClockOut = async () => {
    if (!activeSession) return;
    setProcessing(true);

    try {
        // Try to get end location (best effort)
        let endLat = null, endLng = null;
        try {
            const pos = await getPosition();
            endLat = pos.coords.latitude;
            endLng = pos.coords.longitude;
        } catch (e) { console.log("End GPS failed, proceeding..."); }

        const endTime = new Date();
        const startTime = new Date(activeSession.start_time);
        const duration = Math.round((endTime - startTime) / 60000); 

        const { error } = await supabase
            .from("time_logs")
            .update({ 
                status: "COMPLETED", 
                end_time: endTime.toISOString(),
                duration_minutes: duration,
                end_lat: endLat,
                end_lng: endLng
            })
            .eq("id", activeSession.id);

        if (!error) {
            setHistory([{ 
                ...activeSession, 
                end_time: endTime.toISOString(), 
                duration_minutes: duration,
                end_lat: endLat,
                end_lng: endLng
            }, ...history]);
            setActiveSession(null);
        }
    } catch (err) {
        alert("Error clocking out: " + err.message);
    } finally {
        setProcessing(false);
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
  };

  if(loading) return <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center"><Loader2 className="animate-spin text-[#FF6700]" size={40}/></div>;

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-inter pb-20">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Oswald:wght@500;700&display=swap");
        .font-oswald { font-family: "Oswald", sans-serif; }
      `}</style>

      {/* HEADER */}
      <header className="max-w-xl mx-auto px-6 pt-8 pb-6 flex items-center gap-3">
        <Link href="/" className="text-gray-400 hover:text-white"><ArrowLeft /></Link>
        <div>
            <h1 className="text-3xl font-oswald font-bold tracking-wide flex items-center gap-2">
                CREW<span className="text-[#FF6700]">CLOCK</span> <Clock size={24} className="text-[#FF6700]"/>
            </h1>
            <p className="text-xs text-gray-500 flex items-center gap-1">
                <Navigation size={10} className={gpsStatus === "LOCKED" ? "text-green-500" : gpsStatus === "ERROR" ? "text-red-500" : "text-yellow-500"}/> 
                GPS: {gpsStatus}
            </p>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 space-y-6">
        
        {/* === THE BIG CLOCK === */}
        <div className={`rounded-2xl p-8 border-2 transition-all shadow-2xl relative overflow-hidden ${activeSession ? "border-[#22c55e] bg-green-900/10" : "border-[#404040] bg-[#262626]"}`}>
            
            {activeSession ? (
                <div className="text-center">
                    <p className="text-sm font-bold text-[#22c55e] uppercase tracking-widest mb-2 animate-pulse">● On The Clock</p>
                    <div className="text-6xl font-oswald font-bold text-white mb-2 tabular-nums">
                        {formatTime(elapsed)}
                    </div>
                    <p className="text-gray-400 text-lg flex items-center justify-center gap-2 mb-6">
                        <Briefcase size={16}/> {activeSession.job_name}
                    </p>
                    
                    {/* Location Badge */}
                    <div className="flex justify-center mb-6">
                        {activeSession.gps_verified ? (
                            <a href={`http://maps.google.com/?q=${activeSession.start_lat},${activeSession.start_lng}`} target="_blank" className="text-xs bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/50 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-[#22c55e]/30">
                                <MapPin size={12}/> GPS VERIFIED
                            </a>
                        ) : (
                            <span className="text-xs bg-red-900/40 text-red-500 border border-red-500 px-3 py-1 rounded-full flex items-center gap-1">
                                <AlertTriangle size={12}/> GPS NOT VERIFIED
                            </span>
                        )}
                    </div>

                    <button 
                        onClick={handleClockOut}
                        disabled={processing}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-5 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                    >
                        {processing ? <Loader2 className="animate-spin"/> : <Square fill="currentColor" />} 
                        STOP CLOCK
                    </button>
                </div>
            ) : (
                <div className="text-center">
                    <p className="text-gray-500 text-sm uppercase tracking-widest mb-6">Ready to Work?</p>
                    
                    <div className="mb-6 bg-[#1a1a1a] rounded-lg p-2 border border-[#404040] flex items-center gap-2">
                        <Briefcase size={18} className="text-[#FF6700] ml-2"/>
                        <select 
                            value={selectedJob}
                            onChange={(e) => setSelectedJob(e.target.value)}
                            className="bg-transparent w-full text-white outline-none py-2 text-sm"
                        >
                            <option value="General Shop Time">General Shop Time</option>
                            {jobs.map(j => <option key={j} value={j}>{j}</option>)}
                        </select>
                    </div>

                    <button 
                        onClick={() => handleClockIn(false)}
                        disabled={loading || processing}
                        className="w-full bg-[#22c55e] hover:bg-green-600 text-black font-bold py-5 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.4)] text-xl"
                    >
                        {processing ? <Loader2 className="animate-spin"/> : <Play fill="currentColor" />} 
                        START CLOCK
                    </button>

                    {/* FALLBACK BUTTON (Perplexity Logic #3) */}
                    {gpsStatus === "ERROR" && !processing && (
                        <button 
                            onClick={() => handleClockIn(true)}
                            className="mt-4 text-xs text-yellow-600 hover:text-yellow-500 underline flex items-center justify-center gap-1 w-full"
                        >
                            <AlertTriangle size={12}/> GPS failed? Clock In Anyway
                        </button>
                    )}
                </div>
            )}
        </div>

        {/* === HISTORY LIST === */}
        <div>
            <h2 className="font-oswald text-lg text-gray-400 mb-3 flex items-center gap-2">
                <History size={18}/> RECENT ACTIVITY
            </h2>
            
            <div className="space-y-3">
                {history.map(log => (
                    <div key={log.id} className="bg-[#262626] border border-[#404040] p-4 rounded-xl flex justify-between items-center group hover:border-[#FF6700] transition">
                        <div>
                            <p className="font-bold text-white flex items-center gap-2">
                                {log.job_name}
                                {!log.gps_verified && <AlertTriangle size={12} className="text-red-500" title="No GPS"/>}
                            </p>
                            <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                                <span>{new Date(log.start_time).toLocaleDateString()}</span>
                                <span className="text-[#404040]">|</span>
                                {log.start_lat ? (
                                    <a 
                                        href={`http://maps.google.com/?q=${log.start_lat},${log.start_lng}`} 
                                        target="_blank"
                                        className="flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline"
                                    >
                                        <MapPin size={10}/> Map
                                    </a>
                                ) : (
                                    <span className="text-red-500 flex items-center gap-1"><Smartphone size={10}/> No Loc</span>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="block font-oswald text-xl text-[#FF6700]">
                                {log.duration_minutes}m
                            </span>
                            <span className="text-[10px] text-gray-500 uppercase">Duration</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

      </main>
    </div>
  );
}
