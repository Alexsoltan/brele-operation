"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type UIModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: "sm" | "md" | "lg" | "xl";
  title?: string;
};

function widthClass(width: UIModalProps["width"]) {
  if (width === "sm") return "max-w-md";
  if (width === "lg") return "max-w-3xl";
  if (width === "xl") return "max-w-5xl";
  return "max-w-xl";
}

export function UIModal({
  isOpen,
  onClose,
  children,
  width = "md",
  title,
}: UIModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-6 py-8 backdrop-blur-[2px]">
      <div
        className={[
          "relative w-full rounded-[28px] bg-white shadow-[0_40px_120px_rgba(0,0,0,0.2)]",
          widthClass(width),
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-4 p-5 pb-0">
          {title ? (
            <h2 className="font-heading text-lg font-semibold">{title}</h2>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-black"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 pt-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}