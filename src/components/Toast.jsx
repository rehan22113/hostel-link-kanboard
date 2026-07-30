"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

// Simple error banner pinned to the bottom of the screen. Auto-dismisses.
export function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-lg border border-red-500/40 bg-red-950/90 px-4 py-2.5 text-sm text-red-100 shadow-drag">
        <span>{message}</span>
        <button
          onClick={onClose}
          className="text-red-300 hover:text-white"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
