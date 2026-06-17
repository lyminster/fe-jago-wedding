"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#d8c6a5] bg-white px-3 text-xs font-semibold text-ink"
      aria-label="Copy nomor rekening"
    >
      {copied ? (
        <Check size={14} aria-hidden="true" />
      ) : (
        <Copy size={14} aria-hidden="true" />
      )}
      {copied ? "Tersalin" : "Copy"}
    </button>
  );
}
