'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Package, Search, Plus, Minus, AlertTriangle, Download,
  Trash2, Edit, Check, X, Truck, Clock, MapPin, ArrowLeft,
  BarChart3, AlertCircle
} from 'lucide-react';

export default function LoadOutApp() {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'tools',
    quantity: 1,
    minStock: 1,
    location: 'Van A',
    unit: 'pcs',
    checkedOut: false
  });
  
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStock: 0,
    categories: {}
  });

  const categories = [
    { id: 'all', name: 'All', color: '#505050' },
    { id: 'tools', name: 'Hand Tools', color: '#3B82F6' },
    { id: 'power-tools', name: 'Power Tools', color: '#8B5CF6' },
    { id: 'materials', name: 'Materials', color: '#10B981' },
    { id: 'consumables', name: 'Consumables', color: '#FF6700' },
    { id: 'safety', name: 'Safety', color: '#EF4444' }
  ];

  const locations = ['Van A', 'Van B', 'Van C', 'Warehouse', 'Job Site', 'Storage'];
  const units = ['pcs', 'ft', 'box', 'roll', 'can', 'bag', 'case'];

  useEffect(() => {
    const saved = localStorage.getItem('loadout_inventory');
    if (saved) {
      const parsed = JSON.parse(saved);
      setInventory(parsed);
      updateStats(parsed);
      filterInventory(parsed, 'all', '');
    } else {
      const sample = [
        { id: 1, name: 'Hammer Drill', category: 'power-tools', quantity: 2, minStock: 1, location: 'Van A', unit: 'pcs', checkedOut: false },
        { id: 2, name: 'Impact Driver', category: 'power-tools', quantity: 3, minStock: 2, location: 'Van A', unit: 'pcs', checkedOut: false },
        { id: 3, name: '3/4" PVC Pipe', category: 'materials', quantity: 15, minStock: 10, location: 'Van A', unit: 'ft', checkedOut: false },
        { id: 4, name: 'Electrical Tape', category: 'consumables', quantity: 5, minStock: 10, location: 'Van B', unit: 'roll', checkedOut: false },
        { id: 5, name: 'Safety Glasses', category: 'safety', quantity: 8, minStock: 5, location: 'Van A', unit: 'pcs', checkedOut: false },
      ];
      setInventory(sample);
      localStorage.setItem('loadout_inventory', JSON.stringify(sample));
      updateStats(sample);
      filterInventory(sample, 'all', '');
    }
  }, []);

  const updateStats = (inv) => {
    const totalItems = inv.reduce((sum, item) => sum + item.quantity, 0);
    const lowStock = inv.filter(item => item.quantity <= item.minStock).length;
    const cats = {};
    inv.forEach(item => {
      cats[item.category] = (cats[item.category] || 0) + item.quantity;
    });
    setStats({ totalItems, lowStock, categories: cats });
  };

  const filterInventory = (inv, cat, search) => {
    let filtered = inv;
    if (cat !== 'all') {
      filtered = filtered.filter(item => item.category === cat);
    }
    if (search) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.location.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFilteredInventory(filtered);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    filterInventory(inventory, filter, term);
  };

  const handleFilterChange = (cat) => {
    setFilter(cat);
    filterInventory(inventory, cat, searchTerm);
  };

  const addItem = () => {
    if (!newItem.name.trim()) return;
    const item = {
      id: Date.now(),
      ...newItem,
      quantity: parseInt(newItem.quantity) || 1,
      minStock: parseInt(newItem.minStock) || 1
    };
    const updated = [...inventory, item];
    setInventory(updated);
    localStorage.setItem('loadout_inventory', JSON.stringify(updated));
    updateStats(updated);
    filterInventory(updated, filter, searchTerm);
    resetForm();
  };

  const updateQuantity = (id, change) => {
    const updated = inventory.map(item => 
      item.id === id ? { ...item, quantity: Math.max(0, item.quantity + change) } : item
    );
    setInventory(updated);
    localStorage.setItem('loadout_inventory', JSON.stringify(updated));
    updateStats(updated);
    filterInventory(updated, filter, searchTerm);
  };

  const deleteItem = (id) => {
    if (!confirm('Delete this item?')) return;
    const updated = inventory.filter(item => item.id !== id);
    setInventory(updated);
    localStorage.setItem('loadout_inventory', JSON.stringify(updated));
    updateStats(updated);
    filterInventory(updated, filter, searchTerm);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setNewItem(item);
    setShowForm(true);
  };

  const saveEdit = () => {
    const updated = inventory.map(item =>
      item.id === editingId
        ? { ...newItem, quantity: parseInt(newItem.quantity) || 1, minStock: parseInt(newItem.minStock) || 1 }
        : item
    );
    setInventory(updated);
    localStorage.setItem('loadout_inventory', JSON.stringify(updated));
    updateStats(updated);
    filterInventory(updated, filter, searchTerm);
    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setNewItem({
      name: '',
      category: 'tools',
      quantity: 1,
      minStock: 1,
      location: 'Van A',
      unit: 'pcs',
      checkedOut: false
    });
  };

  const exportData = () => {
    const csv = [
      ['Item', 'Category', 'Quantity', 'Min Stock', 'Location', 'Unit'].join(','),
      ...filteredInventory.map(item => 
        [item.name, item.category, item.quantity, item.minStock, item.location, item.unit].join(',')
      )
    ].join('\n');
    
    const link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    link.download = `loadout-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getCategoryColor = (catId) => {
    return categories.find(c => c.id === catId)?.color || '#505050';
  };

  const getCategoryName = (catId) => {
    return categories.find(c => c.id === catId)?.name || 'Unknown';
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <header className="sticky top-0 z-40 bg-[#262626] border-b border-[#404040] px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 hover:bg-[#333] rounded-lg transition">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">LoadOut</h1>
              <p className="text-xs text-gray-400">Van Inventory Tracker</p>
            </div>
          </div>
          <button onClick={exportData} className="p-2 hover:bg-[#333] rounded-lg transition text-gray-400 hover:text-white" title="Export as CSV">
            <Download size={18} />
          </button>
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto pb-20">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#262626] border border-[#404040] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-2">Total Items</p>
                <p className="text-3xl font-bold">{stats.totalItems}</p>
              </div>
              <Package size={32} className="text-gray-600" />
            </div>
          </div>
          <div className="bg-[#262626] border border-[#404040] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-2">Low Stock</p>
                <p className="text-3xl font-bold text-[#FF6700]">{stats.lowStock}</p>
              </div>
              <AlertTriangle size={32} className="text-[#FF6700]" />
            </div>
          </div>
          <div className="bg-[#262626] border border-[#404040] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-2">Categories</p>
                <p className="text-3xl font-bold">{Object.keys(stats.categories).length}</p>
              </div>
              <BarChart3 size={32} className="text-gray-600" />
            </div>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 text-gray-500" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search items or locations..."
            className="w-full bg-[#262626] border border-[#404040] text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-[#FF6700] transition"
          />
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleFilterChange(cat.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                filter === cat.id 
                  ? 'bg-[#FF6700] text-white font-medium' 
                  : 'bg-[#262626] text-gray-400 border border-[#404040] hover:border-[#FF6700]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full mb-6 bg-[#FF6700] hover:bg-[#e55c00] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition"
        >
          <Plus size={20} />
          {showForm ? 'Cancel' : 'Add New Item'}
        </button>

        {showForm && (
          <div className="bg-[#262626] border border-[#404040] rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">{editingId ? 'Edit Item' : 'Add Item'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Item Name</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  placeholder="e.g., Hammer Drill"
                  className="w-full bg-[#1a1a1a] border border-[#404040] text-white rounded-lg p-3 focus:outline-none focus:border-[#FF6700] transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-[#404040] text-white rounded-lg p-3 focus:outline-none focus:border-[#FF6700]"
                  >
                    {categories.filter(c => c.id !== 'all').map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Location</label>
                  <select
                    value={newItem.location}
                    onChange={(e) => setNewItem({...newItem, location: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-[#404040] text-white rounded-lg p-3 focus:outline-none focus:border-[#FF6700]"
                  >
                    {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <input type="number" value={newItem.quantity} onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 0})} placeholder="Qty" className="bg-[#1a1a1a] border border-[#404040] text-white rounded-lg p-3 focus:outline-none focus:border-[#FF6700]" min="0" />
                <input type="number" value={newItem.minStock} onChange={(e) => setNewItem({...newItem, minStock: parseInt(e.target.value) || 0})} placeholder="Min" className="bg-[#1a1a1a] border border-[#404040] text-white rounded-lg p-3 focus:outline-none focus:border-[#FF6700]" min="0" />
                <select value={newItem.unit} onChange={(e) => setNewItem({...newItem, unit: e.target.value})} className="bg-[#1a1a1a] border border-[#404040] text-white rounded-lg p-3 focus:outline-none focus:border-[#FF6700]">
                  {units.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                {editingId ? (
                  <>
                    <button onClick={saveEdit} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                      <Check size={18} /> Save
                    </button>
                    <button onClick={resetForm} className="flex-1 bg-[#333] hover:bg-[#404040] text-gray-400 font-bold py-3 rounded-lg">
                      Cancel
                    </button>
                  </>
                ) : (
                  <button onClick={addItem} disabled={!newItem.name.trim()} className="w-full bg-[#FF6700] hover:bg-[#e55c00] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
                    <Plus size={18} /> Add Item
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-xl font-bold mb-4">Inventory ({filteredInventory.length})</h3>
          {filteredInventory.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Package size={48} className="mx-auto mb-4 opacity-50" />
              <p>No items found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInventory.map(item => {
                const isLowStock = item.quantity <= item.minStock;
                return (
                  <div key={item.id} className={`bg-[#262626] border rounded-xl p-4 ${isLowStock ? 'border-[#FF6700]' : 'border-[#404040]'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white" style={{backgroundColor: getCategoryColor(item.category)}}>
                          <Package size={20} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-lg mb-1">{item.name}</h4>
                          <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                            <span className="bg-[#333] px-2 py-1 rounded">{getCategoryName(item.category)}</span>
                            <span><MapPin size={12} className="inline" /> {item.location}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-3xl font-bold ${isLowStock ? 'text-[#FF6700]' : 'text-white'}`}>{item.quantity}</div>
                        <div className="text-xs text-gray-400">Min: {item.minStock} {item.unit}</div>
                        {isLowStock && <div className="text-[#FF6700] text-xs mt-1">Low</div>}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => updateQuantity(item.id, -1)} className="flex-1 bg-[#333] hover:bg-[#404040] text-gray-400 py-2 rounded-lg flex items-center justify-center gap-2">
                        <Minus size={16} /> Use
                      </button>
                      <button onClick={() => updateQuantity(item.id, 1)} className="flex-1 bg-[#333] hover:bg-[#404040] text-gray-400 py-2 rounded-lg flex items-center justify-center gap-2">
                        <Plus size={16} /> Add
                      </button>
                      <button onClick={() => startEdit(item)} className="px-4 bg-[#333] hover:bg-[#404040] text-gray-400 py-2 rounded-lg">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => deleteItem(item.id)} className="px-4 bg-[#333] hover:bg-red-900/30 text-red-400 py-2 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
