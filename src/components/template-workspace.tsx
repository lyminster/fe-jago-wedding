"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Check, Save } from "lucide-react";
import { LiveInvitationPreview } from "@/components/live-invitation-preview";
import { SaveDialog } from "@/components/save-dialog";
import {
  getBackendErrorMessage,
  loadWeddingDataFromBackend,
  saveWeddingDataToBackend,
} from "@/lib/backend-api";
import {
  InvitationTemplate,
  useWeddingDataStore,
} from "@/components/wedding-data-store";

type TemplateOption = {
  accent: string;
  badge: string;
  description: string;
  frameClass: string;
  id: InvitationTemplate;
  image: string;
  name: string;
  overlayClass: string;
  titleClass: string;
};

const templates: TemplateOption[] = [
  {
    id: "classic",
    name: "Classic Elegant",
    image: "/images/template-classic.png",
    accent: "bg-[#bd8b32]",
    badge: "Editorial serif",
    description: "Cover formal, frame gold, dan divider klasik.",
    frameClass: "rounded-lg border border-[#d8c6a5]",
    overlayClass: "bg-gradient-to-b from-black/0 via-black/10 to-[#1d241f]/75",
    titleClass: "wedding-editorial text-2xl",
  },
  {
    id: "minimalist",
    name: "Minimalist White",
    image: "/images/template-minimalist.png",
    accent: "bg-[#6f7f68]",
    badge: "Clean line",
    description: "Tipografi sans, garis halus, dan layout lapang.",
    frameClass: "rounded-none border-y border-[#dfe7df]",
    overlayClass: "bg-gradient-to-b from-white/20 via-transparent to-[#2f3b35]/70",
    titleClass: "wedding-modern text-xl font-light uppercase tracking-[0.12em]",
  },
  {
    id: "floral",
    name: "Floral Romantic",
    image: "/images/template-floral.png",
    accent: "bg-[#b95573]",
    badge: "Petal motion",
    description: "Nama script, arch lembut, dan efek petal.",
    frameClass: "rounded-[24px] border border-[#f0bfd0]",
    overlayClass: "bg-gradient-to-b from-[#fff1f4]/20 via-transparent to-[#4b1428]/78",
    titleClass: "wedding-script text-4xl leading-none",
  },
  {
    id: "modern",
    name: "Modern Dark",
    image: "/images/template-modern.png",
    accent: "bg-[#26312d]",
    badge: "Luxe motion",
    description: "Headline bold, grid texture, dan panel kontras.",
    frameClass: "rounded-sm border border-[#26312d]",
    overlayClass: "bg-gradient-to-b from-black/5 via-black/20 to-black/85",
    titleClass: "wedding-modern text-2xl font-black uppercase tracking-[0.05em]",
  },
];

