'use client';

import { useState, useEffect, useRef } from 'react';
import { FileText, PenTool, User, Mail, Download, Share2, Clock, CheckCircle, XCircle, Edit, Trash2, Plus, FileUp, FileDown, Signature, Building, Calendar, DollarSign, Phone, MapPin } from 'lucide-react';

export default function SignOffApp() {
  // Contracts state
  const [contracts, setContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  
  // New contract form
  const [newContract, setNewContract] = useState({
    title: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    projectAddress: '',
    projectType: 'residential',
    amount: '',
    description: '',
    terms: '',
    status: 'draft'
  });
  
  // Signature state
  const [signature, setSignature] = useState(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signatory, setSignatory] = useState('Client');
  
  // Stats
  const [stats, setStats] = useState({
    totalContracts: 0,
    pending: 0,
    signed: 0,
    declined: 0,
    totalValue: 0
  });

  // Categories for filtering
  const categories = [
    { id: 'all', name: 'All Contracts', icon: <FileText size={16} />, color: 'bg-gray-600' },
    { id: 'draft', name: 'Draft', icon: <Edit size={16} />, color: 'bg-yellow-600' },
    { id: 'pending', name: 'Pending', icon: <Clock size={16} />, color: 'bg-blue-600' },
    { id: 'signed', name: 'Signed', icon: <CheckCircle size={16} />, color: 'bg-green-600' },
    { id: 'declined', name: 'Declined', icon: <XCircle size={16} />, color: 'bg-red-600' }
  ];

  // Project types
  const projectTypes = [
    'residential',
    'commercial',
    'renovation',
    'new-construction',
    'repair',
    'maintenance'
  ];

  // Load contracts from localStorage
  useEffect(() => {
    const savedContracts = localStorage.getItem('signoff_contracts');
    if (savedContracts) {
      const parsed = JSON.parse(savedContracts);
      setContracts(parsed);
      updateStats(parsed);
      filterContracts(parsed, 'all', '');
    } else {
      // Load sample data for demo
      const sampleContracts = [
        {
          id: 1,
          title: 'Smith Kitchen Remodel',
          clientName: 'John Smith',
          clientEmail: 'john.smith@email.com',
          clientPhone: '(555) 123-4567',
          projectAddress: '123 Main St, Anytown',
          projectType: 'residential',
          amount: 24500,
          description: 'Complete kitchen remodel including cabinets, countertops, and flooring',
          terms: '50% deposit upon signing, 25% after demo, 25% upon completion',
          status: 'signed',
          createdDate: '2024-05-01',
          signedDate: '2024-05-03',
          signature: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCI+PHBhdGggZD0iTTQwIDUwQzQwIDMwIDYwIDMwIDgwIDUwQzEwMCA3MCAxMjAgNzAgMTQwIDUwQzE2MCAzMCAxODAgMzAgMjAwIDUwIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPjwvc3ZnPg=='
        },
        {
          id: 2,
          title: 'Johnson Office Buildout',
          clientName: 'Sarah Johnson',
          clientEmail: 'sarah@johnsoncorp.com',
          clientPhone: '(555) 987-6543',
          projectAddress: '456 Business Ave, Cityville',
          projectType: 'commercial',
          amount: 185000,
          description: 'Office space buildout including walls, electrical, and flooring',
          terms: '30% deposit, 40% after rough-in, 30% upon completion',
          status: 'pending',
          createdDate: '2024-05-10',
          signedDate: null,
          signature: null
        },
        {
          id: 3,
          title: 'Williams Roof Repair',
          clientName: 'Mike Williams',
          clientEmail: 'mike.williams@email.com',
          clientPhone: '(555) 456-7890',
          projectAddress: '789 Oak St, Townsville',
          projectType: 'repair',
          amount: 8500,
          description: 'Emergency roof repair and replacement of damaged shingles',
          terms: 'Full payment upon completion',
          status: 'draft',
          createdDate: '2024-05-12',
          signedDate: null,
          signature: null
        },
        {
          id: 4,
          title: 'Davis Bathroom Renovation',
          clientName: 'Emily Davis',
          clientEmail: 'emily.davis@email.com',
          clientPhone: '(555) 234-5678',
          projectAddress: '321 Pine St, Villageville',
          projectType: 'renovation',
          amount: 32500,
          description: 'Complete master bathroom renovation with new fixtures and tile',
          terms: '40% deposit, 30% after plumbing rough-in, 30% upon completion',
          status: 'declined',
          createdDate: '2024-05-05',
          signedDate: null,
          signature: null,
          declineReason: 'Client decided to postpone project'
        }
      ];
      setContracts(sampleContracts);
      updateStats(sampleContracts);
      filterContracts(sampleContracts, 'all', '');
      localStorage.setItem('signoff_contracts', JSON.stringify(sampleContracts));
    }
  }, []);

  // Update stats
  const updateStats = (contractsArray) => {
    const totalContracts = contractsArray.length;
    const pending = contractsArray.filter(c => c.status === 'pending').length;
    const signed = contractsArray.filter(c => c.status === 'signed').length;
    const declined = contractsArray.filter(c => c.status === 'declined').length;
    const totalValue = contractsArray
      .filter(c => c.status === 'signed' || c.status === 'pending')
      .reduce((sum, contract) => sum + (contract.amount || 0), 0);

    setStats({
      totalContracts,
      pending,
      signed,
      declined,
      totalValue
    });
  };

  // Filter contracts
  const filterContracts = (contractsArray, statusFilter, search) => {
    let filtered = contractsArray;
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(contract => contract.status === statusFilter);
    }
    
    // Filter by search term
    if (search) {
      filtered = filtered.filter(contract => 
        contract.title.toLowerCase().includes(search.toLowerCase()) ||
        contract.clientName.toLowerCase().includes(search.toLowerCase()) ||
        contract.projectAddress.toLowerCase().includes(search.toLowerCase()) ||
        contract.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    setFilteredContracts(filtered);
  };

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
    filterContracts(contracts, filter, term);
  };

  // Handle filter change
  const handleFilterChange = (statusId) => {
    setFilter(statusId);
    filterContracts(contracts, statusId, searchTerm);
  };

  // Create new contract
  const createContract = () => {
    if (!newContract.title.trim() || !newContract.clientName.trim()) {
      alert('Please fill in required fields (Title and Client Name)');
      return;
    }
    
    const contract = {
      id: Date.now(),
      ...newContract,
      amount: parseFloat(newContract.amount) || 0,
      createdDate: new Date().toISOString().split('T')[0],
      signedDate: null,
      signature: null,
      status: 'draft'
    };
    
    const updatedContracts = [...contracts, contract];
    setContracts(updatedContracts);
    localStorage.setItem('signoff_contracts', JSON.stringify(updatedContracts));
    updateStats(updatedContracts);
    filterContracts(updatedContracts, filter, searchTerm);
    
    // Reset form
    setNewContract({
      title: '',
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      projectAddress: '',
      projectType: 'residential',
      amount: '',
      description: '',
      terms: '',
      status: 'draft'
    });
    
    alert('Contract created successfully! 📝');
  };

  // Update contract status
  const updateContractStatus = (id, newStatus) => {
    const updatedContracts = contracts.map(contract => {
      if (contract.id === id) {
        const updated = { 
          ...contract, 
          status: newStatus,
          signedDate: newStatus === 'signed' ? new Date().toISOString().split('T')[0] : contract.signedDate
        };
        return updated;
      }
      return contract;
    });
    
    setContracts(updatedContracts);
    localStorage.setItem('signoff_contracts', JSON.stringify(updatedContracts));
    updateStats(updatedContracts);
    filterContracts(updatedContracts, filter, searchTerm);
    
    const statusMessages = {
      'pending': 'Contract sent to client for review',
      'signed': 'Contract marked as signed!',
      'declined': 'Contract marked as declined',
      'draft': 'Contract moved back to draft'
    };
    
    alert(statusMessages[newStatus] || 'Status updated');
  };

  // Delete contract
  const deleteContract = (id) => {
    if (!confirm('Delete this contract?')) return;
    
    const updatedContracts = contracts.filter(contract => contract.id !== id);
    setContracts(updatedContracts);
    localStorage.setItem('signoff_contracts', JSON.stringify(updatedContracts));
    updateStats(updatedContracts);
    filterContracts(updatedContracts, filter, searchTerm);
  };

  // Start editing
  const startEdit = (contract) => {
    setEditingId(contract.id);
    setNewContract({ ...contract, amount: contract.amount.toString() });
  };

  // Save edit
  const saveEdit = () => {
    const updatedContracts = contracts.map(contract => {
      if (contract.id === editingId) {
        return { 
          ...newContract, 
          id: editingId,
          amount: parseFloat(newContract.amount) || 0
        };
      }
      return contract;
    });
    
    setContracts(updatedContracts);
    localStorage.setItem('signoff_contracts', JSON.stringify(updatedContracts));
    updateStats(updatedContracts);
    filterContracts(updatedContracts, filter, searchTerm);
    setEditingId(null);
    
    // Reset form
    setNewContract({
      title: '',
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      projectAddress: '',
      projectType: 'residential',
      amount: '',
      description: '',
      terms: '',
      status: 'draft'
    });
    
    alert('Contract updated successfully!');
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingId(null);
    setNewContract({
      title: '',
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      projectAddress: '',
      projectType: 'residential',
      amount: '',
      description: '',
      terms: '',
      status: 'draft'
    });
  };

  // Generate signature (simulated)
  const generateSignature = () => {
    // In a real app, this would use a proper signature pad
    // For demo, we'll create a simple SVG signature
    const svg = `<svg width="200" height="100"><path d="M40 50C40 30 60 30 80 50C100 70 120 70 140 50C160 30 180 30 200 50" stroke="#000" stroke-width="2" fill="none"/></svg>`;
    const signatureData = `data:image/svg+xml;base64,${btoa(svg)}`;
    setSignature(signatureData);
    
    // Update contract with signature
    if (editingId) {
      const updatedContracts = contracts.map(contract => {
        if (contract.id === editingId) {
          return { 
            ...contract, 
            signature: signatureData,
            status: 'signed',
            signedDate: new Date().toISOString().split('T')[0]
          };
        }
        return contract;
      });
      
      setContracts(updatedContracts);
      localStorage.setItem('signoff_contracts', JSON.stringify(updatedContracts));
      updateStats(updatedContracts);
      filterContracts(updatedContracts, filter, searchTerm);
    }
    
    setShowSignaturePad(false);
    setIsSigning(false);
    alert('Signature captured successfully! ✍️');
  };

  // Send contract for signature
  const sendForSignature = (id) => {
    updateContractStatus(id, 'pending');
    alert('Contract sent to client for signature! 📧');
  };

  // Export contract as PDF (simulated)
  const exportContract = (contract) => {
    const contractText = `
CONTRACT: ${contract.title}
CLIENT: ${contract.clientName}
EMAIL: ${contract.clientEmail}
PHONE: ${contract.clientPhone}
ADDRESS: ${contract.projectAddress}
PROJECT TYPE: ${contract.projectType}
AMOUNT: $${contract.amount.toLocaleString()}
DESCRIPTION: ${contract.description}
TERMS: ${contract.terms}
STATUS: ${contract.status.toUpperCase()}
CREATED: ${contract.createdDate}
${contract.signedDate ? `SIGNED: ${contract.signedDate}` : ''}
    `.trim();
    
    const blob = new Blob([contractText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract-${contract.title.toLowerCase().replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Contract exported! 📄');
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not signed';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get category info
  const getCategoryInfo = (statusId) => {
    return categories.find(cat => cat.id === statusId) || categories[0];
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] safe-area-padding">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-[#262626] border-b border-[#404040] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center">
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-oswald text-xl text-white">SignOff</h1>
              <p className="text-xs text-gray-400">Digital Contracts</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setEditingId(null)}
              className="p-2 bg-[#1a1a1a] border border-[#404040] rounded-lg text-gray-400 hover:text-white"
            >
              <Plus size={18} />
            </button>
            <button 
              onClick={() => window.print()}
              className="p-2 bg-[#1a1a1a] border border-[#404040] rounded-lg text-gray-400 hover:text-white"
            >
              <Download size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-md mx-auto">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[#262626] border border-[#333] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-400 text-sm">Total Value</div>
              <DollarSign size={16} className="text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white">{formatCurrency(stats.totalValue)}</div>
          </div>
          <div className="bg-[#262626] border border-[#333] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-400 text-sm">Pending</div>
              <Clock size={16} className="text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats.pending}</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            <FileText size={20} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search contracts..."
            className="w-full bg-[#262626] border border-[#404040] text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-green-600"
          />
        </div>

        {/* Status Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleFilterChange(category.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap ${filter === category.id ? 'bg-green-600 text-white' : 'bg-[#262626] text-gray-400'}`}
            >
              {category.icon}
              <span className="text-sm">{category.name}</span>
            </button>
          ))}
        </div>

        {/* Create/Edit Contract Form */}
        <div className="bg-[#262626] border border-[#333] rounded-xl p-4 mb-6">
          <h3 className="font-oswald text-lg text-white mb-4">
            {editingId ? 'Edit Contract' : 'Create New Contract'}
          </h3>
          
          <div className="space-y-3">
            <input
              type="text"
              value={newContract.title}
              onChange={(e) => setNewContract({...newContract, title: e.target.value})}
              placeholder="Contract Title (e.g., Kitchen Remodel)"
              className="w-full bg-[#1a1a1a] border border-[#404040] text-white rounded-lg p-3 focus:outline-none focus:border-green-600"
            />
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 text-sm block mb-2">Project Type</label>
                <select
                  value={newContract.projectType}
                  onChange={(e) => setNewContract({...newContract, projectType: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-[#404040] text-white rounded-lg p-3 focus:outline-none focus:border-green-600"
                >
                  {projectTypes.map(type => (
                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-gray-400 text-sm block mb-2">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    value={newContract.amount}
                    onChange={(e) => setNewContract({...newContract, amount: e.target.value})}
                    placeholder="0.00"
                    className="w-full bg-[#1a1a1a] border border-[#404040] text-white rounded-lg pl-8 pr-4 py-3 focus:outline-none focus:border-green-600"
                  />
                </div>
              </div>
            </div>
            
            <input
              type="text"
              value={newContract.clientName}
              onChange={(e) => setNewContract({...newContract, clientName: e.target.value})}
              placeholder="Client Name"
              className="w-full bg-[#1a1a1a] border border-[#404040] text-white rounded-lg p-3 focus:outline-none focus:border-green-600"
            />
            
            <div className="grid grid-cols-2 gap-3">
              <input
                type="email"
                value={newContract.clientEmail}
                onChange={(e) => setNewContract({...newContract, clientEmail: e.target.value})}
                placeholder="Client Email"
                className="bg-[#1a1a1a] border border-[#404040] text-white rounded-lg p-3 focus:outline-none focus:border-green-600"
              />
              
              <input
                type="tel"
                value={newContract.clientPhone}
                onChange={(e) => setNewContract({...newContract, clientPhone: e.target.value})}
                placeholder="Client Phone"
                className="bg-[#1a1a1a] border border-[#404040] text-white rounded-lg p-3 focus:outline-none focus:border-green-600"
              />
            </div>
            
            <input
              type="text"
              value={newContract.projectAddress}
              onChange={(e) => setNewContract({...newContract, projectAddress: e.target.value})}
              placeholder="Project Address"
              className="w-full bg-[#1a1a1a] border border-[#404040] text-white rounded-lg p-3 focus:outline-none focus:border-green-600"
            />
            
            <textarea
              value={newContract.description}
              onChange={(e) => setNewContract({...newContract, description: e.target.value})}
              placeholder="Project Description"
              rows="2"
              className="w-full bg-[#1a1a1a] border border-[#404040] text-white rounded-lg p-3 focus:outline-none focus:border-green-600"
            />
            
            <textarea
              value={newContract.terms}
              onChange={(e) => setNewContract({...newContract, terms: e.target.value})}
              placeholder="Payment Terms"
              rows="2"
              className="w-full bg-[#1a1a1a] border border-[#404040] text-white rounded-lg p-3 focus:outline-none focus:border-green-600"
            />
            
            <div className="flex gap-3">
              {editingId ? (
                <>
                  <button
                    onClick={saveEdit}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Save Changes
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex-1 bg-[#1a1a1a] border border-[#404040] text-gray-400 hover:text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                  >
                    <XCircle size={18} />
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={createContract}
                  disabled={!newContract.title.trim() || !newContract.clientName.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={18} />
                  Create Contract
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Contracts List */}
        <div className="space-y-3">
          <h3 className="font-oswald text-lg text-white mb-2">Contracts ({filteredContracts.length})</h3>
          
          {filteredContracts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>No contracts found</p>
              <p className="text-sm mt-2">Create your first contract above</p>
            </div>
          ) : (
            filteredContracts.map((contract) => {
              const categoryInfo = getCategoryInfo(contract.status);
              
              return (
                <div 
                  key={contract.id}
                  className={`bg-[#262626] border rounded-xl p-4 ${contract.status === 'signed' ? 'border-green-500' : contract.status === 'declined' ? 'border-red-500' : 'border-[#333]'}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg ${categoryInfo.color} flex items-center justify-center`}>
                        {categoryInfo.icon}
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">{contract.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1 text-gray-400 text-sm">
                            <User size={12} />
                            {contract.clientName}
                          </div>
                          <div className="flex items-center gap-1 text-gray-400 text-sm">
                            <MapPin size={12} />
                            {contract.projectAddress.split(',')[0]}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xl font-bold text-white">
                        {formatCurrency(contract.amount)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {formatDate(contract.createdDate)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-gray-400 text-sm line-clamp-2">{contract.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {contract.status === 'draft' && (
                        <>
                          <button
                            onClick={() => sendForSignature(contract.id)}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1"
                          >
                            <Mail size={14} />
                            Send
                          </button>
                          <button
                            onClick={() => startEdit(contract)}
                            className="px-3 py-1 bg-[#1a1a1a] border border-[#404040] text-gray-400 rounded-lg text-sm flex items-center gap-1"
                          >
                            <Edit size={14} />
                            Edit
                          </button>
                        </>
                      )}
                      
                      {contract.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateContractStatus(contract.id, 'signed')}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm flex items-center gap-1"
                          >
                            <CheckCircle size={14} />
                            Sign
                          </button>
                          <button
                            onClick={() => updateContractStatus(contract.id, 'declined')}
                            className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm flex items-center gap-1"
                          >
                            <XCircle size={14} />
                            Decline
                          </button>
                        </>
                      )}
                      
                      {contract.status === 'signed' && (
                        <div className="flex items-center gap-2 text-green-400 text-sm">
                          <CheckCircle size={14} />
                          Signed {formatDate(contract.signedDate)}
                        </div>
                      )}
                      
                      {contract.status === 'declined' && (
                        <div className="flex items-center gap-2 text-red-400 text-sm">
                          <XCircle size={14} />
                          Declined
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => exportContract(contract)}
                        className="p-2 bg-[#1a1a1a] border border-[#404040] text-gray-400 rounded-lg"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => deleteContract(contract.id)}
                        className="p-2 bg-[#1a1a1a] border border-[#404040] text-red-400 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {contract.signature && (
                    <div className="mt-3 p-2 bg-green-900/20 border border-green-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Signature size={14} className="text-green-400" />
                        <span className="text-green-300 text-sm">Digitally Signed</span>
                      </div>
                      <div className="h-8 bg-white rounded border"></div>
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
            <FileText size={20} />
            <span className="text-xs mt-1">All</span>
          </button>
          <button 
            onClick={() => setEditingId(null)}
            className="flex flex-col items-center p-2 text-gray-400 hover:text-white"
          >
            <Plus size={20} />
            <span className="text-xs mt-1">New</span>
          </button>
          <button 
            onClick={() => handleFilterChange('pending')}
            className="flex flex-col items-center p-2 text-gray-400 hover:text-white"
          >
            <Clock size={20} />
            <span className="text-xs mt-1">Pending</span>
          </button>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="flex flex-col items-center p-2 text-gray-400 hover:text-white"
          >
            <Building size={20} />
            <span className="text-xs mt-1">Dashboard</span>
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
        
        .font-oswald {
          font-family: 'Oswald', sans-serif;
        }
        
        body {
          font-family: 'Inter', sans-serif;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
