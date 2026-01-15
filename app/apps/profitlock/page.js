'use client';

import { useState, useEffect } from 'react';
import { Calculator, Save, Download, History, Plus, Minus, Printer, Copy, Share2, DollarSign, Clock, Package, Percent } from 'lucide-react';

export default function ProfitLockApp() {
  // State for inputs
  const [inputs, setInputs] = useState({
    jobName: '',
    materials: '',
    hours: '',
    rate: '',
    markup: ''
  });
  
  const [results, setResults] = useState(null);
  const [savedQuotes, setSavedQuotes] = useState([]);
  const [activeTab, setActiveTab] = useState('calculator');

  // Load saved data on mount
  useEffect(() => {
    const savedQuotesData = localStorage.getItem('profitlock_quotes');
    if (savedQuotesData) setSavedQuotes(JSON.parse(savedQuotesData));
    
    const savedRate = localStorage.getItem('pl_rate');
    const savedMarkup = localStorage.getItem('pl_markup');
    
    setInputs(prev => ({
      ...prev,
      rate: savedRate || '85',
      markup: savedMarkup || '25'
    }));
  }, []);

  // Calculate function
  const calculateBid = () => {
    const materials = parseFloat(inputs.materials) || 0;
    const hours = parseFloat(inputs.hours) || 0;
    const rate = parseFloat(inputs.rate) || 85;
    const markup = parseFloat(inputs.markup) || 25;
    
    const labor = hours * rate;
    const subtotal = materials + labor;
    const profit = subtotal * (markup / 100);
    const total = subtotal + profit;
    
    setResults({
      materials,
      labor,
      subtotal,
      profit,
      total,
      markup,
      rate,
      hours
    });
    
    // Save preferences
    localStorage.setItem('pl_rate', rate.toString());
    localStorage.setItem('pl_markup', markup.toString());
  };

  // Save quote
  const saveQuote = () => {
    if (!results || !inputs.jobName.trim()) return;
    
    const newQuote = {
      id: Date.now(),
      jobName: inputs.jobName || 'Untitled Job',
      ...inputs,
      ...results,
      date: new Date().toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    
    const updatedQuotes = [newQuote, ...savedQuotes.slice(0, 9)];
    setSavedQuotes(updatedQuotes);
    localStorage.setItem('profitlock_quotes', JSON.stringify(updatedQuotes));
    
    // Haptic feedback simulation
    if (navigator.vibrate) navigator.vibrate(50);
    alert('Quote saved!');
  };

  // Reset form
  const resetForm = () => {
    setInputs({
      jobName: '',
      materials: '',
      hours: '',
      rate: '85',
      markup: '25'
    });
    setResults(null);
  };

  // Load a saved quote
  const loadQuote = (quote) => {
    setInputs({
      jobName: quote.jobName,
      materials: quote.materials.toString(),
      hours: quote.hours.toString(),
      rate: quote.rate.toString(),
      markup: quote.markup.toString()
    });
    setActiveTab('calculator');
    alert('Quote loaded! Click Calculate to update.');
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Mobile-optimized number input component
  const NumberInput = ({ label, value, onChange, icon: Icon, step = 1, min = 0, max = null, prefix = '' }) => (
    <div className="space-y-2">
      <label className="text-sm text-gray-400 flex items-center gap-2">
        {Icon && <Icon size={16} />}
        {label}
      </label>
      <div className="flex items-center bg-[#262626] rounded-xl border border-[#404040] p-2">
        <button 
          onClick={() => {
            const newVal = Math.max(min, parseFloat(value || 0) - step);
            onChange(newVal.toString());
          }}
          className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-white active:bg-[#333] rounded-lg"
        >
          <Minus size={20} />
        </button>
        <div className="flex-1 text-center">
          {prefix && <span className="text-gray-400 mr-1">{prefix}</span>}
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-transparent text-white text-center text-lg py-2 focus:outline-none"
            min={min}
            max={max}
            step={step}
          />
        </div>
        <button 
          onClick={() => {
            const newVal = max ? Math.min(max, parseFloat(value || 0) + step) : parseFloat(value || 0) + step;
            onChange(newVal.toString());
          }}
          className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-white active:bg-[#333] rounded-lg"
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1a1a1a] safe-area-padding">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-[#262626] border-b border-[#404040] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FF6700] flex items-center justify-center">
              <Calculator size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-oswald text-xl text-white">ProfitLock</h1>
              <p className="text-xs text-gray-400">Bid Calculator</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('calculator')}
              className={`px-3 py-1.5 rounded-lg text-sm ${activeTab === 'calculator' ? 'bg-[#FF6700] text-white' : 'bg-[#1a1a1a] text-gray-400'}`}
            >
              Calc
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg text-sm ${activeTab === 'history' ? 'bg-[#FF6700] text-white' : 'bg-[#1a1a1a] text-gray-400'}`}
            >
              <History size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-md mx-auto">
        {activeTab === 'calculator' ? (
          <>
            {/* Job Name Input */}
            <div className="mb-6">
              <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                <Package size={14} />
                Job Name / Address
              </div>
              <input
                type="text"
                value={inputs.jobName}
                onChange={(e) => setInputs(prev => ({ ...prev, jobName: e.target.value }))}
                placeholder="e.g., 'Kitchen Remodel - Smith Residence'"
                className="w-full bg-[#262626] border border-[#404040] text-white rounded-xl p-4 text-lg focus:outline-none focus:border-[#FF6700]"
              />
            </div>

            {/* Input Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <NumberInput
                label="Materials"
                value={inputs.materials}
                onChange={(val) => setInputs(prev => ({ ...prev, materials: val }))}
                icon={DollarSign}
                step={10}
                prefix="$"
              />
              
              <NumberInput
                label="Labor Hours"
                value={inputs.hours}
                onChange={(val) => setInputs(prev => ({ ...prev, hours: val }))}
                icon={Clock}
                step={0.5}
              />
              
              <NumberInput
                label="Hourly Rate"
                value={inputs.rate}
                onChange={(val) => setInputs(prev => ({ ...prev, rate: val }))}
                icon={DollarSign}
                step={5}
                prefix="$"
              />
              
              <NumberInput
                label="Markup %"
                value={inputs.markup}
                onChange={(val) => setInputs(prev => ({ ...prev, markup: val }))}
                icon={Percent}
                step={1}
                min={0}
                max={100}
                prefix="%"
              />
            </div>

            {/* Quick Markup Presets */}
            <div className="mb-6">
              <div className="text-sm text-gray-400 mb-2">Quick Markup</div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {[15, 20, 25, 30, 35].map((percent) => (
                  <button
                    key={percent}
                    onClick={() => setInputs(prev => ({ ...prev, markup: percent.toString() }))}
                    className={`flex-1 py-3 rounded-lg whitespace-nowrap ${inputs.markup === percent.toString() ? 'bg-[#FF6700] text-white' : 'bg-[#262626] text-gray-400'}`}
                  >
                    {percent}%
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 mb-6">
              <button
                onClick={calculateBid}
                className="w-full bg-[#FF6700] hover:bg-[#e55c00] text-white font-bold py-4 rounded-xl text-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                <Calculator size={20} />
                CALCULATE BID PRICE
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={saveQuote}
                  disabled={!results}
                  className={`py-3 rounded-lg flex items-center justify-center gap-2 ${results ? 'bg-[#1a1a1a] border border-[#404040] text-white hover:border-[#FF6700]' : 'bg-[#1a1a1a] text-gray-500 cursor-not-allowed'}`}
                >
                  <Save size={16} />
                  Save Quote
                </button>
                <button
                  onClick={resetForm}
                  className="py-3 rounded-lg bg-[#1a1a1a] border border-[#404040] text-white hover:border-[#FF6700] flex items-center justify-center gap-2"
                >
                  <History size={16} />
                  Reset
                </button>
              </div>
            </div>

            {/* Results Section */}
            {results && (
              <div className="bg-[#262626] rounded-xl border border-[#404040] p-5 animate-slideUp">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-white">Bid Analysis</h3>
                  <span className="text-gray-400 text-sm">{inputs.jobName || 'Untitled Job'}</span>
                </div>
                
                {/* Profit Margin Indicator */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Profit Margin</span>
                    <span className="font-semibold text-[#FF6700]">{results.markup}%</span>
                  </div>
                  <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#FF6700] to-green-500 rounded-full"
                      style={{ width: `${Math.min(results.markup, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Price Breakdown */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-[#1a1a1a] rounded-lg p-3">
                    <div className="text-gray-400 text-sm">Materials</div>
                    <div className="text-white text-lg font-bold">{formatCurrency(results.materials)}</div>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-lg p-3">
                    <div className="text-gray-400 text-sm">Labor</div>
                    <div className="text-white text-lg font-bold">{formatCurrency(results.labor)}</div>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-lg p-3">
                    <div className="text-gray-400 text-sm">Subtotal</div>
                    <div className="text-white font-bold">{formatCurrency(results.subtotal)}</div>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-lg p-3">
                    <div className="text-gray-400 text-sm">Profit</div>
                    <div className="text-[#FF6700] font-bold">{formatCurrency(results.profit)}</div>
                  </div>
                </div>
                
                {/* Total Price */}
                <div className="text-center pt-4 border-t border-[#404040]">
                  <div className="text-gray-400 text-sm mb-1">TOTAL BID PRICE</div>
                  <div className="text-green-400 text-4xl font-bold">{formatCurrency(results.total)}</div>
                  <div className="text-gray-400 text-sm mt-2">Includes all costs + {results.markup}% profit</div>
                </div>
                
                {/* Export Actions */}
                <div className="grid grid-cols-3 gap-3 mt-6">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `ProfitLock Quote - ${inputs.jobName}\n\n` +
                        `Materials: ${formatCurrency(results.materials)}\n` +
                        `Labor: ${formatCurrency(results.labor)} (${inputs.hours} hrs @ ${formatCurrency(results.rate)}/hr)\n` +
                        `Profit (${results.markup}%): ${formatCurrency(results.profit)}\n` +
                        `TOTAL: ${formatCurrency(results.total)}`
                      );
                      alert('Copied to clipboard!');
                    }}
                    className="flex flex-col items-center justify-center p-3 bg-[#1a1a1a] rounded-lg active:bg-[#2a2a2a]"
                  >
                    <Copy size={18} className="mb-1" />
                    <span className="text-xs">Copy</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex flex-col items-center justify-center p-3 bg-[#1a1a1a] rounded-lg active:bg-[#2a2a2a]"
                  >
                    <Printer size={18} className="mb-1" />
                    <span className="text-xs">Print</span>
                  </button>
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: `Bid: ${inputs.jobName}`,
                          text: `Total: ${formatCurrency(results.total)}`,
                        });
                      } else {
                        alert('Share not available on this device');
                      }
                    }}
                    className="flex flex-col items-center justify-center p-3 bg-[#1a1a1a] rounded-lg active:bg-[#2a2a2a]"
                  >
                    <Share2 size={18} className="mb-1" />
                    <span className="text-xs">Share</span>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* History Tab */
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Saved Quotes</h2>
            {savedQuotes.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <History size={48} className="mx-auto mb-4 opacity-50" />
                <p>No saved quotes yet</p>
                <p className="text-sm mt-2">Calculate and save your first quote!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedQuotes.map((quote) => (
                  <div
                    key={quote.id}
                    className="bg-[#262626] rounded-xl border border-[#404040] p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-white font-semibold">{quote.jobName}</h3>
                        <p className="text-gray-400 text-sm">{quote.date}</p>
                      </div>
                      <div className="text-green-400 text-xl font-bold">
                        {formatCurrency(quote.total)}
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-400 mb-3">
                      <span>Materials: {formatCurrency(quote.materials)}</span>
                      <span>Labor: {formatCurrency(quote.labor)}</span>
                      <span>{quote.markup}% margin</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadQuote(quote)}
                        className="flex-1 py-2 text-center bg-[#1a1a1a] border border-[#404040] text-[#FF6700] rounded-lg text-sm"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => {
                          const updated = savedQuotes.filter(q => q.id !== quote.id);
                          setSavedQuotes(updated);
                          localStorage.setItem('profitlock_quotes', JSON.stringify(updated));
                        }}
                        className="flex-1 py-2 text-center bg-[#1a1a1a] border border-[#404040] text-gray-400 rounded-lg text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#262626] border-t border-[#404040] p-3 safe-area-bottom">
        <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
          <button 
            onClick={() => window.open('https://buy.stripe.com/14A28r60t5nIdMz9vyaIM0c', '_blank')}
            className="flex flex-col items-center p-2 text-gray-400 hover:text-white"
          >
            <DollarSign size={20} />
            <span className="text-xs mt-1">Upgrade</span>
          </button>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="flex flex-col items-center p-2 text-gray-400 hover:text-white"
          >
            <History size={20} />
            <span className="text-xs mt-1">Dashboard</span>
          </button>
          <button 
            onClick={() => window.print()}
            className="flex flex-col items-center p-2 text-gray-400 hover:text-white"
          >
            <Printer size={20} />
            <span className="text-xs mt-1">Print</span>
          </button>
          <button 
            onClick={resetForm}
            className="flex flex-col items-center p-2 text-gray-400 hover:text-white"
          >
            <History size={20} />
            <span className="text-xs mt-1">Clear</span>
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
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
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
