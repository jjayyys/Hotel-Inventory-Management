"use client";

import { useEffect, useState } from "react";

export interface AlertProps {
  message: string;
  type?: "success" | "error" | "warning" | "info";
  autoClose?: boolean;
  duration?: number;
  onClose?: () => void;
}

const typeClasses = {
  success:
    "bg-[rgba(13,148,136,0.12)] border-[var(--accent-strong)] text-[var(--accent-strong)]",
  error:
    "bg-[rgba(176,58,58,0.12)] border-[var(--danger)] text-[var(--danger)]",
  warning:
    "bg-[rgba(196,105,12,0.12)] border-[var(--warning)] text-[var(--warning)]",
  info: "bg-[rgba(59,130,246,0.12)] border-blue-500 text-blue-700",
};

const icons = {
  success: "✓",
  error: "✕",
  warning: "!",
  info: "ⓘ",
};

export function Alert({
  message,
  type = "info",
  autoClose = true,
  duration = 4000,
  onClose,
}: AlertProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!autoClose) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [autoClose, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-sm font-medium ${typeClasses[type]}`}
      role="alert"
    >
      <span className="text-lg">{icons[type]}</span>
      <p>{message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          onClose?.();
        }}
        className="ml-auto text-lg opacity-60 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}
