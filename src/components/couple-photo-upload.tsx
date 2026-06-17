"use client";

import { useRef, useState } from "react";
import { ImageIcon, UploadCloud, X } from "lucide-react";
import { PhotoAsset } from "@/components/wedding-data-store";
import { getBackendErrorMessage, uploadInvitationPhoto } from "@/lib/backend-api";

type CouplePhotoUploadProps = {
  label: string;
  onChange: (asset: PhotoAsset) => void;
  value: PhotoAsset | null;
};

export function CouplePhotoUpload({
  label,
  onChange,
  value,
}: CouplePhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function setPhoto(file?: File) {
    if (!file || !file.type.startsWith("image/")) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      const asset = await uploadInvitationPhoto(file);
      onChange(asset);
    } catch (error) {
      setUploadError(getBackendErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_112px]">
      <div
        className={`rounded-lg border border-dashed px-3 py-4 text-center transition ${
          isDragging
            ? "border-[#bd8b32] bg-[#fff8ec]"
            : "border-[#cdbb9c] bg-white"
        }`}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void setPhoto(event.dataTransfer.files[0]);
        }}
      >
        <UploadCloud
          size={22}
          className="mx-auto text-[#bd8b32]"
          aria-hidden="true"
        />
        <p className="mt-2 text-sm font-semibold">{label}</p>
        <p className="mt-1 text-xs text-[#758178]">
          Drag gambar ke sini atau pilih file.
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="mt-3 inline-flex h-9 items-center justify-center rounded-lg border border-[#e4dfd4] px-3 text-xs font-semibold hover:bg-[#f6f4ee] disabled:cursor-wait disabled:bg-[#f6f4ee]"
        >
          {isUploading ? "Upload..." : "Pilih gambar"}
        </button>
        {uploadError ? (
          <p className="mt-2 text-xs font-semibold text-[#a64f3f]">
            {uploadError}
          </p>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(event) => void setPhoto(event.target.files?.[0])}
          aria-label={label}
        />
      </div>

      <button
        type="button"
        onClick={() => value && setIsPreviewOpen(true)}
        className={`flex min-h-28 items-center justify-center overflow-hidden rounded-lg border bg-white ${
          value
            ? "border-[#d8c6a5]"
            : "cursor-default border-dashed border-[#d6cab7]"
        }`}
        aria-label={value ? `Preview ${label}` : `Thumbnail ${label}`}
      >
        {value ? (
          // Blob URLs from local file uploads cannot be rendered by next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value.url}
            alt={`Thumbnail ${label}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex flex-col items-center gap-2 px-2 text-xs font-semibold text-[#8b928b]">
            <ImageIcon size={20} aria-hidden="true" />
            Thumbnail
          </span>
        )}
      </button>

      {isPreviewOpen && value ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Preview ${label}`}
        >
          <div className="w-full max-w-2xl rounded-lg bg-white p-3 shadow-2xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{label}</p>
                <p className="truncate text-xs text-[#758178]">{value.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e4dfd4] hover:bg-[#f6f4ee]"
                aria-label="Tutup preview foto"
              >
                <X size={17} aria-hidden="true" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value.url}
              alt={`Preview ${label}`}
              className="max-h-[70vh] w-full rounded-lg object-contain"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
