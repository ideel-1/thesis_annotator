"use client";

import { useEffect, useRef } from "react";

export default function OnboardingModal({
  open,
  onClose,
  children,
  title = "How to add comments",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Basic focus trap
  useEffect(() => {
    if (!open) return;
    const first = dialogRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    first?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[100] flex items-center justify-center"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative z-[101] w-[min(92vw,700px)] rounded-2xl border border-neutral-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between p-5 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-neutral-500 hover:text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-300"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6l-12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5">
          {children}
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-neutral-200">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-neutral-300 bg-white text-neutral-800 text-sm hover:bg-neutral-100"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
