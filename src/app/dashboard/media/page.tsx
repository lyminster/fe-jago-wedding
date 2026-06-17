"use client";

import { useEffect, useRef, useState } from "react";
import {
  ImageIcon,
  Music2,
  Save,
  UploadCloud,
  X,
  Youtube,
} from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { SaveDialog } from "@/components/save-dialog";
import {
  getBackendErrorMessage,
  loadWeddingDataFromBackend,
  saveWeddingDataToBackend,
  uploadInvitationPhoto,
} from "@/lib/backend-api";
import type { PhotoAsset, WeddingData } from "@/components/wedding-data-store";
import { useWeddingDataStore } from "@/components/wedding-data-store";

export default function MediaPage() {
  const { data, invitationMeta, setInvitationMeta, setWeddingData } =
    useWeddingDataStore();
  const initialDataRef = useRef(data);
  const [draftData, setDraftData] = useState<WeddingData>(data);
  const [saveDialog, setSaveDialog] = useState<SaveDialogState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletedMediaUrls, setDeletedMediaUrls] = useState<string[]>([]);

  useEffect(() => {
    setDraftData(data);
  }, [data]);

  useEffect(() => {
    let isMounted = true;

    async function loadBackendData() {
      try {
        const invitation = await loadWeddingDataFromBackend(initialDataRef.current);
        if (!isMounted) return;
        setInvitationMeta(invitation);
        setWeddingData(invitation.data);
        setDraftData(invitation.data);
        setDeletedMediaUrls([]);
      } catch {
        // Backend may be started after the UI; saving will surface connection errors.
      }
    }

    void loadBackendData();

    return () => {
      isMounted = false;
    };
  }, [setInvitationMeta, setWeddingData]);

  const mediaStats = [
    {
      label: "Cover utama",
      value: draftData.photos.cover ? "1/1" : "0/1",
      note: "Foto besar full screen",
    },
    {
      label: "Gallery",
      value: `${draftData.photos.gallery.length}/20`,
      note: "Maksimal 20 foto",
    },
    {
      label: "Musik",
      value: "YouTube",
      note: "Link dipakai untuk background",
    },
  ];
  const isSaveLocked = invitationMeta ? !invitationMeta.canEdit : false;

  function updateDraftMusicLink(youtubeUrl: string) {
    setDraftData((current) => ({
      ...current,
      music: {
        ...current.music,
        youtubeUrl,
      },
    }));
  }

  function setDraftCoverPhoto(asset: PhotoAsset) {
    setDraftData((current) => ({
      ...current,
      photos: {
        ...current.photos,
        cover: asset,
      },
    }));
  }

  async function addGalleryFiles(files: File[]) {
    const availableSlots = Math.max(20 - draftData.photos.gallery.length, 0);
    const imageFiles = files
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, availableSlots);

    if (imageFiles.length > 0) {
      setIsUploading(true);

      try {
        const newPhotos = await Promise.all(imageFiles.map(uploadInvitationPhoto));

        setDraftData((current) => ({
          ...current,
          photos: {
            ...current.photos,
            gallery: [...current.photos.gallery, ...newPhotos].slice(0, 20),
          },
        }));
      } catch (error) {
        setSaveDialog({
          description: getBackendErrorMessage(error),
          title: "Gagal upload foto",
          variant: "error",
        });
      } finally {
        setIsUploading(false);
      }
    }
  }

  function removeDraftGalleryPhoto(photo: PhotoAsset) {
    if (photo.url.includes("/uploads/")) {
      setDeletedMediaUrls((current) =>
        current.includes(photo.url) ? current : [...current, photo.url],
      );
    }

    setDraftData((current) => ({
      ...current,
      photos: {
        ...current.photos,
        gallery: current.photos.gallery.filter((item) => item.id !== photo.id),
      },
    }));
  }

  async function handleSave() {
    if (isSaveLocked) return;

    setIsSaving(true);

    try {
      const invitation = await saveWeddingDataToBackend(draftData, deletedMediaUrls);
      setInvitationMeta(invitation);
      setWeddingData(invitation.data);
      setDraftData(invitation.data);
      setDeletedMediaUrls([]);
      setSaveDialog({ title: "Berhasil tersimpan", variant: "success" });
    } catch (error) {
      setSaveDialog({
        description: getBackendErrorMessage(error),
        title: "Gagal menyimpan",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-porcelain text-ink">
      <div className="flex min-h-screen">
        <DashboardSidebar active="media" />

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[#e4dfd4] bg-porcelain/95 px-4 py-4 backdrop-blur md:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm text-[#6e7a72]">Dashboard customer</p>
                <h1 className="mt-1 text-2xl font-semibold text-ink md:text-3xl">
                  Foto & Media
                </h1>
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || isUploading || isSaveLocked}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white hover:bg-[#1c2421] disabled:cursor-wait disabled:bg-[#59645d]"
              >
                <Save size={17} aria-hidden="true" />
                {isSaving
                  ? "Menyimpan..."
                  : isUploading
                    ? "Upload foto..."
                  : isSaveLocked
                    ? "Simpan terkunci"
                    : "Simpan"}
              </button>
            </div>
          </header>

          <div className="flex-1 space-y-5 p-4 md:p-6">
            <section className="grid gap-3 md:grid-cols-3">
              {mediaStats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-[#e4dfd4] bg-white p-4 shadow-soft"
                >
                  <p className="text-sm text-[#6e7a72]">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold">{item.value}</p>
                  <p className="mt-1 text-xs text-moss">{item.note}</p>
                </div>
              ))}
            </section>

            <section className="rounded-lg border border-[#e4dfd4] bg-white p-4 shadow-soft md:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <Youtube size={20} className="text-[#c4302b]" aria-hidden="true" />
                    Widget YouTube musik
                  </h2>
                  <p className="mt-1 text-sm text-[#6e7a72]">
                    Masukkan link YouTube yang akan dipakai sebagai musik
                    background undangan.
                  </p>
                </div>
                <span className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#fff2f0] px-3 text-xs font-semibold text-[#a13b33]">
                  <Music2 size={15} aria-hidden="true" />
                  Background music
                </span>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
                <div className="overflow-hidden rounded-lg border border-[#e8e3d8] bg-[#111714]">
                  <iframe
                    className="aspect-video w-full border-0"
                    title="Preview musik YouTube"
                    src={getYoutubeEmbedSrc(draftData.music.youtubeUrl)}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <label className="flex min-w-0 flex-col justify-center">
                  <span className="mb-2 flex items-center gap-2 text-sm font-medium text-[#59645d]">
                    <Youtube size={16} className="text-[#c4302b]" aria-hidden="true" />
                    Link YouTube musik
                  </span>
                  <input
                    className="block min-h-11 w-full rounded-lg border border-[#e4dfd4] bg-[#fbfaf7] px-3 py-3 text-sm font-semibold text-ink outline-none focus:border-[#bd8b32]"
                    value={draftData.music.youtubeUrl}
                    onChange={(event) => updateDraftMusicLink(event.target.value)}
                  />
                  <p className="mt-2 text-xs leading-5 text-[#758178]">
                    Preview undangan akan mencoba memutar musik dari link ini.
                    Autoplay tetap mengikuti izin browser tamu.
                  </p>
                </label>
              </div>
            </section>

            <section className="rounded-lg border border-[#e4dfd4] bg-white p-4 shadow-soft md:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Upload foto</h2>
                  <p className="mt-1 text-sm text-[#6e7a72]">
                    1 foto cover besar dan maksimal 20 foto gallery.
                  </p>
                </div>
                <span className="rounded-md bg-[#eef3eb] px-3 py-2 text-xs font-semibold text-[#47604b]">
                  {draftData.photos.gallery.length} dari 20
                </span>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                <MediaPhotoDropZone
                  description="Foto ini tampil full screen di bagian paling atas undangan."
                  label="Upload foto cover utama"
                  multiple={false}
                  onFiles={(files) => {
                    const imageFile = files.find((file) =>
                      file.type.startsWith("image/"),
                    );

                    if (imageFile) {
                      setIsUploading(true);
                      uploadInvitationPhoto(imageFile)
                        .then(setDraftCoverPhoto)
                        .catch((error) => {
                          setSaveDialog({
                            description: getBackendErrorMessage(error),
                            title: "Gagal upload foto",
                            variant: "error",
                          });
                        })
                        .finally(() => setIsUploading(false));
                    }
                  }}
                />
                <MediaPhotoDropZone
                  description="Total maksimal 21 foto: 1 cover besar + 20 gallery."
                  label="Drag foto gallery atau pilih dari perangkat"
                  multiple
                  onFiles={addGalleryFiles}
                />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {draftData.photos.cover ? (
                  <PhotoThumbnail
                    photo={draftData.photos.cover}
                    label="Cover utama"
                  />
                ) : null}
                {draftData.photos.gallery.map((photo, index) => (
                  <PhotoThumbnail
                    key={photo.id}
                    photo={photo}
                    label={`Gallery ${index + 1}`}
                    onRemove={() => removeDraftGalleryPhoto(photo)}
                  />
                ))}
                {draftData.photos.gallery.length === 0 ? (
                  <div className="flex min-h-32 items-center justify-center rounded-lg border border-[#e8e3d8] bg-[#f6f4ee] text-xs font-semibold text-[#758178]">
                    Belum ada foto gallery
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        </section>
      </div>

      {saveDialog ? (
        <SaveDialog
          description={saveDialog.description}
          onClose={() => setSaveDialog(null)}
          title={saveDialog.title}
          variant={saveDialog.variant}
        />
      ) : null}
    </main>
  );
}

type SaveDialogState = {
  description?: string;
  title: string;
  variant: "error" | "success";
};

function MediaPhotoDropZone({
  description,
  label,
  multiple,
  onFiles,
}: {
  description: string;
  label: string;
  multiple: boolean;
  onFiles: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    onFiles(Array.from(files));
  }

  return (
    <div
      className={`rounded-lg border border-dashed p-5 text-center transition ${
        isDragging
          ? "border-[#bd8b32] bg-[#fff8ec]"
          : "border-[#cdbb9c] bg-[#fbfaf7]"
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
        handleFiles(event.dataTransfer.files);
      }}
    >
      <UploadCloud
        size={28}
        className="mx-auto text-[#bd8b32]"
        aria-hidden="true"
      />
      <p className="mt-3 text-sm font-semibold">{label}</p>
      <p className="mt-1 text-xs text-[#758178]">{description}</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-4 inline-flex h-9 items-center justify-center rounded-lg border border-[#e4dfd4] bg-white px-3 text-xs font-semibold hover:bg-[#f6f4ee]"
      >
        Pilih gambar
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple={multiple}
        className="sr-only"
        onChange={(event) => handleFiles(event.target.files)}
        aria-label={label}
      />
    </div>
  );
}

function PhotoThumbnail({
  label,
  onRemove,
  photo,
}: {
  label: string;
  onRemove?: () => void;
  photo: PhotoAsset;
}) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-[#e8e3d8] bg-[#f6f4ee]">
      {/* Blob URLs from local uploads cannot be rendered by next/image. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.url} alt={label} className="block h-auto w-full" />
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-black/55 px-2 py-2 text-xs font-semibold text-white">
        <span className="flex min-w-0 items-center gap-1">
          <ImageIcon size={13} aria-hidden="true" />
          <span className="truncate">{label}</span>
        </span>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-white/15 hover:bg-white/25"
            aria-label={`Hapus ${label}`}
          >
            <X size={13} aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function getYoutubeEmbedSrc(url: string) {
  const videoId = getYoutubeVideoId(url);
  if (!videoId) return "about:blank";

  return `https://www.youtube.com/embed/${videoId}`;
}

function getYoutubeVideoId(url: string) {
  const trimmedUrl = url.trim();
  const directMatch = trimmedUrl.match(/youtu\.be\/([^?&/]+)/);
  const watchMatch = trimmedUrl.match(/[?&]v=([^?&]+)/);
  const embedMatch = trimmedUrl.match(/youtube\.com\/embed\/([^?&/]+)/);

  return directMatch?.[1] ?? watchMatch?.[1] ?? embedMatch?.[1] ?? null;
}
