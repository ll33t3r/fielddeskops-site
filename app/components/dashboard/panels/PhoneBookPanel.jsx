"use client";

import { useEffect, useRef, useState } from "react";
import { Search, UserCircle, Plus, Upload, Phone } from "lucide-react";
import useResourcesManagement from "../../../hooks/useResourcesManagement";
import PanelContainer from "./PanelContainer";

export default function PhoneBookPanel({
  isOpen,
  onClose,
  supabase,
  onResourcesUpdated,
  onSelectCustomer,
  startInAddMode = false,
}) {
  const { customers, addCustomer } = useResourcesManagement(supabase, {
    includeCrew: false,
    includeFleet: false,
  });
  const [customerSearch, setCustomerSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "", address: "", notes: "" });
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    if (startInAddMode) {
      setShowAddForm(true);
      setTimeout(() => nameInputRef.current?.focus(), 0);
    }
  }, [isOpen, startInAddMode]);

  const handleAddCustomer = async () => {
    const trimmedName = newCustomer.name.trim();
    if (!trimmedName) return;
    const { error } = await addCustomer({ ...newCustomer, name: trimmedName });
    if (!error) {
      setNewCustomer({ name: "", phone: "", email: "", address: "", notes: "" });
      if (onResourcesUpdated) await onResourcesUpdated();
    }
  };

  const filteredCustomers = customers.filter((c) =>
    c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.address?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <PanelContainer isOpen={isOpen} onClose={onClose} title="Phone Book">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-sub)]" size={16} />
          <input
            placeholder="Search by name, phone, address..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg pl-10 pr-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAddForm((prev) => !prev)}
            className="flex-1 min-w-[140px] bg-[#FF6700] text-black py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(255,103,0,0.4)] transition"
          >
            <Plus size={16} /> Add Customer
          </button>
          <button
            className="flex-1 min-w-[140px] bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-[var(--bg-card)] transition"
          >
            <Upload size={16} /> Import CSV
          </button>
          <button
            className="flex-1 min-w-[140px] bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-[var(--bg-card)] transition"
          >
            <Phone size={16} /> Import from Phone
          </button>
        </div>

        {showAddForm && (
          <div className="space-y-2 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg p-3">
            <input
              ref={nameInputRef}
              placeholder="Name..."
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
            />
            <input
              type="tel"
              inputMode="numeric"
              placeholder="Phone..."
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value.replace(/[^0-9]/g, "") })}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
            />
            <input
              type="email"
              placeholder="Email..."
              value={newCustomer.email}
              onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
            />
            <input
              placeholder="Address..."
              value={newCustomer.address}
              onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
            />
            <textarea
              placeholder="Notes..."
              value={newCustomer.notes}
              onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
              rows={3}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none resize-none"
            />
            <button onClick={handleAddCustomer} className="w-full bg-[#FF6700] text-black py-2 rounded-lg font-bold hover:shadow-[0_0_15px_rgba(255,103,0,0.4)] transition">
              Save Customer
            </button>
          </div>
        )}

        <div>
          <h3 className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-widest mb-3">Customers ({filteredCustomers.length})</h3>
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {filteredCustomers.map((customer) => (
              <button
                key={customer.id}
                onClick={() => onSelectCustomer && onSelectCustomer(customer)}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] p-3 rounded-lg flex items-center gap-3 text-left hover:bg-[var(--bg-card)] transition"
              >
                <UserCircle size={18} className="text-[#FF6700] shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-sm text-[var(--text-main)]">{customer.name}</p>
                  <p className="text-xs text-[var(--text-sub)]">{customer.phone || "No Phone"}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </PanelContainer>
  );
}
