"use client";

import type { ReactNode } from "react";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description: ReactNode;
  confirmText?: string;
  cancelText?: string;
  loadingText?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = "Удалить",
  cancelText = "Отмена",
  loadingText = "Удаляем...",
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/35 px-6 backdrop-blur-[1px]">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-red-50 p-2 text-red-600">
              <AlertTriangle size={18} />
            </div>

            <h2 className="font-heading text-xl font-semibold">{title}</h2>

            <div className="mt-2 text-sm leading-6 text-gray-500">
              {description}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-black disabled:cursor-not-allowed"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
            {isLoading ? loadingText : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}