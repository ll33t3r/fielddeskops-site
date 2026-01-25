'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../../utils/supabase/client';
import { Plus, Trash2, Search, ArrowLeft, Loader2, Minus, AlertTriangle, Package } from 'lucide-react';
import Link from 'next/link';

export default function LoadOut() {
  const supabase = createClient();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState('');
  const [search, setSearch] = useState('');

  // LOAD
  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Create inventory table if it doesnt exist (Supabase might handle this if RLS allows, otherwise done manually)
    const { data, error } = await supabase.from('inventory').select('*').order('name', { ascending: true });
    
    if (data) setItems(data);
    setLoading(false);
  };

  // ADD
  const addItem = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    const item = { user_id: user.id, name: newItem, quantity: 1, category: 'General' };
    
    const { data, error } = await supabase.from('inventory').insert(item).select().single();
    if (data) setItems([...items, data]);
    setNewItem('');
  };

  // UPDATE (+/-)
  const updateQuantity = async (id, currentQty, change) => {
    const newQty = Math.max(0, currentQty + change);
    
    // Optimistic UI Update (Immediate)
    setItems(items.map(i => i.id === id ? { ...i, quantity: newQty } : i));

    // DB Update
    await supabase.from('inventory').update({ quantity: newQty }).eq('id', id);
  };

  // DELETE
  const deleteItem = async (id) => {
    if (!confirm('Remove item?')) return;
    setItems(items.filter(i => i.id !== id));
    await supabase.from('inventory').delete().eq('id', id);
  };

  // FILTER
  const filteredItems = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col p-4 max-w-xl mx-auto min-h-screen bg-[var(--bg-main)]">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/" className="industrial-card p-2 rounded-lg hover:text-[#FF6700] transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wide text-blue-500 font-oswald">LoadOut</h1>
          <p className="text-xs text-[var(--text-sub)] font-bold tracking-widest opacity-60">INVENTORY TRACKER</p>
        </div>
      </div>

      {/* SEARCH & ADD */}
      <div className="industrial-card p-2 rounded-xl mb-6 flex gap-2">
        <div className="flex-1 flex items-center px-3 gap-2 bg-[var(--bg-main)] rounded-lg border border-[var(--border-color)]">
            <Search size={18} className="text-[var(--text-sub)]"/>
            <input 
                type="text" 
                placeholder="Find item..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent w-full py-3 text-[var(--text-main)] outline-none"
            />
        </div>
      </div>
      
      {/* ADD NEW FORM */}
      <form onSubmit={addItem} className="flex gap-2 mb-6">
        <input 
            type="text" 
            placeholder="Add new item (e.g. Wire Nuts)" 
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            className="flex-1 bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl p-4 outline-none focus:border-blue-500 transition"
        />
        <button type="submit" disabled={!newItem} className="bg-blue-500 text-black p-4 rounded-xl font-bold disabled:opacity-50 hover:bg-blue-400 transition">
            <Plus size={24} />
        </button>
      </form>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-20 custom-scrollbar">
        {loading ? (
            <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500"/></div>
        ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 opacity-30 flex flex-col items-center">
                <Package size={48} className="mb-2" />
                <p className="text-sm font-bold uppercase tracking-widest">Van is empty</p>
            </div>
        ) : (
            filteredItems.map(item => (
                <div key={item.id} className={`industrial-card p-4 rounded-xl flex items-center justify-between border-l-4 ${item.quantity <= 2 ? 'border-red-500 bg-red-900/10' : 'border-blue-500'}`}>
                    
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg text-[var(--text-main)]">{item.name}</h3>
                            {item.quantity <= 2 && (
                                <span className="flex items-center gap-1 text-[10px] bg-red-500 text-black px-2 py-0.5 rounded font-bold uppercase">
                                    <AlertTriangle size={10} /> LOW
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={() => updateQuantity(item.id, item.quantity, -1)} className="p-2 bg-[var(--bg-main)] rounded-lg text-[var(--text-sub)] hover:text-red-500 hover:bg-red-500/10 transition">
                            <Minus size={18} />
                        </button>
                        
                        <span className={`w-8 text-center font-mono font-bold text-xl ${item.quantity === 0 ? 'text-red-500' : 'text-[var(--text-main)]'}`}>
                            {item.quantity}
                        </span>
                        
                        <button onClick={() => updateQuantity(item.id, item.quantity, 1)} className="p-2 bg-[var(--bg-main)] rounded-lg text-[var(--text-sub)] hover:text-green-500 hover:bg-green-500/10 transition">
                            <Plus size={18} />
                        </button>

                        <button onClick={() => deleteItem(item.id)} className="ml-2 text-[var(--text-sub)] hover:text-red-500 transition opacity-20 hover:opacity-100">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            ))
        )}
      </div>

       <div className="mt-4 text-center opacity-40">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-sub)]">
                POWERED BY FIELDDESKOPS
            </p>
      </div>
    </div>
  );
}
