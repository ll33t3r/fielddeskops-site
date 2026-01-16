"use client";

import { useState, useEffect, useRef } from 'react';
import { FileContract, Eraser, Check, Plus } from 'lucide-react';

export default function SignOff() {
  const canvasRef = useRef(null);
  const [projectName, setProjectName] = useState('');
  const [scopeOfWork, setScopeOfWork] = useState('');
  const [agreementDate, setAgreementDate] = useState('');
  const [isSignatureSaved, setIsSignatureSaved] = useState(false);
  const [signatureImage, setSignatureImage] = useState(null);
  const [toast, setToast] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setAgreementDate(today);

    const saved = localStorage.getItem('signoff_agreement');
    if (saved) {
      const agreement = JSON.parse(saved);
      setProjectName(agreement.projectName);
      setScopeOfWork(agreement.scopeOfWork);
      setAgreementDate(agreement.agreementDate);
    }

    setupCanvas();
  }, []);

  const setupCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width - 24;
    canvas.height = 200;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#FF6700';
    }
  };

  const handleCanvasStart = (e) => {
    if (isSignatureSaved || !canvasRef.current) return;
    setIsDrawing(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    let x, y;
    if (e.touches) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleCanvasMove = (e) => {
    if (!isDrawing || !canvasRef.current || isSignatureSaved) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    let x, y;
    if (e.touches) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleCanvasEnd = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.closePath();
    }
  };

  const clearSignature = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const saveSignature = () => {
    if (!projectName.trim()) {
      showToast('Please enter project name', 'error');
      return;
    }
    if (!scopeOfWork.trim()) {
      showToast('Please enter scope of work', 'error');
      return;
    }
    if (!agreementDate) {
      showToast('Please select a date', 'error');
      return;
    }

    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let hasDrawing = false;

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 128) {
        hasDrawing = true;
        break;
      }
    }

    if (!hasDrawing) {
      showToast('Please draw your signature', 'error');
      return;
    }

    const signatureDataUrl = canvas.toDataURL('image/png');
    setSignatureImage(signatureDataUrl);
    setIsSignatureSaved(true);

    localStorage.setItem('signoff_agreement', JSON.stringify({
      projectName,
      scopeOfWork,
      agreementDate,
      signatureDataUrl,
      timestamp: new Date().toISOString()
    }));

    showToast('Agreement Signed!', 'success');
  };

  const newAgreement = () => {
    if (confirm('Start a new agreement? Current agreement will be saved.')) {
      setProjectName('');
      setScopeOfWork('');
      setAgreementDate(new Date().toISOString().split('T')[0]);
      setIsSignatureSaved(false);
      setSignatureImage(null);
      clearSignature();
      showToast('Ready for new agreement', 'info');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className="min-h-screen w-full max-w-2xl mx-auto p-4" style={{ backgroundColor: '#1a1a1a' }}>
      <div className="mb-8 pt-4">
        <div className="flex items-center gap-2 mb-2">
          <FileContract size={32} style={{ color: '#FF6700' }} />
          <h1 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: '0.03em', color: '#f5f5f5' }}>SIGNOFF</h1>
        </div>
        <p style={{ color: '#888' }}>Digital Agreement & Signature Pad</p>
      </div>

      <div className="p-4 md:p-6 rounded-lg mb-6" style={{ backgroundColor: '#262626', border: '1px solid #404040' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '16px', color: '#FF6700', fontFamily: "'Oswald', sans-serif" }}>
          Agreement Details
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-2 text-sm" style={{ color: '#f5f5f5' }}>Project Name</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            disabled={isSignatureSaved}
            placeholder="e.g., Smith Kitchen Remodel"
            maxLength="100"
            style={{
              backgroundColor: '#1a1a1a',
              border: '2px solid #404040',
              color: '#f5f5f5',
              minHeight: '50px',
              padding: '12px 16px',
              borderRadius: '8px',
              width: '100%',
              fontFamily: "'Inter', sans-serif",
              opacity: isSignatureSaved ? 0.6 : 1,
              cursor: isSignatureSaved ? 'not-allowed' : 'text'
            }}
            onFocus={(e) => !isSignatureSaved && (e.target.style.borderColor = '#FF6700')}
            onBlur={(e) => (e.target.style.borderColor = '#404040')}
          />
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-2 text-sm" style={{ color: '#f5f5f5' }}>Date</label>
          <input
            type="date"
            value={agreementDate}
            onChange={(e) => setAgreementDate(e.target.value)}
            disabled={isSignatureSaved}
            style={{
              backgroundColor: '#1a1a1a',
              border: '2px solid #404040',
              color: '#f5f5f5',
              minHeight: '50px',
              padding: '12px 16px',
              borderRadius: '8px',
              width: '100%',
              fontFamily: "'Inter', sans-serif",
              opacity: isSignatureSaved ? 0.6 : 1,
              cursor: isSignatureSaved ? 'not-allowed' : 'text'
            }}
            onFocus={(e) => !isSignatureSaved && (e.target.style.borderColor = '#FF6700')}
            onBlur={(e) => (e.target.style.borderColor = '#404040')}
          />
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-2 text-sm" style={{ color: '#f5f5f5' }}>Scope of Work / Change Order</label>
          <textarea
            value={scopeOfWork}
            onChange={(e) => setScopeOfWork(e.target.value)}
            disabled={isSignatureSaved}
            placeholder="e.g., Customer agrees to additional $500 for wood rot repair..."
            style={{
              backgroundColor: '#1a1a1a',
              border: '2px solid #404040',
              color: '#f5f5f5',
              minHeight: '100px',
              padding: '12px 16px',
              borderRadius: '8px',
              width: '100%',
              fontFamily: "'Inter', sans-serif",
              opacity: isSignatureSaved ? 0.6 : 1,
              cursor: isSignatureSaved ? 'not-allowed' : 'text',
              resize: 'vertical'
            }}
            onFocus={(e) => !isSignatureSaved && (e.target.style.borderColor = '#FF6700')}
            onBlur={(e) => (e.target.style.borderColor = '#404040')}
          />
        </div>
      </div>

      <div className="p-4 md:p-6 rounded-lg" style={{ backgroundColor: '#262626', border: '1px solid #404040' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '16px', color: '#FF6700', fontFamily: "'Oswald', sans-serif" }}>
          Digital Signature
        </div>

        <div style={{ backgroundColor: '#1a1a1a', border: '2px solid #404040', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
          <label className="block font-semibold mb-2 text-sm" style={{ color: '#f5f5f5' }}>Sign Below</label>
          {!isSignatureSaved ? (
            <canvas
              ref={canvasRef}
              onMouseDown={handleCanvasStart}
              onMouseMove={handleCanvasMove}
              onMouseUp={handleCanvasEnd}
              onMouseLeave={handleCanvasEnd}
              onTouchStart={handleCanvasStart}
              onTouchMove={handleCanvasMove}
              onTouchEnd={handleCanvasEnd}
              style={{
                backgroundColor: '#0d0d0d',
                borderRadius: '8px',
                cursor: 'crosshair',
                display: 'block',
                width: '100%',
                touchAction: 'none'
              }}
            />
          ) : (
            <img
              src={signatureImage}
              alt="Signature"
              style={{
                width: '100%',
                borderRadius: '8px',
                display: 'block'
              }}
            />
          )}
        </div>

        {!isSignatureSaved ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <button
              onClick={clearSignature}
              style={{
                backgroundColor: 'transparent',
                border: '2px solid #404040',
                color: '#f5f5f5',
                fontWeight: '700',
                minHeight: '50px',
                borderRadius: '8px',
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
              <Eraser className="inline mr-2" size={18} /> Clear Pad
            </button>
            <button
              onClick={saveSignature}
              style={{
                backgroundColor: '#FF6700',
                color: '#1a1a1a',
                fontWeight: '700',
                minHeight: '50px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: "'Oswald', sans-serif"
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#e55c00';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(255, 103, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#FF6700';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <Check className="inline mr-2" size={18} /> Save Signature
            </button>
          </div>
        ) : (
          <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '2px solid #22c55e', borderRadius: '8px', padding: '16px', marginBottom: '16px', textAlign: 'center' }}>
            <p style={{ color: '#22c55e', fontWeight: '700', marginBottom: '8px' }}>Agreement Signed & Locked</p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              backgroundColor: '#22c55e',
              color: '#1a1a1a',
              borderRadius: '50%',
              fontSize: '1.5rem',
              margin: '8px 0'
            }}>
              ✓
            </div>
            <p style={{ color: '#888', fontSize: '0.9rem', marginTop: '8px', marginBottom: '12px' }}>This agreement is now digitally signed.</p>
            <button
              onClick={newAgreement}
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
              <Plus className="inline mr-2" size={18} /> Create New Agreement
            </button>
          </div>
        )}
      </div>

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: toast.type === 'success' ? '#22c55e' : toast.type === 'error' ? '#ff4444' : '#888',
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
