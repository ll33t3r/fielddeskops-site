"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export default function PanelContainer({ isOpen, onClose, title, children }) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const startYRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => setIsVisible(true));
      return undefined;
    }
    setIsVisible(false);
    setDragOffset(0);
    const timeout = setTimeout(() => setShouldRender(false), 200);
    return () => clearTimeout(timeout);
  }, [isOpen]);

  useEffect(() => {
    if (!shouldRender) return undefined;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousTouchAction = body.style.touchAction;
    body.style.overflow = "hidden";
    body.style.touchAction = "none";
    return () => {
      body.style.overflow = previousOverflow || "";
      body.style.touchAction = previousTouchAction || "";
    };
  }, [shouldRender]);

  const handleTouchStart = (event) => {
    startYRef.current = event.touches[0].clientY;
  };

  const handleTouchMove = (event) => {
    if (startYRef.current == null) return;
    const delta = event.touches[0].clientY - startYRef.current;
    if (delta > 0) {
      setDragOffset(delta);
    }
  };

  const handleTouchEnd = () => {
    if (dragOffset > 80 && onClose) {
      onClose();
    }
    setDragOffset(0);
    startYRef.current = null;
  };

  if (!shouldRender) return null;

  const panelTransform = isVisible ? `translateY(${dragOffset}px)` : "translateY(100%)";

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity duration-200 ${isVisible ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4">
        <div
          className="w-full max-w-2xl max-h-[85vh] bg-[var(--bg-card)] border-t border-[var(--border-color)] rounded-2xl shadow-2xl transition-transform duration-200 flex flex-col"
          style={{ transform: panelTransform }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              <span className="h-1.5 w-12 rounded-full bg-white/10" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#FF6700]">{title}</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg text-[var(--text-sub)] hover:bg-white/10 transition">
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto hide-scrollbar px-5 py-4">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
