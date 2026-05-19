"use client";

import { Modal, ModalProps } from "./modal";

export interface DialogProps extends Omit<ModalProps, "footer" | "children"> {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDangerous = false,
  isLoading = false,
  onConfirm,
  onCancel,
  size = "sm",
}: DialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      footer={
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 rounded-2xl border border-[var(--line-soft)] px-4 py-2 text-sm font-medium transition hover:bg-[var(--surface-1)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 rounded-2xl px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
              isDangerous
                ? "bg-[var(--danger)] hover:brightness-110"
                : "bg-[var(--accent)] hover:brightness-110"
            }`}
          >
            {isLoading ? "Loading..." : confirmLabel}
          </button>
        </div>
      }
    >
      <p className="text-sm text-[var(--foreground)]">{message}</p>
    </Modal>
  );
}
