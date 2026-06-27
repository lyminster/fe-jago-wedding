"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Banknote,
  BookOpenText,
  CalendarDays,
  Check,
  Clock,
  CreditCard,
  Eye,
  EyeOff,
  Heart,
  ImageIcon,
  Loader2,
  Plus,
  Save,
  Share2,
  ShieldCheck,
  Trash2,
  UploadCloud,
  UserRound,
  X,
} from "lucide-react";
import { BankAccountField } from "@/components/bank-account-field";
import { CouplePhotoUpload } from "@/components/couple-photo-upload";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { SaveDialog } from "@/components/save-dialog";
import {
  BackendApiError,
  createPaymentOrder,
  loadRsvpsForInvitation,
  getBackendErrorMessage,
  loadWeddingDataFromBackend,
  markPaymentPaid,
  saveWeddingDataToBackend,
  syncPaymentOrder,
  uploadInvitationPhoto,
  type BackendOrder,
  type BackendRSVP,
} from "@/lib/backend-api";
import { payWithMidtransSnap } from "@/lib/midtrans-snap";
import type {
  BankAccountKey,
  CoupleOrder,
  InvitationMeta,
  LoveStoryItem,
  PersonKey,
  PhotoAsset,
  RundownItem,
  WeddingData,
} from "@/components/wedding-data-store";
import { useWeddingDataStore } from "@/components/wedding-data-store";

