"use client";

import { useState } from "react";
import { Check, CheckCircle2, Edit2, MoreVertical, Archive, RotateCcw, Trash2, Users, UserCircle, Truck, Plus, X } from "lucide-react";
import useJobOperations from "../../../hooks/useJobOperations";
import UpgradePrompt from "@/components/UpgradePrompt";

export default function JobsTab({ supabase, activeJob, rigs = [], workers = [], onSelectJob, onAssignResources, onJobsUpdated }) {
  const { jobs, createJob, updateJob, deleteJob } = useJobOperations(supabase);
  const [jobFilter, setJobFilter] = useState("ACTIVE");
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newJobRigId, setNewJobRigId] = useState("");
  const [newJobWorkerId, setNewJobWorkerId] = useState("");
  const [editingJob, setEditingJob] = useState(null);
  const [jobMenuOpen, setJobMenuOpen] = useState(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradePromptData, setUpgradePromptData] = useState({ resourceType: 'jobs', currentCount: 0, limit: 0, tier: 'free' });

  const addJobFromMenu = async () => {
    if (!newJobTitle.trim()) return;
    const { data, error } = await createJob(newJobTitle, {
      rig_id: newJobRigId || null,
      assigned_worker_id: newJobWorkerId || null,
    });

    if (error?.limitReached) {
      setUpgradePromptData({
        resourceType: error.resourceType || 'jobs',
        currentCount: error.currentCount ?? 0,
        limit: error.limit ?? 0,
        tier: error.tier || 'free',
      });
      setShowUpgradePrompt(true);
      return;
    }
    if (data && !error) {
      setNewJobTitle("");
      setNewJobRigId("");
      setNewJobWorkerId("");
      await onJobsUpdated();
    }
  };

  const handleUpdateJob = async (id, updates) => {
    const { error } = await updateJob(id, updates);
    if (!error) {
      setEditingJob(null);
      setJobMenuOpen(null);
      await onJobsUpdated();
    }
  };

  const handleDeleteJob = async (id) => {
    if (!confirm("Delete this job?")) return;
    const { error } = await deleteJob(id);
    if (!error) {
      if (activeJob?.id === id) onSelectJob(null);
      setJobMenuOpen(null);
      await onJobsUpdated();
    }
  };

  const filteredJobs = jobs.filter((job) => {
    if (jobFilter === "ACTIVE") return job.status === "ACTIVE";
    if (jobFilter === "INACTIVE") return job.status === "INACTIVE";
    if (jobFilter === "COMPLETED") return job.status === "COMPLETED";
    return true;
  });

  return (
    <div className="space-y-4">
      {showUpgradePrompt && (
        <UpgradePrompt
          isOpen={showUpgradePrompt}
          onClose={() => setShowUpgradePrompt(false)}
          resourceType={upgradePromptData.resourceType}
          currentCount={upgradePromptData.currentCount}
          limit={upgradePromptData.limit}
          tier={upgradePromptData.tier}
        />
      )}
      <div>
        <label className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-widest mb-2 block">Create Job</label>
        <div className="flex gap-2">
          <input
            placeholder="Job Title..."
            value={newJobTitle}
            onChange={(e) => setNewJobTitle(e.target.value)}
            className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
          />
          <button onClick={addJobFromMenu} className="bg-[#FF6700] text-black px-4 rounded-lg font-bold hover:shadow-[0_0_15px_rgba(255,103,0,0.4)] transition">
            <Plus size={18} />
          </button>
        </div>
        <div className="mt-2">
          <select
            value={newJobRigId}
            onChange={(e) => setNewJobRigId(e.target.value)}
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] focus:border-[#FF6700] outline-none"
          >
            <option value="">Assign Rig (optional)</option>
            {rigs.map((rig) => (
              <option key={rig.id} value={rig.id}>
                {rig.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-2">
          <select
            value={newJobWorkerId}
            onChange={(e) => setNewJobWorkerId(e.target.value)}
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] focus:border-[#FF6700] outline-none"
          >
            <option value="">Assign Worker (optional)</option>
            {workers.map((worker) => (
              <option key={worker.id} value={worker.id}>
                {worker.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2 text-xs">
        {["ACTIVE", "INACTIVE", "COMPLETED"].map((filter) => (
          <button
            key={filter}
            onClick={() => setJobFilter(filter)}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${jobFilter === filter ? "bg-[#FF6700] text-black" : "bg-[var(--bg-surface)] text-[var(--text-sub)]"}`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div>
        <h3 className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-widest mb-3">{jobFilter} Jobs ({filteredJobs.length})</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className={`p-3 rounded-lg border transition-all ${activeJob?.id === job.id ? "bg-[#FF6700]/10 border-[#FF6700] shadow-[0_0_10px_rgba(255,103,0,0.15)]" : "bg-[var(--bg-surface)] border-[var(--border-color)]"}`}
            >
              {editingJob?.id === job.id ? (
                <div className="space-y-2">
                  <input
                    value={editingJob.title}
                    onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2 py-1 text-base text-[var(--input-text)]"
                  />
                  <select
                    value={editingJob.rig_id || ""}
                    onChange={(e) => setEditingJob({ ...editingJob, rig_id: e.target.value || null })}
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2 py-1 text-base text-[var(--input-text)]"
                  >
                    <option value="">No Rig</option>
                    {rigs.map((rig) => (
                      <option key={rig.id} value={rig.id}>
                        {rig.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={editingJob.assigned_worker_id || ""}
                    onChange={(e) => setEditingJob({ ...editingJob, assigned_worker_id: e.target.value || null })}
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2 py-1 text-base text-[var(--input-text)]"
                  >
                    <option value="">No Worker</option>
                    {workers.map((worker) => (
                      <option key={worker.id} value={worker.id}>
                        {worker.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleUpdateJob(job.id, {
                          title: editingJob.title,
                          rig_id: editingJob.rig_id || null,
                          assigned_worker_id: editingJob.assigned_worker_id || null,
                        })
                      }
                      className="flex-1 bg-green-600 text-white py-1 rounded text-xs font-bold"
                    >
                      <Check size={14} className="inline" />
                    </button>
                    <button onClick={() => setEditingJob(null)} className="flex-1 bg-gray-700 text-white py-1 rounded text-xs font-bold">
                      <X size={14} className="inline" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 cursor-pointer" onClick={() => onSelectJob(job)}>
                      <p className={`font-oswald text-sm ${activeJob?.id === job.id ? "text-[#FF6700]" : "text-[var(--text-main)]"}`}>{job.title}</p>
                      <p className="text-[10px] text-[var(--text-sub)]">{job.status} • {new Date(job.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="relative">
                      <button onClick={() => setJobMenuOpen(jobMenuOpen === job.id ? null : job.id)} className="p-1.5 hover:bg-white/10 rounded">
                        <MoreVertical size={16} className="text-[var(--text-sub)]" />
                      </button>
                      {jobMenuOpen === job.id && (
                        <div className="absolute right-0 top-full mt-1 bg-[#0a0a0a] border border-[var(--border-color)] rounded-lg shadow-xl z-10 min-w-[140px]">
                          <button onClick={() => { setEditingJob(job); setJobMenuOpen(null); }} className="w-full text-left px-3 py-2 hover:bg-white/10 text-xs flex items-center gap-2">
                            <Edit2 size={12} /> Edit
                          </button>
                          {job.status === "ACTIVE" && (
                            <button onClick={() => handleUpdateJob(job.id, { status: "COMPLETED" })} className="w-full text-left px-3 py-2 hover:bg-white/10 text-xs flex items-center gap-2 text-green-500">
                              <CheckCircle2 size={12} /> Complete
                            </button>
                          )}
                          {job.status === "ACTIVE" && (
                            <button onClick={() => handleUpdateJob(job.id, { status: "INACTIVE" })} className="w-full text-left px-3 py-2 hover:bg-white/10 text-xs flex items-center gap-2 text-gray-400">
                              <Archive size={12} /> Make Inactive
                            </button>
                          )}
                          {job.status === "INACTIVE" && (
                            <button onClick={() => handleUpdateJob(job.id, { status: "ACTIVE" })} className="w-full text-left px-3 py-2 hover:bg-white/10 text-xs flex items-center gap-2 text-blue-400">
                              <RotateCcw size={12} /> Reactivate
                            </button>
                          )}
                          <button onClick={() => { onAssignResources(job); setJobMenuOpen(null); }} className="w-full text-left px-3 py-2 hover:bg-white/10 text-xs flex items-center gap-2 border-t border-white/10">
                            <Users size={12} /> Assign Resources
                          </button>
                          <button onClick={() => handleDeleteJob(job.id)} className="w-full text-left px-3 py-2 hover:bg-white/10 text-xs flex items-center gap-2 text-red-500 border-t border-white/10">
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {(job.customers || job.fleet || job.crew) && (
                    <div className="text-xs text-[var(--text-sub)] space-y-1 mt-2 pt-2 border-t border-white/10">
                      {job.customers && <p className="flex items-center gap-1"><UserCircle size={10} /> {job.customers.name}</p>}
                      {job.fleet && <p className="flex items-center gap-1"><Truck size={10} /> {job.fleet.name}</p>}
                      {job.crew && <p className="flex items-center gap-1"><Users size={10} /> {job.crew.name}</p>}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
