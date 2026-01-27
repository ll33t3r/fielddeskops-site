"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../utils/supabase/client";
import { useActiveJob } from "../../../hooks/useActiveJob";
import { 
  Trash2, Save, FileText, Menu, X, ArrowLeft, Plus, Loader2, 
  Briefcase, Lock, Unlock, ChevronDown, CheckCircle2, Box, Clock, 
  AlertTriangle, Eye, EyeOff, DollarSign, Percent, Search, Info
} from "lucide-react";
import Link from "next/link";

export default function ProfitLock() {
  const supabase = createClient();
  const { activeJob, setActiveJob } = useActiveJob();
  
  const [allJobs, setAllJobs] = useState([]);
  const [estimateHistory, setEstimateHistory] = useState([]); 
  const [customer, setCustomer] = useState(null);

  const [mode, setMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("profitlock_mode") || "SIMPLE";
    }
    return "SIMPLE";
  });
  
  const [profitMethod, setProfitMethod] = useState("MARKUP");
  const [profitLocked, setProfitLocked] = useState(true);
  const [isInvoiceMode, setIsInvoiceMode] = useState(false);
  const [discountType, setDiscountType] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("profitlock_discount_type") || "DOLLAR";
    }
    return "DOLLAR";
  });
  const [showMethodMenu, setShowMethodMenu] = useState(false);
  
  const [simpleMaterials, setSimpleMaterials] = useState(""); 
  const [simpleHours, setSimpleHours] = useState("");
  
  const [lineItems, setLineItems] = useState([
      { id: 1, description: "Materials", quantity: "", unit_cost: "" },
      { id: 2, description: "Labor", quantity: "", unit_cost: "" }
  ]); 

  const [hourlyRate, setHourlyRate] = useState(100);
  const [targetValue, setTargetValue] = useState(50);
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

  useEffect(() => {
    localStorage.setItem("profitlock_mode", mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem("profitlock_discount_type", discountType);
  }, [discountType]);

  const loadSettings = () => {
      const saved = localStorage.getItem("profitlock_config");
      if (saved) {
          const config = JSON.parse(saved);
          setHourlyRate(config.hourlyRate || 100);
          setTargetValue(config.targetValue || 50);
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

    let discount = 0;
    if (showDiscount && parseFloat(discountAmount)) {
      if (discountType === "DOLLAR") {
        discount = parseFloat(discountAmount);
      } else {
        discount = subtotal * (parseFloat(discountAmount) / 100);
      }
    }
    
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

  const loadEstimate = async (estId) => {
    const { data: est } = await supabase.from("estimates").select("*, line_items(*)").eq("id", estId).single();
    if (!est) return;
    
    const items = est.line_items || [];
    if (mode === "SIMPLE") {
      const matItem = items.find(i => i.description === "Materials");
      const laborItem = items.find(i => i.description === "Labor");
      setSimpleMaterials(matItem ? matItem.unit_price.toString() : "");
      setSimpleHours(laborItem ? laborItem.quantity.toString() : "");
    } else {
      setLineItems(items.length > 0 ? items.map(i => ({
        id: i.id,
        description: i.description,
        quantity: i.quantity.toString(),
        unit_cost: i.unit_price.toString()
      })) : [
        { id: 1, description: "Materials", quantity: "", unit_cost: "" },
        { id: 2, description: "Labor", quantity: "", unit_cost: "" }
      ]);
    }
    setShowMenu(false);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setShowDiscount(false);
    setDiscountAmount("");
  };

  const showToast = (msg, type) => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3000);
  };

  const validUntilDate = new Date();
  validUntilDate.setDate(validUntilDate.getDate() + quoteValidDays);

  return (
    <div className="h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-inter flex flex-col relative overflow-hidden selection:bg-[#FF6700] selection:text-black">
      
      <header className="p-4 shrink-0 flex justify-between items-center z-10 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[#FF6700] hover:text-[#FF6700] transition">
                <ArrowLeft size={20} />
            </Link>
            <div>
                <h1 className="text-[11px] font-oswald font-bold text-[#FF6700] tracking-wide uppercase">FIELDDESKOPS</h1>
                <p className="text-2xl font-oswald font-bold text-[#FF6700] tracking-wide uppercase drop-shadow-[0_0_8px_rgba(255,103,0,0.5)]">PROFITLOCK</p>
            </div>
        </div>
        <button onClick={() => setShowMenu(true)} className="p-2 rounded-lg bg-[#FF6700] text-black shadow-[0_0_20px_rgba(255,103,0,0.4)] hover:scale-105 transition active:scale-95">
            <Menu size={20} strokeWidth={3} />
        </button>
      </header>

      <div className="mx-4 my-3">
        <label className="text-xs font-black text-[var(--text-sub)] uppercase ml-1 mb-1.5 block">Connect to Job</label>
        <button 
          onClick={() => setShowJobSelect(true)}
          className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-3 text-left font-bold uppercase outline-none hover:border-[#FF6700] transition flex justify-between items-center"
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
          <div className="flex-1 p-4 bg-white text-black m-3 rounded-lg shadow-2xl relative flex flex-col overflow-hidden">
              <div className="border-b border-gray-200 pb-4 mb-4 flex justify-between items-start shrink-0">
                  <div>
                      <h2 className="text-2xl font-oswald font-bold uppercase">ESTIMATE</h2>
                      <p className="text-xs font-bold text-gray-500 uppercase">{activeJob?.title}</p>
                  </div>
                  <div className="text-right">
                      <p className="text-xs font-bold text-gray-400">Valid Until</p>
                      <p className="font-mono font-bold text-sm">{validUntilDate.toLocaleDateString()}</p>
                  </div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-left text-sm">
                      <thead>
                          <tr className="border-b border-gray-300">
                              <th className="py-1 text-xs font-black uppercase text-gray-600">Description</th>
                              <th className="py-1 text-xs font-black uppercase text-gray-600 text-right">Qty</th>
                              <th className="py-1 text-xs font-black uppercase text-gray-600 text-right">Total</th>
                          </tr>
                      </thead>
                      <tbody className="font-mono text-xs">
                          {mode === "SIMPLE" ? (
                              <>
                                {parseFloat(simpleMaterials) > 0 && (
                                  <tr className="border-b border-gray-100">
                                    <td className="py-2 font-bold">Materials</td>
                                    <td className="py-2 text-right">1</td>
                                    <td className="py-2 text-right">${(parseFloat(simpleMaterials)).toFixed(2)}</td>
                                  </tr>
                                )}
                                {parseFloat(simpleHours) > 0 && (
                                  <tr className="border-b border-gray-100">
                                    <td className="py-2 font-bold">Labor</td>
                                    <td className="py-2 text-right">{parseFloat(simpleHours).toFixed(2)} hrs</td>
                                    <td className="py-2 text-right">${((parseFloat(simpleHours))*hourlyRate).toFixed(2)}</td>
                                  </tr>
                                )}
                              </>
                          ) : (
                              lineItems.filter(item => item.description && (parseFloat(item.quantity) > 0 || parseFloat(item.unit_cost) > 0)).map((item, i) => (
                                  <tr key={i} className="border-b border-gray-100">
                                      <td className="py-2 font-bold">{item.description}</td>
                                      <td className="py-2 text-right">{parseFloat(item.quantity).toFixed(2)}</td>
                                      <td className="py-2 text-right">${((parseFloat(item.unit_cost) || 0) * (parseFloat(item.quantity) || 0)).toFixed(2)}</td>
                                  </tr>
                              ))
                          )}
                          {showDiscount && parseFloat(discountAmount) > 0 && (
                            <tr className="border-b border-gray-100">
                              <td className="py-2 font-bold text-red-600">Discount</td>
                              <td></td>
                              <td className="py-2 text-right text-red-600">-${(discountType === "DOLLAR" ? parseFloat(discountAmount) : (subtotal * parseFloat(discountAmount) / 100)).toFixed(2)}</td>
                            </tr>
                          )}
                      </tbody>
                  </table>
              </div>

              <div className="bg-black text-white p-4 rounded-lg flex justify-between items-end mt-4 shrink-0">
                  <div>
                      <p className="text-xs font-black text-gray-300 uppercase">Amount Due</p>
                      <p className="text-xs text-gray-300 mt-1">{paymentTerms === "DUE_ON_RECEIPT" && "Due on receipt"}</p>
                  </div>
                  <p className="text-4xl font-oswald font-bold text-[#FF6700]">${total.toFixed(2)}</p>
              </div>

              <button onClick={() => setIsInvoiceMode(false)} className="absolute top-3 right-3 p-1 bg-gray-300 rounded-full hover:bg-gray-400 transition"><X size={16} className="text-black"/></button>
          </div>
      ) : (
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-4 overflow-y-auto pb-20">
        <div className="bg-[var(--bg-card)] rounded-lg p-4 border border-[var(--border-color)] space-y-4">
            
            <div className="flex gap-2">
              <button 
                onClick={() => handleModeChange("SIMPLE")}
                className={`flex-1 py-2 text-sm font-bold rounded transition ${mode === "SIMPLE" ? "bg-[#FF6700] text-black" : "bg-[var(--bg-surface)] border border-[#FF6700]"}`}
              >
                Simple
              </button>
              <button 
                onClick={() => handleModeChange("ADVANCED")}
                className={`flex-1 py-2 text-sm font-bold rounded transition ${mode === "ADVANCED" ? "bg-[#FF6700] text-black" : "bg-[var(--bg-surface)] border border-[#FF6700]"}`}
              >
                Advanced
              </button>
            </div>

            {mode === "SIMPLE" ? (
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-xs font-black text-[var(--text-sub)] uppercase"><Box size={10} className="inline mr-1"/>Materials</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-sub)] font-bold">$</span>
                            <input 
                              type="number" 
                              inputMode="decimal"
                              value={simpleMaterials} 
                              onChange={e => setSimpleMaterials(e.target.value)} 
                              placeholder="0"
                              className="w-full bg-[var(--input-bg)] border border-[#FF6700] rounded-lg p-3 pl-7 text-center font-mono font-bold outline-none focus:border-[#FF6700] transition text-[var(--input-text)] placeholder:text-[var(--text-sub)] placeholder:opacity-20" 
                              style={{ fontSize: '16px' }}
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-black text-[var(--text-sub)] uppercase"><Clock size={10} className="inline mr-1"/>Labor (Hrs)</label>
                        <input 
                          type="number" 
                          inputMode="decimal"
                          value={simpleHours} 
                          onChange={e => setSimpleHours(e.target.value)} 
                          placeholder="0"
                          className="w-full bg-[var(--input-bg)] border border-[#FF6700] rounded-lg p-3 text-center font-mono font-bold outline-none focus:border-[#FF6700] transition text-[var(--input-text)] placeholder:text-[var(--text-sub)] placeholder:opacity-20" 
                          style={{ fontSize: '16px' }}
                        />
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    {lineItems.map((item) => (
                        <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-5">
                                <input 
                                  placeholder="Item" 
                                  value={item.description} 
                                  onChange={(e) => updateLineItem(item.id, "description", e.target.value)} 
                                  className="w-full bg-[var(--input-bg)] border border-[#FF6700] rounded p-2 text-xs font-bold outline-none focus:border-[#FF6700] text-[var(--input-text)]" 
                                  style={{ fontSize: '16px' }}
                                />
                            </div>
                            <div className="col-span-2">
                                <input 
                                  placeholder="Qty" 
                                  type="number" 
                                  inputMode="decimal"
                                  value={item.quantity} 
                                  onChange={(e) => updateLineItem(item.id, "quantity", e.target.value)} 
                                  className="w-full bg-[var(--input-bg)] border border-[#FF6700] rounded p-2 text-xs text-center outline-none focus:border-[#FF6700] text-[var(--input-text)] placeholder:text-[var(--text-sub)] placeholder:opacity-20" 
                                  style={{ fontSize: '16px' }}
                                />
                            </div>
                            <div className="col-span-3">
                                <input 
                                  placeholder="$" 
                                  type="number" 
                                  inputMode="decimal"
                                  value={item.unit_cost} 
                                  onChange={(e) => updateLineItem(item.id, "unit_cost", e.target.value)} 
                                  className="w-full bg-[var(--input-bg)] border border-[#FF6700] rounded p-2 text-xs text-center outline-none focus:border-[#FF6700] text-[var(--input-text)] placeholder:text-[var(--text-sub)] placeholder:opacity-20" 
                                  style={{ fontSize: '16px' }}
                                />
                            </div>
                            <div className="col-span-2 text-center">
                                <button onClick={() => removeLineItem(item.id)} className="text-[var(--text-sub)] hover:text-red-500 transition"><Trash2 size={14}/></button>
                            </div>
                        </div>
                    ))}
                    <button onClick={addLineItem} className="w-full py-2 border border-dashed border-[#FF6700] text-[var(--text-sub)] rounded text-xs font-bold hover:text-[#FF6700] hover:bg-[var(--bg-surface)] transition uppercase">+ Add</button>
                    
                    {!showDiscount && (
                      <button onClick={() => setShowDiscount(true)} className="w-full py-2 border border-dashed border-red-500 text-[var(--text-sub)] rounded text-xs font-bold hover:text-red-500 hover:bg-red-500/5 transition uppercase">- Discount</button>
                    )}

                    {showDiscount && (
                      <div className="grid grid-cols-12 gap-2 items-center bg-red-500/5 border border-red-500/30 rounded p-2">
                        <div className="col-span-5">
                          <p className="text-xs font-bold text-red-500">Discount</p>
                        </div>
                        <div className="col-span-2 flex gap-1">
                          <button 
                            onClick={() => setDiscountType("DOLLAR")}
                            className={`flex-1 py-1 rounded text-[10px] font-bold transition ${discountType === "DOLLAR" ? "bg-red-500 text-black" : "bg-black/20 text-red-500 border border-red-500/30"}`}
                          >
                            $
                          </button>
                          <button 
                            onClick={() => setDiscountType("PERCENT")}
                            className={`flex-1 py-1 rounded text-[10px] font-bold transition ${discountType === "PERCENT" ? "bg-red-500 text-black" : "bg-black/20 text-red-500 border border-red-500/30"}`}
                          >
                            %
                          </button>
                        </div>
                        <div className="col-span-3">
                          <input 
                            placeholder="0" 
                            type="number" 
                            inputMode="decimal"
                            value={discountAmount} 
                            onChange={(e) => setDiscountAmount(e.target.value)} 
                            className="w-full bg-black/20 border border-red-500/30 rounded p-2 text-xs text-center outline-none focus:border-red-500 text-red-500 placeholder:text-red-500 placeholder:opacity-30" 
                            style={{ fontSize: '16px' }}
                          />
                        </div>
                        <div className="col-span-2 text-center">
                          <button onClick={() => { setShowDiscount(false); setDiscountAmount(""); }} className="text-[var(--text-sub)] hover:text-red-500 transition"><X size={14}/></button>
                        </div>
                      </div>
                    )}
                </div>
            )}

            <div className="bg-[var(--bg-surface)] rounded-lg p-6 border border-[var(--border-color)] text-center">
                <p className="text-xs text-[var(--text-sub)] uppercase tracking-wider font-black mb-1">Quoted Price</p>
                <p className="text-5xl font-oswald font-bold text-[var(--text-main)] tracking-tight">${price.toFixed(0)}</p>
            </div>

            <div className="flex gap-2">
                <button onClick={() => setIsInvoiceMode(true)} className="flex-1 py-3 bg-[var(--bg-surface)] border border-[#FF6700] text-[var(--text-main)] font-bold text-xs uppercase rounded-lg hover:bg-[var(--bg-card)] transition flex items-center justify-center gap-2">
                    <FileText size={16}/> Preview
                </button>
                <button onClick={handleSave} disabled={loading || !activeJob} className="flex-[2] py-3 bg-[#FF6700] text-black font-bold text-xs uppercase rounded-lg shadow-[0_0_20px_rgba(255,103,0,0.4)] hover:shadow-[0_0_30px_rgba(255,103,0,0.6)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? <Loader2 size={14} className="animate-spin"/> : <Save size={14} />} SAVE
                </button>
            </div>

        </div>
      </main>
      )}

      {/* JOB SELECT MODAL */}
      {showJobSelect && (
        <>
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={() => setShowJobSelect(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto z-[51] bg-[var(--bg-card)] border border-[#FF6700] rounded-lg shadow-2xl max-h-[75vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#FF6700] flex justify-between items-center">
              <h2 className="font-oswald text-lg font-bold text-[#FF6700]">SELECT JOB</h2>
              <button onClick={() => setShowJobSelect(false)}><X size={18}/></button>
            </div>
            
            <div className="p-3 border-b border-[#FF6700]">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-sub)]" size={14}/>
                <input 
                  placeholder="Search..." 
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[#FF6700] rounded pl-8 pr-2 py-2 text-xs text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <button 
                onClick={() => { setShowJobSelect(false); setShowCreateJob(true); }}
                className="w-full p-2 bg-[#FF6700] text-black font-bold rounded text-xs hover:bg-[#ff8533] transition flex items-center justify-center gap-2"
              >
                <Plus size={14}/> NEW JOB
              </button>
              
              {filteredJobs.map(job => (
                <button
                  key={job.id}
                  onClick={() => { setActiveJob(job); setShowJobSelect(false); }}
                  className={`w-full text-left p-2 rounded border text-xs transition font-bold ${activeJob?.id === job.id ? "bg-[#FF6700]/10 border-[#FF6700]" : "bg-[var(--bg-surface)] border-[#FF6700]"}`}
                >
                  <p>{job.title}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* CREATE JOB MODAL */}
      {showCreateJob && (
        <>
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={() => setShowCreateJob(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto z-[51] bg-[var(--bg-card)] border border-[#FF6700] rounded-lg shadow-2xl p-4">
            <h2 className="font-oswald text-lg font-bold text-[#FF6700] mb-3">CREATE JOB</h2>
            <input 
              autoFocus
              placeholder="Job title..." 
              value={newJobTitle}
              onChange={(e) => setNewJobTitle(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[#FF6700] rounded p-3 text-sm text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none mb-3"
              style={{ fontSize: '16px' }}
            />
            <button 
              onClick={handleCreateJob}
              disabled={loading}
              className="w-full py-3 bg-[#FF6700] text-black font-bold text-xs uppercase rounded hover:bg-[#ff8533] transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin inline mr-2" size={14}/> : ""} Create
            </button>
          </div>
        </>
      )}

      {/* CONTROL PANEL */}
      {showMenu && (
        <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm pointer-events-auto z-40" onClick={() => setShowMenu(false)} />
            <div className="w-80 max-w-[85vw] bg-[var(--bg-card)] border-l border-[#FF6700] h-full shadow-2xl p-4 flex flex-col overflow-y-auto z-50 pointer-events-auto relative">
                
                <div className="flex justify-between items-center mb-4 sticky top-0 bg-[var(--bg-card)] pb-2 z-10">
                    <h2 className="font-oswald text-base font-bold text-[#FF6700] uppercase">SETTINGS</h2>
                    <button onClick={() => setShowMenu(false)} className="p-1 hover:bg-[var(--bg-surface)] rounded"><X size={18}/></button>
                </div>

                {/* TABS */}
                <div className="grid grid-cols-3 gap-1 bg-[var(--bg-surface)] p-1 rounded mb-4 border border-[#FF6700]/30">
                  {["PROFIT", "CONFIG", "HISTORY"].map(tab => (
                    <button 
                      key={tab}
                      onClick={() => setMenuTab(tab)}
                      className={`py-2 rounded text-xs font-bold transition ${menuTab === tab ? "bg-[#FF6700] text-black" : "text-[var(--text-sub)] hover:text-[var(--text-main)]"}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* PROFIT TAB */}
                {menuTab === "PROFIT" && (
                  <div className="space-y-4">
                    <button 
                      onClick={() => setShowMethodMenu(!showMethodMenu)}
                      className="w-full p-3 bg-[var(--bg-surface)] border border-[#FF6700] text-[var(--text-main)] rounded text-xs font-bold text-left flex items-center justify-between hover:bg-[var(--input-bg)] transition"
                    >
                      <span>{profitMethod} - {targetValue}%</span>
                      <ChevronDown size={14} className={`transition ${showMethodMenu ? "rotate-180" : ""}`}/>
                    </button>

                    {showMethodMenu && (
                      <div className="bg-[var(--bg-surface)] border border-[#FF6700] rounded p-3 space-y-3">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-[var(--text-sub)] uppercase block">Method</label>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setProfitMethod("MARKUP")}
                              className={`flex-1 py-2 text-xs font-bold rounded transition ${profitMethod === "MARKUP" ? "bg-[#FF6700] text-black" : "bg-black/20 border border-[#FF6700]"}`}
                            >
                              Markup
                            </button>
                            <button 
                              onClick={() => setProfitMethod("MARGIN")}
                              className={`flex-1 py-2 text-xs font-bold rounded transition ${profitMethod === "MARGIN" ? "bg-[#FF6700] text-black" : "bg-black/20 border border-[#FF6700]"}`}
                            >
                              Margin
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-black text-[var(--text-sub)] uppercase block">Target %</label>
                          <input 
                            type="number" 
                            inputMode="decimal"
                            value={targetValue} 
                            onChange={e => setTargetValue(parseFloat(e.target.value) || 0)} 
                            className="w-full bg-[var(--input-bg)] border border-[#FF6700] rounded p-2 text-sm text-[var(--input-text)] font-bold outline-none focus:border-[#FF6700]" 
                            style={{ fontSize: '16px' }}
                          />
                          <p className="text-[10px] text-[var(--text-sub)] mt-2">
                            {profitMethod === "MARKUP" ? (
                              <>Markup: Cost × (1 + {targetValue}%) = Price</>
                            ) : (
                              <>Margin: Cost ÷ (1 - {targetValue}%) = Price</>
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className={`p-3 rounded bg-[var(--bg-surface)] border border-[#FF6700]`}>
                        <div className="flex justify-between items-center">
                            <p className="text-xs font-black text-[var(--text-sub)] uppercase">Profit {profitLocked && <Lock size={10} className="text-green-500 inline ml-1"/>}</p>
                            <button onClick={() => setShowProfitDetails(!showProfitDetails)} className="p-1 hover:bg-black/20 rounded">
                                {showProfitDetails ? <EyeOff size={14}/> : <Eye size={14}/>}
                            </button>
                        </div>
                        
                        {showProfitDetails ? (
                            <div className="mt-2">
                                <p className={`text-xl font-oswald font-bold ${profit > 0 ? "text-green-500" : "text-red-500"}`}>${profit.toFixed(2)}</p>
                                <p className="text-xs text-[var(--text-sub)] mt-1">Margin: {margin.toFixed(1)}%</p>
                                {isBelowTarget && profitLocked && <p className="text-xs text-green-500 font-bold mt-1">✓ ProfitLock protecting</p>}
                            </div>
                        ) : (
                            <p className="text-xl font-oswald font-bold text-[var(--text-sub)] opacity-30 mt-2">****</p>
                        )}
                    </div>

                    <button onClick={() => setProfitLocked(!profitLocked)} className={`w-full p-2 rounded border text-xs font-bold transition ${profitLocked ? "bg-green-900/20 border-green-500/50 text-green-500 hover:bg-green-900/30" : "bg-[var(--bg-surface)] border-[#FF6700] hover:border-[#FF6700]"}`}>
                        {profitLocked ? "🔒 ProfitLock ON" : "🔓 ProfitLock OFF"}
                    </button>
                  </div>
                )}

                {/* CONFIG TAB */}
                {menuTab === "CONFIG" && (
                  <div className="space-y-4">
                    <div>
                        <label className="text-xs font-black text-[var(--text-sub)] uppercase mb-1 block">Hourly Rate</label>
                        <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-sub)]">$</span>
                            <input 
                              type="number" 
                              inputMode="decimal"
                              value={hourlyRate} 
                              onChange={e => setHourlyRate(parseFloat(e.target.value) || 0)} 
                              className="w-full bg-[var(--input-bg)] border border-[#FF6700] rounded p-2 pl-6 text-xs text-[var(--input-text)] font-bold outline-none focus:border-[#FF6700]" 
                              style={{ fontSize: '16px' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-black text-[var(--text-sub)] uppercase mb-2 block">Discount Type</label>
                        <div className="flex gap-2">
                          <button onClick={() => setDiscountType("DOLLAR")} className={`flex-1 py-2 text-xs font-bold rounded transition ${discountType === "DOLLAR" ? "bg-[#FF6700] text-black" : "bg-[var(--bg-surface)] border border-[#FF6700]"}`}>Dollar ($)</button>
                          <button onClick={() => setDiscountType("PERCENT")} className={`flex-1 py-2 text-xs font-bold rounded transition ${discountType === "PERCENT" ? "bg-[#FF6700] text-black" : "bg-[var(--bg-surface)] border border-[#FF6700]"}`}>Percent (%)</button>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-black text-[var(--text-sub)] uppercase mb-2 block">Tax</label>
                        <div className="flex items-center justify-between p-2 bg-[var(--bg-surface)] border border-[#FF6700] rounded mb-2">
                          <span className="text-xs font-bold">Include</span>
                          <button 
                            onClick={() => setIncludeTax(!includeTax)}
                            className={`w-8 h-4 rounded-full transition-colors ${includeTax ? "bg-[#FF6700]" : "bg-gray-700"}`}
                          >
                            <div className={`w-3 h-3 rounded-full bg-black m-0.5 transition-transform ${includeTax ? "translate-x-4" : ""}`}></div>
                          </button>
                        </div>
                        {includeTax && (
                          <div>
                            <label className="text-xs font-black text-[var(--text-sub)] uppercase mb-1 block">Rate %</label>
                            <input 
                              type="number" 
                              inputMode="decimal"
                              value={taxRate} 
                              onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} 
                              className="w-full bg-[var(--input-bg)] border border-[#FF6700] rounded p-2 text-xs text-[var(--input-text)] font-bold outline-none focus:border-[#FF6700]" 
                              style={{ fontSize: '16px' }}
                            />
                          </div>
                        )}
                    </div>

                    <div>
                        <label className="text-xs font-black text-[var(--text-sub)] uppercase mb-1 block">Payment Terms</label>
                        <select 
                          value={paymentTerms}
                          onChange={(e) => setPaymentTerms(e.target.value)}
                          className="w-full bg-[var(--input-bg)] border border-[#FF6700] rounded p-2 text-xs text-[var(--input-text)] font-bold outline-none focus:border-[#FF6700]"
                          style={{ fontSize: '16px' }}
                        >
                          <option value="DUE_ON_RECEIPT">Due on Receipt</option>
                          <option value="NET_15">Net 15</option>
                          <option value="NET_30">Net 30</option>
                          <option value="DEPOSIT_50">50% Deposit</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-black text-[var(--text-sub)] uppercase mb-1 block">Quote Valid For</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            inputMode="numeric"
                            value={quoteValidDays} 
                            onChange={e => setQuoteValidDays(parseInt(e.target.value) || 30)} 
                            className="flex-1 bg-[var(--input-bg)] border border-[#FF6700] rounded p-2 text-xs text-[var(--input-text)] font-bold outline-none focus:border-[#FF6700]" 
                            style={{ fontSize: '16px' }}
                          />
                          <span className="text-xs text-[var(--text-sub)]">days</span>
                        </div>
                    </div>
                  </div>
                )}

                {/* HISTORY TAB */}
                {menuTab === "HISTORY" && (
                  <div className="space-y-2">
                    <p className="text-xs font-black text-[var(--text-sub)] uppercase mb-2">Recent ({estimateHistory.length})</p>
                    {estimateHistory.slice(0,8).map(est => (
                        <button 
                          key={est.id} 
                          onClick={() => { loadEstimate(est.id); }}
                          className="w-full text-left p-2 rounded bg-[var(--bg-surface)] border border-[#FF6700] hover:bg-[var(--input-bg)] transition text-xs"
                        >
                            <p className="font-bold text-[var(--text-main)]">{est.jobs?.title}</p>
                            <p className="text-[var(--text-sub)]">${est.total_price?.toFixed(0)}</p>
                        </button>
                    ))}
                    {estimateHistory.length === 0 && <p className="text-xs text-[var(--text-sub)] text-center py-4">No estimates yet</p>}
                  </div>
                )}

            </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-[var(--text-sub)] uppercase tracking-widest pointer-events-none">
        POWEREDBY<span className="text-[#FF6700]">FIELDDESKOPS</span>
      </div>

      {toast && (
          <div className={`fixed bottom-6 right-4 px-4 py-2 rounded-lg shadow-2xl text-white font-bold text-xs z-[60] flex items-center gap-2 border ${toast.type === "error" ? "bg-red-900/90 border-red-500" : "bg-green-900/90 border-green-500"}`}>
              {toast.type === "error" ? <AlertTriangle size={14}/> : <CheckCircle2 size={14}/>}
              {toast.msg}
          </div>
      )}

    </div>
  );
}
