"use client";

import { useEffect, useState } from "react";
import { X, FileText, Plus, Pin, PinOff, Trash2, Pencil, Eye, Check, Save, RotateCcw, Loader2, Share, Send } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";

function SiteSnapImage({ photo, onSelect, selected, supabase }) {
  const [imageUrl, setImageUrl] = useState("/placeholder.png");

  useEffect(() => {
    async function fetchImage() {
      if (!photo?.storage_path) return;

      // CORRECT BUCKET NAME: 'fielddeskops-photos'
      // We use createSignedUrl so it works even if the bucket is Private.
      const { data } = await supabase.storage
        .from("fielddeskops-photos")
        .createSignedUrl(photo.storage_path, 3600);

      if (data?.signedUrl) setImageUrl(data.signedUrl);
    }
    fetchImage();
  }, [photo, supabase]);

  return (
    <div
      onClick={() => onSelect(imageUrl)}
      className={`relative aspect-square cursor-pointer rounded-lg border-2 overflow-hidden ${
        selected ? "border-orange-500" : "border-transparent"
      }`}
    >
      <img src={imageUrl} alt="SiteSnap" className="w-full h-full object-cover" />
    </div>
  );
}

export default function SignOffModals({ modal }) {
  const {
    showMenu, setShowMenu, menuTab, setMenuTab, jobLinkedData, linkedEstimate, smartVariables, baseVarKeys,
    clientName, contractorName, editingVar, setEditingVar, editingVarValue, setEditingVarValue, setSmartVariables,
    setShowAddVarModal, templates, togglePin, setContractBody, vibrate, setShowTemplateBuilder, contracts,
    restoreContract, showTemplateBuilder, newTemplateName, setNewTemplateName,
    newTemplateBody, setNewTemplateBody, newTemplateCategory, setNewTemplateCategory, insertVariable,
    removeVariableFromTemplate, saveTemplate, toast, showDocPreview, setShowDocPreview, signedAt, savedSignature,
    getDisplayedContractBody, attachedPhotos, getPhotoDisplayUrl, docReadOnly, sigPad, handleSignatureEnd,
    clearSignature, saveContract, saving, contractBody, hasSigned, setClientName, setContractorName,
    setAttachedPhotos, setSignedAt, setSavedSignature, setHasSigned, setDocReadOnly, selectedJob,
    showNewJobModal, setShowNewJobModal, newJobTitle, setNewJobTitle, newJobCustomer, setNewJobCustomer,
    showToast, supabase, setRecentJobs, setSelectedJob, showAddVarModal, newVarName,
    setNewVarName, newVarValue, setNewVarValue, showSiteSnapModal, setShowSiteSnapModal, siteSnapPhotos,
    selectedSiteSnap, setSelectedSiteSnap, showPhotoViewer,
    activePhoto, setShowPhotoViewer, setActivePhoto, handleSiteSnapImport, deleteContract, editDraft,
    editTemplate, deleteTemplate, setEditingTemplateId, onGenerateShareLink, onShareSigned,
  } = modal;

  const [historySearch, setHistorySearch] = useState("");

  const filteredContracts = selectedJob
    ? contracts.filter((c) => c.job_id === selectedJob.id)
    : contracts;

  const searchedContracts = filteredContracts
    .filter((c) => {
      if (!historySearch) return true;
      const search = historySearch.toLowerCase();
      return (
        c.job_name?.toLowerCase().includes(search) ||
        c.client_name?.toLowerCase().includes(search) ||
        new Date(c.created_at).toLocaleDateString().includes(search)
      );
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <>
      {showMenu && (
        <>
          <div className="fixed inset-0 bg-black/90 z-50" onClick={() => setShowMenu(false)} style={{ overflow: "hidden" }} />
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 pointer-events-none" style={{ overflow: "hidden" }}>
            <div className="bg-[var(--bg-card)] w-full sm:max-w-3xl sm:rounded-2xl rounded-t-3xl h-[600px] overflow-hidden flex flex-col border-2 border-[#FF6700] pointer-events-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#FF6700]/30">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-[#FF6700]">Menu</h2>
                  <button onClick={() => setShowMenu(false)} className="p-2 hover:bg-[#FF6700]/10 rounded-lg text-[#FF6700]"><X size={24} /></button>
                </div>
                <div className="flex gap-2">
                  {["DATA", "TEMPLATES", "HISTORY"].map((tab) => (
                    <button key={tab} onClick={() => setMenuTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${menuTab === tab ? "bg-[#FF6700] text-black shadow-[0_0_10px_rgba(255,103,0,0.4)]" : "bg-[#FF6700]/10 text-[#FF6700] hover:bg-[#FF6700]/20"}`}>{tab}</button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {menuTab === "DATA" && (
                  <div className="space-y-4">
                    {jobLinkedData ? (
                      <>
                        {linkedEstimate && (
                          <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/10">
                            <div className="flex items-center justify-between">
                              <div><p className="text-sm font-bold text-blue-400">ProfitLock Estimate</p><p className="text-xs text-gray-400">{linkedEstimate.service_name}</p></div>
                              <p className="text-2xl font-bold text-[#FF6700]">${linkedEstimate.total_price?.toFixed(2)}</p>
                            </div>
                          </div>
                        )}
                        <div className="space-y-2">
                          <p className="text-sm font-bold text-gray-400">Smart Variables</p>
                          <div className="grid grid-cols-2 gap-2">
                            {/* Customer and Contractor - Always editable */}
                            <div className="p-3 rounded-lg bg-[#FF6700]/10 border border-[#FF6700]/30">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-mono text-[#FF6700]">[CUSTOMER]</p>
                                {editingVar === "[CUSTOMER]" ? (
                                  <div className="flex gap-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setClientName(editingVarValue || "");
                                        setEditingVar(null);
                                      }}
                                      className="px-2 py-1 bg-[#FF6700] text-black rounded text-xs font-bold"
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingVar(null)}
                                      className="px-2 py-1 bg-gray-700 text-white rounded text-xs"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingVar("[CUSTOMER]");
                                      setEditingVarValue(clientName || "");
                                    }}
                                    className="text-gray-300 hover:text-white p-1 rounded"
                                  >
                                    <Pencil size={12} />
                                  </button>
                                )}
                              </div>
                              {editingVar === "[CUSTOMER]" ? (
                                <input
                                  value={editingVarValue}
                                  onChange={(e) => setEditingVarValue(e.target.value)}
                                  className="w-full mt-2 px-2 py-1 text-sm rounded bg-black/40 border border-[#FF6700]/40 text-white outline-none"
                                  style={{ fontSize: "16px" }}
                                />
                              ) : (
                                <p className="text-xs text-gray-400 mt-1">{clientName || "Not set"}</p>
                              )}
                            </div>

                            <div className="p-3 rounded-lg bg-[#FF6700]/10 border border-[#FF6700]/30">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-mono text-[#FF6700]">[CONTRACTOR]</p>
                                {editingVar === "[CONTRACTOR]" ? (
                                  <div className="flex gap-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setContractorName(editingVarValue || "");
                                        setEditingVar(null);
                                      }}
                                      className="px-2 py-1 bg-[#FF6700] text-black rounded text-xs font-bold"
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingVar(null)}
                                      className="px-2 py-1 bg-gray-700 text-white rounded text-xs"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingVar("[CONTRACTOR]");
                                      setEditingVarValue(contractorName || "");
                                    }}
                                    className="text-gray-300 hover:text-white p-1 rounded"
                                  >
                                    <Pencil size={12} />
                                  </button>
                                )}
                              </div>
                              {editingVar === "[CONTRACTOR]" ? (
                                <input
                                  value={editingVarValue}
                                  onChange={(e) => setEditingVarValue(e.target.value)}
                                  className="w-full mt-2 px-2 py-1 text-sm rounded bg-black/40 border border-[#FF6700]/40 text-white outline-none"
                                  style={{ fontSize: "16px" }}
                                />
                              ) : (
                                <p className="text-xs text-gray-400 mt-1">{contractorName || "Not set"}</p>
                              )}
                            </div>

                            {Object.keys(smartVariables).map((varName) => (
                              <div key={varName} className="p-3 rounded-lg bg-[#FF6700]/10 border border-[#FF6700]/30">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-mono text-[#FF6700]">{varName}</p>
                                  {editingVar === varName ? (
                                    <div className="flex gap-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSmartVariables((prev) => ({ ...prev, [varName]: editingVarValue }));
                                          setEditingVar(null);
                                        }}
                                        className="px-2 py-1 bg-[#FF6700] text-black rounded text-xs"
                                      >
                                        Save
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingVar(null)}
                                        className="px-2 py-1 bg-gray-700 text-white rounded text-xs"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingVar(varName);
                                        setEditingVarValue(smartVariables[varName]);
                                      }}
                                    >
                                      <Pencil size={12} />
                                    </button>
                                  )}
                                </div>
                                {editingVar === varName ? (
                                  <input
                                    value={editingVarValue}
                                    onChange={(e) => setEditingVarValue(e.target.value)}
                                    className="w-full mt-2 px-2 py-1 text-sm rounded bg-black/40 border border-[#FF6700]/40 text-white"
                                  />
                                ) : (
                                  <p className="text-xs text-gray-400 mt-1">{smartVariables[varName]}</p>
                                )}
                              </div>
                            ))}
                          </div>
                          <button type="button" onClick={() => setShowAddVarModal(true)} className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#FF6700]/40 text-xs text-[#FF6700] hover:bg-[#FF6700]/10"><Plus size={12} /> Add Custom Variable</button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12"><FileText size={48} className="mx-auto text-gray-600 mb-4" /><p className="text-gray-400">No job selected</p><p className="text-sm text-gray-500 mt-2">Select a job to link contract data</p></div>
                    )}
                  </div>
                )}
                {menuTab === "TEMPLATES" && (
                  <div className="space-y-4">
                    <button onClick={() => setShowTemplateBuilder(true)} className="w-full p-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all" style={{ background: "#FF6700", color: "#000", boxShadow: "0 0 20px rgba(255,103,0,0.4)" }}><Plus size={20} /> Create Template</button>
                    {templates.map((template) => (
                      <div key={template.id} className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2"><h3 className="font-bold text-white">{template.label}</h3>{template.is_pinned && <Pin size={14} className="text-[#FF6700]" />}</div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => togglePin(template)} className="p-2 hover:bg-[var(--bg-main)] rounded-lg">{template.is_pinned ? <PinOff size={16} className="text-gray-400" /> : <Pin size={16} className="text-gray-400" />}</button>
                            <button type="button" onClick={() => editTemplate(template)} className="p-2 hover:bg-[var(--bg-main)] rounded-lg"><Pencil size={16} className="text-gray-400" /></button>
                            <button type="button" onClick={() => deleteTemplate(template.id)} className="p-2 hover:bg-[var(--bg-main)] rounded-lg"><Trash2 size={16} className="text-red-400" /></button>
                            <button type="button" onClick={() => { const bodyText = template.body; setTimeout(() => setContractBody(bodyText), 0); setShowMenu(false); vibrate(10); }} className="px-3 py-1 bg-[#FF6700] text-black rounded-lg text-xs font-bold">Use</button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-400 line-clamp-2">{template.body}</p>
                      </div>
                    ))}
                  </div>
                )}
                {menuTab === "HISTORY" && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Search contracts..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="w-full p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]"
                    />
                    <p className="text-sm text-gray-400 mb-2">
                      {selectedJob
                        ? `Showing ${searchedContracts.length} contracts for ${selectedJob.title}`
                        : `Showing all ${searchedContracts.length} contracts`}
                    </p>
                    {searchedContracts.length === 0 ? (
                      <div className="text-center py-12"><FileText size={48} className="mx-auto text-gray-600 mb-4" /><p className="text-gray-400">No contracts yet</p></div>
                    ) : (
                      searchedContracts.map((contract) => (
                        <div key={contract.id} className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[#FF6700] transition-colors cursor-pointer" onClick={() => restoreContract(contract)}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {contract.signed_at ? (
                                <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                                  SIGNED
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-bold rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                  DRAFT
                                </span>
                              )}
                              <span className="text-xs text-gray-500">
                                {new Date(contract.created_at).toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {!contract.signed_at ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    editDraft(contract);
                                  }}
                                  className="inline-flex items-center gap-1 text-xs text-blue-300 hover:text-blue-200"
                                >
                                  <Pencil size={16} /> Edit
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    restoreContract(contract);
                                  }}
                                  className="inline-flex items-center gap-1 text-xs text-blue-300 hover:text-blue-200"
                                >
                                  <Eye size={16} /> View
                                </button>
                              )}
                              {!contract.signed_at ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onGenerateShareLink(contract.id);
                                  }}
                                  className="px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center gap-2"
                                  title="Send for remote signature"
                                >
                                  <Send size={14} />
                                  <span className="text-xs font-semibold">Send for Signature</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onShareSigned(contract);
                                  }}
                                  className="px-3 py-2 rounded-lg bg-gray-500/10 border border-gray-500/30 text-gray-400 hover:bg-gray-500/20 transition-colors flex items-center gap-2"
                                  title="Share signed contract"
                                >
                                  <Share size={14} />
                                  <span className="text-xs font-semibold">Share</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteContract(contract.id);
                                }}
                              >
                                <Trash2 size={16} className="text-red-400" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex-1"><h3 className="font-bold text-white">{contract.job_name}</h3><p className="text-sm text-gray-400">{contract.client_name}</p><p className="text-xs text-gray-500 mt-1">{new Date(contract.created_at).toLocaleDateString()}</p></div>
                            <Eye size={20} className="text-[#FF6700] flex-shrink-0 ml-2" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {showTemplateBuilder && (
        <>
          <div className="fixed inset-0 bg-black/90 z-50" onClick={() => { setShowTemplateBuilder(false); setNewTemplateName(""); setNewTemplateBody(""); setEditingTemplateId(null); }} style={{ overflow: "hidden" }} />
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 pointer-events-none" style={{ overflow: "hidden" }}>
            <div className="bg-[var(--bg-card)] w-full sm:max-w-2xl sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col border-2 border-[#FF6700] pointer-events-auto relative z-[51]" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#FF6700]/30">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-[#FF6700]">Create Template</h2>
                  <button onClick={() => { setShowTemplateBuilder(false); setNewTemplateName(""); setNewTemplateBody(""); setEditingTemplateId(null); }} className="p-2 hover:bg-[#FF6700]/10 rounded-lg text-[#FF6700]"><X size={24} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Template Name</label>
                  <input type="text" value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} placeholder="e.g., Custom Warranty" className="w-full p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] outline-none text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Category</label>
                  <select value={newTemplateCategory} onChange={(e) => setNewTemplateCategory(e.target.value)} className="w-full p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] outline-none text-white">
                    <option value="CUSTOM">Custom</option><option value="AUTHORIZATION">Authorization</option><option value="LEGAL">Legal</option><option value="PAYMENT">Payment</option><option value="COMPLETION">Completion</option><option value="CHANGE">Change Order</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Smart Variables (Click to Add/Remove)</label>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => { const isInBody = newTemplateBody.includes("[CUSTOMER]"); isInBody ? removeVariableFromTemplate("[CUSTOMER]") : insertVariable("[CUSTOMER]"); }} className={`px-3 py-2 rounded-lg text-xs font-mono transition-all ${newTemplateBody.includes("[CUSTOMER]") ? "bg-[#FF6700] text-black border-2 border-[#FF6700]" : "bg-[#FF6700]/10 text-[#FF6700] border border-[#FF6700]/30"}`}>{newTemplateBody.includes("[CUSTOMER]") && <Check size={12} className="inline mr-1" />}[CUSTOMER]</button>
                    <button onClick={() => { const isInBody = newTemplateBody.includes("[CONTRACTOR]"); isInBody ? removeVariableFromTemplate("[CONTRACTOR]") : insertVariable("[CONTRACTOR]"); }} className={`px-3 py-2 rounded-lg text-xs font-mono transition-all ${newTemplateBody.includes("[CONTRACTOR]") ? "bg-[#FF6700] text-black border-2 border-[#FF6700]" : "bg-[#FF6700]/10 text-[#FF6700] border border-[#FF6700]/30"}`}>{newTemplateBody.includes("[CONTRACTOR]") && <Check size={12} className="inline mr-1" />}[CONTRACTOR]</button>
                    {Object.keys(smartVariables).map((varName) => {
                      const isInBody = newTemplateBody.includes(varName);
                      return (
                        <button key={varName} onClick={() => isInBody ? removeVariableFromTemplate(varName) : insertVariable(varName)} className={`px-3 py-2 rounded-lg text-xs font-mono transition-all ${isInBody ? "bg-[#FF6700] text-black border-2 border-[#FF6700]" : "bg-[#FF6700]/10 text-[#FF6700] border border-[#FF6700]/30"}`}>{isInBody && <Check size={12} className="inline mr-1" />}{varName}</button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Template Text</label>
                  <textarea value={newTemplateBody} onChange={(e) => setNewTemplateBody(e.target.value)} placeholder="Enter your contract template..." rows={10} className="w-full p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] outline-none resize-none text-white" />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("SAVE CLICKED");
                    saveTemplate(e);
                  }}
                  className="w-full p-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all relative z-10 pointer-events-auto cursor-pointer"
                  style={{ background: "#FF6700", color: "#000", boxShadow: "0 0 20px rgba(255,103,0,0.4)" }}
                >
                  <Save size={20} /> Save Template
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {toast && (
        <div className={`fixed bottom-24 right-6 px-6 py-3 rounded-xl font-black shadow-lg ${toast.type === "error" ? "bg-red-500 text-white" : "bg-[#FF6700] text-black"}`}>{toast.msg}</div>
      )}

      {showDocPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white text-black shadow-2xl rounded-xl p-8">
            <button type="button" onClick={() => setShowDocPreview(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"><X size={20} /></button>
            {signedAt && (
              <div className="pointer-events-none select-none absolute inset-0 flex items-center justify-center">
                <span className="text-6xl font-black text-[#FF6700]/20" style={{ transform: "rotate(-45deg)" }}>SIGNED</span>
              </div>
            )}
            <div className="relative">
              <div className="mb-6 pb-3 border-b-4 border-[#FF6700] flex items-start justify-between">
                <div><h2 className="text-2xl font-bold tracking-wide">FieldDeskOps Contract</h2><p className="text-xs text-gray-500 mt-1">Generated on-site with FieldDeskOps SignOff</p></div>
                <div className="text-right text-xs text-gray-600"><p>{new Date().toLocaleDateString()}</p></div>
              </div>
              <h1 className="text-xl font-semibold mb-4">{selectedJob?.title || "Contract Agreement"}</h1>
              <div className="mb-4 text-sm">
                <p className="font-semibold">CUSTOMER: <span className="font-normal">{clientName || "________________"}</span></p>
                <p className="font-semibold mt-1">CONTRACTOR: <span className="font-normal">{contractorName || "________________"}</span></p>
              </div>
              <div className="mt-4 text-sm leading-relaxed whitespace-pre-wrap">{getDisplayedContractBody()}</div>
              {attachedPhotos.length > 0 && (
                <div className="mt-8">
                  <p className="text-sm font-semibold mb-3">Attached Photos</p>
                  <div className="grid grid-cols-2 gap-3">
                    {attachedPhotos.map((photo) => (
                      <div key={photo.id} className="w-full h-32 border border-gray-200 rounded-md overflow-hidden">
                        <img src={getPhotoDisplayUrl(photo)} alt="Contract photo" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-10 pt-6 border-t border-gray-200">
                <p className="text-sm font-semibold mb-3">Client Signature</p>
                {!signedAt && !docReadOnly ? (
                  <>
                    <div className="border border-gray-300 rounded-md overflow-hidden bg-white">
                      <SignatureCanvas ref={sigPad} onEnd={handleSignatureEnd} canvasProps={{ className: "w-full h-32", style: { touchAction: "none" } }} penColor="#000000" backgroundColor="#ffffff" />
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <button type="button" onClick={clearSignature} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"><RotateCcw size={14} /> Clear</button>
                      <button type="button" onClick={saveContract} disabled={saving || !contractBody.trim() || !clientName.trim() || !hasSigned} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF6700] text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(255,103,0,0.4)] transition-shadow">
                        {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Sign &amp; Save</>}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {signedAt && savedSignature ? (
                      <div className="w-full h-32 border border-gray-300 rounded-md bg-white p-2"><img src={savedSignature} alt="Signature" className="h-full object-contain" /></div>
                    ) : (
                      <div className="w-full h-32 border border-gray-300 rounded-md bg-white flex items-center justify-center text-gray-400 text-xs">Signed contract on file.</div>
                    )}
                    {signedAt && <p className="mt-3 text-xs text-gray-600">Signed: {new Date(signedAt).toLocaleString()}</p>}
                    <button type="button" onClick={() => { setShowDocPreview(false); setContractBody(""); setClientName(""); setContractorName(""); setAttachedPhotos([]); setSignedAt(null); setSavedSignature(null); setSavedSignature(null); setHasSigned(false); setDocReadOnly(false); }} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-white font-semibold hover:bg-gray-700 transition-colors">Close</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showNewJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div className="w-full max-w-md bg-[var(--bg-card)] border border-[#FF6700]/40 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#FF6700] uppercase tracking-wide">Create Job</h3>
              <button type="button" onClick={() => { setShowNewJobModal(false); setNewJobTitle(""); setNewJobCustomer(""); }} className="text-[var(--text-sub)] hover:text-[var(--text-main)]"><X size={18} /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="space-y-1"><label className="text-xs text-[var(--text-sub)] uppercase font-bold">Job Title</label><input type="text" value={newJobTitle} onChange={(e) => setNewJobTitle(e.target.value)} placeholder="e.g. Roof Replacement - Smith Residence" className="w-full px-3 py-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] outline-none" /></div>
              <div className="space-y-1"><label className="text-xs text-[var(--text-sub)] uppercase font-bold">Customer Name</label><input type="text" value={newJobCustomer} onChange={(e) => setNewJobCustomer(e.target.value)} placeholder="e.g. John Smith" className="w-full px-3 py-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] outline-none" /></div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setShowNewJobModal(false); setNewJobTitle(""); setNewJobCustomer(""); }} className="px-3 py-2 rounded-lg text-xs bg-gray-800 text-white hover:bg-gray-700">Cancel</button>
                <button type="button" onClick={async () => {
                  const title = newJobTitle.trim();
                  if (!title) { showToast("Job title is required", "error"); return; }
                  try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) { showToast("You must be logged in", "error"); return; }
                    const { data, error } = await supabase.from("jobs").insert({ user_id: user.id, title, customer_name: newJobCustomer.trim() || null, status: "ACTIVE" }).select().single();
                    if (error) { console.error("Create job error:", error); showToast(`Failed to create job: ${error.message}`, "error"); return; }
                    setRecentJobs((prev) => [data, ...prev]); setSelectedJob(data); showToast("Job created", "success"); setShowNewJobModal(false); setNewJobTitle(""); setNewJobCustomer("");
                  } catch (err) { console.error("Create job unexpected error:", err); showToast("Failed to create job", "error"); }
                }} className="px-3 py-2 rounded-lg text-xs bg-[#FF6700] text-black font-bold hover:shadow-[0_0_10px_rgba(255,103,0,0.4)]">Create</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddVarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div className="w-full max-w-sm bg-[var(--bg-card)] border border-[#FF6700]/40 rounded-2xl p-5 shadow-2xl relative">
            <button type="button" className="absolute top-3 right-3 text-[var(--text-sub)] hover:text-[var(--text-main)]" onClick={() => { setShowAddVarModal(false); setNewVarName(""); setNewVarValue(""); }}><X size={16} /></button>
            <h3 className="text-sm font-bold text-[#FF6700] mb-3 uppercase tracking-wide">Add Custom Variable</h3>
            <div className="space-y-3 text-sm">
              <div className="space-y-1"><label className="text-xs text-[var(--text-sub)] uppercase font-bold">Variable Name</label><input type="text" value={newVarName} onChange={(e) => setNewVarName(e.target.value)} placeholder="e.g. DEPOSIT_AMOUNT" className="w-full px-3 py-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] outline-none" /><p className="text-[10px] text-[var(--text-sub)]">Brackets will be added automatically, e.g. [DEPOSIT_AMOUNT]</p></div>
              <div className="space-y-1"><label className="text-xs text-[var(--text-sub)] uppercase font-bold">Value</label><input type="text" value={newVarValue} onChange={(e) => setNewVarValue(e.target.value)} placeholder="$500 deposit" className="w-full px-3 py-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] outline-none" /></div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setShowAddVarModal(false); setNewVarName(""); setNewVarValue(""); }} className="px-3 py-2 rounded-lg text-xs bg-gray-800 text-white hover:bg-gray-700">Cancel</button>
                <button type="button" onClick={() => {
                  const raw = newVarName.trim().toUpperCase().replace(/\s+/g, "_");
                  if (!raw) { showToast("Variable name required", "error"); return; }
                  const key = raw.startsWith("[") && raw.endsWith("]") ? raw : `[${raw}]`;
                  setSmartVariables((prev) => ({ ...prev, [key]: newVarValue }));
                  setShowAddVarModal(false); setNewVarName(""); setNewVarValue("");
                }} className="px-3 py-2 rounded-lg text-xs bg-[#FF6700] text-black font-bold hover:shadow-[0_0_10px_rgba(255,103,0,0.4)]">Save Variable</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSiteSnapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div className="w-full max-w-3xl max-h-[90vh] bg-[var(--bg-card)] border border-[#FF6700]/40 rounded-2xl p-5 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#FF6700] uppercase tracking-wide">Import from SiteSnap</h3>
              <button type="button" className="text-[var(--text-sub)] hover:text-[var(--text-main)]" onClick={() => setShowSiteSnapModal(false)}><X size={18} /></button>
            </div>
            {(!siteSnapPhotos || siteSnapPhotos.length === 0) ? (
              <div className="flex-1 flex items-center justify-center text-sm text-[var(--text-sub)]">No SiteSnap photos found for this job.</div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3 pb-3">
                  {siteSnapPhotos.map((photo) => {
                    const checked = selectedSiteSnap.has(photo.id);
                    return (
                      <div key={photo.id} className="relative">
                        <SiteSnapImage
                          photo={photo}
                          selected={checked}
                          supabase={supabase}
                          onSelect={(imageUrl) => {
                            setSelectedSiteSnap((prev) => {
                              const next = new Map(prev);
                              if (next.has(photo.id)) next.delete(photo.id);
                              else next.set(photo.id, imageUrl);
                              return next;
                            });
                          }}
                        />
                        <div className="absolute top-1 left-1 bg-black/60 rounded-full w-5 h-5 flex items-center justify-center border border-white/40">
                          <input type="checkbox" readOnly checked={checked} className="accent-[#FF6700]" />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-3 flex justify-between items-center text-xs">
                  <p className="text-[var(--text-sub)]">Selected: {selectedSiteSnap.size}</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowSiteSnapModal(false)} className="px-3 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700">Cancel</button>
                    <button type="button" disabled={selectedSiteSnap.size === 0} onClick={() => modal.handleSiteSnapImport()} className="px-3 py-2 rounded-lg bg-[#FF6700] text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed">Add Selected ({selectedSiteSnap.size})</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showPhotoViewer && activePhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4">
          <button type="button" className="absolute top-4 right-4 text-white hover:text-gray-300" onClick={() => { setShowPhotoViewer(false); setActivePhoto(null); }}><X size={24} /></button>
          <div className="max-w-3xl max-h-[90vh]">
            <img src={getPhotoDisplayUrl(activePhoto)} alt="Preview" className="w-full h-full object-contain rounded-lg" />
          </div>
        </div>
      )}
    </>
  );
}
