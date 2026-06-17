"use client";

import { Banknote } from "lucide-react";
import { useState } from "react";

type BankAccountFieldProps = {
  accountName: string;
  bankName: string;
  label: string;
  number?: string;
  initialNumber?: string;
  onAccountNameChange?: (value: string) => void;
  onBankNameChange?: (value: string) => void;
  onNumberChange?: (value: string) => void;
};

export function BankAccountField({
  accountName,
  bankName,
  initialNumber = "",
  label,
  number,
  onAccountNameChange,
  onBankNameChange,
  onNumberChange,
}: BankAccountFieldProps) {
  const [internalNumber, setInternalNumber] = useState(
    initialNumber.replace(/\D/g, ""),
  );
  const [touched, setTouched] = useState(false);
  const currentNumber = number ?? internalNumber;

  const hasError = touched && currentNumber.length === 0;

  return (
    <div>
      <label>
        <span className="mb-2 flex items-center gap-2 text-sm font-medium text-[#59645d]">
          <Banknote size={16} className="text-moss" aria-hidden="true" />
          {label}
        </span>
        <div className="grid gap-3 sm:grid-cols-[110px_minmax(0,1fr)]">
          <input
            className="block min-h-11 w-full rounded-lg border border-[#e4dfd4] bg-[#fbfaf7] px-3 py-3 text-sm font-semibold text-ink outline-none focus:border-[#bd8b32]"
            value={bankName}
            onChange={(event) => onBankNameChange?.(event.target.value)}
            aria-label={`${label} bank`}
          />
          <input
            className={`block min-h-11 w-full rounded-lg border bg-[#fbfaf7] px-3 py-3 text-sm font-semibold text-ink outline-none focus:border-[#bd8b32] ${
              hasError ? "border-[#d66a55]" : "border-[#e4dfd4]"
            }`}
            inputMode="numeric"
            pattern="[0-9]*"
            value={currentNumber}
            onBlur={() => setTouched(true)}
            onChange={(event) => {
              const nextNumber = event.target.value.replace(/\D/g, "");
              setTouched(true);
              setInternalNumber(nextNumber);
              onNumberChange?.(nextNumber);
            }}
            placeholder="Nomor rekening"
            aria-invalid={hasError}
            aria-label={`${label} nomor rekening`}
          />
        </div>
      </label>
      <input
        className="mt-3 block min-h-11 w-full rounded-lg border border-[#e4dfd4] bg-[#fbfaf7] px-3 py-3 text-sm font-semibold text-ink outline-none focus:border-[#bd8b32]"
        value={accountName}
        onChange={(event) => onAccountNameChange?.(event.target.value)}
        aria-label={`${label} nama pemilik`}
      />
      <p className={`mt-2 text-xs ${hasError ? "text-[#b85040]" : "text-[#758178]"}`}>
        {hasError
          ? "Nomor rekening wajib angka. Huruf tidak akan disimpan."
          : "Input nomor rekening hanya menerima angka."}
      </p>
    </div>
  );
}
