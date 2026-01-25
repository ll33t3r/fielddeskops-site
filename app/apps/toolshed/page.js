'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../../utils/supabase/client';
import { 
  Wrench, Plus, User, Trash2, AlertTriangle, Search, X, 
  Camera, Loader2, CheckCircle2, ChevronDown, Users, ArrowLeft 
} from 'lucide-react';
import Link from 'next/link';

export default function ToolShed() {
  const supabase = createClient();
  
  // STATE
  const [assets, setAssets] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [defaultVanId, setDefaultVanId] = useState(null); 
  
  // UI STATE
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false); 
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  // FORM STATE
  const [newTool, setNewTool] = useState({ name: '', brand: '', serial: '' });
  const [newPhoto, setNewPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [newMemberName, setNewMemberName] = useState(''); 
  
  useEffect(() => { 
    const init = async () => {
        await Promise.all([loadData()]);
        setLoading(false);
    };
    init(); 
  }, []);

  // --- DATA LOADING ---
  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Get Default Van (For Syncing)
    const { data: vans } = await supabase.from('vans').select('id').order('created_at').limit(1);
    if (vans && vans.length > 0) setDefaultVanId(vans[0].id);

    // 2. Get Assets
    const { data: assetData } = await supabase.from('assets').select('*').order('name');
    if (assetData) setAssets(assetData);

    // 3. Get Team
    const { data: teamData } = await supabase.from('team_members').select('*').order('name');
    if (teamData) setTeamMembers(teamData);
  };

  // --- TEAM ACTIONS ---
  const addTeamMember = async () => {
      if (!newMemberName.trim()) return;
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase.from('team_members').insert({ user_id: user.id, name: newMemberName }).select().single();
      if (data) {
          setTeamMembers([...teamMembers, data]);
          setNewMemberName('');
      }
  };

  const deleteTeamMember = async (id) => {
      if(!confirm('Remove this person?')) return;
      setTeamMembers(teamMembers.filter(m => m.id !== id));
      await supabase.from('team_members').delete().eq('id', id);
  };

  // --- ASSET ACTIONS ---
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result);
    reader.readAsDataURL(file);
    setNewPhoto(file);
  };

  const addAsset = async () => {
    if (!newTool.name) return alert('Tool Name Required');
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    // 1. Upload Photo
    let finalPhotoUrl = null;
    if (newPhoto) {
        const fileName = `${user.id}/${Date.now()}-${newPhoto.name}`;
        const { error } = await supabase.storage.from('tool-photos').upload(fileName, newPhoto);
        if (!error) {
            const { data } = supabase.storage.from('tool-photos').getPublicUrl(fileName);
            finalPhotoUrl = data.publicUrl;
        }
    }

    // 2. Insert Record
    const { data, error } = await supabase.from('assets').insert({
        user_id: user.id,
        van_id: defaultVanId, 
        name: newTool.name,
        brand: newTool.brand,
        serial_number: newTool.serial,
        photo_url: finalPhotoUrl,
        status: 'IN_VAN' 
    }).select().single();

    if (error) {
        alert('Error adding tool: ' + error.message);
    } else if (data) {
        setAssets([data, ...assets]);
        setShowAddModal(false);
        setNewTool({ name: '', brand: '', serial: '' });
        setNewPhoto(null);
        setPhotoPreview(null);
    }
    setUploading(false);
  };

  const updateStatus = async (id, status, memberId = null) => {
    setAssets(assets.map(a => a.id === id ? { ...a, status, assigned_to: memberId } : a));
    setSelectedAsset(null);
    await supabase.from('assets').update({ status, assigned_to: memberId }).eq('id', id);
  };

  const deleteAsset = async (id) => {
    if(!confirm('Permanently delete this tool?')) return;
    setAssets(assets.filter(a => a.id !== id));
    await supabase.from('assets').delete().eq('id', id);
  };

  // --- FILTERS ---
  const filteredAssets = assets.filter(a => {
    const matchesStatus = filter === 'ALL' || (filter === 'CHECKED_OUT' && a.status === 'CHECKED_OUT') || (filter === 'IN_VAN' && a.status === 'IN_VAN') || (filter === 'BROKEN' && a.status === 'BROKEN');
    const matchesSearch = !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.serial_number?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#FF6700]" size={40} /></div>;

  return (
    <div className="flex flex-col p-4 max-w-xl mx-auto space-y-6">
      
      {/* 1. FLUSH HEADER (Orange Title) */}
      <div className="flex items-center gap-4">
        <Link href="/" className="industrial-card p-2 rounded-lg hover:text-[#FF6700] transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wide text-[#FF6700]">ToolShed</h1>
          <p className="text-xs text-gray-400 font-bold tracking-widest opacity-60">ASSET TRACKER</p>
        </div>
      </div>

      <main className="space-y-6">
        
        {/* TOP STATS BAR */}
        <div className="grid grid-cols-3 gap-2">
            {[
                { label: 'ALL TOOLS', key: 'ALL', count: assets.length, color: 'text-[var(--text-main)]' },
                { label: 'CHECKED OUT', key: 'CHECKED_OUT', count: assets.filter(a => a.status === 'CHECKED_OUT').length, color: 'text-blue-400' },
                { label: 'BROKEN', key: 'BROKEN', count: assets.filter(a => a.status === 'BROKEN').length, color: 'text-red-500' }
            ].map(stat => (
                <button 
                    key={stat.key} 
                    onClick={() => setFilter(stat.key)} 
                    className={`industrial-card p-3 rounded-lg text-center transition active:scale-95 ${filter === stat.key ? 'border-[#FF6700] bg-[#FF6700]/10' : 'hover:bg-white/5'}`}
                >
                    <p className={`text-2xl font-oswald font-bold ${stat.color}`}>{stat.count}</p>
                    <p className="text-[10px] text-[var(--text-sub)] uppercase font-bold tracking-wider">{stat.label}</p>
                </button>
            ))}
        </div>

        {/* TOOLBAR */}
        <div className="flex gap-2">
            <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-3.5 text-[var(--text-sub)]" />
                <input 
                    type="text" 
                    placeholder="Search tools..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg pl-10 pr-4 py-3 w-full outline-none focus:border-[#FF6700]"
                />
            </div>
            <button onClick={() => setShowTeamModal(true)} className="industrial-card hover:bg-[var(--text-main)] hover:text-[var(--bg-main)] text-[var(--text-main)] font-bold px-4 rounded-lg flex items-center justify-center transition border border-[var(--border-color)]">
                <Users size={20}/>
            </button>
            <button onClick={() => setShowAddModal(true)} className="bg-[#FF6700] text-black font-bold px-4 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(255,103,0,0.4)] hover:scale-105 transition">
                <Plus size={24}/>
            </button>
        </div>

        {/* ASSET LIST */}
        <div className="space-y-3 pb-20">
            {filteredAssets.length === 0 ? (
              <div className="text-center py-10 text-[var(--text-sub)]">
                <Wrench size={40} className="mx-auto mb-2 opacity-20"/>
                <p className="text-sm">No tools found.</p>
              </div>
            ) : (
              filteredAssets.map(asset => (
                <div key={asset.id} className={`industrial-card p-4 rounded-xl relative transition-all duration-300 ${asset.status === 'BROKEN' ? 'border-red-900/50 bg-red-900/5' : ''} ${selectedAsset === asset.id ? 'ring-1 ring-[#FF6700]' : ''}`}>
                    
                    <div className="flex gap-4 cursor-pointer" onClick={() => setSelectedAsset(selectedAsset === asset.id ? null : asset.id)}>
                        <div className="w-16 h-16 rounded-lg bg-black/20 flex-shrink-0 border border-[var(--border-color)] flex items-center justify-center overflow-hidden">
                            {asset.photo_url ? <img src={asset.photo_url} alt={asset.name} className="w-full h-full object-cover" /> : <Wrench size={20} className="text-[var(--text-sub)]"/>}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-lg leading-tight truncate pr-2 text-[var(--text-main)]">{asset.name}</h3>
                                {asset.status === 'IN_VAN' && <span className="text-[10px] font-bold bg-green-500/20 text-green-500 px-2 py-1 rounded">IN VAN</span>}
                                {asset.status === 'CHECKED_OUT' && <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2 py-1 rounded">OUT</span>}
                                {asset.status === 'BROKEN' && <span className="text-[10px] font-bold bg-red-500/20 text-red-500 px-2 py-1 rounded">BROKEN</span>}
                            </div>
                            <p className="text-xs text-[var(--text-sub)] mt-1">{asset.brand} {asset.serial_number && `• S/N: ${asset.serial_number}`}</p>
                            
                            {asset.status === 'CHECKED_OUT' && asset.assigned_to && (
                                <p className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                                    <User size={12}/> {teamMembers.find(m => m.id === asset.assigned_to)?.name || 'Unknown'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ACTIONS */}
                    {selectedAsset === asset.id && (
                        <div className="mt-4 pt-4 border-t border-[var(--border-color)] animate-in slide-in-from-top-2">
                            {asset.status === 'IN_VAN' ? (
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <select onChange={(e) => { if(e.target.value) updateStatus(asset.id, 'CHECKED_OUT', e.target.value); }} className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-main)] outline-none appearance-none focus:border-[#FF6700]">
                                            <option value="">Select Technician...</option>
                                            {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-3 text-[var(--text-sub)] pointer-events-none"/>
                                    </div>
                                    <button onClick={() => updateStatus(asset.id, 'BROKEN')} className="px-3 py-2 bg-red-900/20 border border-red-900/50 rounded-lg text-red-500 hover:bg-red-900/40"><AlertTriangle size={18}/></button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <button onClick={() => updateStatus(asset.id, 'IN_VAN')} className="flex-1 bg-[var(--bg-main)] hover:bg-[var(--text-main)] hover:text-[var(--bg-main)] py-2 rounded-lg font-bold text-sm transition text-[var(--text-main)] border border-[var(--border-color)]">RETURN TO VAN</button>
                                    <button onClick={() => deleteAsset(asset.id)} className="px-3 py-2 text-[var(--text-sub)] hover:text-red-500 transition"><Trash2 size={18}/></button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
              ))
            )}
        </div>

        {/* BRANDING FOOTER */}
        <div className="mt-12 text-center opacity-40">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-sub)]">
                POWERED BY FIELDDESKOPS
            </p>
        </div>

      </main>

      {/* TEAM MODAL */}
      {showTeamModal && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
             <div className="industrial-card w-full max-w-sm rounded-2xl p-6 shadow-2xl relative">
                <button onClick={() => setShowTeamModal(false)} className="absolute top-4 right-4 text-[var(--text-sub)] hover:text-[var(--text-main)]"><X size={20}/></button>
                <h2 className="font-oswald font-bold text-xl mb-6 text-[var(--text-main)] flex items-center gap-2"><Users size={20}/> MANAGE TEAM</h2>
                <div className="flex gap-2 mb-6">
                    <input placeholder="Enter Name (e.g. Mike)" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} className="bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg p-2 flex-1 outline-none"/>
                    <button onClick={addTeamMember} className="bg-[#FF6700] text-black font-bold px-4 rounded-lg"><Plus/></button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                    {teamMembers.length === 0 ? <p className="text-[var(--text-sub)] text-xs text-center py-4">No team members added yet.</p> : teamMembers.map(m => (
                        <div key={m.id} className="bg-white/5 border border-white/5 p-3 rounded-lg flex justify-between items-center">
                            <span className="font-bold text-sm text-[var(--text-main)]">{m.name}</span>
                            <button onClick={() => deleteTeamMember(m.id)} className="text-[var(--text-sub)] hover:text-red-500"><Trash2 size={14}/></button>
                        </div>
                    ))}
                </div>
             </div>
        </div>
      )}

      {/* ADD TOOL MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
            <div className="industrial-card w-full max-w-sm rounded-2xl p-6 shadow-2xl relative">
                <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-[var(--text-sub)] hover:text-[var(--text-main)]"><X size={20}/></button>
                <h2 className="font-oswald font-bold text-xl mb-6 text-[#FF6700]">REGISTER TOOL</h2>
                
                {/* PHOTO */}
                <div className="mb-4">
                    {photoPreview ? (
                        <div className="relative w-full h-40 bg-black/40 rounded-xl overflow-hidden border border-white/10">
                            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover"/>
                            <button onClick={() => { setPhotoPreview(null); setNewPhoto(null); }} className="absolute top-2 right-2 bg-red-500 p-1.5 rounded-full text-white shadow-lg"><X size={14}/></button>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[var(--border-color)] rounded-xl cursor-pointer hover:border-[#FF6700] hover:bg-white/5 transition">
                            <Camera size={24} className="text-[var(--text-sub)] mb-2"/>
                            <span className="text-xs text-[var(--text-sub)] font-bold uppercase">Tap to Take Photo</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect}/>
                        </label>
                    )}
                </div>

                <div className="space-y-3">
                    <input placeholder="Tool Name (e.g. Hilti Drill)" value={newTool.name} onChange={e => setNewTool({...newTool, name: e.target.value})} className="bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg p-3 w-full outline-none"/>
                    <div className="flex gap-2">
                        <input placeholder="Brand" value={newTool.brand} onChange={e => setNewTool({...newTool, brand: e.target.value})} className="bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg p-3 w-full outline-none"/>
                        <input placeholder="Serial #" value={newTool.serial} onChange={e => setNewTool({...newTool, serial: e.target.value})} className="bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg p-3 w-full outline-none"/>
                    </div>
                </div>

                <button onClick={addAsset} disabled={uploading} className="w-full mt-6 bg-[#FF6700] text-black font-bold py-3 rounded-xl hover:scale-105 transition shadow-[0_0_20px_rgba(255,103,0,0.4)] flex items-center justify-center gap-2">
                    {uploading ? <Loader2 className="animate-spin"/> : <CheckCircle2 size={18}/>} SAVE TO VAN
                </button>
            </div>
        </div>
      )}

    </div>
  );
}
