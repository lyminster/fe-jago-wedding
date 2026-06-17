"use client";

import { AlertCircle, Check, X } from "lucide-react";

type SaveDialogProps = {
  description?: string;
  onClose: () => void;
  title?: string;
  variant?: "error" | "success";
};

export function SaveDialog({
  description,
  onClose,
  title = "Berhasil tersimpan",
  variant = "success",
}: SaveDialogProps) {
  const isError = variant === "error";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#111714]/45 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-dialog-title"
    >
      <div className="jw-rise relative w-full max-w-[360px] overflow-hidden rounded-lg border border-[#e4dfd4] bg-white shadow-[0_24px_70px_rgba(17,23,20,0.28)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#e8e3d8] bg-white/85 text-[#68746c] shadow-sm backdrop-blur hover:bg-[#f6f4ee]"
          aria-label="Tutup dialog"
        >
          <X size={17} aria-hidden="true" />
        </button>

        <div className="bg-[#fbfaf7] px-6 pb-6 pt-7 text-center">
          <div
            className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-white shadow-[0_14px_34px_rgba(61,114,70,0.22)] ${
              isError ? "bg-[#fff2f0]" : "bg-[#e4f2e6]"
            }`}
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-sm ${
                isError ? "bg-[#b64b3f]" : "bg-[#3d7246]"
              }`}
            >
              {isError ? (
                <AlertCircle size={27} strokeWidth={2.6} aria-hidden="true" />
              ) : (
                <Check size={27} strokeWidth={3} aria-hidden="true" />
              )}
            </span>
          </div>

          <h3
            id="save-dialog-title"
            className="mt-4 text-xl font-semibold text-ink"
          >
            {title}
          </h3>
          {description ? (
            <p className="mx-auto mt-2 max-w-[260px] text-sm leading-6 text-[#6e7a72]">
              {description}
            </p>
          ) : null}
        </div>

        <div className={`h-1 ${isError ? "bg-[#b64b3f]" : "bg-[#bd8b32]"}`} />
      </div>
    </div>
  );
}
