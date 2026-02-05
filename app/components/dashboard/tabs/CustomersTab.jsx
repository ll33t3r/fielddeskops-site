"use client";

import { useState } from "react";
import { Search, UserCircle, Mail, MapPin, FileText, Trash2, ChevronDown, Edit2, Check, X } from "lucide-react";
import useResourcesManagement from "../../../hooks/useResourcesManagement";
import { logError } from "../../../../utils/logger";
import FormField from "../../shared/FormField";
import { buildFieldErrors, isEmail, isPhone, isRequired } from "../../../utils/validation";

export default function CustomersTab({ supabase, onResourcesUpdated }) {
  const { customers, addCustomer, deleteCustomer, updateCustomer } = useResourcesManagement(supabase, {
    includeCrew: false,
    includeFleet: false,
  });
  const [expandedCustomer, setExpandedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "", address: "", notes: "" });
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [newErrors, setNewErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});

  const validateCustomer = (values) =>
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

  const handleAddCustomer = async () => {
    const trimmedName = newCustomer.name.trim();
    const errors = validateCustomer({ ...newCustomer, name: trimmedName });
    setNewErrors(errors);
    if (Object.keys(errors).length > 0) return;
    const { error } = await addCustomer({ ...newCustomer, name: trimmedName });
    if (!error) {
      setNewCustomer({ name: "", phone: "", email: "", address: "", notes: "" });
      setNewErrors({});
      await onResourcesUpdated();
    } else {
      logError("Add customer failed", error);
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!confirm("Remove customer?")) return;
    const { error } = await deleteCustomer(id);
    if (!error) {
      await onResourcesUpdated();
    }
  };

  const handleUpdateCustomer = async (id) => {
    const trimmedName = editingCustomer?.name?.trim();
    const errors = validateCustomer({ ...editingCustomer, name: trimmedName });
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) return;
    const { error } = await updateCustomer(id, {
      name: trimmedName,
      phone: editingCustomer.phone || "",
      email: editingCustomer.email || "",
      address: editingCustomer.address || "",
      notes: editingCustomer.notes || "",
    });
    if (!error) {
      setEditingCustomer(null);
      setEditErrors({});
      await onResourcesUpdated();
    } else {
      logError("Update customer failed", error);
    }
  };

  const filteredCustomers = customers.filter((c) =>
    c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.address?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-widest mb-2 block">Add Customer</label>
        <div className="space-y-2">
          <FormField id="new-customer-name" label="Name" required error={newErrors.name}>
            <input
              id="new-customer-name"
              placeholder="Name..."
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              onBlur={() => setNewErrors(validateCustomer(newCustomer))}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
            />
          </FormField>
          <FormField id="new-customer-phone" label="Phone" error={newErrors.phone}>
            <input
              id="new-customer-phone"
              type="tel"
              inputMode="numeric"
              placeholder="Phone..."
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value.replace(/[^0-9]/g, "") })}
              onBlur={() => setNewErrors(validateCustomer(newCustomer))}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
            />
          </FormField>
          <FormField id="new-customer-email" label="Email" error={newErrors.email}>
            <input
              id="new-customer-email"
              type="email"
              placeholder="Email..."
              value={newCustomer.email}
              onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
              onBlur={() => setNewErrors(validateCustomer(newCustomer))}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
            />
          </FormField>
          <FormField id="new-customer-address" label="Address">
            <input
              id="new-customer-address"
              placeholder="Address..."
              value={newCustomer.address}
              onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
              onBlur={() => setNewErrors(validateCustomer(newCustomer))}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
            />
          </FormField>
          <FormField id="new-customer-notes" label="Notes">
            <textarea
              id="new-customer-notes"
              placeholder="Notes..."
              value={newCustomer.notes}
              onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
              onBlur={() => setNewErrors(validateCustomer(newCustomer))}
              rows={3}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none resize-none"
            />
          </FormField>
          <button onClick={handleAddCustomer} className="w-full bg-[#FF6700] text-black py-2 rounded-lg font-bold hover:shadow-[0_0_15px_rgba(255,103,0,0.4)] transition">
            Add Customer
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-widest mb-3">Customers ({customers.length})</h3>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-sub)]" size={16} />
          <input
            placeholder="Search by name, phone, address..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg pl-10 pr-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
          />
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedCustomer(expandedCustomer === customer.id ? null : customer.id)}
                className="w-full p-3 flex justify-between items-center hover:bg-[var(--bg-surface)] transition"
              >
                <div className="flex items-center gap-3 text-left">
                  <UserCircle size={16} className="text-[#FF6700] shrink-0" />
                  <div>
                    <p className="font-bold text-sm text-[var(--text-main)]">{customer.name}</p>
                    <p className="text-xs text-[var(--text-sub)]">{customer.phone || "No Phone"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCustomer({
                        id: customer.id,
                        name: customer.name || "",
                        phone: customer.phone || "",
                        email: customer.email || "",
                        address: customer.address || "",
                        notes: customer.notes || "",
                      });
                      setExpandedCustomer(customer.id);
                    }}
                    className="p-1.5 hover:bg-white/10 rounded"
                    aria-label="Edit customer"
                  >
                    <Edit2 size={14} className="text-[var(--text-sub)]" />
                  </button>
                  <ChevronDown size={16} className={`text-[var(--text-sub)] transition-transform ${expandedCustomer === customer.id ? "rotate-180" : ""}`} />
                </div>
              </button>

              {expandedCustomer === customer.id && (
                <div className="px-3 pb-3 space-y-2 border-t border-[var(--border-color)] pt-3">
                  {editingCustomer?.id === customer.id ? (
                    <>
                      <FormField id={`edit-name-${customer.id}`} label="Name" required error={editErrors.name}>
                        <input
                          id={`edit-name-${customer.id}`}
                          value={editingCustomer.name}
                          onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                          onBlur={() => setEditErrors(validateCustomer(editingCustomer))}
                          className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2 py-1 text-base text-[var(--input-text)]"
                          placeholder="Name"
                        />
                      </FormField>
                      <FormField id={`edit-phone-${customer.id}`} label="Phone" error={editErrors.phone}>
                        <input
                          id={`edit-phone-${customer.id}`}
                          value={editingCustomer.phone}
                          onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value.replace(/[^0-9]/g, "") })}
                          onBlur={() => setEditErrors(validateCustomer(editingCustomer))}
                          className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2 py-1 text-base text-[var(--input-text)]"
                          placeholder="Phone"
                          type="tel"
                          inputMode="numeric"
                        />
                      </FormField>
                      <FormField id={`edit-email-${customer.id}`} label="Email" error={editErrors.email}>
                        <input
                          id={`edit-email-${customer.id}`}
                          value={editingCustomer.email}
                          onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                          onBlur={() => setEditErrors(validateCustomer(editingCustomer))}
                          className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2 py-1 text-base text-[var(--input-text)]"
                          placeholder="Email"
                          type="email"
                        />
                      </FormField>
                      <FormField id={`edit-address-${customer.id}`} label="Address">
                        <input
                          id={`edit-address-${customer.id}`}
                          value={editingCustomer.address}
                          onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                          onBlur={() => setEditErrors(validateCustomer(editingCustomer))}
                          className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2 py-1 text-base text-[var(--input-text)]"
                          placeholder="Address"
                        />
                      </FormField>
                      <FormField id={`edit-notes-${customer.id}`} label="Notes">
                        <textarea
                          id={`edit-notes-${customer.id}`}
                          value={editingCustomer.notes}
                          onChange={(e) => setEditingCustomer({ ...editingCustomer, notes: e.target.value })}
                          onBlur={() => setEditErrors(validateCustomer(editingCustomer))}
                          rows={3}
                          className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2 py-1 text-base text-[var(--input-text)] resize-none"
                          placeholder="Notes"
                        />
                      </FormField>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateCustomer(customer.id)}
                          className="flex-1 bg-green-600 text-white py-1 rounded text-xs font-bold"
                        >
                          <Check size={14} className="inline" />
                        </button>
                        <button
                          onClick={() => setEditingCustomer(null)}
                          className="flex-1 bg-gray-700 text-white py-1 rounded text-xs font-bold"
                        >
                          <X size={14} className="inline" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {customer.email && <p className="text-xs text-[var(--text-sub)] flex items-center gap-2"><Mail size={12} />{customer.email}</p>}
                      {customer.address && <p className="text-xs text-[var(--text-sub)] flex items-center gap-2"><MapPin size={12} />{customer.address}</p>}
                      {customer.notes && <p className="text-xs text-[var(--text-sub)] flex items-start gap-2 bg-black/40 p-2 rounded"><FileText size={12} className="mt-0.5 shrink-0" />{customer.notes}</p>}
                      <button onClick={() => handleDeleteCustomer(customer.id)} className="w-full bg-red-900/20 border border-red-500/30 text-red-500 py-2 rounded text-xs font-bold hover:bg-red-900/40 transition flex items-center justify-center gap-2">
                        <Trash2 size={12} /> Delete Customer
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
