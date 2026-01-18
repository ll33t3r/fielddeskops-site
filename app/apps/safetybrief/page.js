"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../utils/supabase/client";
import { 
  ShieldAlert, CheckSquare, Users, ArrowLeft, 
  Save, AlertTriangle, FileText, CheckCircle 
} from "lucide-react";
import Link from "next/link";

export default function SafetyBrief() {
  const supabase = createClient();
  
  // PRESET TOPICS
  const TOPICS = {
    "GENERAL": [
        "Work area is clean and clear of debris?",
        "First Aid kit is accessible?",
        "Fire extinguisher is present and charged?",
        "Lighting is adequate for the task?"
    ],
    "LADDERS": [
        "Ladders inspected for damage (rungs/feet)?",
        "Ladders set on stable, level ground?",
        "3-point contact rule reviewed?",
        "Extension ladders secured at top?"
    ],
    "ELECTRICAL": [
        "Power sources identified and locked out?",
        "Extension cords inspected for fraying?",
        "GFCI outlets being used?",
        "Metal ladders kept away from wires?"
    ],
    "PPE": [
        "Hard hats worn?",
        "Safety glasses on?",
        "High-vis vests worn near traffic?",
        "Hearing protection available?"
    ]
  };

  // STATE
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [history, setHistory] = useState([]);
  
  // FORM
  const [selectedJob, setSelectedJob] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("GENERAL");
  const [attendees, setAttendees] = useState("");
  const [checklist, setChecklist] = useState({}); // { "Item 1": true, "Item 2": false }
  
  // INIT
  useEffect(() => {
    loadData();
  }, []);

  // Reset checklist when topic changes
  useEffect(() => {
    const initialChecklist = {};
    TOPICS[selectedTopic].forEach(item => initialChecklist[item] = false);
    setChecklist(initialChecklist);
  }, [selectedTopic]);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load Jobs
    const { data: bids } = await supabase.from("bids").select("project_name");
    if (bids) setJobs(bids.map(b => b.project_name));

    // Load History
    const { data: logs } = await supabase.from("safety_logs").select("*").order("created_at", { ascending: false }).limit(5);
    if (logs) setHistory(logs);
    
    setLoading(false);
  };

  const handleToggle = (item) => {
    setChecklist(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const saveLog = async () => {
    if (!selectedJob) return alert("Select a Job Site");
    if (!attendees) return alert("List who is present");

    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from("safety_logs").insert({
        user_id: user.id,
        job_name: selectedJob,
        topic: selectedTopic,
        attendees: attendees,
        checklist_data: checklist
    });

    if (!error) {
        alert("Safety Briefing Recorded.");
        setAttendees("");
        loadData(); // Refresh history
    } else {
        alert("Error saving log.");
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-inter pb-24">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Oswald:wght@500;700&display=swap");
        .font-oswald { font-family: "Oswald", sans-serif; }
      `}</style>

      {/* HEADER */}
      <header className="max-w-xl mx-auto px-6 pt-8 pb-6 flex items-center gap-3">
        <Link href="/" className="text-gray-400 hover:text-white"><ArrowLeft /></Link>
        <div>
            <h1 className="text-3xl font-oswald font-bold tracking-wide flex items-center gap-2">
                SAFETY<span className="text-[#FF6700]">BRIEF</span> <ShieldAlert size={24} className="text-[#FF6700]"/>
            </h1>
            <p className="text-xs text-gray-500">Toolbox Talks & Compliance</p>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 space-y-6">
        
        {/* === FORM CARD === */}
        <div className="bg-[#262626] border border-[#404040] rounded-xl p-5 shadow-xl">
            
            {/* Job Select */}
            <div className="mb-4">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Job Site</label>
                <select 
                    value={selectedJob} 
                    onChange={(e) => setSelectedJob(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#404040] rounded-lg p-3 text-white focus:border-[#FF6700] outline-none"
                >
                    <option value="">-- Select Job --</option>
                    {jobs.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
            </div>

            {/* Topic Tabs */}
            <div className="mb-4">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Briefing Topic</label>
                <div className="grid grid-cols-4 gap-1 bg-[#1a1a1a] p-1 rounded-lg border border-[#404040]">
                    {Object.keys(TOPICS).map(t => (
                        <button 
                            key={t}
                            onClick={() => setSelectedTopic(t)}
                            className={`text-[10px] font-bold py-2 rounded ${selectedTopic === t ? "bg-[#FF6700] text-black" : "text-gray-400 hover:bg-[#333]"}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Checklist */}
            <div className="mb-6 space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase block">Verification List</label>
                {TOPICS[selectedTopic].map((item, i) => (
                    <div 
                        key={i} 
                        onClick={() => handleToggle(item)}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${checklist[item] ? "bg-green-900/20 border-green-600 text-green-400" : "bg-[#1a1a1a] border-[#404040] text-gray-400 hover:border-[#FF6700]"}`}
                    >
                        {checklist[item] ? <CheckCircle size={20} className="text-green-500" /> : <div className="w-5 h-5 rounded-full border-2 border-[#404040]"></div>}
                        <span className="text-sm font-medium">{item}</span>
                    </div>
                ))}
            </div>

            {/* Crew Present */}
            <div className="mb-6">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Crew Present (Sign-in)</label>
                <div className="relative">
                    <Users size={18} className="absolute left-3 top-3 text-gray-500"/>
                    <input 
                        type="text" 
                        value={attendees}
                        onChange={(e) => setAttendees(e.target.value)}
                        placeholder="e.g. Mike, Sarah, John..." 
                        className="w-full bg-[#1a1a1a] border border-[#404040] rounded-lg p-3 pl-10 text-white focus:border-[#FF6700] outline-none"
                    />
                </div>
            </div>

            <button 
                onClick={saveLog}
                className="w-full bg-[#FF6700] hover:bg-[#e55c00] text-black font-bold font-oswald text-lg py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:translate-y-[-2px] transition-all"
            >
                <Save size={20}/> LOG BRIEFING
            </button>
        </div>

        {/* === HISTORY === */}
        <div>
            <h2 className="font-oswald text-lg text-gray-400 mb-3">RECENT LOGS</h2>
            <div className="space-y-3">
                {history.map(log => (
                    <div key={log.id} className="bg-[#262626] border border-[#404040] p-4 rounded-xl flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-white text-sm">{log.topic}</span>
                                <span className="text-[10px] bg-[#333] px-2 py-0.5 rounded text-gray-400">{new Date(log.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-gray-500">{log.job_name}</p>
                        </div>
                        <CheckSquare size={18} className="text-green-600"/>
                    </div>
                ))}
            </div>
        </div>

      </main>
    </div>
  );
}
