"use client";

import { useState } from "react";
import { Search, UserCircle, Mail, MapPin, FileText, Trash2, ChevronDown } from "lucide-react";
import useResourcesManagement from "../../../hooks/useResourcesManagement";

export default function CustomersTab({ supabase, onResourcesUpdated }) {
  const { customers, addCustomer, deleteCustomer } = useResourcesManagement(supabase, {
    includeCrew: false,
    includeFleet: false,
  });
  const [expandedCustomer, setExpandedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "", address: "", notes: "" });

  const handleAddCustomer = async () => {
    if (!newCustomer.name.trim()) return;
    const { error } = await addCustomer(newCustomer);
    if (!error) {
      setNewCustomer({ name: "", phone: "", email: "", address: "", notes: "" });
      await onResourcesUpdated();
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!confirm("Remove customer?")) return;
    const { error } = await deleteCustomer(id);
    if (!error) {
      await onResourcesUpdated();
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
          <input
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
                <ChevronDown size={16} className={`text-[var(--text-sub)] transition-transform ${expandedCustomer === customer.id ? "rotate-180" : ""}`} />
              </button>

              {expandedCustomer === customer.id && (
                <div className="px-3 pb-3 space-y-2 border-t border-[var(--border-color)] pt-3">
                  {customer.email && <p className="text-xs text-[var(--text-sub)] flex items-center gap-2"><Mail size={12} />{customer.email}</p>}
                  {customer.address && <p className="text-xs text-[var(--text-sub)] flex items-center gap-2"><MapPin size={12} />{customer.address}</p>}
                  {customer.notes && <p className="text-xs text-[var(--text-sub)] flex items-start gap-2 bg-black/40 p-2 rounded"><FileText size={12} className="mt-0.5 shrink-0" />{customer.notes}</p>}
                  <button onClick={() => handleDeleteCustomer(customer.id)} className="w-full bg-red-900/20 border border-red-500/30 text-red-500 py-2 rounded text-xs font-bold hover:bg-red-900/40 transition flex items-center justify-center gap-2">
                    <Trash2 size={12} /> Delete Customer
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