export function TemplateWorkspace() {
  const { data, invitationMeta, setInvitationMeta, setWeddingData } =
    useWeddingDataStore();
  const initialDataRef = useRef(data);
  const savedTemplate = data.template.saved;
  const [selectedTemplate, setSelectedTemplate] =
    useState<InvitationTemplate>(savedTemplate);
  const [saveDialog, setSaveDialog] = useState<SaveDialogState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isGroomFirst = data.coupleOrder === "groom-first";
  const coupleTitle = isGroomFirst
    ? `${getFirstName(data.groom.name)} & ${getFirstName(data.bride.name)}`
    : `${getFirstName(data.bride.name)} & ${getFirstName(data.groom.name)}`;

  useEffect(() => {
    setSelectedTemplate(savedTemplate);
  }, [savedTemplate]);

  useEffect(() => {
    let isMounted = true;

    async function loadBackendData() {
      try {
        const invitation = await loadWeddingDataFromBackend(initialDataRef.current);
        if (!isMounted) return;
        setInvitationMeta(invitation);
        setWeddingData(invitation.data);
      } catch {
        // Backend may be started after the UI; saving will surface connection errors.
      }
    }

    void loadBackendData();

    return () => {
      isMounted = false;
    };
  }, [setInvitationMeta, setWeddingData]);

  const selectedName = templates.find(
    (template) => template.id === selectedTemplate,
  )?.name;
  const savedName = templates.find((template) => template.id === savedTemplate)?.name;
  const hasUnsavedChange = selectedTemplate !== savedTemplate;
  const isSaveLocked = invitationMeta ? !invitationMeta.canEdit : false;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaveLocked) return;

    setIsSaving(true);

    const nextData = {
      ...data,
      template: {
        ...data.template,
        draft: selectedTemplate,
        saved: selectedTemplate,
      },
    };

    try {
      const invitation = await saveWeddingDataToBackend(nextData);
      setInvitationMeta(invitation);
      setWeddingData(invitation.data);
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
    <div className="grid flex-1 grid-cols-1 gap-5 p-4 md:p-6 xl:grid-cols-[minmax(0,1fr)_390px]">
      <div className="min-w-0 space-y-5">
        <section className="grid gap-3 md:grid-cols-3">
          <StatCard
            label="Template tersimpan"
            value={savedName ?? "Classic"}
            note="Dipakai di undangan"
          />
          <StatCard
            label="Dipilih saat ini"
            value={selectedName ?? "Classic"}
            note={hasUnsavedChange ? "Belum disimpan" : "Sudah tersimpan"}
          />
          <StatCard
            label="Template tersedia"
            value="4"
            note="Landing page siap dipakai"
          />
        </section>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-[#e4dfd4] bg-white p-4 shadow-soft md:p-5"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Pilih template</h2>
              <p className="mt-1 text-sm text-[#6e7a72]">
                Pilih salah satu landing page. Live preview berubah langsung,
                lalu simpan saat pilihan sudah final.
              </p>
            </div>
            <button
              type="submit"
              disabled={isSaving || isSaveLocked}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white hover:bg-[#1c2421] disabled:cursor-wait disabled:bg-[#59645d]"
            >
              <Save size={17} aria-hidden="true" />
              {isSaving
                ? "Menyimpan..."
                : isSaveLocked
                  ? "Simpan terkunci"
                  : "Simpan template"}
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            {templates.map((template) => {
              const isSelected = template.id === selectedTemplate;
              const isSaved = template.id === savedTemplate;

              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplate(template.id)}
                  data-testid={`template-option-${template.id}`}
                  className={`rounded-lg border bg-white p-3 text-left transition hover:border-[#bd8b32] focus:outline-none ${
                    isSelected
                      ? "border-[#bd8b32] shadow-soft"
                      : "border-[#e8e3d8]"
                  }`}
                  aria-pressed={isSelected}
                >
                  <span
                    className={`relative block aspect-[4/5] overflow-hidden bg-[#f6f4ee] ${template.frameClass}`}
                  >
                    <Image
                      src={template.image}
                      alt={`Foto template ${template.name}`}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1536px) 180px, (min-width: 640px) 40vw, 90vw"
                    />
                    <span className={`absolute inset-0 ${template.overlayClass}`} />
                    <TemplateCardEffect template={template.id} />
                    <span
                      className={`absolute left-3 top-3 h-8 w-8 rounded-full ${template.accent}`}
                    />
                    <span className="absolute bottom-3 left-3 right-3 text-white">
                      <span className={`block leading-none ${template.titleClass}`}>
                        {coupleTitle}
                      </span>
                      <span className="mt-2 block text-xs font-semibold">
                        {template.badge}
                      </span>
                    </span>
                  </span>
                  <span className="mt-3 flex items-center justify-between gap-3">
                    <span className="min-w-0 text-sm font-semibold">
                      {template.name}
                    </span>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold ${
                        isSaved
                          ? "bg-[#e4f2e6] text-[#3d7246]"
                          : isSelected
                            ? "bg-[#f3ead9] text-[#8a6227]"
                            : "bg-[#f5f2ea] text-[#68746c]"
                      }`}
                    >
                      {isSaved ? <Check size={12} aria-hidden="true" /> : null}
                      {isSaved ? "Tersimpan" : isSelected ? "Dipilih" : "Preview"}
                    </span>
                  </span>
                  <span className="mt-2 block text-xs leading-5 text-[#758178]">
                    {template.description}
                  </span>
                </button>
              );
            })}
          </div>

          {hasUnsavedChange ? (
            <p className="mt-4 rounded-lg bg-[#fff8ec] px-3 py-2 text-sm font-semibold text-[#8a6227]">
              Template sudah berubah di live preview, tetapi belum tersimpan.
            </p>
          ) : (
            <p className="mt-4 rounded-lg bg-[#eef3eb] px-3 py-2 text-sm font-semibold text-[#47604b]">
              Template ini sudah tersimpan untuk undangan.
            </p>
          )}
        </form>

        {saveDialog ? (
          <SaveDialog
            description={saveDialog.description}
            onClose={() => setSaveDialog(null)}
            title={saveDialog.title}
            variant={saveDialog.variant}
          />
        ) : null}
      </div>

      <LiveInvitationPreview template={selectedTemplate} />
    </div>
  );
}

type SaveDialogState = {
  description?: string;
  title: string;
  variant: "error" | "success";
};

function StatCard({
  label,
  note,
  value,
}: {
  label: string;
  note: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[#e4dfd4] bg-white p-4 shadow-soft">
      <p className="text-sm text-[#6e7a72]">{label}</p>
      <p className="mt-2 truncate text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-moss">{note}</p>
    </div>
  );
}

function TemplateCardEffect({ template }: { template: InvitationTemplate }) {
  if (template === "floral") {
    return (
      <>
        <span className="jw-petal absolute right-4 top-10 h-8 w-6 rounded-full" />
        <span className="absolute inset-x-5 bottom-16 h-20 rounded-t-full border-x border-t border-white/40" />
      </>
    );
  }

  if (template === "modern") {
    return (
      <>
        <span className="jw-grain absolute inset-0 opacity-50" />
        <span className="absolute left-0 top-16 h-px w-full bg-[#d6a348]/70" />
      </>
    );
  }

  if (template === "minimalist") {
    return (
      <span className="jw-line-sweep absolute left-6 top-8 h-px w-28 bg-white/80" />
    );
  }

  return (
    <>
      <span className="absolute inset-3 rounded-lg border border-white/35" />
      <span className="jw-gold-orb absolute bottom-8 right-0 h-16 w-16 rounded-full" />
    </>
  );
}

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || "Mempelai";
}
