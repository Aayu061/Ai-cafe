"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      aria-describedby={description ? "modal-description" : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#120905]/60 backdrop-blur-sm animate-fadeIn"
    >
      <div
        className={cn(
          "relative w-full max-w-lg rounded-2xl bg-[#FFFDF8] border border-[#3A2418]/10 p-6 sm:p-8 shadow-floating text-[#3A2418] transition-all",
          className
        )}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#3A2418]/60 hover:text-[#3A2418] hover:bg-[#3A2418]/5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#C98A4A]"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {title && (
          <h2 id="modal-title" className="font-serif text-xl sm:text-2xl font-bold tracking-tight mb-1 text-[#3A2418]">
            {title}
          </h2>
        )}

        {description && (
          <p id="modal-description" className="text-xs text-[#8C877F] mb-6">
            {description}
          </p>
        )}

        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
