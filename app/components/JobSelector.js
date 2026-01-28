'use client';

import { useState, useRef, useEffect } from 'react';
import { FolderOpen, ChevronDown, Plus, Pencil, X } from 'lucide-react';
import { useJobSelector } from '../hooks/useJobSelector';

export default function JobSelector() {
  const { activeJob, setActiveJob, recentJobs, createQuickJob } = useJobSelector();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const dropdownRef = useRef(null);

  const vibrate = (pattern = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateJob = async () => {
    if (!newJobTitle.trim()) return;
    setCreating(true);
    await createQuickJob(newJobTitle.trim());
    setNewJobTitle('');
    setIsCreating(false);
    setIsOpen(false);
    setCreating(false);
  };

  return (
    <div className="relative mb-6" ref={dropdownRef}>
      {isCreating ? (
        <div className="flex items-center gap-2 industrial-card p-4 rounded-xl border-2 border-[#FF6700]">
          <Pencil className="text-[#FF6700]" size={20} />
          <input
            autoFocus
            placeholder="JOB TITLE..."
            value={newJobTitle}
            onChange={(e) => setNewJobTitle(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateJob()}
            onBlur={() => !newJobTitle && setIsCreating(false)}
            className="bg-transparent text-[var(--text-main)] font-bold uppercase outline-none w-full placeholder:text-[var(--input-placeholder)]"
            style={{ fontSize: '16px' }}
          />
          <button onClick={() => setIsCreating(false)} className="text-[var(--text-sub)] hover:text-[#FF6700]">
            <X size={22} />
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={() => {
              vibrate();
              setIsOpen(!isOpen);
            }}
            className="w-full flex items-center justify-between industrial-card p-4 rounded-xl hover:border-[#FF6700] transition-colors"
          >
            <div className="flex items-center gap-3">
              <FolderOpen className="text-[#FF6700]" size={22} />
              <span className="font-bold uppercase truncate text-[var(--text-main)]">
                {activeJob?.title || 'SELECT JOB'}
              </span>
            </div>
            <ChevronDown size={20} className={`transition-transform text-[var(--text-sub)] ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 w-full mt-2 bg-[var(--bg-card)] border border-[var(--border-color)] industrial-card rounded-xl z-50 overflow-hidden">
              <div className="p-2 space-y-1 max-h-56 overflow-y-auto">
                {recentJobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => {
                      vibrate();
                      setActiveJob(job);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg font-bold uppercase text-sm transition-all ${
                      activeJob?.id === job.id
                        ? 'bg-[#FF6700] text-black'
                        : 'text-[var(--text-main)] hover:bg-[#FF6700]/10'
                    }`}
                  >
                    {job.title}
                  </button>
                ))}
                <button
                  onClick={() => {
                    vibrate();
                    setIsCreating(true);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg font-bold uppercase text-sm text-[#FF6700] hover:bg-[#FF6700]/10 flex items-center gap-2"
                >
                  <Plus size={16} /> NEW JOB
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
