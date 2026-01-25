'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../../utils/supabase/client';
import { ShieldAlert, CheckSquare, Users, Save, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SafetyBrief() {
  const supabase = createClient();
  
  // PRESET TOPICS
  const TOPICS = {
    'GENERAL': [
        'Work area is clean and clear of debris?',
        'First Aid kit is accessible?',
        'Fire extinguisher is present and charged?',
        'Lighting is adequate for the task?'
    ],
    'LADDERS': [
        'Ladders inspected for damage (rungs/feet)?',
        'Ladders set on stable, level ground?',
        '3-point contact rule reviewed?',
        'Extension ladders secured at top?'
    ],
    'ELECTRICAL': [
        'Power sources identified and locked out?',
        'Extension cords inspected for fraying?',
        'GFCI outlets being used?',
        'Metal ladders kept away from wires?'
    ],
    'PPE': [
        'Hard hats worn?',
        'Safety glasses on?',
        'High-vis vests worn near traffic?',
        'Hearing protection available?'
    ]
  };

  // STATE
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [customJob, setCustomJob] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('GENERAL');
  const [attendees, setAttendees] = useState('');
  const [checklist, setChecklist] = useState({}); 

  // INIT
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const initialChecklist = {};
    TOPICS[selectedTopic].forEach(item => initialChecklist[item] = false);
    setChecklist(initialChecklist);
  }, [selectedTopic]);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: bids } = await supabase.from('bids').select('project_name').order('created_at', { ascending: false });
    if (bids) setJobs(bids.map(b => b.project_name));

    const { data: logs } = await supabase.from('safety_logs').select('*').order('created_at', { ascending: false }).limit(5);
    if (logs) setHistory(logs);
    
    setLoading(false);
  };

  const handleToggle = (item) => {
    setChecklist(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const saveLog = async () => {
    let finalJobName = selectedJob;
    if (selectedJob === 'custom') {
        finalJobName = customJob.trim();
    }

    if (!finalJobName) return alert('Please select or type a Job Name.');
    if (!attendees) return alert('Please list who is present.');

    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from('safety_logs').insert({
        user_id: user.id,
        job_name: finalJobName,
        topic: selectedTopic,
        attendees: attendees,
        checklist_data: checklist
    });

    if (!error) {
        alert('Safety Briefing Recorded.');
        setAttendees('');
        setCustomJob('');
        setSelectedJob('');
        loadData();
    } else {
        alert('Error saving log: ' + error.message);
    }
  };

  return (
    <div className="flex flex-col p-4 max-w-xl mx-auto space-y-6">
      
      {/* 1. FLUSH HEADER */}
      <div className="flex items-center gap-4">
        <Link href="/" className="industrial-card p-2 rounded-lg hover:text-[#FF6700] transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wide text-[#FF6700]">SafetyBrief</h1>
          <p className="text-xs text-gray-400 font-bold tracking-widest opacity-60">COMPLIANCE & LOGS</p>
        </div>
      </div>

      {/* === FORM CARD === */}
      <div className="industrial-card rounded-xl p-5 shadow-xl">
          
          {/* Job Select */}
          <div className="mb-4">
              <label className="text-xs font-bold text-[var(--text-sub)] uppercase block mb-1">Job Site</label>
              <select 
                  value={selectedJob} 
                  onChange={(e) => setSelectedJob(e.target.value)}
                  className="bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg p-3 w-full mb-2 outline-none focus:border-[#FF6700]"
              >
                  <option value="">-- Select Job --</option>
                  {jobs.map(j => <option key={j} value={j}>{j}</option>)}
                  <option value="custom">+ Other / Quick Job</option>
              </select>

              {/* Custom Job Input */}
              {selectedJob === 'custom' && (
                  <input 
                      type="text"
                      value={customJob}
                      onChange={(e) => setCustomJob(e.target.value)}
                      placeholder="Type Job Name (e.g. Shop Maintenance)..."
                      className="bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg p-3 w-full outline-none focus:border-[#FF6700]"
                      autoFocus
                  />
              )}
          </div>

          {/* Topic Tabs */}
          <div className="mb-4">
              <label className="text-xs font-bold text-[var(--text-sub)] uppercase block mb-1">Briefing Topic</label>
              <div className="grid grid-cols-4 gap-1 bg-black/20 p-1 rounded-lg border border-[var(--border-color)]">
                  {Object.keys(TOPICS).map(t => (
                      <button 
                          key={t}
                          onClick={() => setSelectedTopic(t)}
                          className={`text-[10px] font-bold py-2 rounded transition-colors ${selectedTopic === t ? 'bg-[#FF6700] text-black shadow-md' : 'text-[var(--text-sub)] hover:bg-white/5 hover:text-[var(--text-main)]'}`}
                      >
                          {t}
                      </button>
                  ))}
              </div>
          </div>

          {/* Checklist */}
          <div className="mb-6 space-y-2">
              <label className="text-xs font-bold text-[var(--text-sub)] uppercase block">Verification List</label>
              {TOPICS[selectedTopic].map((item, i) => (
                  <div 
                      key={i} 
                      onClick={() => handleToggle(item)}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${checklist[item] ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-sub)] hover:border-[#FF6700]/50'}`}
                  >
                      {checklist[item] ? <CheckCircle size={20} className="text-green-500" /> : <div className="w-5 h-5 rounded-full border-2 border-[var(--border-color)]"></div>}
                      <span className="text-sm font-medium">{item}</span>
                  </div>
              ))}
          </div>

          {/* Crew Present */}
          <div className="mb-6">
              <label className="text-xs font-bold text-[var(--text-sub)] uppercase block mb-1">Crew Present (Sign-in)</label>
              <div className="relative">
                  <Users size={18} className="absolute left-3 top-3 text-[var(--text-sub)]"/>
                  <input 
                      type="text" 
                      value={attendees}
                      onChange={(e) => setAttendees(e.target.value)}
                      placeholder="e.g. Mike, Sarah, John..." 
                      className="bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg p-3 w-full pl-10 outline-none focus:border-[#FF6700]"
                  />
              </div>
          </div>

          <button 
              onClick={saveLog}
              className="w-full bg-[#FF6700] text-black font-bold shadow-[0_0_20px_rgba(255,103,0,0.4)] font-oswald text-lg py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
          >
              <Save size={20}/> LOG BRIEFING
          </button>
      </div>

      {/* === HISTORY === */}
      <div>
          <h2 className="font-oswald text-lg text-[var(--text-sub)] mb-3">RECENT LOGS</h2>
          <div className="space-y-3">
              {history.map(log => (
                  <div key={log.id} className="industrial-card rounded-xl p-4 flex justify-between items-center group">
                      <div>
                          <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-[var(--text-main)] text-sm">{log.topic}</span>
                              <span className="text-[10px] bg-black/20 border border-[var(--border-color)] px-2 py-0.5 rounded text-[var(--text-sub)]">{new Date(log.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-[var(--text-sub)]">{log.job_name}</p>
                      </div>
                      <CheckSquare size={18} className="text-green-600"/>
                  </div>
              ))}
          </div>
      </div>

      {/* BRANDING FOOTER */}
      <div className="mt-12 text-center opacity-40">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-sub)]">
              POWERED BY FIELDDESKOPS
          </p>
      </div>

    </div>
  );
}
