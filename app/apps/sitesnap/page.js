'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, Upload, MapPin, Tag, Calendar, Trash2, Download, Share2, Filter, Image as ImageIcon, Plus, X, Check, Edit, Search, FolderOpen, Clock, User, Building, Layers } from 'lucide-react';

export default function SiteSnapApp() {
  // Photos state
  const [photos, setPhotos] = useState([]);
  const [filteredPhotos, setFilteredPhotos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  
  // Current photo session
  const [currentSession, setCurrentSession] = useState({
    id: Date.now(),
    project: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    tags: []
  });
  
  // New photo data
  const [newPhoto, setNewPhoto] = useState({
    title: '',
    description: '',
    tag: ''
  });
  
  // UI state
  const [showCamera, setShowCamera] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [showSessionForm, setShowSessionForm] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    totalPhotos: 0,
    todayPhotos: 0,
    byProject: {},
    byLocation: {}
  });

  // Categories for filtering
  const categories = [
    { id: 'all', name: 'All Photos', icon: <ImageIcon size={16} />, color: 'bg-gray-600' },
    { id: 'progress', name: 'Progress', icon: <Layers size={16} />, color: 'bg-blue-600' },
    { id: 'issues', name: 'Issues', icon: <X size={16} />, color: 'bg-red-600' },
    { id: 'completed', name: 'Completed', icon: <Check size={16} />, color: 'bg-green-600' },
    { id: 'materials', name: 'Materials', icon: <Building size={16} />, color: 'bg-orange-600' },
    { id: 'safety', name: 'Safety', icon: <Check size={16} />, color: 'bg-yellow-600' }
  ];

  // Sample projects
  const projects = [
    'Smith Residence Remodel',
    'Johnson Office Build',
    'Downtown Plaza',
    'River View Apartments',
    'Main Street Retail'
  ];

  // Load photos from localStorage
  useEffect(() => {
    const savedPhotos = localStorage.getItem('sitesnap_photos');
    if (savedPhotos) {
      const parsed = JSON.parse(savedPhotos);
      setPhotos(parsed);
      updateStats(parsed);
      filterPhotos(parsed, 'all', '');
    } else {
      // Load sample data for demo
      const samplePhotos = [
        {
          id: 1,
          sessionId: 1,
          title: 'Kitchen Demo Start',
          description: 'Starting demolition of old cabinets',
          project: 'Smith Residence Remodel',
          location: 'Kitchen',
          date: '2024-05-10',
          time: '08:30',
          tags: ['progress', 'demo'],
          category: 'progress',
          imageUrl: '/api/placeholder/300/200',
          notes: 'All cabinets removed, ready for new install'
        },
        {
          id: 2,
          sessionId: 1,
          title: 'Electrical Issue Found',
          description: 'Outdated wiring behind wall',
          project: 'Smith Residence Remodel',
          location: 'Kitchen Wall',
          date: '2024-05-10',
          time: '10:15',
          tags: ['issues', 'electrical'],
          category: 'issues',
          imageUrl: '/api/placeholder/300/200',
          notes: 'Need electrician review before proceeding'
        },
        {
          id: 3,
          sessionId: 2,
          title: 'Drywall Complete',
          description: 'All drywall installed and taped',
          project: 'Johnson Office Build',
          location: 'Conference Room',
          date: '2024-05-11',
          time: '14:20',
          tags: ['progress', 'drywall'],
          category: 'progress',
          imageUrl: '/api/placeholder/300/200',
          notes: 'Ready for painting tomorrow'
        },
        {
          id: 4,
          sessionId: 3,
          title: 'Safety Violation',
          description: 'Missing guard rail on second floor',
          project: 'Downtown Plaza',
          location: 'Stairwell',
          date: '2024-05-12',
          time: '09:45',
          tags: ['safety', 'violation'],
          category: 'safety',
          imageUrl: '/api/placeholder/300/200',
          notes: 'Immediate correction required'
        }
      ];
      setPhotos(samplePhotos);
      updateStats(samplePhotos);
      filterPhotos(samplePhotos, 'all', '');
      localStorage.setItem('sitesnap_photos', JSON.stringify(samplePhotos));
    }
  }, []);

  // Update stats
  const updateStats = (photosArray) => {
    const totalPhotos = photosArray.length;
    const today = new Date().toISOString().split('T')[0];
    const todayPhotos = photosArray.filter(p => p.date === today).length;
    
    const byProject = {};
    const byLocation = {};
    
    photosArray.forEach(photo => {
      byProject[photo.project] = (byProject[photo.project] || 0) + 1;
      byLocation[photo.location] = (byLocation[photo.location] || 0) + 1;
    });

    setStats({
      totalPhotos,
      todayPhotos,
      byProject,
      byLocation
    });
  };

  // Filter photos
  const filterPhotos = (photosArray, categoryFilter, search) => {
    let filtered = photosArray;
    
    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(photo => photo.category === categoryFilter);
    }
    
    // Filter by search term
    if (search) {
      filtered = filtered.filter(photo => 
        photo.title.toLowerCase().includes(search.toLowerCase()) ||
        photo.description.toLowerCase().includes(search.toLowerCase()) ||
        photo.project.toLowerCase().includes(search.toLowerCase()) ||
        photo.location.toLowerCase().includes(search.toLowerCase()) ||
        photo.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
      );
    }
    
    setFilteredPhotos(filtered);
  };

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
    filterPhotos(photos, filter, term);
  };

  // Handle filter change
  const handleFilterChange = (categoryId) => {
    setFilter(categoryId);
    filterPhotos(photos, categoryId, searchTerm);
  };

  // Simulate taking a photo
  const takePhoto = () => {
    if (!currentSession.project) {
      alert('Please select a project first');
      setShowSessionForm(true);
      return;
    }
    
    const photo = {
      id: Date.now(),
      sessionId: currentSession.id,
      title: newPhoto.title || `Photo ${filteredPhotos.length + 1}`,
      description: newPhoto.description,
      project: currentSession.project,
      location: currentSession.location,
      date: currentSession.date,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tags: [...currentSession.tags, newPhoto.tag].filter(Boolean),
      category: newPhoto.tag || 'progress',
      imageUrl: `/api/placeholder/300/200?random=${Date.now()}`,
      notes: currentSession.notes
    };
    
    const updatedPhotos = [...photos, photo];
    setPhotos(updatedPhotos);
    localStorage.setItem('sitesnap_photos', JSON.stringify(updatedPhotos));
    updateStats(updatedPhotos);
    filterPhotos(updatedPhotos, filter, searchTerm);
    
    // Reset form
    setNewPhoto({
      title: '',
      description: '',
      tag: ''
    });
    
    // Haptic feedback simulation
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    alert('Photo saved! 📸');
  };

  // Delete photo
  const deletePhoto = (id) => {
    if (!confirm('Delete this photo?')) return;
    
    const updatedPhotos = photos.filter(photo => photo.id !== id);
    setPhotos(updatedPhotos);
    localStorage.setItem('sitesnap_photos', JSON.stringify(updatedPhotos));
    updateStats(updatedPhotos);
    filterPhotos(updatedPhotos, filter, searchTerm);
  };

  // Start new session
  const startNewSession = () => {
    const newSession = {
      id: Date.now(),
      project: '',
      location: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      tags: []
    };
    setCurrentSession(newSession);
    setShowSessionForm(true);
  };

  // Save session
  const saveSession = () => {
    if (!currentSession.project) {
      alert('Please select a project');
      return;
    }
    
    setShowSessionForm(false);
    alert(`Session started for ${currentSession.project} 🎬`);
  };

  // Add tag to session
  const addTag = (tag) => {
    if (tag && !currentSession.tags.includes(tag)) {
      setCurrentSession({
        ...currentSession,
        tags: [...currentSession.tags, tag]
      });
    }
  };

  // Remove tag
  const removeTag = (tagToRemove) => {
    setCurrentSession({
      ...currentSession,
      tags: currentSession.tags.filter(tag => tag !== tagToRemove)
    });
  };

  // Toggle photo selection
  const togglePhotoSelection = (id) => {
    setSelectedPhotos(prev => 
      prev.includes(id) 
        ? prev.filter(photoId => photoId !== id)
        : [...prev, id]
    );
  };

  // Export selected photos
  const exportPhotos = () => {
    if (selectedPhotos.length === 0) {
      alert('Select photos to export first');
      return;
    }
    
    const selected = photos.filter(photo => selectedPhotos.includes(photo.id));
    const dataStr = JSON.stringify(selected, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `sitesnap-export-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    alert(`Exported ${selectedPhotos.length} photos 📤`);
  };

  // Share photo (using Web Share API if available)
  const sharePhoto = (photo) => {
    if (navigator.share) {
      navigator.share({
        title: photo.title,
        text: photo.description,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      const text = `${photo.title}\n${photo.description}\nProject: ${photo.project}\nLocation: ${photo.location}\nDate: ${photo.date}`;
      navigator.clipboard.writeText(text);
      alert('Photo details copied to clipboard! 📋');
    }
  };

  // Get category info
  const getCategoryInfo = (categoryId) => {
    return categories.find(cat => cat.id === categoryId) || categories[0];
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] safe-area-padding">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-[#262626] border-b border-[#404040] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
              <Camera size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-oswald text-xl text-white">SiteSnap</h1>
              <p className="text-xs text-gray-400">Photo Documentation</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={startNewSession}
              className="p-2 bg-[#1a1a1a] border border-[#404040] rounded-lg text-gray-400 hover:text-white"
            >
              <FolderOpen size={18} />
            </button>
            <button 
              onClick={exportPhotos}
              disabled={selectedPhotos.length === 0}
              className="p-2 bg-[#1a1a1a] border border-[#404040] rounded-lg text-gray-400 hover:text-white disabled:opacity-50"
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
              <div className="text-gray-400 text-sm">Total Photos</div>
              <ImageIcon size={16} className="text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats.totalPhotos}</div>
          </div>
          <div className="bg-[#262626] border border-[#333] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-400 text-sm">Today</div>
              <Calendar size={16} className="text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats.todayPhotos}</div>
          </div>
        </div>

        {/* Current Session Bar */}
        {currentSession.project && !showSessionForm && (
          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-700/50 rounded-xl p-3 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Building size={14} className="text-purple-400" />
                  <span className="text-white font-semibold">{currentSession.project}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <MapPin size={12} />
                  {currentSession.location}
                  <Clock size={12} className="ml-2" />
                  {currentSession.date}
                </div>
              </div>
              <button
                onClick={() => setShowSessionForm(true)}
                className="p-2 bg-white/10 rounded-lg text-white"
              >
                <Edit size={14} />
              </button>
            </div>
            {currentSession.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {currentSession.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-purple-800/50 text-purple-200 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Session Form */}
        {showSessionForm && (
          <div className="bg-[#262626] border border-[#333] rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-oswald text-lg text-white">New Photo Session</h3>
              <button 
                onClick={() => setShowSessionForm(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-sm block mb-2">Project</label>
                <select
                  value={currentSession.project}
                  onChange={(e) => setCurrentSession({...currentSession, project: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-[#404040] text-white rounded-lg p-3 focus:outline-none focus:border-purple-600"
                >
                  <option value="">Select a project</option>
                  {projects.map(project => (
                    <option key={project} value={project}>{project}</option>
                  ))}
                  <option value="new">+ New Project</option>
                </select>
              </div>
              
              <div>
                <label className="text-gray-400 text-sm block mb-2">Location</label>
                <input
                  type="text"
                  value={currentSession.location}
                  onChange={(e) => setCurrentSession({...currentSession, location: e.target.value})}
                  placeholder="e.g., Kitchen, 2nd Floor, Exterior"
                  className="w-full bg-[#1a1a1a] border border-[#404040] text-white rounded-lg p-3 focus:outline-none focus:border-purple-600"
                />
              </div>
              
              <div>
                <label className="text-gray-400 text-sm block mb-2">Notes</label>
                <textarea
                  value={currentSession.notes}
                  onChange={(e) => setCurrentSession({...currentSession, notes: e.target.value})}
                  placeholder="Session notes..."
                  rows="2"
                  className="w-full bg-[#1a1a1a] border border-[#404040] text-white rounded-lg p-3 focus:outline-none focus:border-purple-600"
                />
              </div>
              
              <div>
                <label className="text-gray-400 text-sm block mb-2">Add Tags</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., electrical, plumbing, drywall"
                    className="flex-1 bg-[#1a1a1a] border border-[#404040] text-white rounded-lg p-3 focus:outline-none focus:border-purple-600"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        addTag(e.target.value.trim());
                        e.target.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector('input[type="text"]');
                      if (input.value.trim()) {
                        addTag(input.value.trim());
                        input.value = '';
                      }
                    }}
                    className="p-3 bg-purple-600 text-white rounded-lg"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {currentSession.tags.map(tag => (
                    <div key={tag} className="flex items-center gap-1 px-3 py-1 bg-purple-800/50 text-purple-200 rounded-full text-sm">
                      {tag}
                      <button 
                        onClick={() => removeTag(tag)}
                        className="text-purple-300 hover:text-white"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              <button
                onClick={saveSession}
                disabled={!currentSession.project}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Session
              </button>
            </div>
          </div>
        )}

        {/* Camera Section */}
        <div className="bg-[#262626] border border-[#333] rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-oswald text-lg text-white">Take Photo</h3>
            <div className="text-gray-400 text-sm">
              {currentSession.project || 'No session active'}
            </div>
          </div>
          
          {/* Camera Preview */}
          <div className="relative mb-4">
            <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
              {showCamera ? (
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-white rounded-full mx-auto mb-4"></div>
                  <p className="text-white">Camera Active</p>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <Camera size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Camera Preview</p>
                </div>
              )}
            </div>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <button
                onClick={() => setShowCamera(!showCamera)}
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg"
              >
                <Camera size={24} className="text-black" />
              </button>
            </div>
          </div>
          
          {/* Photo Details Form */}
          <div className="space-y-3">
            <input
              type="text"
              value={newPhoto.title}
              onChange={(e) => setNewPhoto({...newPhoto, title: e.target.value})}
              placeholder="Photo title (optional)"
              className="w-full bg-[#1a1a1a] border border-[#404040] text-white rounded-lg p-3 focus:outline-none focus:border-purple-600"
            />
            
            <textarea
              value={newPhoto.description}
              onChange={(e) => setNewPhoto({...newPhoto, description: e.target.value})}
              placeholder="Add description..."
              rows="2"
              className="w-full bg-[#1a1a1a] border border-[#404040] text-white rounded-lg p-3 focus:outline-none focus:border-purple-600"
            />
            
            <select
              value={newPhoto.tag}
              onChange={(e) => setNewPhoto({...newPhoto, tag: e.target.value})}
              className="w-full bg-[#1a1a1a] border border-[#404040] text-white rounded-lg p-3 focus:outline-none focus:border-purple-600"
            >
              <option value="">Select category</option>
              {categories.slice(1).map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            
            <button
              onClick={takePhoto}
              disabled={!currentSession.project}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera size={18} />
              Capture Photo
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex gap-2 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search photos..."
              className="w-full bg-[#262626] border border-[#404040] text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-purple-600"
            />
          </div>
          <button
            onClick={() => handleFilterChange(filter === 'all' ? 'progress' : 'all')}
            className="p-3 bg-[#262626] border border-[#404040] text-gray-400 rounded-xl hover:text-white"
          >
            <Filter size={20} />
          </button>
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleFilterChange(category.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap ${filter === category.id ? 'bg-purple-600 text-white' : 'bg-[#262626] text-gray-400'}`}
            >
              {category.icon}
              <span className="text-sm">{category.name}</span>
            </button>
          ))}
        </div>

        {/* Photos Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-oswald text-lg text-white">
              {filter === 'all' ? 'All Photos' : categories.find(c => c.id === filter)?.name} ({filteredPhotos.length})
            </h3>
            <div className="text-gray-400 text-sm">
              {selectedPhotos.length > 0 && `${selectedPhotos.length} selected`}
            </div>
          </div>
          
          {filteredPhotos.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Camera size={48} className="mx-auto mb-4 opacity-50" />
              <p>No photos yet</p>
              <p className="text-sm mt-2">Start a session and take your first photo!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredPhotos.map((photo) => {
                const categoryInfo = getCategoryInfo(photo.category);
                const isSelected = selectedPhotos.includes(photo.id);
                
                return (
                  <div 
                    key={photo.id}
                    className={`bg-[#262626] border rounded-xl overflow-hidden cursor-pointer ${isSelected ? 'border-purple-500 ring-2 ring-purple-500' : 'border-[#333]'}`}
                    onClick={() => togglePhotoSelection(photo.id)}
                  >
                    {/* Photo Thumbnail */}
                    <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 relative">
                      <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs ${categoryInfo.color} text-white`}>
                        {categoryInfo.name}
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                          <Check size={14} className="text-white" />
                        </div>
                      )}
                    </div>
                    
                    {/* Photo Info */}
                    <div className="p-3">
                      <h4 className="text-white font-semibold text-sm truncate">{photo.title}</h4>
                      <p className="text-gray-400 text-xs truncate">{photo.description}</p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-xs text-gray-500">
                          {photo.time}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              sharePhoto(photo);
                            }}
                            className="p-1 text-gray-400 hover:text-white"
                          >
                            <Share2 size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePhoto(photo.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-400"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
            <ImageIcon size={20} />
            <span className="text-xs mt-1">All</span>
          </button>
          <button 
            onClick={startNewSession}
            className="flex flex-col items-center p-2 text-gray-400 hover:text-white"
          >
            <FolderOpen size={20} />
            <span className="text-xs mt-1">Session</span>
          </button>
          <button 
            onClick={() => setShowCamera(true)}
            className="flex flex-col items-center p-2 text-gray-400 hover:text-white"
          >
            <Camera size={20} />
            <span className="text-xs mt-1">Camera</span>
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
      `}</style>
    </div>
  );
}
