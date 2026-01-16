"use client";

import { useState, useEffect } from 'react';
import { Trash2, Save, Calculator } from 'lucide-react';

export default function ProfitLock() {
  const [jobName, setJobName] = useState('');
  const [materialsCost, setMaterialsCost] = useState(0);
  const [laborHours, setLaborHours] = useState(0);
  const [hourlyRate, setHourlyRate] = useState(75);
  const [markupPercent, setMarkupPercent] = useState(20);
  const [bidHistory, setBidHistory] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('profitlock_data');
    if (stored) {
      const parsed = JSON.parse(stored);
      setBidHistory(parsed.bidHistory || []);
      setHourlyRate(parsed.hourlyRate || 75);
      setMarkupPercent(parsed.markupPercent || 20);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'profitlock_data',
      JSON.stringify({
        bidHistory,
        hourlyRate,
        markupPercent
      })
    );
  }, [bidHistory, hourlyRate, markupPercent]);

  const materials = parseFloat(materialsCost) || 0;
  const hours = parseFloat(laborHours) || 0;
  const rate = parseFloat(hourlyRate) || 75;
  const markup = parseFloat(markupPercent) || 20;

  const labor = hours * rate;
  const cost = materials + labor;
  const markupAmount = cost * (markup / 100);
  const finalBid = cost + markupAmount;
  const grossMargin = finalBid > 0 ? ((finalBid - cost) / finalBid) * 100 : 0;

  const getProfitMeterInfo = (margin) => {
    const visualWidth = Math.min(margin * 1.6, 100);
    if (margin < 20) {
      return {
        color: '#ef4444',
        label: '🚨 CRITICAL RISK',
        sublabel: 'You are barely breaking even',
        visualWidth
      };
    } else if (margin < 40) {
      return {
        color: '#eab308',
        label: '⚠️ THIN MARGINS',
        sublabel: 'You are surviving, but not growing',
        visualWidth
      };
    } else if (margin < 60) {
      return {
        color: '#22c55e',
        label: '✅ HEALTHY',
        sublabel: 'This is where a real business lives',
        visualWidth
      };
    } else {
      return {
        color: '#f97316',
        label: '💰 AGGRESSIVE',
        sublabel: 'High profit - watch for rejection risk',
        visualWidth
      };
    }
  };

  const meterInfo = getProfitMeterInfo(grossMargin);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const saveBid = () => {
    if (!jobName.trim()) {
      showToast('Please enter a job name', 'error');
      return;
    }
    if (materials === 0 && hours === 0) {
      showToast('Add materials or labor hours', 'error');
      return;
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const bid = {
      jobName,
      materials,
      hours,
      hourlyRate: rate,
      markup,
      cost,
      finalPrice: `$${finalBid.toFixed(2)}`,
      grossMargin: Math.round(grossMargin),
      date: `${dateStr} at ${timeStr}`
    };

    setBidHistory([bid, ...bidHistory]);
    setJobName('');
    setMaterialsCost(0);
    setLaborHours(0);
    showToast('✅ Bid Saved!', 'success');
  };

  const loadBidIntoCalculator = (bid) => {
    setJobName(bid.jobName);
    setMaterialsCost(bid.materials);
    setLaborHours(bid.hours);
    setHourlyRate(bid.hourlyRate);
    setMarkupPercent(bid.markup);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteBid = (index) => {
    setBidHistory(bidHistory.filter((_, i) => i !== index));
  };

  return (
    <div
      className="min-h-screen w-full max-w-2xl mx-auto p-4"
      style={{ backgroundColor: '#1a1a1a' }}
    >
      {/* Header */}
      <div className="mb-8 pt-4">
        <div className="flex items-center gap-2 mb-2">
          <Calculator size={32} style={{ color: '#FF6700' }} />
          <h1
            className="text-3xl md:text-4xl font-bold"
            style={{
              fontFamily: "'Oswald', sans-serif",
              letterSpacing: '0.03em',
              color: '#f5f5f5'
            }}
          >
            PROFITLOCK
          </h1>
          <span
            className="text-xs md:text-sm"
            style={{ color: '#888', marginLeft: '8px' }}
          >
            V5
          </span>
        </div>
        <p style={{ color: '#888' }}>Real-time Bid Calculator</p>
      </div>

      {/* Calculator */}
      <div
        className="p-4 md:p-6 rounded-lg mb-6"
        style={{ backgroundColor: '#262626', border: '1px solid #404040' }}
      >
        <div
          style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#FF6700',
            fontFamily: "'Oswald', sans-serif",
            letterSpacing: '0.03em'
          }}
        >
          Calculate Your Bid
        </div>

        {/* Job Name */}
        <div className="mb-4">
          <label
            className="block font-semibold mb-2 text-sm"
            style={{ color: '#f5f5f5' }}
          >
            Job Name
          </label>
          <input
            type="text"
            value={jobName}
            onChange={(e) => setJobName(e.target.value)}
            placeholder="e.g., Kitchen Sink Repair"
            maxLength={50}
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
            onFocus={(e) => (e.target.style.borderColor = '#FF6700')}
            onBlur={(e) => (e.target.style.borderColor = '#404040')}
          />
        </div>

        {/* Materials & Labor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label
              className="block font-semibold mb-2 text-sm"
              style={{ color: '#f5f5f5' }}
            >
              Materials Cost ($)
            </label>
            <input
              type="number"
              value={materialsCost}
              onChange={(e) => setMaterialsCost(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
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
              onFocus={(e) => (e.target.style.borderColor = '#FF6700')}
              onBlur={(e) => (e.target.style.borderColor = '#404040')}
            />
          </div>
          <div>
            <label
              className="block font-semibold mb-2 text-sm"
              style={{ color: '#f5f5f5' }}
            >
              Labor Hours
            </label>
            <input
              type="number"
              value={laborHours}
              onChange={(e) => setLaborHours(e.target.value)}
              placeholder="0"
              min="0"
              step="0.5"
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
              onFocus={(e) => (e.target.style.borderColor = '#FF6700')}
              onBlur={(e) => (e.target.style.borderColor = '#404040')}
            />
          </div>
        </div>

        {/* Rate & Markup */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div>
            <label
              className="block font-semibold mb-2 text-sm"
              style={{ color: '#f5f5f5' }}
            >
              Hourly Rate ($)
            </label>
            <input
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="75"
              min="0"
              step="5"
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
              onFocus={(e) => (e.target.style.borderColor = '#FF6700')}
              onBlur={(e) => (e.target.style.borderColor = '#404040')}
            />
          </div>
          <div>
            <label
              className="block font-semibold mb-2 text-sm"
              style={{ color: '#f5f5f5' }}
            >
              Markup (%)
            </label>
            <input
              type="number"
              value={markupPercent}
              onChange={(e) => setMarkupPercent(e.target.value)}
              placeholder="20"
              min="0"
              step="5"
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
              onFocus={(e) => (e.target.style.borderColor = '#FF6700')}
              onBlur={(e) => (e.target.style.borderColor = '#404040')}
            />
          </div>
        </div>

        {/* Breakdown */}
        <div
          className="p-4 rounded-lg mb-6"
          style={{ backgroundColor: '#1a1a1a', border: '1px solid #404040' }}
        >
          <div
            className="flex justify-between mb-3 text-sm"
            style={{ color: '#888' }}
          >
            <span>Materials</span>
            <span>${materials.toFixed(2)}</span>
          </div>
          <div
            className="flex justify-between mb-3 text-sm"
            style={{ color: '#888' }}
          >
            <span>Labor (Hours × Rate)</span>
            <span>${labor.toFixed(2)}</span>
          </div>
          <div
            className="flex justify-between mb-3 text-sm"
            style={{ color: '#888' }}
          >
            <span>Subtotal (Cost)</span>
            <span>${cost.toFixed(2)}</span>
          </div>
          <div
            className="flex justify-between text-sm"
            style={{ color: '#FF6700', fontWeight: '700' }}
          >
            <span>Markup</span>
            <span>${markupAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Final Price */}
        <div className="text-center mb-6">
          <p
            className="text-xs md:text-sm"
            style={{ color: '#888', marginBottom: '8px' }}
          >
            FINAL BID PRICE
          </p>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#22c55e',
              textShadow: '0 0 20px rgba(34, 197, 94, 0.3)',
              fontFamily: "'Oswald', sans-serif"
            }}
          >
            ${finalBid.toFixed(2)}
          </div>
        </div>

        {/* Profit Meter */}
        <div className="mb-6">
          <div
            style={{
              width: '100%',
              height: '40px',
              backgroundColor: '#1a1a1a',
              borderRadius: '20px',
              overflow: 'hidden',
              border: '2px solid #404040',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: '18px',
                width: `${meterInfo.visualWidth}%`,
                backgroundColor: meterInfo.color,
                transition: 'width 0.4s ease, background-color 0.4s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                paddingLeft: '12px',
                fontWeight: '700',
                fontSize: '0.85rem',
                color: '#fff',
                fontFamily: "'Oswald', sans-serif",
                letterSpacing: '0.02em'
              }}
            >
              {meterInfo.visualWidth > 15 ? `${Math.round(grossMargin)}%` : ''}
            </div>
          </div>
          <div
            style={{
              fontWeight: '700',
              fontSize: '1rem',
              padding: '12px 0 4px 0',
              fontFamily: "'Oswald', sans-serif",
              letterSpacing: '0.03em',
              color: meterInfo.color
            }}
          >
            {meterInfo.label}
          </div>
          <div
            style={{
              fontSize: '0.85rem',
              color: '#888',
              marginTop: '4px'
            }}
          >
            {meterInfo.sublabel}
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={saveBid}
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
            fontFamily: "'Oswald', sans-serif",
            letterSpacing: '0.05em'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#e55c00';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow =
              '0 4px 12px rgba(255, 103, 0, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#FF6700';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          <Save className="inline mr-2" size={18} /> SAVE BID TO HISTORY
        </button>
      </div>

      {/* History */}
      <div
        className="p-4 md:p-6 rounded-lg"
        style={{ backgroundColor: '#262626', border: '1px solid #404040' }}
      >
        <div
          style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#FF6700',
            fontFamily: "'Oswald', sans-serif"
          }}
        >
          Recent Bids
        </div>

        {bidHistory.length === 0 ? (
          <div className="text-center py-8">
            <p style={{ color: '#888' }}>No bids saved yet. Create one above!</p>
          </div>
        ) : (
          <div>
            {bidHistory.map((bid, index) => (
              <div
                key={index}
                onClick={() => loadBidIntoCalculator(bid)}
                style={{
                  backgroundColor: '#262626',
                  border: '1px solid #404040',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#FF6700';
                  e.currentTarget.style.backgroundColor = '#2d2d2d';
                  e.currentTarget.style.transform = 'translateX(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#404040';
                  e.currentTarget.style.backgroundColor = '#262626';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div className="flex-1">
                  <div
                    style={{
                      fontWeight: '700',
                      color: '#f5f5f5',
                      fontSize: '1.05rem'
                    }}
                  >
                    {bid.jobName || 'Unnamed Job'}
                    <span
                      style={{
                        display: 'inline-block',
                        backgroundColor: 'rgba(255, 103, 0, 0.15)',
                        color: '#FF6700',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        marginLeft: '8px'
                      }}
                    >
                      {Math.round(bid.grossMargin)}% Margin
                    </span>
                  </div>
                  <div
                    style={{
                      color: '#888',
                      fontSize: '0.875rem',
                      marginTop: '4px'
                    }}
                  >
                    {bid.date}
                  </div>
                </div>
                <div style={{ textAlign: 'right', marginRight: '16px' }}>
                  <div
                    style={{
                      color: '#22c55e',
                      fontWeight: '700',
                      fontSize: '1.25rem'
                    }}
                  >
                    {bid.finalPrice}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteBid(index);
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#ff4444',
                    cursor: 'pointer',
                    fontSize: '1.25rem',
                    padding: '8px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = '#ff6666';
                    e.target.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = '#ff4444';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor:
              toast.type === 'success'
                ? '#22c55e'
                : toast.type === 'error'
                ? '#ff4444'
                : '#888',
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
