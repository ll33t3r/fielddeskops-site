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
    project: 'Smith Residence Remodel',
    location: 'Job Site',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    tags: []
  });
  
  // Camera state
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const fileInputRef = useRef(null);
  
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
          imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=200&fit=crop',
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
          imageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=300&h=200&fit=crop',
          notes: 'Need electrician review before proceeding'
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
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(photo => photo.category === categoryFilter);
    }
    
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

  // Take photo using device camera
  const openCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle photo capture
  const handlePhotoCapture = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target.result;
      
      // Create new photo object
      const photo = {
        id: Date.now(),
        sessionId: currentSession.id,
        title: `Photo ${photos.length + 1}`,
        description: 'Captured from camera',
        project: currentSession.project,
        location: currentSession.location,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tags: [...currentSession.tags],
        category: 'progress',
        imageUrl: imageUrl,
        notes: currentSession.notes
      };
      
      const updatedPhotos = [...photos, photo];
      setPhotos(updatedPhotos);
      localStorage.setItem('sitesnap_photos', JSON.stringify(updatedPhotos));
      updateStats(updatedPhotos);
      filterPhotos(updatedPhotos, filter, searchTerm);
      
      // Haptic feedback on mobile
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      alert('Photo saved! 📸');
      setShowCamera(false);
    };
    
    reader.readAsDataURL(file);
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

  // Export photos
  const exportPhotos = () => {
    const dataStr = JSON.stringify(photos, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `sitesnap-export-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    alert(`Exported ${photos.length} photos 📤`);
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
              onClick={exportPhotos}
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
          </div>
        </div>

        {/* Camera Section - SIMPLIFIED */}
        <div className="bg-[#262626] border border-[#333] rounded-xl p-4 mb-6">
          <h3 className="font-oswald text-lg text-white mb-4">Take Photo</h3>
          
          <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center mb-4">
            <div className="text-center text-gray-400">
              <Camera size={48} className="mx-auto mb-2 opacity-50" />
              <p>Ready to capture photos</p>
            </div>
          </div>
          
          <button
            onClick={openCamera}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
          >
            <Camera size={18} />
            Take Photo
          </button>
          
          <p className="text-gray-400 text-sm text-center mt-3">
            Uses your device's camera or gallery
          </p>
          
          {/* Hidden file input for camera */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            capture="environment"
            onChange={handlePhotoCapture}
            className="hidden"
          />
        </div>

        {/* Search */}
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
          <h3 className="font-oswald text-lg text-white">
            {filter === 'all' ? 'All Photos' : categories.find(c => c.id === filter)?.name} ({filteredPhotos.length})
          </h3>
          
          {filteredPhotos.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Camera size={48} className="mx-auto mb-4 opacity-50" />
              <p>No photos yet</p>
              <p className="text-sm mt-2">Tap "Take Photo" to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredPhotos.map((photo) => {
                const categoryInfo = categories.find(c => c.id === photo.category) || categories[0];
                
                return (
                  <div 
                    key={photo.id}
                    className="bg-[#262626] border border-[#333] rounded-xl overflow-hidden"
                  >
                    {/* Photo Thumbnail */}
                    <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 relative">
                      <img 
                        src={photo.imageUrl} 
                        alt={photo.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs ${categoryInfo.color} text-white`}>
                        {categoryInfo.name}
                      </div>
                    </div>
                    
                    {/* Photo Info */}
                    <div className="p-3">
                      <h4 className="text-white font-semibold text-sm truncate">{photo.title}</h4>
                      <p className="text-gray-400 text-xs truncate">{photo.description}</p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-xs text-gray-500">
                          {photo.time}
                        </div>
                        <button
                          onClick={() => deletePhoto(photo.id)}
                          className="p-1 text-gray-400 hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
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
            onClick={openCamera}
            className="flex flex-col items-center p-2 text-gray-400 hover:text-white"
          >
            <Camera size={20} />
            <span className="text-xs mt-1">Camera</span>
          </button>
          <button 
            onClick={exportPhotos}
            className="flex flex-col items-center p-2 text-gray-400 hover:text-white"
          >
            <Download size={20} />
            <span className="text-xs mt-1">Export</span>
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
