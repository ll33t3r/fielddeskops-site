"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../utils/supabase/client";
import { useActiveJob } from "../../../hooks/useActiveJob";
import { 
  Trash2, Save, FileText, Share, Settings, Menu, X, ArrowLeft, Plus, Loader2, 
  Briefcase, Lock, Unlock, ChevronDown, ChevronRight, CheckCircle2, Box, Clock, 
  AlertTriangle, Eye, EyeOff, Calculator, DollarSign, Percent, Camera
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfitLock() {
  const supabase = createClient();
  const router = useRouter();
  const { activeJob, setActiveJob } = useActiveJob();
  
  // --- CORE DATA ---
  const [allJobs, setAllJobs] = useState([]);
  const [estimateHistory, setEstimateHistory] = useState([]); 
  const [customer, setCustomer] = useState(null);

  // --- CALCULATOR STATE ---
  const [mode, setMode] = useState("SIMPLE");
  const [profitMethod, setProfitMethod] = useState("MARKUP"); // MARKUP or MARGIN
  const [profitLocked, setProfitLocked] = useState(true);
  const [isInvoiceMode, setIsInvoiceMode] = useState(false);
  
  // Simple Inputs
  const [simpleMaterials, setSimpleMaterials] = useState(""); 
  const [simpleHours, setSimpleHours] = useState("");
  
  // Advanced Inputs
  const [lineItems, setLineItems] = useState([
      { id: 1, description: "Materials", quantity: 1, unit_cost: 0 },
      { id: 2, description: "Labor", quantity: 1, unit_cost: 0 }
  ]); 

  // --- CONFIG & UI STATE ---
  const [hourlyRate, setHourlyRate] = useState(100);
  const [targetValue, setTargetValue] = useState(400); // 400% markup or 20% margin
  const [taxRate, setTaxRate] = useState(8.5);
  const [includeTax, setIncludeTax] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState("DUE_ON_RECEIPT");
  const [depositPercent, setDepositPercent] = useState(50);
  const [quoteValidDays, setQuoteValidDays] = useState(30);
  
  const [showMenu, setShowMenu] = useState(false);
  const [showProfitDetails, setShowProfitDetails] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [menuTab, setMenuTab] = useState("PROFIT");

  // --- INIT ---
  useEffect(() => { 
      loadData(); 
      loadSettings();
  }, []);

  useEffect(() => {
    if (activeJob?.customer_id) {
      loadCustomer(activeJob.customer_id);
    }
  }, [activeJob]);

  // Scroll Lock when Menu is open
  useEffect(() => {
    if (showMenu) {
        document.body.style.overflow = "hidden";
    } else {
        document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [showMenu]);

  // Load Persisted Settings
  const loadSettings = () => {
      const saved = localStorage.getItem("profitlock_config");
      if (saved) {
          const config = JSON.parse(saved);
          setHourlyRate(config.hourlyRate || 100);
          setTargetValue(config.targetValue || 400);
          setProfitMethod(config.profitMethod || "MARKUP");
          setTaxRate(config.taxRate || 8.5);
          setIncludeTax(config.includeTax || false);
          setPaymentTerms(config.paymentTerms || "DUE_ON_RECEIPT");
          setDepositPercent(config.depositPercent || 50);
          setQuoteValidDays(config.quoteValidDays || 30);
      }
  };

  // Save Settings on Change
  const saveSettings = () => {
      const config = {
          hourlyRate,
          targetValue,
          profitMethod,
          taxRate,
          includeTax,
          paymentTerms,
          depositPercent,
          quoteValidDays
      };
      localStorage.setItem("profitlock_config", JSON.stringify(config));
  };

  useEffect(() => {
    saveSettings();
  }, [hourlyRate, targetValue, profitMethod, taxRate, includeTax, paymentTerms, depositPercent, quoteValidDays]);

  const loadCustomer = async (customerId) => {
    const { data } = await supabase.from("customers").select("*").eq("id", customerId).single();
    setCustomer(data);
  };

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: jobs } = await supabase.from("jobs").select("*").order("updated_at", { ascending: false });
    setAllJobs(jobs || []);

    const { data: est } = await supabase.from("estimates").select("*, jobs(title)").order("created_at", { ascending: false });
    setEstimateHistory(est || []);
  };

  // --- LOGIC ENGINE ---
  const calculateTotals = () => {
    let subtotal = 0;

    if (mode === "SIMPLE") {
        const mat = parseFloat(simpleMaterials) || 0;
        const labor = (parseFloat(simpleHours) || 0) * hourlyRate;
        subtotal = mat + labor;
    } else {
        lineItems.forEach(item => {
            const itemCost = (parseFloat(item.unit_cost) || 0) * (parseFloat(item.quantity) || 1);
            subtotal += itemCost;
        });
    }

    // Apply discount
    const discount = parseFloat(discountAmount) || 0;
    const cost = subtotal - discount;

    // Calculate price based on profit method
    let price = 0;
    if (profitMethod === "MARKUP") {
      // Markup: Price = Cost × (1 + Markup%)
      price = cost * (1 + (targetValue / 100));
    } else {
      // Margin: Price = Cost / (1 - Margin%)
      const marginDecimal = targetValue / 100;
      if (marginDecimal >= 1) {
        price = cost * 2; // Safety: if margin is 100%+, just double it
      } else {
        price = cost / (1 - marginDecimal);
      }
    }

    const profit = price - cost;
    const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
    
    // Tax calculation
    const tax = includeTax ? price * (taxRate / 100) : 0;
    const total = price + tax;

    return { subtotal, discount, cost, price, profit, margin, tax, total };
  };

  const { subtotal, discount, cost, price, profit, margin, tax, total } = calculateTotals();

  // Margin warning
  const isBelowTarget = profitMethod === "MARGIN" && margin < targetValue;

  // --- ACTIONS ---
  const addLineItem = () => setLineItems([...lineItems, { id: Date.now(), description: "", quantity: 1, unit_cost: 0 }]);
  
  const updateLineItem = (id, field, value) => {
      setLineItems(lineItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };
  
  const removeLineItem = (id) => setLineItems(lineItems.filter(item => item.id !== id));

  const handleSave = async () => {
    if (!activeJob) { showToast("Select a Job first!", "error"); return; }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const estimateData = {
        user_id: user.id,
        job_id: activeJob.id,
        customer_id: activeJob.customer_id || null,
        estimate_number: `EST-${Date.now().toString().slice(-6)}`,
        subtotal: price,
        tax: tax,
        total_price: total,
        status: "DRAFT",
        notes: `${profitMethod}: ${targetValue}% | Payment: ${paymentTerms}`
    };

    const { data: estimate, error } = await supabase.from("estimates").insert(estimateData).select().single();

    if (error) { 
        showToast("Error: " + error.message, "error"); 
        setLoading(false);
        return;
    }

    // Save line items
    if (mode === "ADVANCED") {
        const items = lineItems.map(item => ({
            estimate_id: estimate.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_cost,
            total: item.quantity * item.unit_cost
        }));
        await supabase.from("line_items").insert(items);
    } else {
        // Save simple mode as line items
        const items = [
            { estimate_id: estimate.id, description: "Materials", quantity: 1, unit_price: parseFloat(simpleMaterials) || 0, total: parseFloat(simpleMaterials) || 0 },
            { estimate_id: estimate.id, description: "Labor", quantity: parseFloat(simpleHours) || 0, unit_price: hourlyRate, total: (parseFloat(simpleHours) || 0) * hourlyRate }
        ];
        await supabase.from("line_items").insert(items);
    }

    showToast("Estimate Saved!", "success");
    await loadData();
    setLoading(false);
  };

  const showToast = (msg, type) => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3000);
  };

  const validUntilDate = new Date();
  validUntilDate.setDate(validUntilDate.getDate() + quoteValidDays);

  return (
    <div className="h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-inter flex flex-col relative overflow-hidden selection:bg-[#FF6700] selection:text-black">
      
      {/* HEADER */}
      <header className="p-6 shrink-0 flex justify-between items-start z-10">
        <div className="flex items-center gap-4">
            <Link href="/" className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[#FF6700] hover:text-[#FF6700] transition">
                <ArrowLeft size={24} />
            </Link>
            <div>
                <h1 className="text-3xl font-oswald font-bold text-[#FF6700] tracking-wide uppercase drop-shadow-[0_0_10px_rgba(255,103,0,0.5)]">PROFITLOCK</h1>
                <p className="text-[10px] font-bold text-[var(--text-sub)] uppercase tracking-widest">ESTIMATING SUITE</p>
            </div>
        </div>
        <button onClick={() => setShowMenu(true)} className="p-3 rounded-xl bg-[#FF6700] text-black shadow-[0_0_20px_rgba(255,103,0,0.4)] hover:scale-105 transition active:scale-95">
            <Menu size={24} strokeWidth={3} />
        </button>
      </header>

      {/* ACTIVE JOB INDICATOR */}
      {activeJob && (
        <div className="mx-6 mb-4 flex items-center justify-between bg-[#FF6700]/10 border border-[#FF6700]/30 rounded-lg p-3 shadow-[0_0_10px_rgba(255,103,0,0.15)]">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#FF6700] shadow-[0_0_8px_#FF6700] animate-pulse"></div>
            <div>
              <p className="text-[10px] text-[#FF6700] font-bold uppercase tracking-wider">LOCKED TO JOB</p>
              <p className="font-oswald text-sm text-[var(--text-main)] tracking-wide">{activeJob.title}</p>
              {customer && <p className="text-xs text-[var(--text-sub)]">{customer.name}</p>}
            </div>
          </div>
          <button onClick={() => setActiveJob(null)} className="p-2 hover:bg-[#FF6700]/20 rounded text-[#FF6700]">
            <X size={14}/>
          </button>
        </div>
      )}

      {!activeJob && (
        <div className="mx-6 mb-4 p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-center">
          <p className="text-sm text-[var(--text-sub)] mb-2">No active job selected</p>
          <Link href="/" className="text-[#FF6700] text-sm font-bold hover:underline">
            ← Select job in Command Center
          </Link>
        </div>
      )}

      {/* INVOICE PREVIEW MODE */}
      {isInvoiceMode ? (
          <div className="flex-1 p-6 animate-in slide-in-from-bottom-10 bg-white text-black m-4 rounded-xl shadow-2xl relative flex flex-col overflow-hidden">
              <div className="border-b border-gray-200 pb-6 mb-6 flex justify-between items-start shrink-0">
                  <div>
                      <h2 className="text-4xl font-oswald font-bold uppercase tracking-tighter">INVOICE</h2>
                      <p className="text-sm font-bold text-gray-500 uppercase">{activeJob?.title || "DRAFT"}</p>
                      {customer && (
                        <div className="mt-3 text-sm">
                          <p className="font-bold">{customer.name}</p>
                          {customer.phone && <p className="text-gray-600">{customer.phone}</p>}
                          {customer.address && <p className="text-gray-600">{customer.address}</p>}
                        </div>
                      )}
                  </div>
                  <div className="text-right">
                      <p className="text-sm font-bold text-gray-400">Date Issued</p>
                      <p className="font-mono font-bold">{new Date().toLocaleDateString()}</p>
                      <p className="text-sm font-bold text-gray-400 mt-2">Valid Until</p>
                      <p className="font-mono font-bold">{validUntilDate.toLocaleDateString()}</p>
                  </div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left">
                      <thead>
                          <tr className="border-b-2 border-black">
                              <th className="py-2 text-xs font-black uppercase tracking-wider text-gray-500">Description</th>
                              <th className="py-2 text-xs font-black uppercase tracking-wider text-gray-500 text-right">Qty</th>
                              <th className="py-2 text-xs font-black uppercase tracking-wider text-gray-500 text-right">Total</th>
                          </tr>
                      </thead>
                      <tbody className="font-mono text-sm">
                          {mode === "SIMPLE" ? (
                              <>
                                <tr className="border-b border-gray-100">
                                  <td className="py-4 font-bold">Materials & Hardware</td>
                                  <td className="py-4 text-right">1</td>
                                  <td className="py-4 text-right">${(parseFloat(simpleMaterials)||0).toFixed(2)}</td>
                                </tr>
                                <tr className="border-b border-gray-100">
                                  <td className="py-4 font-bold">Labor Services</td>
                                  <td className="py-4 text-right">{simpleHours || 0} hrs</td>
                                  <td className="py-4 text-right">${((parseFloat(simpleHours)||0)*hourlyRate).toFixed(2)}</td>
                                </tr>
                              </>
                          ) : (
                              lineItems.map((item, i) => (
                                  <tr key={i} className="border-b border-gray-100">
                                      <td className="py-4 font-bold">{item.description || "Item"}</td>
                                      <td className="py-4 text-right">{item.quantity}</td>
                                      <td className="py-4 text-right">${(item.unit_cost * item.quantity).toFixed(2)}</td>
                                  </tr>
                              ))
                          )}
                          {showDiscount && discount > 0 && (
                            <tr className="border-b border-gray-100">
                              <td className="py-4 font-bold text-red-600">Discount</td>
                              <td className="py-4 text-right">-</td>
                              <td className="py-4 text-right text-red-600">-${discount.toFixed(2)}</td>
                            </tr>
                          )}
                      </tbody>
                  </table>
              </div>

              {includeTax && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-right">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-mono font-bold">${price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax ({taxRate}%):</span>
                    <span className="font-mono font-bold">${tax.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="bg-gray-100 p-6 rounded-xl flex justify-between items-end mt-6 shrink-0">
                  <div>
                      <p className="text-xs font-black text-gray-400 uppercase">Total Amount Due</p>
                      {paymentTerms === "DEPOSIT_50" && (
                        <div className="text-xs text-gray-600 mt-2">
                          <p className="font-bold">Payment Terms:</p>
                          <p>50% Deposit: ${(total * 0.5).toFixed(2)} (due now)</p>
                          <p>Balance: ${(total * 0.5).toFixed(2)} (on completion)</p>
                        </div>
                      )}
                      {paymentTerms === "NET_30" && <p className="text-xs text-gray-600 mt-2">Payment due within 30 days</p>}
                      {paymentTerms === "NET_15" && <p className="text-xs text-gray-600 mt-2">Payment due within 15 days</p>}
                      {paymentTerms === "DUE_ON_RECEIPT" && <p className="text-xs text-gray-600 mt-2">Payment due upon receipt</p>}
                  </div>
                  <p className="text-5xl font-oswald font-bold">${total.toFixed(2)}</p>
              </div>

              <button onClick={() => setIsInvoiceMode(false)} className="absolute top-4 right-4 p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition"><X size={20} /></button>
          </div>
      ) : (
      /* MAIN CALCULATOR */
      <main className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-6 overflow-y-auto custom-scrollbar pb-24">
        
        {/* INPUT AREA */}
        <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-color)] space-y-6 backdrop-blur-sm">
            
            {mode === "SIMPLE" ? (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-[var(--text-sub)] uppercase flex items-center gap-2"><Box size={12}/> Materials ($)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-sub)] font-mono">$</span>
                            <input 
                              type="number" 
                              value={simpleMaterials} 
                              onChange={e => setSimpleMaterials(e.target.value)} 
                              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl p-4 pl-8 text-center font-mono font-bold text-xl outline-none focus:border-[#FF6700] transition text-[var(--input-text)]" 
                              placeholder="0" 
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-[var(--text-sub)] uppercase flex items-center gap-2"><Clock size={12}/> Labor (Hrs)</label>
                        <div className="relative">
                            <input 
                              type="number" 
                              value={simpleHours} 
                              onChange={e => setSimpleHours(e.target.value)} 
                              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl p-4 text-center font-mono font-bold text-xl outline-none focus:border-[#FF6700] transition text-[var(--input-text)]" 
                              placeholder="0" 
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-3 animate-in fade-in">
                    {lineItems.map((item, idx) => (
                        <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-5">
                                <input 
                                  placeholder="Description" 
                                  value={item.description} 
                                  onChange={(e) => updateLineItem(item.id, "description", e.target.value)} 
                                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg p-3 text-sm font-bold outline-none focus:border-[#FF6700] text-[var(--input-text)]" 
                                />
                            </div>
                            <div className="col-span-2">
                                <input 
                                  placeholder="Qty" 
                                  type="number" 
                                  value={item.quantity} 
                                  onChange={(e) => updateLineItem(item.id, "quantity", e.target.value)} 
                                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg p-3 text-sm text-center outline-none focus:border-[#FF6700] text-[var(--input-text)]" 
                                />
                            </div>
                            <div className="col-span-3">
                                <input 
                                  placeholder="Cost" 
                                  type="number" 
                                  value={item.unit_cost} 
                                  onChange={(e) => updateLineItem(item.id, "unit_cost", e.target.value)} 
                                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg p-3 text-sm text-center outline-none focus:border-[#FF6700] text-[var(--input-text)]" 
                                />
                            </div>
                            <div className="col-span-2 text-center">
                                <button onClick={() => removeLineItem(item.id)} className="text-[var(--text-sub)] hover:text-red-500 transition"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                    <button onClick={addLineItem} className="w-full py-3 border border-dashed border-[var(--border-color)] text-[var(--text-sub)] rounded-lg text-xs font-bold hover:text-[#FF6700] hover:border-[#FF6700] transition uppercase">+ Add Item</button>
                    
                    {!showDiscount && (
                      <button onClick={() => setShowDiscount(true)} className="w-full py-3 border border-dashed border-[var(--border-color)] text-[var(--text-sub)] rounded-lg text-xs font-bold hover:text-red-500 hover:border-red-500 transition uppercase">- Add Discount</button>
                    )}

                    {showDiscount && (
                      <div className="grid grid-cols-12 gap-2 items-center bg-red-500/5 border border-red-500/30 rounded-lg p-3">
                        <div className="col-span-5">
                          <p className="text-sm font-bold text-red-500">Discount</p>
                        </div>
                        <div className="col-span-2"></div>
                        <div className="col-span-3">
                          <input 
                            placeholder="Amount" 
                            type="number" 
                            value={discountAmount} 
                            onChange={(e) => setDiscountAmount(e.target.value)} 
                            className="w-full bg-black/20 border border-red-500/30 rounded-lg p-3 text-sm text-center outline-none focus:border-red-500 text-red-500" 
                          />
                        </div>
                        <div className="col-span-2 text-center">
                          <button onClick={() => { setShowDiscount(false); setDiscountAmount(0); }} className="text-[var(--text-sub)] hover:text-red-500 transition"><X size={16}/></button>
                        </div>
                      </div>
                    )}
                </div>
            )}

            {/* TOTAL QUOTE */}
            <div className={`bg-[var(--bg-surface)] rounded-xl p-8 border text-center relative overflow-hidden group ${isBelowTarget ? "border-red-500/50" : "border-[var(--border-color)]"}`}>
                {isBelowTarget && (
                  <div className="absolute top-3 right-3">
                    <AlertTriangle size={20} className="text-red-500 animate-pulse"/>
                  </div>
                )}
                <p className="text-xs text-[var(--text-sub)] uppercase tracking-widest mb-2 font-bold">ESTIMATED QUOTE</p>
                <p className="text-6xl font-oswald font-bold text-[var(--text-main)] tracking-tight">${price.toFixed(0)}</p>
                {includeTax && (
                  <div className="mt-4 pt-4 border-t border-[var(--border-color)] space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-sub)]">Subtotal:</span>
                      <span className="font-mono">${price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-sub)]">Tax ({taxRate}%):</span>
                      <span className="font-mono">${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base pt-2 border-t border-[var(--border-color)]">
                      <span>TOTAL:</span>
                      <span className="font-oswald text-xl">${total.toFixed(2)}</span>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#FF6700]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-3">
                <button onClick={() => setIsInvoiceMode(true)} className="flex-1 py-4 bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] font-black text-sm uppercase rounded-xl hover:bg-[var(--bg-card)] transition flex items-center justify-center gap-2">
                    <FileText size={18}/> Preview
                </button>
                <button onClick={handleSave} disabled={loading || !activeJob} className="flex-[2] py-4 bg-[#FF6700] text-black font-black text-sm uppercase rounded-xl shadow-[0_0_20px_rgba(255,103,0,0.4)] hover:shadow-[0_0_30px_rgba(255,103,0,0.6)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? <Loader2 className="animate-spin"/> : <Save size={18} />} SAVE QUOTE
                </button>
            </div>

        </div>
      </main>
      )}

      {/* CONTROL PANEL */}
      {showMenu && (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm animate-in fade-in" onClick={() => setShowMenu(false)} />
            <div className="w-96 max-w-[90vw] bg-[var(--bg-card)] border-l border-[var(--border-color)] h-full shadow-2xl relative animate-in slide-in-from-right p-6 flex flex-col overflow-y-auto">
                
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-oswald font-bold text-[#FF6700] uppercase">CONTROL PANEL</h2>
                    <button onClick={() => setShowMenu(false)}><X className="text-[var(--text-sub)] hover:text-[var(--text-main)]" /></button>
                </div>

                {/* TABS */}
                <div className="grid grid-cols-3 gap-1 bg-[var(--bg-surface)] p-1 rounded-lg mb-6">
                  {["PROFIT", "SETTINGS", "HISTORY"].map(tab => (
                    <button 
                      key={tab}
                      onClick={() => setMenuTab(tab)}
                      className={`py-2 px-1 rounded text-[10px] font-bold transition ${menuTab === tab ? "bg-[#FF6700] text-black shadow-[0_0_12px_rgba(255,103,0,0.3)]" : "text-[var(--text-sub)] hover:text-[var(--text-main)]"}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* PROFIT TAB */}
                {menuTab === "PROFIT" && (
                  <div className="space-y-6 animate-in fade-in">
                    {/* THE VAULT */}
                    <div className={`p-4 rounded-xl border relative overflow-hidden transition-all duration-300 ${isBelowTarget ? "bg-red-900/10 border-red-500/50" : "bg-[var(--bg-surface)] border-[var(--border-color)]"}`}>
                        <div className="flex justify-between items-center mb-2 relative z-10">
                            <p className="text-xs font-black text-[var(--text-sub)] uppercase flex items-center gap-2">
                              Internal Profit {profitLocked && <Lock size={10} className="text-green-500"/>}
                            </p>
                            <button onClick={() => setShowProfitDetails(!showProfitDetails)} className="text-[var(--text-sub)] hover:text-[var(--text-main)]">
                                {showProfitDetails ? <EyeOff size={16}/> : <Eye size={16}/>}
                            </button>
                        </div>
                        
                        {showProfitDetails ? (
                            <div className="animate-in fade-in">
                                <p className={`text-3xl font-oswald font-bold relative z-10 ${profit > 0 ? "text-green-500" : "text-red-500"}`}>${profit.toFixed(2)}</p>
                                <div className="flex justify-between items-center mt-2">
                                    <p className="text-xs text-[var(--text-sub)] font-bold relative z-10">Margin: {margin.toFixed(1)}%</p>
                                    <p className="text-[10px] text-[var(--text-sub)] font-mono">Cost: ${cost.toFixed(0)}</p>
                                </div>
                                {isBelowTarget && (
                                  <p className="text-xs text-red-500 mt-2">⚠️ Below target margin ({targetValue}%)</p>
                                )}
                                <div className="mt-3 pt-3 border-t border-[var(--border-color)] text-[10px] text-[var(--text-sub)] font-mono">
                                    <p>Price: ${price.toFixed(2)}</p>
                                    <p>- Cost: ${cost.toFixed(2)}</p>
                                    <p>= Net:  ${profit.toFixed(2)}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="py-2">
                                <p className="text-3xl font-oswald font-bold text-[var(--text-sub)] tracking-widest select-none">****</p>
                            </div>
                        )}
                        
                        {showProfitDetails && (
                            <div className="absolute bottom-0 left-0 h-1 bg-[var(--bg-surface)] w-full">
                                <div className={`h-full ${profit > 0 ? "bg-green-500" : "bg-red-500"}`} style={{ width: `${Math.min(margin, 100)}%` }}></div>
                            </div>
                        )}
                    </div>

                    {/* Mode Toggle */}
                    <div>
                        <label className="text-[10px] font-black text-[var(--text-sub)] uppercase mb-2 block">Calculator Mode</label>
                        <div className="flex bg-[var(--bg-surface)] rounded-lg p-1 border border-[var(--border-color)]">
                            <button onClick={() => setMode("SIMPLE")} className={`flex-1 py-2 text-xs font-bold rounded transition ${mode === "SIMPLE" ? "bg-[#FF6700] text-black" : "text-[var(--text-sub)] hover:text-[var(--text-main)]"}`}>Simple</button>
                            <button onClick={() => setMode("ADVANCED")} className={`flex-1 py-2 text-xs font-bold rounded transition ${mode === "ADVANCED" ? "bg-[#FF6700] text-black" : "text-[var(--text-sub)] hover:text-[var(--text-main)]"}`}>Advanced</button>
                        </div>
                    </div>

                    {/* ProfitLock Feature */}
                    <button onClick={() => setProfitLocked(!profitLocked)} className={`w-full flex items-center justify-between p-3 rounded-lg border transition ${profitLocked ? "bg-green-900/20 border-green-500/50" : "bg-[var(--bg-surface)] border-[var(--border-color)]"}`}>
                        <span className={`text-xs font-bold ${profitLocked ? "text-green-500" : "text-[var(--text-sub)]"}`}>ProfitLock™ {profitLocked ? "Active" : "Off"}</span>
                        {profitLocked ? <Lock size={14} className="text-green-500"/> : <Unlock size={14} className="text-[var(--text-sub)]"/>}
                    </button>
                  </div>
                )}

                {/* SETTINGS TAB */}
                {menuTab === "SETTINGS" && (
                  <div className="space-y-6 animate-in fade-in">
                    
                    {/* Profit Method Toggle */}
                    <div>
                        <label className="text-[10px] font-black text-[var(--text-sub)] uppercase mb-2 block">Profit Calculation</label>
                        <div className="flex bg-[var(--bg-surface)] rounded-lg p-1 border border-[var(--border-color)] mb-3">
                            <button onClick={() => setProfitMethod("MARKUP")} className={`flex-1 py-2 text-xs font-bold rounded transition flex items-center justify-center gap-1 ${profitMethod === "MARKUP" ? "bg-[#FF6700] text-black" : "text-[var(--text-sub)] hover:text-[var(--text-main)]"}`}>
                              <DollarSign size={12}/> Markup
                            </button>
                            <button onClick={() => setProfitMethod("MARGIN")} className={`flex-1 py-2 text-xs font-bold rounded transition flex items-center justify-center gap-1 ${profitMethod === "MARGIN" ? "bg-[#FF6700] text-black" : "text-[var(--text-sub)] hover:text-[var(--text-main)]"}`}>
                              <Percent size={12}/> Margin
                            </button>
                        </div>
                        <div>
                          <p className="text-[9px] text-[var(--text-sub)] mb-1">{profitMethod === "MARKUP" ? "Markup %" : "Target Margin %"}</p>
                          <input 
                            type="number" 
                            value={targetValue} 
                            onChange={e => setTargetValue(parseFloat(e.target.value) || 0)} 
                            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded p-3 text-base text-[var(--input-text)] font-bold outline-none focus:border-[#FF6700]" 
                          />
                          <p className="text-[9px] text-[var(--text-sub)] mt-1">
                            {profitMethod === "MARKUP" ? "Price = Cost × (1 + Markup%)" : "Price = Cost / (1 - Margin%)"}
                          </p>
                        </div>
                    </div>

                    {/* Global Defaults */}
                    <div>
                        <label className="text-[10px] font-black text-[var(--text-sub)] uppercase mb-2 block">Global Defaults</label>
                        <div className="space-y-3">
                            <div>
                                <p className="text-[9px] text-[var(--text-sub)] mb-1">Hourly Rate ($)</p>
                                <input 
                                  type="number" 
                                  value={hourlyRate} 
                                  onChange={e => setHourlyRate(parseFloat(e.target.value) || 0)} 
                                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded p-3 text-base text-[var(--input-text)] font-bold outline-none focus:border-[#FF6700]" 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tax Settings */}
                    <div>
                        <label className="text-[10px] font-black text-[var(--text-sub)] uppercase mb-2 block">Tax Settings</label>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg">
                              <span className="text-xs font-bold">Include Tax on Invoice</span>
                              <button 
                                onClick={() => setIncludeTax(!includeTax)}
                                className={`w-10 h-5 rounded-full transition-colors ${includeTax ? "bg-[#FF6700]" : "bg-gray-700"}`}
                              >
                                <div className={`w-4 h-4 rounded-full bg-black m-0.5 transition-transform ${includeTax ? "translate-x-5" : ""}`}></div>
                              </button>
                            </div>
                            {includeTax && (
                              <div>
                                <p className="text-[9px] text-[var(--text-sub)] mb-1">Tax Rate (%)</p>
                                <input 
                                  type="number" 
                                  value={taxRate} 
                                  onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} 
                                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded p-3 text-base text-[var(--input-text)] font-bold outline-none focus:border-[#FF6700]" 
                                />
                              </div>
                            )}
                        </div>
                    </div>

                    {/* Payment Terms */}
                    <div>
                        <label className="text-[10px] font-black text-[var(--text-sub)] uppercase mb-2 block">Payment Terms</label>
                        <select 
                          value={paymentTerms}
                          onChange={(e) => setPaymentTerms(e.target.value)}
                          className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg p-3 text-sm text-[var(--input-text)] font-bold outline-none focus:border-[#FF6700]"
                        >
                          <option value="DUE_ON_RECEIPT">Due on Receipt</option>
                          <option value="NET_15">Net 15 Days</option>
                          <option value="NET_30">Net 30 Days</option>
                          <option value="DEPOSIT_50">50% Deposit</option>
                        </select>
                    </div>

                    {/* Quote Valid Days */}
                    <div>
                        <label className="text-[10px] font-black text-[var(--text-sub)] uppercase mb-2 block">Quote Valid For</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            value={quoteValidDays} 
                            onChange={e => setQuoteValidDays(parseInt(e.target.value) || 30)} 
                            className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded p-3 text-base text-[var(--input-text)] font-bold outline-none focus:border-[#FF6700]" 
                          />
                          <span className="text-sm text-[var(--text-sub)]">days</span>
                        </div>
                    </div>

                  </div>
                )}

                {/* HISTORY TAB */}
                {menuTab === "HISTORY" && (
                  <div className="space-y-4 animate-in fade-in">
                    <p className="text-[10px] font-black text-[var(--text-sub)] uppercase">Recent Estimates ({estimateHistory.length})</p>
                    <div className="space-y-3">
                        {estimateHistory.slice(0,10).map(est => (
                            <div key={est.id} className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[#FF6700] transition group cursor-pointer flex justify-between items-center">
                                <div>
                                    <p className="text-xs font-bold text-[var(--text-main)]">{est.jobs?.title || "Unknown Job"}</p>
                                    <p className="text-[10px] text-[var(--text-sub)]">{est.estimate_number} • {new Date(est.created_at).toLocaleDateString()}</p>
                                </div>
                                <p className="text-xs font-oswald font-bold text-[#FF6700]">${est.total_price?.toFixed(0)}</p>
                            </div>
                        ))}
                        {estimateHistory.length === 0 && (
                          <p className="text-sm text-[var(--text-sub)] text-center py-8">No estimates yet</p>
                        )}
                    </div>
                  </div>
                )}

            </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
          <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] text-white font-bold animate-in slide-in-from-bottom-10 z-[60] flex items-center gap-3 border ${toast.type === "error" ? "bg-red-900/90 border-red-500" : "bg-green-900/90 border-green-500"}`}>
              {toast.type === "error" ? <AlertTriangle size={20}/> : <CheckCircle2 size={20}/>}
              {toast.msg}
          </div>
      )}

    </div>
  );
}
