"use client";

import { ReactNode } from "react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`w-full ${sizeClasses[size]} rounded-[1.75rem] bg-white shadow-lg`}>
        {/* Header */}
        <div className="border-b border-[var(--line-soft)] p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">
                {title}
              </h2>
              {description && (
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-[var(--muted)] transition hover:text-[var(--foreground)]"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-[var(--line-soft)] p-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
