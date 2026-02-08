"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Edit2, Check, Phone, Mail, MapPin, FileText, DollarSign } from "lucide-react";
import { createClient } from "../../utils/supabase/client";
import { logError } from "../../../../utils/logger";
import FormField from "../../shared/FormField";
import { buildFieldErrors, isEmail, isPhone, isRequired } from "../../../utils/validation";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);

export default function CustomerDetailModal({
  customer,
  isOpen,
  onClose,
  onUpdate,
  onSelectJob,
}) {
  const supabase = createClient();
  const [localCustomer, setLocalCustomer] = useState(customer || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFields, setEditFields] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });
  const [jobs, setJobs] = useState([]);
  const [estimatesByJob, setEstimatesByJob] = useState({});
  const [totalBilled, setTotalBilled] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loadingFinancials, setLoadingFinancials] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [accessError, setAccessError] = useState("");

  useEffect(() => {
    if (!isOpen) return undefined;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = previousOverflow || "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setLocalCustomer(customer || null);
    setIsEditing(false);
    setFieldErrors({});
  }, [customer, isOpen]);

  useEffect(() => {
    if (!localCustomer) return;
    setEditFields({
      name: localCustomer.name || "",
      phone: localCustomer.phone || "",
      email: localCustomer.email || "",
      address: localCustomer.address || "",
      notes: localCustomer.notes || "",
    });
    setFieldErrors({});
  }, [localCustomer]);

  useEffect(() => {
    let cancelled = false;
    const loadFinancials = async () => {
      if (!isOpen || !customer?.id) return;
      setLoadingFinancials(true);
      try {
        const { data: jobRows, error: jobsError } = await supabase
          .from("jobs")
          .select("id,title,status,created_at")
          .eq("customer_id", customer.id)
          .order("created_at", { ascending: false });

        if (jobsError) throw jobsError;
        const safeJobs = jobRows || [];
        if (cancelled) return;
        setJobs(safeJobs);

        const jobIds = safeJobs.map((job) => job.id).filter(Boolean);
        if (jobIds.length === 0) {
          setEstimatesByJob({});
          setTotalBilled(0);
          setTotalPaid(0);
          return;
        }

        const { data: estimateRows, error: estimatesError } = await supabase
          .from("estimates")
          .select("job_id,total_price")
          .in("job_id", jobIds);

        if (estimatesError) {
          logError("Customer detail estimates query failed", estimatesError);
        }

        const estimateMap = {};
        let billed = 0;
        (estimateRows || []).forEach((row) => {
          const amount = Number(row.total_price) || 0;
          estimateMap[row.job_id] = (estimateMap[row.job_id] || 0) + amount;
          billed += amount;
        });

        let paidTotal = 0;
        if (jobIds.length > 0) {
          const { data: paymentRows, error: paymentsError } = await supabase
            .from("payments")
            .select("job_id,amount")
            .in("job_id", jobIds);

          if (paymentsError) {
            logError("Customer detail payments query failed", paymentsError);
          } else {
            paidTotal = (paymentRows || []).reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
          }
        }

        if (!cancelled) {
          setEstimatesByJob(estimateMap);
          setTotalBilled(billed);
          setTotalPaid(paidTotal);
        }
      } catch (err) {
        if (!cancelled) {
          logError("Customer detail load failed", err);
        }
      } finally {
        if (!cancelled) {
          setLoadingFinancials(false);
        }
      }
    };

    loadFinancials();
    return () => {
      cancelled = true;
    };
  }, [customer?.id, isOpen, supabase]);

  const outstandingBalance = useMemo(() => totalBilled - totalPaid, [totalBilled, totalPaid]);

  const validateEditFields = (values) =>
    buildFieldErrors({
      name: [
        { isValid: isRequired(values.name), message: "Name is required." },
      ],
      email: values.email
        ? [{ isValid: isEmail(values.email), message: "Enter a valid email." }]
        : [],
      phone: values.phone
        ? [{ isValid: isPhone(values.phone), message: "Enter a valid phone number." }]
        : [],
    });

  const handleSave = async () => {
    const trimmedName = editFields.name.trim();
    const errors = validateEditFields({ ...editFields, name: trimmedName });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0 || !localCustomer?.id) return;
    const { getWriteAccessStatus } = await import('@/lib/subscription/subscriptionHelpers');
    const access = await getWriteAccessStatus();
    if (!access.allowed) {
      setAccessError(access.reason || "Account locked. Renew to edit.");
      return;
    }

    const payload = {
      name: trimmedName,
      phone: editFields.phone.trim() || null,
      email: editFields.email.trim() || null,
      address: editFields.address.trim() || null,
      notes: editFields.notes.trim() || null,
    };

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      logError("Customer detail user fetch failed", userError);
      return;
    }

    let query = supabase.from("customers").update(payload).eq("id", localCustomer.id);
    if (userData?.user?.id) {
      query = query.eq("user_id", userData.user.id);
    }

    const { data, error } = await query.select().single();
    if (error) {
      logError("Customer detail update failed", error);
      return;
    }

    setLocalCustomer(data);
    setIsEditing(false);
    setFieldErrors({});
    if (onUpdate) await onUpdate();
  };

  const handleToggleEdit = async () => {
    const { getWriteAccessStatus } = await import('@/lib/subscription/subscriptionHelpers');
    const access = await getWriteAccessStatus();
    if (!access.allowed) {
      setAccessError(access.reason || "Account locked. Renew to edit.");
      return;
    }
    setIsEditing((prev) => !prev);
  };

  if (!isOpen || !localCustomer) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--text-sub)]">Customer</p>
            <h2 className="text-2xl font-bold text-[var(--text-main)]">{localCustomer.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleEdit}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--text-sub)] transition"
              aria-label="Edit customer"
            >
              <Edit2 size={18} />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg text-[var(--text-sub)] hover:bg-white/10 transition">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {accessError && (
            <p className="text-xs text-red-400">{accessError}</p>
          )}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-sub)]">Contact Info</h3>
            <div className="space-y-3">
              {isEditing ? (
                <div className="grid gap-2">
                  <FormField id="customer-name" label="Name" required error={fieldErrors.name}>
                    <input
                      id="customer-name"
                      value={editFields.name}
                      onChange={(e) => setEditFields({ ...editFields, name: e.target.value })}
                      onBlur={() => setFieldErrors(validateEditFields(editFields))}
                      className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)]"
                      placeholder="Name"
                    />
                  </FormField>
                  <FormField id="customer-phone" label="Phone" error={fieldErrors.phone}>
                    <input
                      id="customer-phone"
                      value={editFields.phone}
                      onChange={(e) => setEditFields({ ...editFields, phone: e.target.value.replace(/[^0-9]/g, "") })}
                      onBlur={() => setFieldErrors(validateEditFields(editFields))}
                      className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)]"
                      placeholder="Phone"
                      type="tel"
                      inputMode="numeric"
                    />
                  </FormField>
                  <FormField id="customer-email" label="Email" error={fieldErrors.email}>
                    <input
                      id="customer-email"
                      value={editFields.email}
                      onChange={(e) => setEditFields({ ...editFields, email: e.target.value })}
                      onBlur={() => setFieldErrors(validateEditFields(editFields))}
                      className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)]"
                      placeholder="Email"
                      type="email"
                    />
                  </FormField>
                  <FormField id="customer-address" label="Address">
                    <input
                      id="customer-address"
                      value={editFields.address}
                      onChange={(e) => setEditFields({ ...editFields, address: e.target.value })}
                      onBlur={() => setFieldErrors(validateEditFields(editFields))}
                      className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)]"
                      placeholder="Address"
                    />
                  </FormField>
                  <FormField id="customer-notes" label="Notes">
                    <textarea
                      id="customer-notes"
                      value={editFields.notes}
                      onChange={(e) => setEditFields({ ...editFields, notes: e.target.value })}
                      onBlur={() => setFieldErrors(validateEditFields(editFields))}
                      rows={3}
                      className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] resize-none"
                      placeholder="Notes"
                    />
                  </FormField>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="flex-1 bg-[#FF6700] text-black py-2 rounded-lg font-bold hover:shadow-[0_0_15px_rgba(255,103,0,0.4)] transition flex items-center justify-center gap-2"
                    >
                      <Check size={16} /> Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditFields({
                          name: localCustomer.name || "",
                          phone: localCustomer.phone || "",
                          email: localCustomer.email || "",
                          address: localCustomer.address || "",
                          notes: localCustomer.notes || "",
                        });
                      }}
                      className="flex-1 bg-white/10 text-[var(--text-main)] py-2 rounded-lg font-bold hover:bg-white/20 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm text-[var(--text-main)]">
                  <a
                    href={localCustomer.phone ? `tel:${localCustomer.phone}` : undefined}
                    className="flex items-center gap-2 text-[var(--text-main)] hover:text-[#FF6700] transition"
                  >
                    <Phone size={16} className="text-[#FF6700]" />
                    {localCustomer.phone || "No phone on file"}
                  </a>
                  <a
                    href={localCustomer.email ? `mailto:${localCustomer.email}` : undefined}
                    className="flex items-center gap-2 text-[var(--text-main)] hover:text-[#FF6700] transition"
                  >
                    <Mail size={16} className="text-[#FF6700]" />
                    {localCustomer.email || "No email on file"}
                  </a>
                  <div className="flex items-center gap-2 text-[var(--text-main)]">
                    <MapPin size={16} className="text-[#FF6700]" />
                    {localCustomer.address || "No address on file"}
                  </div>
                  <div className="flex items-start gap-2 text-[var(--text-main)]">
                    <FileText size={16} className="text-[#FF6700] mt-0.5" />
                    <span>{localCustomer.notes || "No notes yet"}</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-sub)]">Financial Summary</h3>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg p-3">
                <p className="text-xs text-[var(--text-sub)]">Total Billed</p>
                <p className="text-lg font-bold text-[var(--text-main)]">{formatCurrency(totalBilled)}</p>
              </div>
              <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg p-3">
                <p className="text-xs text-[var(--text-sub)]">Total Paid</p>
                <p className="text-lg font-bold text-[var(--text-main)]">{formatCurrency(totalPaid)}</p>
              </div>
              <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg p-3">
                <p className="text-xs text-[var(--text-sub)]">Outstanding</p>
                <p className={`text-lg font-bold ${outstandingBalance > 0 ? "text-red-400" : "text-[var(--text-main)]"}`}>
                  {formatCurrency(outstandingBalance)}
                </p>
              </div>
            </div>
            {loadingFinancials && (
              <p className="text-xs text-[var(--text-sub)]">Loading financial summary…</p>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-sub)]">Job History</h3>
            <div className="space-y-2">
              {jobs.length === 0 && !loadingFinancials && (
                <p className="text-xs text-[var(--text-sub)]">No jobs linked to this customer yet.</p>
              )}
              {jobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => {
                    if (onSelectJob) onSelectJob(job);
                    onClose();
                  }}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] p-3 rounded-lg flex items-center justify-between text-left hover:bg-[var(--bg-card)] transition"
                >
                  <div>
                    <p className="font-bold text-sm text-[var(--text-main)]">{job.title}</p>
                    <p className="text-[10px] text-[var(--text-sub)]">
                      {job.status} • {job.created_at ? new Date(job.created_at).toLocaleDateString() : "Unknown date"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[var(--text-sub)]">Estimate</p>
                    <p className="text-sm font-bold text-[var(--text-main)]">{formatCurrency(estimatesByJob[job.id])}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-sub)]">Quick Actions</h3>
            <div className="grid gap-2 md:grid-cols-2">
              <a
                href={localCustomer.phone ? `tel:${localCustomer.phone}` : undefined}
                className="bg-[#FF6700] text-black py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(255,103,0,0.4)] transition"
              >
                <Phone size={16} /> Call
              </a>
              <a
                href={localCustomer.email ? `mailto:${localCustomer.email}` : undefined}
                className="bg-[#FF6700] text-black py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(255,103,0,0.4)] transition"
              >
                <Mail size={16} /> Email
              </a>
              <button
                className="bg-white/10 text-[var(--text-main)] py-2 rounded-lg font-bold flex items-center justify-center gap-2"
                disabled
              >
                <DollarSign size={16} /> Send Quote (Coming soon)
              </button>
              <button
                className="bg-white/10 text-[var(--text-main)] py-2 rounded-lg font-bold flex items-center justify-center gap-2"
                disabled
              >
                📸 Send Photos (Coming soon)
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