export default function Home() {
  const { data, invitationMeta, setInvitationMeta, setWeddingData } =
    useWeddingDataStore();
  const initialDataRef = useRef(data);
  const [draftData, setDraftData] = useState<WeddingData>(data);
  const [rsvps, setRsvps] = useState<BackendRSVP[]>([]);
  const [paymentDialog, setPaymentDialog] = useState<PaymentDialogState | null>(
    null,
  );
  const [saveDialog, setSaveDialog] = useState<SaveDialogState | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletedMediaUrls, setDeletedMediaUrls] = useState<string[]>([]);
  const [subdomainError, setSubdomainError] = useState<string | null>(null);

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

        try {
          const backendRsvps = await loadRsvpsForInvitation(invitation);
          if (isMounted) {
            setRsvps(backendRsvps);
          }
        } catch {
          if (isMounted) {
            setRsvps([]);
          }
        }
      } catch {
        // Backend may be started after the UI; saving will surface connection errors.
      }
    }

    void loadBackendData();

    return () => {
      isMounted = false;
    };
  }, [setInvitationMeta, setWeddingData]);

  const invitationTitle = getCoupleTitle(draftData);
  const attendingGuests = rsvps
    .filter((rsvp) => isAttending(rsvp.attendanceStatus))
    .reduce((total, rsvp) => total + Math.max(rsvp.guestCount, 1), 0);
  const notAttendingCount = rsvps.filter((rsvp) =>
    isNotAttending(rsvp.attendanceStatus),
  ).length;
  const progressSteps = getPublicationSteps(draftData, invitationMeta);
  const isContentReady = progressSteps
    .filter((step) => step.kind !== "payment")
    .every((step) => step.status === "Selesai");
  const isPaymentActive =
    invitationMeta?.paymentStatus === "paid" &&
    invitationMeta.status === "active" &&
    !isExpired(invitationMeta.expiredAt);
  const canShareInvitation = isPaymentActive && Boolean(draftData.slug.trim());
  const shareDisabledReason = getShareDisabledReason(
    invitationMeta,
    draftData.slug,
  );
  const isSaveLocked = invitationMeta ? !invitationMeta.canEdit : false;
  const paymentButtonLabel = isPaymentActive
    ? "Sudah aktif"
    : invitationMeta?.status === "expired"
      ? "Perpanjang paket"
      : "Bayar & publish";
  const stats = [
    {
      label: "Kuota undangan",
      value: "1/1",
      delta: "Satu user satu undangan",
    },
    {
      label: "Foto gallery",
      value: `${draftData.photos.gallery.length}/20`,
      delta: draftData.photos.cover
        ? "1 cover besar + gallery aktif"
        : "Cover utama belum diisi",
    },
    {
      label: "RSVP masuk",
      value: String(rsvps.length),
      delta: `${attendingGuests} hadir, ${notAttendingCount} tidak hadir`,
    },
  ];

  function updateDraftSlug(slug: string) {
    setSubdomainError(null);
    const normalizedSlug = slug.toLowerCase().replace(/[^a-z0-9&-]/g, "");
    setDraftData((current) => ({
      ...current,
      slug: normalizedSlug,
    }));
  }

  async function handleShareInvitation() {
    if (!canShareInvitation) return;

    const shareUrl = getPublicInvitationUrl(draftData.slug);
    try {
      if (navigator.share) {
        await navigator.share({ title: invitationTitle, url: shareUrl });
        return;
      }

      await navigator.clipboard?.writeText(shareUrl);
      setSaveDialog({
        description: "Link undangan berhasil disalin ke clipboard.",
        title: "Link siap dibagikan",
        variant: "success",
      });
    } catch {
      setSaveDialog({
        description: "Link undangan belum berhasil dibagikan. Coba lagi sebentar.",
        title: "Gagal membagikan link",
        variant: "error",
      });
    }
  }

  function updateDraftEventInfo(
    patch: Partial<Pick<WeddingData, "mapLink" | "venue">>,
  ) {
    setDraftData((current) => ({
      ...current,
      ...patch,
    }));
  }

  function updateDraftPerson(
    person: PersonKey,
    field: keyof Omit<WeddingData["bride"], "photo">,
    value: string,
  ) {
    setDraftData((current) => ({
      ...current,
      [person]: {
        ...current[person],
        [field]: value,
      },
    }));
  }

  function setDraftCouplePhoto(person: PersonKey, asset: PhotoAsset) {
    setDraftData((current) => ({
      ...current,
      [person]: {
        ...current[person],
        photo: asset,
      },
    }));
  }

  function updateDraftText(
    field: "heroLabel" | "storyText" | "welcomeText",
    value: string,
  ) {
    setDraftData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateDraftCoupleOrder(coupleOrder: CoupleOrder) {
    setDraftData((current) => ({
      ...current,
      coupleOrder,
    }));
  }

  function updateDraftSchedule(
    event: keyof WeddingData["schedule"],
    patch: Partial<WeddingData["schedule"]["ceremony"]>,
  ) {
    setDraftData((current) => ({
      ...current,
      schedule: {
        ...current.schedule,
        [event]: {
          ...current.schedule[event],
          ...patch,
        },
      },
    }));
  }

  function markDeletedMediaUrl(url?: string) {
    if (!url || !url.includes("/uploads/")) return;

    setDeletedMediaUrls((current) =>
      current.includes(url) ? current : [...current, url],
    );
  }

  function updateLoveStoryVisibility(isVisible: boolean) {
    setDraftData((current) => ({
      ...current,
      loveStory: {
        ...current.loveStory,
        isVisible,
      },
    }));
  }

  function addLoveStoryItem() {
    setDraftData((current) => ({
      ...current,
      loveStory: {
        ...current.loveStory,
        isVisible: true,
        items: [
          ...current.loveStory.items,
          {
            date: "",
            description: "",
            id: createLocalId(),
            photo: null,
            title: "",
          },
        ],
      },
    }));
  }

  function updateLoveStoryItem(
    id: string,
    patch: Partial<Omit<LoveStoryItem, "id">>,
  ) {
    setDraftData((current) => ({
      ...current,
      loveStory: {
        ...current.loveStory,
        items: current.loveStory.items.map((item) =>
          item.id === id ? { ...item, ...patch } : item,
        ),
      },
    }));
  }

  function setLoveStoryPhoto(id: string, asset: PhotoAsset) {
    const currentItem = draftData.loveStory.items.find((item) => item.id === id);
    if (currentItem?.photo?.url !== asset.url) {
      markDeletedMediaUrl(currentItem?.photo?.url);
    }

    setDraftData((current) => ({
      ...current,
      loveStory: {
        ...current.loveStory,
        items: current.loveStory.items.map((item) =>
          item.id === id ? { ...item, photo: asset } : item,
        ),
      },
    }));
  }

  function removeLoveStoryPhoto(item: LoveStoryItem) {
    markDeletedMediaUrl(item.photo?.url);
    updateLoveStoryItem(item.id, { photo: null });
  }

  function removeLoveStoryItem(item: LoveStoryItem) {
    markDeletedMediaUrl(item.photo?.url);
    setDraftData((current) => ({
      ...current,
      loveStory: {
        ...current.loveStory,
        items: current.loveStory.items.filter((currentItem) => currentItem.id !== item.id),
      },
    }));
  }

  function moveLoveStoryItem(id: string, direction: -1 | 1) {
    setDraftData((current) => ({
      ...current,
      loveStory: {
        ...current.loveStory,
        items: moveItemById(current.loveStory.items, id, direction),
      },
    }));
  }

  function updateRundownVisibility(isVisible: boolean) {
    setDraftData((current) => ({
      ...current,
      eventRundown: {
        ...current.eventRundown,
        isVisible,
      },
    }));
  }

  function addRundownItem() {
    setDraftData((current) => ({
      ...current,
      eventRundown: {
        ...current.eventRundown,
        isVisible: true,
        items: [
          ...current.eventRundown.items,
          {
            date: "",
            description: "",
            endTime: "",
            id: createLocalId(),
            location: "",
            startTime: "",
            title: "",
          },
        ],
      },
    }));
  }

  function updateRundownItem(
    id: string,
    patch: Partial<Omit<RundownItem, "id">>,
  ) {
    setDraftData((current) => ({
      ...current,
      eventRundown: {
        ...current.eventRundown,
        items: current.eventRundown.items.map((item) =>
          item.id === id ? { ...item, ...patch } : item,
        ),
      },
    }));
  }

  function removeRundownItem(id: string) {
    setDraftData((current) => ({
      ...current,
      eventRundown: {
        ...current.eventRundown,
        items: current.eventRundown.items.filter((item) => item.id !== id),
      },
    }));
  }

  function moveRundownItem(id: string, direction: -1 | 1) {
    setDraftData((current) => ({
      ...current,
      eventRundown: {
        ...current.eventRundown,
        items: moveItemById(current.eventRundown.items, id, direction),
      },
    }));
  }

  function updateDraftBankAccount(
    account: BankAccountKey,
    patch: Partial<WeddingData["bankAccounts"]["bride"]>,
  ) {
    setDraftData((current) => ({
      ...current,
      bankAccounts: {
        ...current.bankAccounts,
        [account]: {
          ...current.bankAccounts[account],
          ...patch,
        },
      },
    }));
  }

  async function handleSave() {
    if (isSaveLocked) return;

    setIsSaving(true);

    try {
      const invitation = await saveWeddingDataToBackend(
        draftData,
        deletedMediaUrls,
      );
      setInvitationMeta(invitation);
      setWeddingData(invitation.data);
      setDraftData(invitation.data);
      setDeletedMediaUrls([]);
      setSubdomainError(null);
      setSaveDialog({ title: "Berhasil tersimpan", variant: "success" });
    } catch (error) {
      const message = getBackendErrorMessage(error);
      if (
        error instanceof BackendApiError &&
        (error.status === 400 || error.status === 409) &&
        (message.toLowerCase().includes("subdomain") ||
          message.toLowerCase().includes("alamat unik"))
      ) {
        setSubdomainError(message);
        return;
      }

      setSaveDialog({
        description: message,
        title: "Gagal menyimpan",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleOpenPaymentDialog() {
    setPaymentDialog({ status: "loading" });
    setIsCreatingOrder(true);

    try {
      const result = await createPaymentOrder();
      setInvitationMeta(result.invitation);
      setPaymentDialog({ order: result.order, status: "ready" });
    } catch (error) {
      setPaymentDialog({
        errorMessage: getBackendErrorMessage(error),
        status: "error",
      });
    } finally {
      setIsCreatingOrder(false);
    }
  }

  async function handlePayOrder(order: BackendOrder) {
    setIsPaying(true);

    try {
      if (order.provider === "midtrans") {
        const snapResult = await payWithMidtransSnap(order);

        if (snapResult.status === "closed") {
          setPaymentDialog({ order, status: "ready" });
          return;
        }

        const result = await syncPaymentOrder(order);
        setInvitationMeta(result.invitation);
        setWeddingData(result.invitation.data);
        setDraftData(result.invitation.data);

        if (result.order.status === "paid") {
          setPaymentDialog({
            invitationExpiredAt: result.invitation.expiredAt,
            order: result.order,
            status: "paid",
          });
          return;
        }

        setPaymentDialog({
          order: result.order,
          status: "pending",
        });
        return;
      }

      const result = await markPaymentPaid(order);
      setInvitationMeta(result.invitation);
      setWeddingData(result.invitation.data);
      setDraftData(result.invitation.data);
      setPaymentDialog({
        invitationExpiredAt: result.invitation.expiredAt,
        order: result.order,
        status: "paid",
      });
    } catch (error) {
      setPaymentDialog({
        errorMessage: getBackendErrorMessage(error),
        order,
        status: "error",
      });
    } finally {
      setIsPaying(false);
    }
  }

  async function handleRefreshPayment(order: BackendOrder) {
    setIsPaying(true);

    try {
      const result = await syncPaymentOrder(order);
      setInvitationMeta(result.invitation);
      setWeddingData(result.invitation.data);
      setDraftData(result.invitation.data);
      setPaymentDialog(
        result.order.status === "paid"
          ? {
              invitationExpiredAt: result.invitation.expiredAt,
              order: result.order,
              status: "paid",
            }
          : {
              order: result.order,
              status: "pending",
            },
      );
    } catch (error) {
      setPaymentDialog({
        errorMessage: getBackendErrorMessage(error),
        order,
        status: "error",
      });
    } finally {
      setIsPaying(false);
    }
  }

  return (
    <main className="min-h-screen bg-porcelain text-ink">
      <div className="flex min-h-screen">
        <DashboardSidebar active="dashboard" />

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[#e4dfd4] bg-porcelain/95 px-4 py-4 backdrop-blur md:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm text-[#6e7a72]">Dashboard customer</p>
                <h1 className="mt-1 text-2xl font-semibold text-ink md:text-3xl">
                  Undangan {invitationTitle}
                </h1>
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || isSaveLocked}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white hover:bg-[#1c2421] disabled:cursor-wait disabled:bg-[#59645d]"
              >
                <Save size={17} aria-hidden="true" />
                {isSaving
                  ? "Menyimpan..."
                  : isSaveLocked
                    ? "Simpan terkunci"
                    : "Simpan"}
              </button>
            </div>
          </header>

          <div className="flex-1 space-y-5 p-4 md:p-6">
            <section className="grid gap-3 sm:grid-cols-3">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-[#e4dfd4] bg-white p-4 shadow-soft"
                >
                  <p className="text-sm text-[#6e7a72]">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold">{item.value}</p>
                  <p className="mt-1 text-xs text-moss">{item.delta}</p>
                </div>
              ))}
            </section>

            <section className="rounded-lg border border-[#e4dfd4] bg-white p-4 shadow-soft md:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Progress publikasi</h2>
                  <p className="mt-1 text-sm text-[#6e7a72]">
                    Lengkapi detail acara, rekening, template, foto, dan media.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenPaymentDialog}
                  disabled={!isContentReady || isPaymentActive || isCreatingOrder}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#bd8b32] px-4 text-sm font-semibold text-white hover:bg-[#a87929] disabled:cursor-not-allowed disabled:bg-[#b9b0a0]"
                >
                  <CreditCard size={17} aria-hidden="true" />
                  {isCreatingOrder ? "Menyiapkan..." : paymentButtonLabel}
                </button>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                {progressSteps.map((step, index) => (
                  <div
                    key={step.label}
                    className="flex items-center gap-3 rounded-lg border border-[#e8e3d8] px-3 py-3"
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${
                        step.status === "Selesai"
                          ? "bg-[#e4f2e6] text-[#3d7246]"
                          : step.status === "Aktif"
                            ? "bg-ink text-white"
                            : "bg-[#f5f2ea] text-[#7a837c]"
                      }`}
                    >
                      {step.status === "Selesai" ? (
                        <Check size={16} aria-hidden="true" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">
                        {step.label}
                      </span>
                      <span className="text-xs text-[#758178]">
                        {step.status}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-[#e4dfd4] bg-white p-4 shadow-soft md:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Alamat undangan</h2>
                  <p className="mt-1 text-sm text-[#6e7a72]">
                    User hanya mengisi alamat unik. URL utama terkunci dan tidak
                    bisa diedit.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-[#eef3eb] px-3 py-2 text-xs font-semibold text-[#47604b]">
                    URL undangan
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleShareInvitation()}
                    disabled={!canShareInvitation}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#d9cdb9] px-3 text-sm font-semibold text-ink hover:bg-[#f6f4ee] disabled:cursor-not-allowed disabled:opacity-45"
                    title={
                      canShareInvitation
                        ? "Bagikan undangan"
                        : shareDisabledReason
                    }
                  >
                    <Share2 size={16} aria-hidden="true" />
                    Share
                  </button>
                </div>
              </div>
              <label className="mt-5 block">
                <span className="mb-2 block text-sm font-medium text-[#59645d]">
                  Alamat unik
                </span>
                <span className="flex min-h-12 min-w-0 flex-col overflow-hidden rounded-lg border border-[#d9cdb9] bg-white md:flex-row">
                  <span className="flex h-12 min-w-0 shrink-0 border-b border-[#e4dfd4] bg-[#f2f0ea] px-3 text-xs font-semibold text-[#757d76] md:w-[340px] md:border-b-0 md:border-r lg:w-[365px]">
                    <span className="self-center whitespace-nowrap">
                      jago-wedding.up.railway.app/undangan/
                    </span>
                  </span>
                  <input
                    className={`h-12 min-w-[180px] flex-1 bg-white px-3 text-sm font-semibold text-ink outline-none ${
                      subdomainError ? "text-[#a64f3f]" : ""
                    }`}
                    value={draftData.slug}
                    onChange={(event) => updateDraftSlug(event.target.value)}
                    aria-label="Alamat unik undangan"
                    aria-invalid={Boolean(subdomainError)}
                    aria-describedby={
                      subdomainError ? "subdomain-error" : undefined
                    }
                  />
                </span>
                <span className="mt-2 block text-xs leading-5 text-[#758178]">
                  Gunakan huruf kecil, angka, dash (-), atau & tanpa spasi.
                </span>
                {subdomainError ? (
                  <span
                    id="subdomain-error"
                    className="mt-2 block text-sm font-semibold text-[#a64f3f]"
                  >
                    {subdomainError}
                  </span>
                ) : null}
              </label>
            </section>

            <section className="rounded-lg border border-[#e4dfd4] bg-white p-4 shadow-soft md:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Detail acara</h2>
                  <p className="mt-1 text-sm text-[#6e7a72]">
                    Data mempelai, keluarga, jadwal, lokasi, dan cerita.
                  </p>
                </div>
                <button className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#e4dfd4] px-3 text-sm font-semibold hover:bg-[#f6f4ee]">
                  <CalendarDays size={16} aria-hidden="true" />
                  Jadwal
                </button>
              </div>

              <div className="mt-5 space-y-5">
                <FormField
                  label="Teks cover undangan"
                  value={draftData.heroLabel}
                  onChange={(value) => updateDraftText("heroLabel", value)}
                />

                <CoupleOrderField
                  value={draftData.coupleOrder ?? "bride-first"}
                  onChange={updateDraftCoupleOrder}
                />

                <div className="grid gap-4 lg:grid-cols-2">
                  <CoupleDetailCard
                    person="bride"
                    personData={draftData.bride}
                    title="Mempelai wanita"
                    onFieldChange={updateDraftPerson}
                    onPhotoChange={setDraftCouplePhoto}
                  />
                  <CoupleDetailCard
                    person="groom"
                    personData={draftData.groom}
                    title="Mempelai pria"
                    onFieldChange={updateDraftPerson}
                    onPhotoChange={setDraftCouplePhoto}
                  />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <TextAreaField
                    label="Pembuka penyambutan"
                    value={draftData.welcomeText}
                    onChange={(value) => updateDraftText("welcomeText", value)}
                  />
                  <TextAreaField
                    label="Kisah pasangan"
                    value={draftData.storyText}
                    onChange={(value) => updateDraftText("storyText", value)}
                  />
                </div>

                <LoveStoryEditor
                  items={draftData.loveStory.items}
                  isVisible={draftData.loveStory.isVisible}
                  onAdd={addLoveStoryItem}
                  onMove={moveLoveStoryItem}
                  onPhotoChange={setLoveStoryPhoto}
                  onPhotoRemove={removeLoveStoryPhoto}
                  onRemove={removeLoveStoryItem}
                  onToggle={updateLoveStoryVisibility}
                  onUpdate={updateLoveStoryItem}
                />

                <RundownEditor
                  items={draftData.eventRundown.items}
                  isVisible={draftData.eventRundown.isVisible}
                  onAdd={addRundownItem}
                  onMove={moveRundownItem}
                  onRemove={removeRundownItem}
                  onToggle={updateRundownVisibility}
                  onUpdate={updateRundownItem}
                />

                <div className="grid gap-4 xl:grid-cols-2">
                  <DateTimeField
                    event="ceremony"
                    label="Tanggal akad"
                    schedule={draftData.schedule.ceremony}
                    onChange={updateDraftSchedule}
                  />
                  <DateTimeField
                    event="reception"
                    label="Tanggal resepsi"
                    schedule={draftData.schedule.reception}
                    onChange={updateDraftSchedule}
                  />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <FormField
                    label="Venue"
                    value={draftData.venue}
                    onChange={(value) => updateDraftEventInfo({ venue: value })}
                  />
                  <FormField
                    label="Link Google Maps"
                    value={draftData.mapLink}
                    onChange={(value) => updateDraftEventInfo({ mapLink: value })}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-[#e4dfd4] bg-white p-4 shadow-soft md:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Rekening hadiah</h2>
                  <p className="mt-1 text-sm text-[#6e7a72]">
                    Nomor rekening hanya menerima angka agar tombol copy di
                    undangan tamu tetap akurat.
                  </p>
                </div>
                <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#e4dfd4] px-3 text-sm font-semibold text-[#59645d]">
                  <Banknote size={16} className="text-moss" aria-hidden="true" />
                  Pria & wanita
                </span>
              </div>
              <div className="mt-5 grid gap-5 xl:grid-cols-2">
                <BankAccountField
                  label="Rekening mempelai wanita"
                  bankName={draftData.bankAccounts.bride.bankName}
                  number={draftData.bankAccounts.bride.number}
                  accountName={draftData.bankAccounts.bride.accountName}
                  onBankNameChange={(value) =>
                    updateDraftBankAccount("bride", { bankName: value })
                  }
                  onNumberChange={(value) =>
                    updateDraftBankAccount("bride", { number: value })
                  }
                  onAccountNameChange={(value) =>
                    updateDraftBankAccount("bride", { accountName: value })
                  }
                />
                <BankAccountField
                  label="Rekening mempelai pria"
                  bankName={draftData.bankAccounts.groom.bankName}
                  number={draftData.bankAccounts.groom.number}
                  accountName={draftData.bankAccounts.groom.accountName}
                  onBankNameChange={(value) =>
                    updateDraftBankAccount("groom", { bankName: value })
                  }
                  onNumberChange={(value) =>
                    updateDraftBankAccount("groom", { number: value })
                  }
                  onAccountNameChange={(value) =>
                    updateDraftBankAccount("groom", { accountName: value })
                  }
                />
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

      {paymentDialog ? (
        <PaymentDialog
          dialog={paymentDialog}
          isPaying={isPaying}
          onClose={() => setPaymentDialog(null)}
          onPay={handlePayOrder}
          onRefresh={handleRefreshPayment}
        />
      ) : null}
    </main>
  );
}

type PaymentDialogState =
  | {
      errorMessage?: string;
      order?: BackendOrder;
      status: "error";
    }
  | {
      status: "loading";
    }
  | {
      order: BackendOrder;
      status: "pending";
    }
  | {
      order: BackendOrder;
      status: "ready";
    }
  | {
      invitationExpiredAt?: string;
      order: BackendOrder;
      status: "paid";
    };

type SaveDialogState = {
  description?: string;
  title: string;
  variant: "error" | "success";
};

type PublicationStep = {
  kind: "detail" | "media" | "payment" | "template";
  label: string;
  status: "Aktif" | "Menunggu" | "Selesai";
};

function PaymentDialog({
  dialog,
  isPaying,
  onClose,
  onPay,
  onRefresh,
}: {
  dialog: PaymentDialogState;
  isPaying: boolean;
  onClose: () => void;
  onPay: (order: BackendOrder) => void;
  onRefresh: (order: BackendOrder) => void;
}) {
  const isPaid = dialog.status === "paid";
  const isPending = dialog.status === "pending";
  const order = "order" in dialog ? dialog.order : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#111714]/45 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-dialog-title"
    >
      <div className="jw-rise relative w-full max-w-[430px] overflow-hidden rounded-lg border border-[#e4dfd4] bg-white shadow-[0_24px_70px_rgba(17,23,20,0.28)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#e8e3d8] bg-white/85 text-[#68746c] shadow-sm backdrop-blur hover:bg-[#f6f4ee]"
          aria-label="Tutup dialog pembayaran"
        >
          <X size={17} aria-hidden="true" />
        </button>

        <div className="bg-[#fbfaf7] px-6 pb-5 pt-6">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
                isPaid ? "bg-[#e4f2e6] text-[#3d7246]" : "bg-[#f3ead9] text-[#8a6227]"
              }`}
            >
              {isPaid ? (
                <ShieldCheck size={24} aria-hidden="true" />
              ) : (
                <CreditCard size={23} aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 pr-8">
              <p className="text-xs font-semibold uppercase text-[#8d928c]">
                Payment gateway
              </p>
              <h3
                id="payment-dialog-title"
                className="mt-1 text-xl font-semibold text-ink"
              >
                {isPaid
                  ? "Pembayaran berhasil"
                  : isPending
                    ? "Menunggu pembayaran"
                    : "Pembayaran paket undangan"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#6e7a72]">
                VA, QRIS, e-wallet, dan kartu kredit dibuat lewat Midtrans
                sandbox. Paket aktif 30 hari setelah pembayaran berhasil.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          {dialog.status === "loading" ? (
            <div className="flex items-center gap-3 rounded-lg border border-[#e8e3d8] bg-[#fbfaf7] px-4 py-4 text-sm text-[#6e7a72]">
              <Loader2 className="animate-spin text-[#bd8b32]" size={18} />
              Menyiapkan order pembayaran...
            </div>
          ) : null}

          {order ? (
            <div className="rounded-lg border border-[#e8e3d8] bg-[#fbfaf7] px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-[#6e7a72]">Order code</span>
                <span className="text-sm font-semibold text-ink">
                  {order.orderCode}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-sm text-[#6e7a72]">Total bayar</span>
                <span className="text-lg font-semibold text-ink">
                  {formatRupiah(order.amount)}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-sm text-[#6e7a72]">Status</span>
                <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold uppercase text-[#8a6227]">
                  {order.status}
                </span>
              </div>
            </div>
          ) : null}

          {order && dialog.status === "ready" ? (
            <div className="rounded-lg border border-[#e8e3d8] bg-white px-4 py-4 text-sm leading-6 text-[#59645d]">
              Klik tombol bayar untuk membuka Snap. User bisa memilih Virtual
              Account, bank transfer, QRIS/e-wallet, atau kartu kredit sandbox.
            </div>
          ) : null}

          {dialog.status === "pending" ? (
            <div className="rounded-lg border border-[#f0dfbd] bg-[#fff9ec] px-4 py-4 text-sm leading-6 text-[#8a6227]">
              Instruksi pembayaran sudah dibuat di Midtrans. Selesaikan
              pembayaran di simulator sandbox, lalu cek status pembayaran dari
              dialog ini.
            </div>
          ) : null}

          {dialog.status === "paid" ? (
            <div className="rounded-lg border border-[#dbe9dc] bg-[#f0f8f1] px-4 py-4 text-sm leading-6 text-[#3d7246]">
              Undangan sudah aktif sampai{" "}
              <span className="font-semibold">
                {formatDateLabel(dialog.invitationExpiredAt)}
              </span>
              .
            </div>
          ) : null}

          {dialog.status === "error" ? (
            <div className="rounded-lg border border-[#efd2cc] bg-[#fff5f2] px-4 py-4 text-sm leading-6 text-[#a64f3f]">
              {dialog.errorMessage ?? "Pembayaran belum berhasil diproses."}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#e8e3d8] bg-white px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[#e4dfd4] px-4 text-sm font-semibold text-[#59645d] hover:bg-[#f6f4ee]"
          >
            {isPaid ? "Tutup" : "Nanti dulu"}
          </button>
          {order && dialog.status === "pending" ? (
            <>
              <button
                type="button"
                onClick={() => onRefresh(order)}
                disabled={isPaying}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#e4dfd4] px-4 text-sm font-semibold text-[#59645d] hover:bg-[#f6f4ee] disabled:cursor-wait disabled:text-[#8b928b]"
              >
                {isPaying ? (
                  <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                ) : (
                  <ShieldCheck size={16} aria-hidden="true" />
                )}
                Cek status
              </button>
              <button
                type="button"
                onClick={() => onPay(order)}
                disabled={isPaying}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white hover:bg-[#1c2421] disabled:cursor-wait disabled:bg-[#59645d]"
              >
                <CreditCard size={16} aria-hidden="true" />
                Buka pembayaran lagi
              </button>
            </>
          ) : order && dialog.status !== "paid" ? (
            <button
              type="button"
              onClick={() => onPay(order)}
              disabled={isPaying}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white hover:bg-[#1c2421] disabled:cursor-wait disabled:bg-[#59645d]"
            >
              {isPaying ? (
                <Loader2 className="animate-spin" size={16} aria-hidden="true" />
              ) : (
                <CreditCard size={16} aria-hidden="true" />
              )}
              {isPaying ? "Memproses..." : "Bayar via Midtrans"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  onChange,
  value,
  icon: Icon,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
  icon?: typeof Banknote;
}) {
  return (
    <label>
      <span className="mb-2 flex items-center gap-2 text-sm font-medium text-[#59645d]">
        {Icon ? <Icon size={16} className="text-moss" aria-hidden="true" /> : null}
        {label}
      </span>
      <input
        className="block min-h-11 w-full rounded-lg border border-[#e4dfd4] bg-[#fbfaf7] px-3 py-3 text-sm font-semibold text-ink outline-none focus:border-[#bd8b32]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function CoupleOrderField({
  onChange,
  value,
}: {
  onChange: (value: CoupleOrder) => void;
  value: CoupleOrder;
}) {
  const options: Array<{ label: string; value: CoupleOrder }> = [
    { label: "Wanita dulu", value: "bride-first" },
    { label: "Pria dulu", value: "groom-first" },
  ];

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-[#59645d]">
        Urutan nama di undangan
      </legend>
      <div className="grid gap-2 rounded-lg border border-[#e4dfd4] bg-[#fbfaf7] p-1 sm:grid-cols-2">
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`h-10 rounded-md px-3 text-sm font-semibold transition ${
                isSelected
                  ? "bg-ink text-white shadow-sm"
                  : "text-[#59645d] hover:bg-white"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function DateTimeField({
  event,
  label,
  onChange,
  schedule,
}: {
  event: keyof WeddingData["schedule"];
  label: string;
  onChange: (
    event: keyof WeddingData["schedule"],
    patch: Partial<WeddingData["schedule"]["ceremony"]>,
  ) => void;
  schedule: WeddingData["schedule"]["ceremony"];
}) {
  return (
    <fieldset className="rounded-lg border border-[#e8e3d8] bg-[#fbfaf7] p-3">
      <legend className="px-1 text-sm font-medium text-[#59645d]">
        {label}
      </legend>
      <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px]">
        <label>
          <span className="sr-only">Tanggal {label}</span>
          <input
            type="date"
            className="block min-h-11 w-full rounded-lg border border-[#e4dfd4] bg-white px-3 py-3 text-sm font-semibold text-ink outline-none focus:border-[#bd8b32]"
            value={schedule.date}
            onChange={(inputEvent) =>
              onChange(event, { date: inputEvent.target.value })
            }
          />
        </label>
        <label>
          <span className="sr-only">Jam {label}</span>
          <input
            type="time"
            className="block min-h-11 w-full rounded-lg border border-[#e4dfd4] bg-white px-3 py-3 text-sm font-semibold text-ink outline-none focus:border-[#bd8b32]"
            value={schedule.time}
            onChange={(inputEvent) =>
              onChange(event, { time: inputEvent.target.value })
            }
          />
        </label>
      </div>
    </fieldset>
  );
}

function CoupleDetailCard({
  onFieldChange,
  onPhotoChange,
  person,
  personData,
  title,
}: {
  onFieldChange: (
    person: PersonKey,
    field: keyof Omit<WeddingData["bride"], "photo">,
    value: string,
  ) => void;
  onPhotoChange: (person: PersonKey, asset: PhotoAsset) => void;
  person: PersonKey;
  personData: WeddingData["bride"];
  title: string;
}) {
  return (
    <div className="rounded-lg border border-[#e8e3d8] bg-[#fbfaf7] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <UserRound size={17} className="text-moss" aria-hidden="true" />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <CouplePhotoUpload
            label={`Foto ${title.toLowerCase()}`}
            value={personData.photo}
            onChange={(asset) => onPhotoChange(person, asset)}
          />
        </div>
        <div className="sm:col-span-2">
          <FormField
            label="Nama lengkap"
            value={personData.name}
            onChange={(value) => onFieldChange(person, "name", value)}
          />
        </div>
        <FormField
          label="Nama ayah"
          value={personData.father}
          onChange={(value) => onFieldChange(person, "father", value)}
        />
        <FormField
          label="Nama ibu"
          value={personData.mother}
          onChange={(value) => onFieldChange(person, "mother", value)}
        />
      </div>
    </div>
  );
}

function LoveStoryEditor({
  isVisible,
  items,
  onAdd,
  onMove,
  onPhotoChange,
  onPhotoRemove,
  onRemove,
  onToggle,
  onUpdate,
}: {
  isVisible: boolean;
  items: LoveStoryItem[];
  onAdd: () => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onPhotoChange: (id: string, asset: PhotoAsset) => void;
  onPhotoRemove: (item: LoveStoryItem) => void;
  onRemove: (item: LoveStoryItem) => void;
  onToggle: (isVisible: boolean) => void;
  onUpdate: (id: string, patch: Partial<Omit<LoveStoryItem, "id">>) => void;
}) {
  return (
    <section className="rounded-lg border border-[#e8e3d8] bg-[#fbfaf7] p-4">
      <SectionToggleHeader
        description="Tambahkan momen penting seperti awal kenal, pacaran, lamaran, sampai hari pernikahan."
        icon={Heart}
        isVisible={isVisible}
        onAdd={onAdd}
        onToggle={onToggle}
        title="Perjalanan cinta"
      />

      {isVisible && items.length === 0 ? (
        <EmptyEditorHint text="Section ini aktif, tapi belum ada momen yang ditambahkan." />
      ) : null}

      <div className="mt-4 space-y-4">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="rounded-lg border border-[#e4dfd4] bg-white p-3"
          >
            <ItemToolbar
              index={index}
              itemCount={items.length}
              label={`Momen ${index + 1}`}
              onMoveDown={() => onMove(item.id, 1)}
              onMoveUp={() => onMove(item.id, -1)}
              onRemove={() => onRemove(item)}
            />

            <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px]">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FormField
                    label="Judul momen"
                    value={item.title}
                    onChange={(value) => onUpdate(item.id, { title: value })}
                  />
                </div>
                <DateInputField
                  label="Tanggal"
                  value={item.date}
                  onChange={(value) => onUpdate(item.id, { date: value })}
                />
                <div className="sm:col-span-2">
                  <TextAreaField
                    label="Cerita singkat"
                    minHeightClassName="min-h-28"
                    value={item.description}
                    onChange={(value) =>
                      onUpdate(item.id, { description: value })
                    }
                  />
                </div>
              </div>
              <LoveStoryPhotoField
                item={item}
                onChange={(asset) => onPhotoChange(item.id, asset)}
                onRemove={() => onPhotoRemove(item)}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RundownEditor({
  isVisible,
  items,
  onAdd,
  onMove,
  onRemove,
  onToggle,
  onUpdate,
}: {
  isVisible: boolean;
  items: RundownItem[];
  onAdd: () => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onRemove: (id: string) => void;
  onToggle: (isVisible: boolean) => void;
  onUpdate: (id: string, patch: Partial<Omit<RundownItem, "id">>) => void;
}) {
  return (
    <section className="rounded-lg border border-[#e8e3d8] bg-[#fbfaf7] p-4">
      <SectionToggleHeader
        description="Isi bebas untuk semua format acara, misalnya akad, pemberkatan, tea pai, resepsi, atau jamuan makan malam."
        icon={Clock}
        isVisible={isVisible}
        onAdd={onAdd}
        onToggle={onToggle}
        title="Rundown acara"
      />

      {isVisible && items.length === 0 ? (
        <EmptyEditorHint text="Section ini aktif, tapi belum ada agenda acara." />
      ) : null}

      <div className="mt-4 space-y-4">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="rounded-lg border border-[#e4dfd4] bg-white p-3"
          >
            <ItemToolbar
              index={index}
              itemCount={items.length}
              label={`Agenda ${index + 1}`}
              onMoveDown={() => onMove(item.id, 1)}
              onMoveUp={() => onMove(item.id, -1)}
              onRemove={() => onRemove(item.id)}
            />

            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <FormField
                  label="Nama acara"
                  value={item.title}
                  onChange={(value) => onUpdate(item.id, { title: value })}
                />
              </div>
              <DateInputField
                label="Tanggal"
                value={item.date}
                onChange={(value) => onUpdate(item.id, { date: value })}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <TimeInputField
                  label="Jam mulai"
                  value={item.startTime}
                  onChange={(value) => onUpdate(item.id, { startTime: value })}
                />
                <TimeInputField
                  label="Jam selesai"
                  value={item.endTime}
                  onChange={(value) => onUpdate(item.id, { endTime: value })}
                />
              </div>
              <div className="lg:col-span-2">
                <FormField
                  label="Lokasi"
                  value={item.location}
                  onChange={(value) => onUpdate(item.id, { location: value })}
                />
              </div>
              <div className="lg:col-span-2">
                <TextAreaField
                  label="Catatan"
                  minHeightClassName="min-h-24"
                  value={item.description}
                  onChange={(value) => onUpdate(item.id, { description: value })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionToggleHeader({
  description,
  icon: Icon,
  isVisible,
  onAdd,
  onToggle,
  title,
}: {
  description: string;
  icon: typeof Heart;
  isVisible: boolean;
  onAdd: () => void;
  onToggle: (isVisible: boolean) => void;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
      <div className="min-w-0">
        <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
          <Icon size={18} className="text-[#bd8b32]" aria-hidden="true" />
          {title}
        </h3>
        <p className="mt-1 text-sm leading-6 text-[#6e7a72]">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onToggle(!isVisible)}
          className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold ${
            isVisible
              ? "border-[#d4e6d5] bg-[#eef8ef] text-[#3d7246]"
              : "border-[#e4dfd4] bg-white text-[#59645d]"
          }`}
        >
          {isVisible ? (
            <Eye size={16} aria-hidden="true" />
          ) : (
            <EyeOff size={16} aria-hidden="true" />
          )}
          {isVisible ? "Ditampilkan" : "Disembunyikan"}
        </button>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-ink px-3 text-sm font-semibold text-white hover:bg-[#1c2421]"
        >
          <Plus size={16} aria-hidden="true" />
          Tambah item
        </button>
      </div>
    </div>
  );
}

function ItemToolbar({
  index,
  itemCount,
  label,
  onMoveDown,
  onMoveUp,
  onRemove,
}: {
  index: number;
  itemCount: number;
  label: string;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm font-semibold text-ink">{label}</p>
      <div className="flex items-center gap-2">
        <IconButton
          disabled={index === 0}
          label="Naikkan item"
          onClick={onMoveUp}
        >
          <ArrowUp size={15} aria-hidden="true" />
        </IconButton>
        <IconButton
          disabled={index === itemCount - 1}
          label="Turunkan item"
          onClick={onMoveDown}
        >
          <ArrowDown size={15} aria-hidden="true" />
        </IconButton>
        <IconButton label="Hapus item" onClick={onRemove} tone="danger">
          <Trash2 size={15} aria-hidden="true" />
        </IconButton>
      </div>
    </div>
  );
}

function IconButton({
  children,
  disabled = false,
  label,
  onClick,
  tone = "neutral",
}: {
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  tone?: "danger" | "neutral";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm disabled:cursor-not-allowed disabled:opacity-40 ${
        tone === "danger"
          ? "border-[#efd2cc] text-[#a64f3f] hover:bg-[#fff5f2]"
          : "border-[#e4dfd4] text-[#59645d] hover:bg-[#f6f4ee]"
      }`}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

function LoveStoryPhotoField({
  item,
  onChange,
  onRemove,
}: {
  item: LoveStoryItem;
  onChange: (asset: PhotoAsset) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function uploadPhoto(file?: File) {
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
    <div className="rounded-lg border border-dashed border-[#d6cab7] bg-[#fbfaf7] p-3">
      <span className="mb-2 flex items-center gap-2 text-sm font-medium text-[#59645d]">
        <ImageIcon size={16} className="text-moss" aria-hidden="true" />
        Foto momen
      </span>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="flex min-h-40 w-full items-center justify-center overflow-hidden rounded-lg border border-[#e4dfd4] bg-white text-sm font-semibold text-[#758178] hover:bg-[#f6f4ee] disabled:cursor-wait"
      >
        {item.photo ? (
          // Uploaded image URLs are served by the Go backend.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.photo.url}
            alt={item.photo.name}
            className="h-full max-h-52 w-full object-cover"
          />
        ) : (
          <span className="flex flex-col items-center gap-2 px-3">
            <UploadCloud size={22} className="text-[#bd8b32]" aria-hidden="true" />
            {isUploading ? "Upload..." : "Pilih foto"}
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(event) => void uploadPhoto(event.target.files?.[0])}
        aria-label="Upload foto perjalanan cinta"
      />
      {item.photo ? (
        <button
          type="button"
          onClick={onRemove}
          className="mt-2 inline-flex h-8 items-center justify-center gap-2 rounded-lg border border-[#efd2cc] px-3 text-xs font-semibold text-[#a64f3f] hover:bg-[#fff5f2]"
        >
          <Trash2 size={14} aria-hidden="true" />
          Hapus foto
        </button>
      ) : null}
      {uploadError ? (
        <p className="mt-2 text-xs font-semibold text-[#a64f3f]">
          {uploadError}
        </p>
      ) : null}
    </div>
  );
}

function TimeInputField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-medium text-[#59645d]">
        {label}
      </span>
      <input
        type="time"
        className="block min-h-11 w-full rounded-lg border border-[#e4dfd4] bg-[#fbfaf7] px-3 py-3 text-sm font-semibold text-ink outline-none focus:border-[#bd8b32]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function DateInputField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-medium text-[#59645d]">
        {label}
      </span>
      <input
        type="date"
        className="block min-h-11 w-full rounded-lg border border-[#e4dfd4] bg-[#fbfaf7] px-3 py-3 text-sm font-semibold text-ink outline-none focus:border-[#bd8b32]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function EmptyEditorHint({ text }: { text: string }) {
  return (
    <div className="mt-4 rounded-lg border border-[#f0dfbd] bg-[#fff9ec] px-3 py-3 text-sm font-semibold text-[#8a6227]">
      {text}
    </div>
  );
}

function TextAreaField({
  label,
  minHeightClassName = "min-h-32",
  onChange,
  value,
}: {
  label: string;
  minHeightClassName?: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label>
      <span className="mb-2 flex items-center gap-2 text-sm font-medium text-[#59645d]">
        <BookOpenText size={16} className="text-moss" aria-hidden="true" />
        {label}
      </span>
      <textarea
        className={`block w-full resize-none rounded-lg border border-[#e4dfd4] bg-[#fbfaf7] px-3 py-3 text-sm font-semibold text-ink outline-none focus:border-[#bd8b32] ${minHeightClassName}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function createLocalId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function moveItemById<T extends { id: string }>(
  items: T[],
  id: string,
  direction: -1 | 1,
) {
  const currentIndex = items.findIndex((item) => item.id === id);
  const nextIndex = currentIndex + direction;
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= items.length) {
    return items;
  }

  const nextItems = [...items];
  const [item] = nextItems.splice(currentIndex, 1);
  nextItems.splice(nextIndex, 0, item);

  return nextItems;
}

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || "Mempelai";
}

function getCoupleTitle(data: WeddingData) {
  const isGroomFirst = data.coupleOrder === "groom-first";
  const firstName = getFirstName(isGroomFirst ? data.groom.name : data.bride.name);
  const secondName = getFirstName(isGroomFirst ? data.bride.name : data.groom.name);

  return `${firstName} & ${secondName}`;
}

function getPublicationSteps(
  data: WeddingData,
  invitationMeta: InvitationMeta | null,
): PublicationStep[] {
  const checklist = [
    {
      complete: Boolean(data.template.saved),
      kind: "template" as const,
      label: "Template",
    },
    {
      complete:
        Boolean(data.slug.trim()) &&
        Boolean(data.heroLabel.trim()) &&
        Boolean(data.bride.name.trim()) &&
        Boolean(data.bride.father.trim()) &&
        Boolean(data.bride.mother.trim()) &&
        Boolean(data.groom.name.trim()) &&
        Boolean(data.groom.father.trim()) &&
        Boolean(data.groom.mother.trim()) &&
        Boolean(data.welcomeText.trim()) &&
        Boolean(data.storyText.trim()) &&
        Boolean(data.schedule.ceremony.date) &&
        Boolean(data.schedule.ceremony.time) &&
        Boolean(data.schedule.reception.date) &&
        Boolean(data.schedule.reception.time) &&
        Boolean(data.venue.trim()) &&
        Boolean(data.mapLink.trim()) &&
        Boolean(data.bankAccounts.bride.bankName.trim()) &&
        Boolean(data.bankAccounts.bride.number.trim()) &&
        Boolean(data.bankAccounts.bride.accountName.trim()) &&
        Boolean(data.bankAccounts.groom.bankName.trim()) &&
        Boolean(data.bankAccounts.groom.number.trim()) &&
        Boolean(data.bankAccounts.groom.accountName.trim()),
      kind: "detail" as const,
      label: "Detail",
    },
    {
      complete:
        Boolean(data.photos.cover) &&
        data.photos.gallery.length > 0 &&
        Boolean(data.music.youtubeUrl.trim()),
      kind: "media" as const,
      label: "Media",
    },
    {
      complete:
        invitationMeta?.paymentStatus === "paid" &&
        invitationMeta.status === "active" &&
        !isExpired(invitationMeta.expiredAt),
      kind: "payment" as const,
      label: "Pembayaran",
    },
  ];
  let activeStepWasSet = false;

  return checklist.map((step) => {
    if (step.complete) {
      return { kind: step.kind, label: step.label, status: "Selesai" };
    }

    if (!activeStepWasSet) {
      activeStepWasSet = true;

      return { kind: step.kind, label: step.label, status: "Aktif" };
    }

    return { kind: step.kind, label: step.label, status: "Menunggu" };
  });
}

function isExpired(expiredAt?: string) {
  if (!expiredAt) return false;

  const expiredTime = Date.parse(expiredAt);

  return !Number.isNaN(expiredTime) && Date.now() >= expiredTime;
}

function getPublicInvitationUrl(slug: string) {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) return "";

  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ?? "https://jago-wedding.up.railway.app"
  ).replace(/\/$/, "");

  return `${appUrl}/undangan/${encodeURIComponent(normalizedSlug)}`;
}

function getShareDisabledReason(
  invitationMeta: InvitationMeta | null,
  slug: string,
) {
  if (!slug.trim()) {
    return "Isi subdomain dulu sebelum membagikan undangan.";
  }

  if (!invitationMeta) {
    return "Data undangan belum selesai dimuat.";
  }

  if (invitationMeta.status === "expired" || isExpired(invitationMeta.expiredAt)) {
    return "Masa aktif undangan sudah habis. Perpanjang paket untuk membagikan.";
  }

  if (invitationMeta.paymentStatus !== "paid") {
    return "Bayar paket dulu agar undangan bisa dibagikan.";
  }

  return "Undangan belum aktif.";
}

function formatDateLabel(dateValue?: string) {
  if (!dateValue) return "-";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    timeZone: "Asia/Jakarta",
    year: "numeric",
  }).format(date);
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    currency: "IDR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function isAttending(status: string) {
  const normalizedStatus = status.toLowerCase();

  return (
    !normalizedStatus.includes("tidak") &&
    (normalizedStatus.includes("hadir") ||
      normalizedStatus.includes("attend") ||
      normalizedStatus === "yes")
  );
}

function isNotAttending(status: string) {
  const normalizedStatus = status.toLowerCase();

  return (
    normalizedStatus.includes("tidak") ||
    normalizedStatus.includes("decline") ||
    normalizedStatus === "no"
  );
}
