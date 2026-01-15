'use client';

import { useState, useEffect } from 'react';
import { Package, Search, Plus, Minus, AlertTriangle, Download, Upload, Filter, Trash2, Edit, Check, X, Barcode, Truck, Clock, Tag, MapPin, Package2, Warehouse, BarChart3 } from 'lucide-react';

export default function LoadOutApp() {
  // Inventory state
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  
  // New item form
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'tools',
    quantity: 1,
    minStock: 1,
    location: 'Van A',
    lastUsed: new Date().toISOString().split('T')[0],
    checkedOut: false
  });
  
  // Stats
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStock: 0,
    totalValue: 0,
    categories: {}
  });

  // Categories for filtering
  const categories = [
    { id: 'all', name: 'All Items', icon: <Package size={16} />, color: 'bg-gray-600' },
    { id: 'tools', name: 'Hand Tools', icon: <Package2 size={16} />, color: 'bg-blue-600' },
    { id: 'power-tools', name: 'Power Tools', icon: <Package2 size={16} />, color: 'bg-purple-600' },
    { id: 'materials', name: 'Materials', icon: <Warehouse size={16} />, color: 'bg-green-600' },
    { id: 'consumables', name: 'Consumables', icon: <Tag size={16} />, color: 'bg-orange-600' },
    { id: 'safety', name: 'Safety Gear', icon: <AlertTriangle size={16} />, color: 'bg-red-600' }
  ];

  // Load inventory from localStorage
  useEffect(() => {
    const savedInventory = localStorage.getItem('loadout_inventory');
    if (savedInventory) {
      const parsed = JSON.parse(savedInventory);
      setInventory(parsed);
      updateStats(parsed);
      filterInventory(parsed, 'all', '');
    } else {
      // Load sample data for demo
      const sampleInventory = [
        { id: 1, name: 'Hammer Drill', category: 'power-tools', quantity: 2, minStock: 1, location: 'Van A', lastUsed: '2024-05-10', checkedOut: false },
        { id: 2, name: 'Impact Driver', category: 'power-tools', quantity: 3, minStock: 2, location: 'Van A', lastUsed: '2024-05-12', checkedOut: true },
        { id: 3, name: 'Circular Saw', category: 'power-tools', quantity: 1, minStock: 1, location: 'Van B', lastUsed: '2024-05-08', checkedOut: false },
        { id: 4, name: '3/4" PVC Pipe', category: 'materials', quantity: 15, minStock: 10, location: 'Van A', lastUsed: '2024-05-11', checkedOut: false },
        { id: 5, name: 'Electrical Tape', category: 'consumables', quantity: 5, minStock: 10, location: 'Van B', lastUsed: '2024-05-09', checkedOut: false },
        { id: 6, name: 'Safety Glasses', category: 'safety', quantity: 8, minStock: 5, location: 'Van A', lastUsed: '2024-05-12', checkedOut: false },
        { id: 7, name: 'Claw Hammer', category: 'tools', quantity: 4, minStock: 2, location: 'Van A', lastUsed: '2024-05-07', checkedOut: false },
        { id: 8, name: '2x4 Lumber', category: 'materials', quantity: 25, minStock: 20, location: 'Van B', lastUsed: '2024-05-06', checkedOut: false }
      ];
      setInventory(sampleInventory);
      updateStats(sampleInventory);
      filterInventory(sampleInventory, 'all', '');
      localStorage.setItem('loadout_inventory', JSON.stringify(sampleInventory));
    }
  }, []);

  // Update stats
  const updateStats = (inv) => {
    const totalItems = inv.reduce((sum, item) => sum + item.quantity, 0);
    const lowStock = inv.filter(item => item.quantity <= item.minStock).length;
    const categories = {};
    
    inv.forEach(item => {
      categories[item.category] = (categories[item.category] || 0) + item.quantity;
    });

    setStats({
      totalItems,
      lowStock,
      totalValue: totalItems * 100, // Simplified value calculation
      categories
    });
  };

  // Filter inventory
  const filterInventory = (inv, categoryFilter, search) => {
    let filtered = inv;
    
    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }
    
    // Filter by search term
    if (search) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.location.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    setFilteredInventory(filtered);
  };

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
    filterInventory(inventory, filter, term);
  };

  // Handle filter change
  const handleFilterChange = (categoryId) => {
    setFilter(categoryId);
    filterInventory(inventory, categoryId, searchTerm);
  };

  // Add new item
  const addItem = () => {
    if (!newItem.name.trim()) return;
    
    const item = {
      id: Date.now(),
      ...newItem,
      quantity: parseInt(newItem.quantity),
      minStock: parseInt(newItem.minStock)
    };
    
    const updatedInventory = [...inventory, item];
    setInventory(updatedInventory);
    localStorage.setItem('loadout_inventory', JSON.stringify(updatedInventory));
    updateStats(updatedInventory);
    filterInventory(updatedInventory, filter, searchTerm);
    
    // Reset form
    setNewItem({
      name: '',
      category: 'tools',
      quantity: 1,
      minStock: 1,
      location: 'Van A',
      lastUsed: new Date().toISOString().split('T')[0],
      checkedOut: false
    });
  };

  // Update item quantity
  const updateQuantity = (id, change) => {
    const updatedInventory = inventory.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    
    setInventory(updatedInventory);
    localStorage.setItem('loadout_inventory', JSON.stringify(updatedInventory));
    updateStats(updatedInventory);
    filterInventory(updatedInventory, filter, searchTerm);
  };

  // Toggle checkout status
  const toggleCheckout = (id) => {
    const updatedInventory = inventory.map(item => {
      if (item.id === id) {
        return { ...item, checkedOut: !item.checkedOut };
      }
      return item;
    });
    
    setInventory(updatedInventory);
    localStorage.setItem('loadout_inventory', JSON.stringify(updatedInventory));
    filterInventory(updatedInventory, filter, searchTerm);
  };

  // Delete item
  const deleteItem = (id) => {
    if (!confirm('Delete this item from inventory?')) return;
    
    const updatedInventory = inventory.filter(item => item.id !== id);
    setInventory(updatedInventory);
    localStorage.setItem('loadout_inventory', JSON.stringify(updatedInventory));
    updateStats(updatedInventory);
    filterInventory(updatedInventory, filter, searchTerm);
  };

  // Start editing
  const startEdit = (item) => {
    setEditingId(item.id);
    setNewItem({ ...item });
  };

  // Save edit
  const saveEdit = () => {
    const updatedInventory = inventory.map(item => {
      if (item.id === editingId) {
        return { 
          ...newItem, 
          id: editingId,
          quantity: parseInt(newItem.quantity),
          minStock: parseInt(newItem.minStock)
        };
      }
      return item;
    });
    
    setInventory(updatedInventory);
    localStorage.setItem('loadout_inventory', JSON.stringify(updatedInventory));
    updateStats(updatedInventory);
    filterInventory(updatedInventory, filter, searchTerm);
    setEditingId(null);
    
    // Reset form
    setNewItem({
      name: '',
      category: 'tools',
      quantity: 1,
      minStock: 1,
      location: 'Van A',
      lastUsed: new Date().toISOString().split('T')[0],
      checkedOut: false
    });
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingId(null);
    setNewItem({
      name: '',
      category: 'tools',
      quantity: 1,
      minStock: 1,
      location: 'Van A',
      lastUsed: new Date().toISOString().split('T')[0],
      checkedOut: false
    });
  };

  // Export inventory
  const exportInventory = () => {
    const dataStr = JSON.stringify(inventory, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `loadout-inventory-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Import inventory
  const importInventory = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          setInventory(imported);
          localStorage.setItem('loadout_inventory', JSON.stringify(imported));
          updateStats(imported);
          filterInventory(imported, filter, searchTerm);
          alert(`Imported ${imported.length} items successfully!`);
        } catch (err) {
          alert('Error importing file. Make sure it\'s a valid LoadOut export.');
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  };

  // Get category info
  const getCategoryInfo = (categoryId) => {
    return categories.find(cat => cat.id === categoryId) || categories[0];
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] safe-area-padding">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-[#262626] border-b border-[#404040] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <Truck size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-oswald text-xl text-white">LoadOut</h1>
              <p className="text-xs text-gray-400">Van Inventory Tracker</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={exportInventory}
              className="p-2 bg-[#1a1a1a] border border-[#404040] rounded-lg text-gray-400 hover:text-white"
            >
              <Download size={18} />
            </button>
            <button 
              onClick={importInventory}
              className="p-2 bg-[#1a1a1a] border border-[#404040] rounded-lg text-gray-400 hover:text-white"
            >
              <Upload size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-md mx-auto">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[#262626] border border-[#333] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-400 text-sm">Total Items</div>
              <Package size={16} className="text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats.totalItems}</div>
          </div>
          <div className="bg-[#262626] border border-[#333] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-400 text-sm">Low Stock</div>
              <AlertTriangle size={16} className="text-red-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats.lowStock}</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search items or locations..."
            className="w-full bg-[#262626] border border-[#404040] text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-[#FF6700]"
          />
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleFilterChange(category.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap ${filter === category.id ? 'bg-[#FF6700] text-white' : 'bg-[#262626] text-gray-400'}`}
            >
              {category.icon}
              <span className="text-sm">{category.name}</span>
            </button>
          ))}
        </div>

        {/* Add/Edit Item Form */}
        <div className="bg-[#262626] border border-[#333] rounded-xl p-4 mb-6">
          <h3 className="font-oswald text-lg text-white mb-4">
            {editingId ? 'Edit Item' : 'Add New Item'}
          </h3>
          
          <div className="space-y-3">
            <input
              type="text"
              value={newItem.name}
              onChange={(e) => setNewItem({...newItem, name: e.target.value})}
              placeholder="Item name (e.g., Hammer Drill)"
              className="w-full bg-[#1a1a1a] border border-[#404040] text-white rounded-lg p-3 focus:outline-none focus:border-[#FF6700]"
            />
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 text-sm block mb-2">Category</label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-[#404040] text-white rounded-lg p-3 focus:outline-none focus:border-[#FF6700]"
                >
                  <option value="tools">Hand Tools</option>
                  <option value="power-tools">Power Tools</option>
                  <option value="materials">Materials</option>
                  <option value="consumables">Consumables</option>
                  <option value="safety">Safety Gear</option>
                </select>
              </div>
              
              <div>
                <label className="text-gray-400 text-sm block mb-2">Location</label>
                <select
                  value={newItem.location}
                  onChange={(e) => setNewItem({...newItem, location: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-[#404040] text-white rounded-lg p-3 focus:outline-none focus:border-[#FF6700]"
                >
                  <option value="Van A">Van A</option>
                  <option value="Van B">Van B</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Job Site">Job Site</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 text-sm block mb-2">Current Qty</label>
                <div className="flex items-center bg-[#1a1a1a] border border-[#404040] rounded-lg">
                  <button 
                    onClick={() => setNewItem({...newItem, quantity: Math.max(1, newItem.quantity - 1)})}
                    className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-white"
                  >
                    <Minus size={20} />
                  </button>
                  <input
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})}
                    className="flex-1 bg-transparent text-white text-center text-lg py-2 focus:outline-none"
                    min="1"
                  />
                  <button 
                    onClick={() => setNewItem({...newItem, quantity: newItem.quantity + 1})}
                    className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-white"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
              
              <div>
                <label className="text-gray-400 text-sm block mb-2">Min Stock</label>
                <div className="flex items-center bg-[#1a1a1a] border border-[#404040] rounded-lg">
                  <button 
                    onClick={() => setNewItem({...newItem, minStock: Math.max(1, newItem.minStock - 1)})}
                    className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-white"
                  >
                    <Minus size={20} />
                  </button>
                  <input
                    type="number"
                    value={newItem.minStock}
                    onChange={(e) => setNewItem({...newItem, minStock: parseInt(e.target.value) || 1})}
                    className="flex-1 bg-transparent text-white text-center text-lg py-2 focus:outline-none"
                    min="1"
                  />
                  <button 
                    onClick={() => setNewItem({...newItem, minStock: newItem.minStock + 1})}
                    className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-white"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              {editingId ? (
                <>
                  <button
                    onClick={saveEdit}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Check size={18} />
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex-1 bg-[#1a1a1a] border border-[#404040] text-gray-400 hover:text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                  >
                    <X size={18} />
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={addItem}
                  disabled={!newItem.name.trim()}
                  className="flex-1 bg-[#FF6700] hover:bg-[#e55c00] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={18} />
                  Add to Inventory
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Inventory List */}
        <div className="space-y-3">
          <h3 className="font-oswald text-lg text-white mb-2">Inventory Items ({filteredInventory.length})</h3>
          
          {filteredInventory.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Package size={48} className="mx-auto mb-4 opacity-50" />
              <p>No items found</p>
              <p className="text-sm mt-2">Try adding some items or changing your filters</p>
            </div>
          ) : (
            filteredInventory.map((item) => {
              const categoryInfo = getCategoryInfo(item.category);
              const isLowStock = item.quantity <= item.minStock;
              
              return (
                <div 
                  key={item.id}
                  className={`bg-[#262626] border rounded-xl p-4 ${isLowStock ? 'border-red-500' : 'border-[#333]'} ${item.checkedOut ? 'opacity-70' : ''}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg ${categoryInfo.color} flex items-center justify-center`}>
                        {categoryInfo.icon}
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">{item.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1 text-gray-400 text-sm">
                            <MapPin size={12} />
                            {item.location}
                          </div>
                          <div className="flex items-center gap-1 text-gray-400 text-sm">
                            <Clock size={12} />
                            Last: {formatDate(item.lastUsed)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${isLowStock ? 'text-red-400' : 'text-white'}`}>
                        {item.quantity}
                        <span className="text-sm text-gray-400"> / {item.minStock}</span>
                      </div>
                      {item.checkedOut && (
                        <div className="text-xs text-blue-400 mt-1">Checked Out</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="flex-1 flex gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="flex-1 py-2 bg-[#1a1a1a] border border-[#404040] text-gray-400 rounded-lg text-sm flex items-center justify-center gap-1"
                      >
                        <Minus size={14} />
                        Use
                      </button>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="flex-1 py-2 bg-[#1a1a1a] border border-[#404040] text-gray-400 rounded-lg text-sm flex items-center justify-center gap-1"
                      >
                        <Plus size={14} />
                        Restock
                      </button>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleCheckout(item.id)}
                        className={`p-2 rounded-lg ${item.checkedOut ? 'bg-green-900/30 text-green-400' : 'bg-[#1a1a1a] border border-[#404040] text-gray-400'}`}
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => startEdit(item)}
                        className="p-2 bg-[#1a1a1a] border border-[#404040] text-gray-400 rounded-lg"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-2 bg-[#1a1a1a] border border-[#404040] text-red-400 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {isLowStock && (
                    <div className="mt-3 p-2 bg-red-900/20 border border-red-800 rounded-lg flex items-center gap-2">
                      <AlertTriangle size={14} className="text-red-400" />
                      <span className="text-red-300 text-sm">Low stock! Reorder soon.</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#262626] border-t border-[#404040] p-3 safe-area-bottom">
        <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
          <button 
            onClick={() => handleFilterChange('all')}
            className="flex flex-col items-center p-2 text-gray-400 hover:text-white"
          >
            <Package size={20} />
            <span className="text-xs mt-1">All</span>
          </button>
          <button 
            onClick={() => setNewItem({...newItem, name: ''})}
            className="flex flex-col items-center p-2 text-gray-400 hover:text-white"
          >
            <Plus size={20} />
            <span className="text-xs mt-1">Add</span>
          </button>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="flex flex-col items-center p-2 text-gray-400 hover:text-white"
          >
            <Truck size={20} />
            <span className="text-xs mt-1">Dashboard</span>
          </button>
          <button 
            onClick={exportInventory}
            className="flex flex-col items-center p-2 text-gray-400 hover:text-white"
          >
            <Download size={20} />
            <span className="text-xs mt-1">Export</span>
          </button>
        </div>
      </nav>

      <style jsx global>{`
        .safe-area-padding {
          padding-top: env(safe-area-inset-top);
          padding-bottom: env(safe-area-inset-bottom);
        }
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
        
        /* Oswald font for headings */
        .font-oswald {
          font-family: 'Oswald', sans-serif;
        }
        
        /* Inter font for body (already default) */
        body {
          font-family: 'Inter', sans-serif;
        }
        
        /* Remove number input arrows */
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}
