"use client";

import { useEffect, useRef, useState } from "react";
import {
  Banknote,
  BookOpenText,
  CalendarDays,
  Check,
  CreditCard,
  Loader2,
  Save,
  Share2,
  ShieldCheck,
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
  type BackendOrder,
  type BackendRSVP,
} from "@/lib/backend-api";
import { payWithMidtransSnap } from "@/lib/midtrans-snap";
import type {
  BankAccountKey,
  CoupleOrder,
  InvitationMeta,
  PersonKey,
  PhotoAsset,
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
    setDraftData((current) => ({
      ...current,
      slug,
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
      const invitation = await saveWeddingDataToBackend(draftData);
      setInvitationMeta(invitation);
      setWeddingData(invitation.data);
      setDraftData(invitation.data);
      setSubdomainError(null);
      setSaveDialog({ title: "Berhasil tersimpan", variant: "success" });
    } catch (error) {
      const message = getBackendErrorMessage(error);
      if (
        error instanceof BackendApiError &&
        (error.status === 400 || error.status === 409) &&
        message.toLowerCase().includes("subdomain")
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
                    User hanya mengisi subdomain. Domain utama terkunci dan tidak
                    bisa diedit.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-[#eef3eb] px-3 py-2 text-xs font-semibold text-[#47604b]">
                    Subdomain aktif
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
                  Subdomain
                </span>
                <span className="flex min-h-12 min-w-0 overflow-hidden rounded-lg border border-[#d9cdb9] bg-white">
                  <input
                    className={`min-w-0 flex-1 bg-white px-3 text-sm font-semibold text-ink outline-none ${
                      subdomainError ? "text-[#a64f3f]" : ""
                    }`}
                    value={draftData.slug}
                    onChange={(event) => updateDraftSlug(event.target.value)}
                    aria-label="Subdomain"
                    aria-invalid={Boolean(subdomainError)}
                    aria-describedby={
                      subdomainError ? "subdomain-error" : undefined
                    }
                  />
                  <input
                    className="w-[215px] shrink-0 border-l border-[#e4dfd4] bg-[#f2f0ea] px-3 text-sm font-semibold text-[#757d76]"
                    defaultValue=".jago-wedding.up.railway.app"
                    aria-label="Domain utama terkunci"
                    disabled
                  />
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

function TextAreaField({
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
      <span className="mb-2 flex items-center gap-2 text-sm font-medium text-[#59645d]">
        <BookOpenText size={16} className="text-moss" aria-hidden="true" />
        {label}
      </span>
      <textarea
        className="block min-h-32 w-full resize-none rounded-lg border border-[#e4dfd4] bg-[#fbfaf7] px-3 py-3 text-sm font-semibold text-ink outline-none focus:border-[#bd8b32]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
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

  const publicDomain =
    process.env.NEXT_PUBLIC_PUBLIC_INVITATION_DOMAIN ??
    "jago-wedding.up.railway.app";

  return `https://${normalizedSlug}.${publicDomain}`;
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
