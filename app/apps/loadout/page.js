"use client";

import { useState, useEffect } from 'react';
import { Package, Plus, Minus, Trash2, Download, AlertTriangle } from 'lucide-react';

export default function LoadOut() {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [newQuantity, setNewQuantity] = useState('1');
  const [newCategory, setNewCategory] = useState('tools');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editQuantity, setEditQuantity] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('loadout_items');
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load items:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('loadout_items', JSON.stringify(items));
  }, [items]);

  const addItem = () => {
    if (!newItem.trim()) {
      showToast('Please enter item name', 'error');
      return;
    }

    const quantity = parseInt(newQuantity) || 1;
    if (quantity < 1) {
      showToast('Quantity must be at least 1', 'error');
      return;
    }

    const item = {
      id: Date.now(),
      name: newItem.trim(),
      quantity,
      category: newCategory,
      dateAdded: new Date().toLocaleDateString()
    };

    setItems([...items, item]);
    setNewItem('');
    setNewQuantity('1');
    showToast('✅ Item added', 'success');
  };

  const updateQuantity = (id, newQty) => {
    const qty = parseInt(newQty) || 0;
    if (qty < 1) {
      deleteItem(id);
      return;
    }
    setItems(items.map(item =>
      item.id === id ? { ...item, quantity: qty } : item
    ));
  };

  const deleteItem = (id) => {
    setItems(items.filter(item => item.id !== id));
    showToast('Item removed', 'info');
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditQuantity(item.quantity.toString());
  };

  const saveEdit = (id) => {
    updateQuantity(id, editQuantity);
    setEditingId(null);
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = items.filter(item => item.quantity < 3);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const categories = ['tools', 'supplies', 'safety', 'equipment', 'parts'];

  const exportCSV = () => {
    if (items.length === 0) {
      showToast('No items to export', 'error');
      return;
    }

    const csv = [
      ['Item', 'Quantity', 'Category', 'Date Added'],
      ...items.map(item => [item.name, item.quantity, item.category, item.dateAdded])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loadout-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    showToast('✅ Exported to CSV', 'success');
  };

  const getBgColor = (type) => {
    const colors = {
      success: '#22c55e',
      error: '#ff4444',
      info: '#888'
    };
    return colors[type] || '#888';
  };

  return (
    <div className="min-h-screen w-full max-w-2xl mx-auto p-4" style={{ backgroundColor: '#1a1a1a' }}>
      <div className="mb-8 pt-4">
        <div className="flex items-center gap-2 mb-2">
          <Package size={32} style={{ color: '#FF6700' }} />
          <h1 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: '0.03em', color: '#f5f5f5' }}>LOADOUT</h1>
        </div>
        <p style={{ color: '#888' }}>Inventory & Equipment Tracker</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div style={{ backgroundColor: '#262626', border: '1px solid #404040', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#FF6700' }}>{totalItems}</div>
          <div style={{ color: '#888', fontSize: '0.9rem' }}>Total Items</div>
        </div>
        <div style={{ backgroundColor: '#262626', border: '1px solid #404040', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: lowStockItems.length > 0 ? '#ff4444' : '#22c55e' }}>{items.length}</div>
          <div style={{ color: '#888', fontSize: '0.9rem' }}>Tracked Items</div>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div style={{ backgroundColor: 'rgba(255, 68, 68, 0.1)', border: '2px solid #ff4444', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff4444', fontWeight: '700' }}>
            <AlertTriangle size={20} />
            {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''} low on stock
          </div>
        </div>
      )}

      <div style={{ backgroundColor: '#262626', border: '1px solid #404040', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '16px', color: '#FF6700', fontFamily: "'Oswald', sans-serif" }}>
          Add New Item
        </div>

        <div className="mb-3">
          <label className="block font-semibold mb-2 text-sm" style={{ color: '#f5f5f5' }}>Item Name</label>
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addItem()}
            placeholder="e.g., Wrench Set, Drill Bits"
            style={{
              backgroundColor: '#1a1a1a',
              border: '2px solid #404040',
              color: '#f5f5f5',
              minHeight: '50px',
              padding: '12px 16px',
              borderRadius: '8px',
              width: '100%',
              fontFamily: "'Inter', sans-serif"
            }}
            onFocus={(e) => e.target.style.borderColor = '#FF6700'}
            onBlur={(e) => e.target.style.borderColor = '#404040'}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block font-semibold mb-2 text-sm" style={{ color: '#f5f5f5' }}>Quantity</label>
            <input
              type="number"
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
              min="1"
              style={{
                backgroundColor: '#1a1a1a',
                border: '2px solid #404040',
                color: '#f5f5f5',
                minHeight: '50px',
                padding: '12px 16px',
                borderRadius: '8px',
                width: '100%',
                fontFamily: "'Inter', sans-serif"
              }}
              onFocus={(e) => e.target.style.borderColor = '#FF6700'}
              onBlur={(e) => e.target.style.borderColor = '#404040'}
            />
          </div>
          <div>
            <label className="block font-semibold mb-2 text-sm" style={{ color: '#f5f5f5' }}>Category</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              style={{
                backgroundColor: '#1a1a1a',
                border: '2px solid #404040',
                color: '#f5f5f5',
                minHeight: '50px',
                padding: '12px 16px',
                borderRadius: '8px',
                width: '100%',
                fontFamily: "'Inter', sans-serif"
              }}
              onFocus={(e) => e.target.style.borderColor = '#FF6700'}
              onBlur={(e) => e.target.style.borderColor = '#404040'}
            >
              {['tools', 'supplies', 'safety', 'equipment', 'parts'].map(cat => (
                <option key={cat} value={cat} style={{ backgroundColor: '#1a1a1a', color: '#f5f5f5' }}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={addItem}
          style={{
            backgroundColor: '#FF6700',
            color: '#1a1a1a',
            fontWeight: '700',
            minHeight: '50px',
            border: 'none',
            borderRadius: '8px',
            width: '100%',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontFamily: "'Oswald', sans-serif"
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#e55c00';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#FF6700';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          <Plus className="inline mr-2" size={18} /> Add Item
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search items..."
          style={{
            backgroundColor: '#262626',
            border: '2px solid #404040',
            color: '#f5f5f5',
            minHeight: '50px',
            padding: '12px 16px',
            borderRadius: '8px',
            width: '100%',
            fontFamily: "'Inter', sans-serif"
          }}
          onFocus={(e) => e.target.style.borderColor = '#FF6700'}
          onBlur={(e) => e.target.style.borderColor = '#404040'}
        />
      </div>

      <button
        onClick={exportCSV}
        style={{
          backgroundColor: 'transparent',
          border: '2px solid #404040',
          color: '#f5f5f5',
          fontWeight: '700',
          minHeight: '50px',
          borderRadius: '8px',
          width: '100%',
          marginBottom: '16px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          fontFamily: "'Oswald', sans-serif"
        }}
        onMouseEnter={(e) => {
          e.target.style.borderColor = '#FF6700';
          e.target.style.color = '#FF6700';
        }}
        onMouseLeave={(e) => {
          e.target.style.borderColor = '#404040';
          e.target.style.color = '#f5f5f5';
        }}
      >
        <Download className="inline mr-2" size={18} /> Export CSV
      </button>

      <div style={{ backgroundColor: '#262626', border: '1px solid #404040', borderRadius: '8px', padding: '16px' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '16px', color: '#FF6700', fontFamily: "'Oswald', sans-serif" }}>
          Inventory ({filteredItems.length})
        </div>

        {filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#888' }}>
            <Package size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p>No items yet. Add one above!</p>
          </div>
        ) : (
          <div>
            {filteredItems.map(item => (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #404040',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div className="flex-1">
                  <div style={{ fontWeight: '700', color: '#f5f5f5' }}>{item.name}</div>
                  <div style={{ color: '#888', fontSize: '0.85rem', marginTop: '4px' }}>
                    {item.category} • {item.dateAdded}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {editingId === item.id ? (
                    <>
                      <input
                        type="number"
                        value={editQuantity}
                        onChange={(e) => setEditQuantity(e.target.value)}
                        min="1"
                        style={{
                          backgroundColor: '#262626',
                          border: '1px solid #FF6700',
                          color: '#f5f5f5',
                          width: '60px',
                          padding: '6px 8px',
                          borderRadius: '4px',
                          textAlign: 'center'
                        }}
                      />
                      <button
                        onClick={() => saveEdit(item.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#22c55e',
                          cursor: 'pointer',
                          fontSize: '1.2rem',
                          padding: '4px'
                        }}
                      >
                        ✓
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{
                        backgroundColor: item.quantity < 3 ? 'rgba(255, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.1)',
                        color: item.quantity < 3 ? '#ff4444' : '#22c55e',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        minWidth: '50px',
                        textAlign: 'center'
                      }}>
                        {item.quantity}
                      </div>
                      <button
                        onClick={() => startEdit(item)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#FF6700',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          padding: '4px',
                          opacity: 0.7
                        }}
                      >
                        ✎
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => deleteItem(item.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ff4444',
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      padding: '4px'
                    }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: getBgColor(toast.type),
            color: '#1a1a1a',
            padding: '16px 24px',
            borderRadius: '8px',
            fontWeight: '700',
            zIndex: 9999,
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          {toast.message}
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
