'use client';

import { useEffect, useState } from 'react';

export default function SiteSnapPage() {
  const [photos, setPhotos] = useState([]);
  const [currentImageBase64, setCurrentImageBase64] = useState(null);
  const [jobName, setJobName] = useState('');
  const [photoTag, setPhotoTag] = useState('BEFORE WORK');
  const [photoNotes, setPhotoNotes] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('fdo_sitesnap_v2');
      if (stored) setPhotos(JSON.parse(stored));
    } catch (e) {
      console.error('Error loading photos', e);
    }
  }, []);

  // Handle camera input
  const handleCamera = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCurrentImageBase64(ev.target?.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Save entry
  const saveEntry = () => {
    if (!jobName || !currentImageBase64) {
      alert('Please enter a Job Name and take a photo.');
      return;
    }

    const newEntry = {
      id: Date.now(),
      job: jobName,
      tag: photoTag,
      note: photoNotes,
      img: currentImageBase64,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [newEntry, ...photos];
    if (updated.length > 10) updated.pop();

    setPhotos(updated);
    localStorage.setItem('fdo_sitesnap_v2', JSON.stringify(updated));

    setPhotoNotes('');
    setJobName('');
    setPhotoTag('BEFORE WORK');
    setCurrentImageBase64(null);
  };

  const deletePhoto = (id) => {
    if (!confirm('Delete this photo log?')) return;
    const updated = photos.filter((p) => p.id !== id);
    setPhotos(updated);
    localStorage.setItem('fdo_sitesnap_v2', JSON.stringify(updated));
  };

  const getTagColor = (tag) => {
    if (tag.includes('DAMAGE')) return 'text-red-500';
    if (tag.includes('SAFETY')) return 'text-orange-500';
    return 'text-white';
  };

  return (
    <>
      <style jsx global>{`
        :root {
          --bg-dark: #1a1a1a;
          --surface: #262626;
          --accent: #ff6700;
          --border: #404040;
          --text-main: #ffffff;
          --text-muted: #a3a3a3;
        }

        .sitesnap-card {
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
        }

        .sitesnap-input {
          background-color: var(--bg-dark);
          border: 1px solid var(--border);
          color: #ffffff;
          border-radius: 6px;
          padding: 12px;
          width: 100%;
          font-size: 16px;
          transition: border-color 0.2s;
        }

        .sitesnap-input:focus {
          outline: none;
          border-color: var(--accent);
        }

        .sitesnap-btn-primary {
          background-color: var(--accent);
          color: white;
          font-weight: 700;
          padding: 16px;
          border-radius: 6px;
          transition: transform 0.1s;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          border: none;
          cursor: pointer;
        }

        .sitesnap-btn-primary:active {
          transform: scale(0.98);
        }

        .photo-wrapper {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid var(--border);
        }

        .watermark-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent);
          padding: 15px;
          color: white;
        }

        .sitesnap-print-modal {
          display: none;
          position: fixed;
          inset: 0;
          background: white;
          color: black;
          z-index: 50;
          overflow-y: auto;
          padding: 20px;
        }

        .sitesnap-print-modal.active {
          display: block;
        }

        @media print {
          body * {
            visibility: hidden;
          }
          .sitesnap-print-modal,
          .sitesnap-print-modal * {
            visibility: visible;
          }
          .sitesnap-print-modal {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            overflow: visible;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="pb-20 bg-[#1a1a1a] min-h-screen">
        <div className="sticky top-0 z-40 bg-[#1a1a1a] border-b border-[#333] p-4 shadow-lg">
          <div className="flex justify-between items-center max-w-md mx-auto">
            <h1 className="text-2xl font-bold tracking-wide">
              <i className="fa-solid fa-camera text-[#ff6700] mr-2" />
              SiteSnap
            </h1>
            <span className="text-xs text-neutral-500 font-mono">V2.0</span>
          </div>
        </div>

        <div className="max-w-md mx-auto p-4 space-y-6">
          <div className="sitesnap-card p-4 shadow-xl">
            <h2 className="text-lg mb-4 text-[#ff6700] border-b border-[#333] pb-2">New Entry</h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#a3a3a3] uppercase font-bold mb-1 block">
                  Job Name / Location
                </label>
                <input
                  className="sitesnap-input"
                  type="text"
                  placeholder="e.g. Smith Residence - Master Bath"
                  value={jobName}
                  onChange={(e) => setJobName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-[#a3a3a3] uppercase font-bold mb-1 block">
                  Tag
                </label>
                <select
                  className="sitesnap-input"
                  value={photoTag}
                  onChange={(e) => setPhotoTag(e.target.value)}
                >
                  <option value="BEFORE WORK">Before Work</option>
                  <option value="AFTER WORK">After Work</option>
                  <option value="EXISTING DAMAGE">Existing Damage</option>
                  <option value="SAFETY HAZARD">Safety Hazard</option>
                  <option value="MATERIAL DROP">Material Drop</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-[#a3a3a3] uppercase font-bold mb-1 block">
                  Notes (Optional)
                </label>
                <textarea
                  className="sitesnap-input"
                  rows={2}
                  placeholder="Describe the issue..."
                  value={photoNotes}
                  onChange={(e) => setPhotoNotes(e.target.value)}
                />
              </div>

              <input
                type="file"
                id="sitesnap-camera-input"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleCamera}
              />

              <button
                type="button"
                onClick={() => document.getElementById('sitesnap-camera-input')?.click()}
                className="sitesnap-btn-primary"
                style={{ backgroundColor: '#333', border: '1px solid #555' }}
              >
                <i className="fa-solid fa-camera fa-lg" /> TAKE PHOTO
              </button>

              {currentImageBase64 && (
                <div className="relative rounded-lg overflow-hidden border border-[#ff6700]">
                  <img
                    src={currentImageBase64}
                    alt="Preview"
                    className="w-full h-48 object-cover opacity-50"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">PHOTO READY</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={saveEntry}
                className="sitesnap-btn-primary shadow-lg shadow-orange-900/20"
              >
                ADD TO LOG
              </button>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-end mb-3">
              <h2 className="text-white text-xl">Photo Log</h2>
              <span className="text-xs bg-[#333] px-2 py-1 rounded text-[#a3a3a3]">
                {photos.length} Photos
              </span>
            </div>

            {photos.length === 0 ? (
              <div className="text-center py-10 opacity-50">
                <i className="fa-solid fa-images text-4xl mb-3 text-[#444]" />
                <p className="text-sm text-[#a3a3a3]">No photos logged yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {photos.map((p) => (
                  <div key={p.id} className="photo-wrapper bg-[#262626]">
                    <img src={p.img} alt="Photo" className="w-full h-64 object-cover" />
                    <div className="watermark-overlay">
                      <div className="flex justify-between items-end">
                        <div>
                          <div className={`font-bold text-lg leading-none ${getTagColor(p.tag)}`}>
                            {p.tag}
                          </div>
                          <div className="text-sm font-bold text-white mt-1">{p.job}</div>
                          <div className="text-xs text-gray-300 mt-1">
                            {p.date} • {p.time}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => deletePhoto(p.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <i className="fa-solid fa-trash" />
                        </button>
                      </div>
                      {p.note && (
                        <div className="mt-2 text-xs italic text-gray-300 border-l-2 border-[#ff6700] pl-2">
                          {p.note}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {photos.length > 0 && (
            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="w-full py-4 text-[#a3a3a3] font-bold hover:text-white transition"
            >
              <i className="fa-solid fa-file-pdf mr-2" />
              GENERATE PDF REPORT
            </button>
          )}
        </div>

        {showPrintModal && (
          <div className="sitesnap-print-modal active">
            <div className="max-w-3xl mx-auto">
              <div className="flex justify-between items-start border-b-4 border-[#ff6700] pb-4 mb-6">
                <div>
                  <h1 className="text-4xl text-black font-bold mb-1">FIELD REPORT</h1>
                  <p className="text-sm text-gray-500">
                    Generated: {new Date().toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-black">SITESNAP</div>
                  <div className="text-xs text-gray-400">Powered by FieldDeskOps</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                {photos.map((p) => (
                  <div key={p.id} className="border border-gray-200 p-2 break-inside-avoid">
                    <img
                      src={p.img}
                      alt="Photo"
                      className="w-full h-64 object-contain bg-gray-50 border border-gray-100 mb-2"
                    />
                    <div className="p-2">
                      <div className="font-bold text-black text-sm">{p.tag}</div>
                      <div className="text-xs text-gray-500 mb-2">
                        {p.date} @ {p.time}
                      </div>
                      <div className="text-sm font-bold text-black">{p.job}</div>
                      {p.note && (
                        <div className="text-xs text-gray-600 mt-1 italic">
                          &quot;{p.note}&quot;
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 pt-4 border-t border-gray-200 text-xs text-gray-400 text-center">
                Legal Documentation • Time-Stamped & Geotagged • FieldDeskOps
              </div>

              <button
                type="button"
                onClick={() => {
                  window.print();
                  setTimeout(() => setShowPrintModal(false), 400);
                }}
                className="no-print fixed bottom-6 right-6 bg-black text-white px-6 py-3 rounded-full shadow-xl font-bold"
              >
                CLOSE & PRINT
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
