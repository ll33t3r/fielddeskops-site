"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../utils/supabase/client";
import { useActiveJob } from "../../../hooks/useActiveJob";
import { 
  Trash2, Save, FileText, Menu, X, ArrowLeft, Plus, Loader2, 
  Briefcase, Lock, Unlock, ChevronDown, CheckCircle2, Box, Clock, 
  AlertTriangle, Eye, EyeOff, DollarSign, Percent, Search
} from "lucide-react";
import Link from "next/link";

export default function ProfitLock() {
  const supabase = createClient();
  const { activeJob, setActiveJob } = useActiveJob();
  
  const [allJobs, setAllJobs] = useState([]);
  const [estimateHistory, setEstimateHistory] = useState([]); 
  const [customer, setCustomer] = useState(null);

  const [mode, setMode] = useState("SIMPLE");
  const [profitMethod, setProfitMethod] = useState("MARKUP");
  const [profitLocked, setProfitLocked] = useState(true);
  const [isInvoiceMode, setIsInvoiceMode] = useState(false);
  
  const [simpleMaterials, setSimpleMaterials] = useState(""); 
  const [simpleHours, setSimpleHours] = useState("");
  
  const [lineItems, setLineItems] = useState([
      { id: 1, description: "Materials", quantity: "", unit_cost: "" },
      { id: 2, description: "Labor", quantity: "", unit_cost: "" }
  ]); 

  const [hourlyRate, setHourlyRate] = useState(100);
  const [targetValue, setTargetValue] = useState(400);
  const [taxRate, setTaxRate] = useState(8.5);
  const [includeTax, setIncludeTax] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState("DUE_ON_RECEIPT");
  const [quoteValidDays, setQuoteValidDays] = useState(30);
  
  const [showMenu, setShowMenu] = useState(false);
  const [showProfitDetails, setShowProfitDetails] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountAmount, setDiscountAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [menuTab, setMenuTab] = useState("PROFIT");
  
  const [showJobSelect, setShowJobSelect] = useState(false);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState("");
  const [jobSearch, setJobSearch] = useState("");

  useEffect(() => { 
      loadData(); 
      loadSettings();
  }, []);

  useEffect(() => {
    if (activeJob?.customer_id) {
      loadCustomer(activeJob.customer_id);
    } else {
      setCustomer(null);
    }
  }, [activeJob]);

  useEffect(() => {
    if (showMenu || showJobSelect) {
        document.body.style.overflow = "hidden";
    } else {
        document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [showMenu, showJobSelect]);

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
          setQuoteValidDays(config.quoteValidDays || 30);
      }
  };

  const saveSettings = () => {
      const config = {
          hourlyRate,
          targetValue,
          profitMethod,
          taxRate,
          includeTax,
          paymentTerms,
          quoteValidDays
      };
      localStorage.setItem("profitlock_config", JSON.stringify(config));
  };

  useEffect(() => {
    saveSettings();
  }, [hourlyRate, targetValue, profitMethod, taxRate, includeTax, paymentTerms, quoteValidDays]);

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

  const handleCreateJob = async () => {
    if (!newJobTitle.trim()) { showToast("Job title required", "error"); return; }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: job, error } = await supabase.from("jobs").insert({
      user_id: user.id,
      title: newJobTitle,
      status: "ACTIVE"
    }).select().single();

    if (error) {
      showToast("Error creating job", "error");
    } else {
      setActiveJob(job);
      setAllJobs([job, ...allJobs]);
      setNewJobTitle("");
      setShowCreateJob(false);
      setShowJobSelect(false);
      showToast("Job created!", "success");
    }
    setLoading(false);
  };

  const filteredJobs = allJobs.filter(j => 
    j.title?.toLowerCase().includes(jobSearch.toLowerCase()) &&
    (j.status === "ACTIVE" || j.status === "PENDING")
  );

  const calculateTotals = () => {
    let subtotal = 0;

    if (mode === "SIMPLE") {
        const mat = parseFloat(simpleMaterials) || 0;
        const labor = (parseFloat(simpleHours) || 0) * hourlyRate;
        subtotal = mat + labor;
    } else {
        lineItems.forEach(item => {
            const itemCost = (parseFloat(item.unit_cost) || 0) * (parseFloat(item.quantity) || 0);
            subtotal += itemCost;
        });
    }

    const discount = parseFloat(discountAmount) || 0;
    const cost = subtotal - discount;

    let price = 0;
    if (profitMethod === "MARKUP") {
      price = cost * (1 + (targetValue / 100));
    } else {
      const marginDecimal = targetValue / 100;
      if (marginDecimal >= 1) {
        price = cost * 2;
      } else {
        price = cost / (1 - marginDecimal);
      }
    }

    const profit = price - cost;
    const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
    const tax = includeTax ? price * (taxRate / 100) : 0;
    const total = price + tax;

    return { subtotal, discount, cost, price, profit, margin, tax, total };
  };

  const { subtotal, discount, cost, price, profit, margin, tax, total } = calculateTotals();
  const isBelowTarget = profitMethod === "MARGIN" && margin < targetValue;

  const addLineItem = () => setLineItems([...lineItems, { id: Date.now(), description: "", quantity: "", unit_cost: "" }]);
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
        console.error("Save error:", error);
        showToast("Error: " + error.message, "error"); 
        setLoading(false);
        return;
    }

    if (mode === "ADVANCED") {
        const items = lineItems.filter(item => item.description && (item.quantity || item.unit_cost)).map(item => ({
            estimate_id: estimate.id,
            description: item.description,
            quantity: parseFloat(item.quantity) || 0,
            unit_price: parseFloat(item.unit_cost) || 0,
            total: (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_cost) || 0)
        }));
        if (items.length > 0) await supabase.from("line_items").insert(items);
    } else {
        const items = [];
        if (parseFloat(simpleMaterials) > 0) {
          items.push({ estimate_id: estimate.id, description: "Materials", quantity: 1, unit_price: parseFloat(simpleMaterials), total: parseFloat(simpleMaterials) });
        }
        if (parseFloat(simpleHours) > 0) {
          items.push({ estimate_id: estimate.id, description: "Labor", quantity: parseFloat(simpleHours), unit_price: hourlyRate, total: parseFloat(simpleHours) * hourlyRate });
        }
        if (items.length > 0) await supabase.from("line_items").insert(items);
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
      
      <header className="p-6 shrink-0 flex justify-between items-start z-10 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-4">
            <Link href="/" className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[#FF6700] hover:text-[#FF6700] transition">
                <ArrowLeft size={24} />
            </Link>
            <div>
                <h1 className="text-2xl font-oswald font-bold text-[#FF6700] tracking-wide uppercase drop-shadow-[0_0_10px_rgba(255,103,0,0.5)]">FIELDDESKOPS</h1>
                <p className="text-[9px] font-bold text-[var(--text-sub)] uppercase tracking-widest">PROFITLOCK ESTIMATING</p>
            </div>
        </div>
        <button onClick={() => setShowMenu(true)} className="p-3 rounded-xl bg-[#FF6700] text-black shadow-[0_0_20px_rgba(255,103,0,0.4)] hover:scale-105 transition active:scale-95">
            <Menu size={24} strokeWidth={3} />
        </button>
      </header>

      <div className="mx-6 mt-4 mb-4">
        <label className="text-[10px] font-black text-[var(--text-sub)] uppercase ml-1 mb-2 block">Connect to Job</label>
        <button 
          onClick={() => setShowJobSelect(true)}
          className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 text-left font-bold uppercase outline-none hover:border-[#FF6700] transition flex justify-between items-center"
        >
          {activeJob ? (
            <div>
              <p className="text-sm text-[var(--text-main)]">{activeJob.title}</p>
              {customer && <p className="text-xs text-[var(--text-sub)] font-normal">{customer.name}</p>}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-sub)]">-- Select Job --</p>
          )}
          <ChevronDown size={16} className="text-[var(--text-sub)]"/>
        </button>
      </div>

      {isInvoiceMode ? (
          <div className="flex-1 p-6 bg-white text-black m-4 rounded-xl shadow-2xl relative flex flex-col overflow-hidden">
              <div className="border-b border-gray-200 pb-6 mb-6 flex justify-between items-start shrink-0">
                  <div>
                      <h2 className="text-4xl font-oswald font-bold uppercase tracking-tighter">ESTIMATE</h2>
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
              
              <div className="flex-1 overflow-y-auto">
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
                                {parseFloat(simpleMaterials) > 0 && (
                                  <tr className="border-b border-gray-100">
                                    <td className="py-4 font-bold">Materials & Hardware</td>
                                    <td className="py-4 text-right">1</td>
                                    <td className="py-4 text-right">${(parseFloat(simpleMaterials)).toFixed(2)}</td>
                                  </tr>
                                )}
                                {parseFloat(simpleHours) > 0 && (
                                  <tr className="border-b border-gray-100">
                                    <td className="py-4 font-bold">Labor Services</td>
                                    <td className="py-4 text-right">{simpleHours} hrs @ ${hourlyRate}/hr</td>
                                    <td className="py-4 text-right">${((parseFloat(simpleHours))*hourlyRate).toFixed(2)}</td>
                                  </tr>
                                )}
                              </>
                          ) : (
                              lineItems.filter(item => item.description && (parseFloat(item.quantity) > 0 || parseFloat(item.unit_cost) > 0)).map((item, i) => (
                                  <tr key={i} className="border-b border-gray-100">
                                      <td className="py-4 font-bold">{item.description}</td>
                                      <td className="py-4 text-right">{parseFloat(item.quantity).toFixed(2)}</td>
                                      <td className="py-4 text-right">${((parseFloat(item.unit_cost) || 0) * (parseFloat(item.quantity) || 0)).toFixed(2)}</td>
                                  </tr>
                              ))
                          )}
                          {showDiscount && parseFloat(discountAmount) > 0 && (
                            <tr className="border-b border-gray-100">
                              <td className="py-4 font-bold text-red-600">Discount</td>
                              <td className="py-4 text-right">-</td>
                              <td className="py-4 text-right text-red-600">-${parseFloat(discountAmount).toFixed(2)}</td>
                            </tr>
                          )}
                      </tbody>
                  </table>
              </div>

              {includeTax && (
                <div className="mt-6 pt-4 border-t-2 border-black space-y-2 text-right">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-bold">Subtotal:</span>
                    <span className="font-mono font-bold">${price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-bold">Tax ({taxRate}%):</span>
                    <span className="font-mono font-bold">${tax.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="bg-black text-white p-6 rounded-xl flex justify-between items-end mt-6 shrink-0">
                  <div>
                      <p className="text-xs font-black text-gray-300 uppercase">Total Amount Due</p>
                      {paymentTerms === "DEPOSIT_50" && (
                        <div className="text-xs text-gray-300 mt-2">
                          <p className="font-bold">Payment Terms:</p>
                          <p>50% Deposit: ${(total * 0.5).toFixed(2)} (due now)</p>
                          <p>Balance: ${(total * 0.5).toFixed(2)} (on completion)</p>
                        </div>
                      )}
                      {paymentTerms === "NET_30" && <p className="text-xs text-gray-300 mt-2 font-bold">Payment due within 30 days</p>}
                      {paymentTerms === "NET_15" && <p className="text-xs text-gray-300 mt-2 font-bold">Payment due within 15 days</p>}
                      {paymentTerms === "DUE_ON_RECEIPT" && <p className="text-xs text-gray-300 mt-2 font-bold">Payment due upon receipt</p>}
                  </div>
                  <p className="text-5xl font-oswald font-bold text-[#FF6700]">${total.toFixed(2)}</p>
              </div>

              <button onClick={() => setIsInvoiceMode(false)} className="absolute top-4 right-4 p-2 bg-gray-300 rounded-full hover:bg-gray-400 transition"><X size={20} className="text-black"/></button>
          </div>
      ) : (
      <main className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-6 overflow-y-auto pb-32">
        <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-color)] space-y-6">
            
            {mode === "SIMPLE" ? (
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-[var(--text-sub)] uppercase flex items-center gap-2"><Box size={12}/> Materials ($)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-sub)] font-mono">$</span>
                            <input 
                              type="number" 
                              inputMode="decimal"
                              value={simpleMaterials} 
                              onChange={e => setSimpleMaterials(e.target.value)} 
                              placeholder="0"
                              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl p-4 pl-8 text-center font-mono font-bold outline-none focus:border-[#FF6700] transition text-[var(--input-text)] placeholder:text-[var(--text-sub)] placeholder:opacity-30" 
                              style={{ fontSize: '16px' }}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-[var(--text-sub)] uppercase flex items-center gap-2"><Clock size={12}/> Labor (Hrs)</label>
                        <input 
                          type="number" 
                          inputMode="decimal"
                          value={simpleHours} 
                          onChange={e => setSimpleHours(e.target.value)} 
                          placeholder="0"
                          className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl p-4 text-center font-mono font-bold outline-none focus:border-[#FF6700] transition text-[var(--input-text)] placeholder:text-[var(--text-sub)] placeholder:opacity-30" 
                          style={{ fontSize: '16px' }}
                        />
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {lineItems.map((item) => (
                        <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-5">
                                <input 
                                  placeholder="Description" 
                                  value={item.description} 
                                  onChange={(e) => updateLineItem(item.id, "description", e.target.value)} 
                                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg p-3 text-sm font-bold outline-none focus:border-[#FF6700] text-[var(--input-text)]" 
                                  style={{ fontSize: '16px' }}
                                />
                            </div>
                            <div className="col-span-2">
                                <input 
                                  placeholder="0" 
                                  type="number" 
                                  inputMode="decimal"
                                  value={item.quantity} 
                                  onChange={(e) => updateLineItem(item.id, "quantity", e.target.value)} 
                                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg p-3 text-sm text-center outline-none focus:border-[#FF6700] text-[var(--input-text)] placeholder:text-[var(--text-sub)] placeholder:opacity-30" 
                                  style={{ fontSize: '16px' }}
                                />
                            </div>
                            <div className="col-span-3">
                                <input 
                                  placeholder="0" 
                                  type="number" 
                                  inputMode="decimal"
                                  value={item.unit_cost} 
                                  onChange={(e) => updateLineItem(item.id, "unit_cost", e.target.value)} 
                                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg p-3 text-sm text-center outline-none focus:border-[#FF6700] text-[var(--input-text)] placeholder:text-[var(--text-sub)] placeholder:opacity-30" 
                                  style={{ fontSize: '16px' }}
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
                            placeholder="0" 
                            type="number" 
                            inputMode="decimal"
                            value={discountAmount} 
                            onChange={(e) => setDiscountAmount(e.target.value)} 
                            className="w-full bg-black/20 border border-red-500/30 rounded-lg p-3 text-sm text-center outline-none focus:border-red-500 text-red-500 placeholder:text-red-500 placeholder:opacity-30" 
                            style={{ fontSize: '16px' }}
                          />
                        </div>
                        <div className="col-span-2 text-center">
                          <button onClick={() => { setShowDiscount(false); setDiscountAmount(""); }} className="text-[var(--text-sub)] hover:text-red-500 transition"><X size={16}/></button>
                        </div>
                      </div>
                    )}
                </div>
            )}

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
            </div>

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

      {/* JOB SELECT MODAL */}
      {showJobSelect && (
        <>
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={() => setShowJobSelect(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto z-50 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center">
              <h2 className="font-oswald text-xl text-[#FF6700]">SELECT JOB</h2>
              <button onClick={() => setShowJobSelect(false)} className="p-2 hover:bg-white/10 rounded-lg">
                <X size={20}/>
              </button>
            </div>
            
            <div className="p-4 border-b border-[var(--border-color)]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-sub)]" size={16}/>
                <input 
                  placeholder="Search jobs..." 
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg pl-10 pr-3 py-2 text-sm text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <button 
                onClick={() => { setShowJobSelect(false); setShowCreateJob(true); }}
                className="w-full p-3 bg-[#FF6700] text-black font-bold rounded-lg hover:bg-[#ff8533] transition flex items-center justify-center gap-2"
              >
                <Plus size={18}/> CREATE NEW JOB
              </button>
              
              {filteredJobs.map(job => (
                <button
                  key={job.id}
                  onClick={() => { setActiveJob(job); setShowJobSelect(false); }}
                  className={`w-full text-left p-3 rounded-lg border transition flex justify-between items-center ${activeJob?.id === job.id ? "bg-[#FF6700]/10 border-[#FF6700]" : "bg-[var(--bg-surface)] border-[var(--border-color)] hover:border-[#FF6700]"}`}
                >
                  <div>
                    <p className="font-oswald text-sm text-[var(--text-main)]">{job.title}</p>
                    <p className="text-xs text-[var(--text-sub)]">{new Date(job.created_at).toLocaleDateString()}</p>
                  </div>
                  {activeJob?.id === job.id && <CheckCircle2 size={18} className="text-[#FF6700]"/>}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* CREATE JOB MODAL */}
      {showCreateJob && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm" onClick={() => setShowCreateJob(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto z-[60] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="font-oswald text-xl text-[#FF6700]">CREATE JOB</h2>
                <p className="text-xs text-[var(--text-sub)]">Quick dispatch from ProfitLock</p>
              </div>
              <button onClick={() => setShowCreateJob(false)} className="p-2 hover:bg-white/10 rounded-lg">
                <X size={20}/>
              </button>
            </div>
            
            <div className="space-y-4">
              <input 
                autoFocus
                placeholder="Job Title..." 
                value={newJobTitle}
                onChange={(e) => setNewJobTitle(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg p-4 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
                style={{ fontSize: '16px' }}
              />
              <button 
                onClick={handleCreateJob}
                disabled={loading}
                className="w-full py-4 bg-[#FF6700] text-black font-black uppercase rounded-lg hover:bg-[#ff8533] transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin"/> : <Briefcase size={18}/>} CREATE & SELECT
              </button>
            </div>
          </div>
        </>
      )}

      {/* CONTROL PANEL - FULL FEATURED */}
      {showMenu && (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowMenu(false)} />
            <div className="w-96 max-w-[90vw] bg-[var(--bg-card)] border-l border-[var(--border-color)] h-full shadow-2xl relative p-6 flex flex-col overflow-y-auto">
                
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
                  <div className="space-y-6">
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
                            <div>
                                <p className={`text-3xl font-oswald font-bold relative z-10 ${profit > 0 ? "text-green-500" : "text-red-500"}`}>${profit.toFixed(2)}</p>
                                <div className="flex justify-between items-center mt-2">
                                    <p className="text-xs text-[var(--text-sub)] font-bold relative z-10">Margin: {margin.toFixed(1)}%</p>
                                    <p className="text-[10px] text-[var(--text-sub)] font-mono">Cost: ${cost.toFixed(0)}</p>
                                </div>
                                {isBelowTarget && (
                                  <p className="text-xs text-red-500 mt-2">⚠️ Below target margin ({targetValue}%)</p>
                                )}
                                <div className="mt-3 pt-3 border-t border-[var(--border-color)] text-[10px] text-[var(--text-sub)] font-mono space-y-1">
                                    <p>Price: ${price.toFixed(2)}</p>
                                    <p>- Cost: ${cost.toFixed(2)}</p>
                                    <p>= Net:  ${profit.toFixed(2)}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="py-2">
                                <p className="text-3xl font-oswald font-bold text-[var(--text-sub)] opacity-30 tracking-widest select-none">****</p>
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
                  <div className="space-y-6">
                    
                    {/* Profit Method Toggle */}
                    <div>
                        <label className="text-[10px] font-black text-[var(--text-sub)] uppercase mb-2 block">Profit Method</label>
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
                            inputMode="decimal"
                            value={targetValue} 
                            onChange={e => setTargetValue(parseFloat(e.target.value) || 0)} 
                            placeholder="0"
                            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded p-3 text-base text-[var(--input-text)] font-bold outline-none focus:border-[#FF6700]" 
                            style={{ fontSize: '16px' }}
                          />
                        </div>
                    </div>

                    {/* Global Defaults */}
                    <div>
                        <label className="text-[10px] font-black text-[var(--text-sub)] uppercase mb-2 block">Hourly Rate ($)</label>
                        <input 
                          type="number" 
                          inputMode="decimal"
                          value={hourlyRate} 
                          onChange={e => setHourlyRate(parseFloat(e.target.value) || 0)} 
                          className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded p-3 text-base text-[var(--input-text)] font-bold outline-none focus:border-[#FF6700]" 
                          style={{ fontSize: '16px' }}
                        />
                    </div>

                    {/* Tax Settings */}
                    <div>
                        <label className="text-[10px] font-black text-[var(--text-sub)] uppercase mb-2 block">Tax Settings</label>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg">
                              <span className="text-xs font-bold text-[var(--text-main)]">Include Tax</span>
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
                                  inputMode="decimal"
                                  value={taxRate} 
                                  onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} 
                                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded p-3 text-base text-[var(--input-text)] font-bold outline-none focus:border-[#FF6700]" 
                                  style={{ fontSize: '16px' }}
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
                          style={{ fontSize: '16px' }}
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
                            inputMode="numeric"
                            value={quoteValidDays} 
                            onChange={e => setQuoteValidDays(parseInt(e.target.value) || 30)} 
                            className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded p-3 text-base text-[var(--input-text)] font-bold outline-none focus:border-[#FF6700]" 
                            style={{ fontSize: '16px' }}
                          />
                          <span className="text-sm text-[var(--text-sub)]">days</span>
                        </div>
                    </div>

                  </div>
                )}

                {/* HISTORY TAB */}
                {menuTab === "HISTORY" && (
                  <div className="space-y-4">
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

      {/* FOOTER BRANDING */}
      <footer className="shrink-0 border-t border-[var(--border-color)] bg-[var(--bg-card)] p-4 text-center">
        <p className="text-[10px] font-black text-[var(--text-sub)] uppercase tracking-widest">
          POWERED BY <span className="text-[#FF6700]">FIELDDESKOPS</span>
        </p>
      </footer>

      {toast && (
          <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl text-white font-bold z-[60] flex items-center gap-3 border ${toast.type === "error" ? "bg-red-900/90 border-red-500" : "bg-green-900/90 border-green-500"}`}>
              {toast.type === "error" ? <AlertTriangle size={20}/> : <CheckCircle2 size={20}/>}
              {toast.msg}
          </div>
      )}

    </div>
  );
}
