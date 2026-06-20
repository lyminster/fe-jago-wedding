"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  Banknote,
  Building2,
  CalendarDays,
  Heart,
  MailOpen,
  MapPin,
  Pause,
  Play,
  Send,
  Share2,
} from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import type {
  InvitationMeta,
  InvitationTemplate,
  PhotoAsset,
} from "@/components/wedding-data-store";
import { useWeddingDataStore } from "@/components/wedding-data-store";
import {
  getGoogleMapEmbedSrc,
  isGoogleMapsShortLink,
} from "@/lib/google-maps";

const fallbackGallery: PhotoAsset[] = [
];

export type GuestComment = {
  id: string;
  message: string;
  name: string;
  submittedAt: string;
};

export type RsvpPayload = {
  attendanceStatus: string;
  guestCount: number;
  guestName: string;
  reason: string;
};

const initialComments: GuestComment[] = [];

const templateStyles: Record<
  InvitationTemplate,
  {
    accentText: string;
    cardBg: string;
    cardShape: string;
    countdownBg: string;
    countdownCard: string;
    effect: "classic" | "minimalist" | "floral" | "modern";
    frameBg: string;
    galleryShape: string;
    heroContent: string;
    heroDateClass: string;
    heroEyebrowClass: string;
    heroImage: string;
    heroOverlay: string;
    heroSection: string;
    heroTitleClass: string;
    primaryButton: string;
    sectionTitleClass: string;
    surfaceBg: string;
  }
> = {
  classic: {
    accentText: "text-[#bd8b32]",
    cardBg: "bg-[#f6f4ee]",
    cardShape: "rounded-lg border border-[#eee8dc]",
    countdownBg: "bg-[#130a2a]",
    countdownCard: "rounded-[18px]",
    effect: "classic",
    frameBg: "bg-[#ece8dd]",
    galleryShape: "rounded-lg",
    heroContent: "pb-8 text-center",
    heroDateClass: "mt-3 text-sm text-white/85",
    heroEyebrowClass: "text-xs font-semibold uppercase tracking-[0.12em]",
    heroImage: "/images/template-classic.png",
    heroOverlay: "bg-gradient-to-b from-white/20 via-transparent to-[#202620]/80",
    heroSection: "items-end",
    heroTitleClass: "wedding-editorial mt-3 text-4xl leading-none",
    primaryButton: "bg-[#bd8b32] text-white",
    sectionTitleClass: "text-xs font-semibold uppercase",
    surfaceBg: "bg-white",
  },
  minimalist: {
    accentText: "text-[#6f7f68]",
    cardBg: "bg-white",
    cardShape: "rounded-none border-y border-[#dfe7df]",
    countdownBg: "bg-[#eaf0ea]",
    countdownCard: "rounded-none border border-[#d4ded5]",
    effect: "minimalist",
    frameBg: "bg-[#edf1ee]",
    galleryShape: "rounded-none",
    heroContent: "pb-10 text-left",
    heroDateClass: "mt-5 border-l border-white/60 pl-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/88",
    heroEyebrowClass: "text-[11px] font-semibold uppercase tracking-[0.28em]",
    heroImage: "/images/template-minimalist.png",
    heroOverlay: "bg-gradient-to-b from-white/35 via-transparent to-[#2f3b35]/72",
    heroSection: "items-end",
    heroTitleClass: "wedding-modern mt-4 text-5xl font-light uppercase leading-none tracking-[0.08em]",
    primaryButton: "bg-[#6f7f68] text-white",
    sectionTitleClass: "text-[11px] font-semibold uppercase tracking-[0.22em]",
    surfaceBg: "bg-[#fbfcfa]",
  },
  floral: {
    accentText: "text-[#b95573]",
    cardBg: "bg-[#fff1f4]",
    cardShape: "rounded-[24px] border border-[#f3ccd8]",
    countdownBg: "bg-[#381324]",
    countdownCard: "rounded-[28px]",
    effect: "floral",
    frameBg: "bg-[#f7e7ec]",
    galleryShape: "rounded-[24px]",
    heroContent: "pb-10 text-center",
    heroDateClass: "wedding-editorial mt-4 text-sm italic text-white/90",
    heroEyebrowClass: "text-[11px] font-semibold uppercase tracking-[0.18em]",
    heroImage: "/images/template-floral.png",
    heroOverlay: "bg-gradient-to-b from-[#fff1f4]/35 via-transparent to-[#4b1428]/80",
    heroSection: "items-end",
    heroTitleClass: "wedding-script mt-4 text-6xl leading-[0.82]",
    primaryButton: "bg-[#b95573] text-white",
    sectionTitleClass: "wedding-script text-3xl leading-none",
    surfaceBg: "bg-[#fff8f9]",
  },
  modern: {
    accentText: "text-[#d6a348]",
    cardBg: "bg-[#ece8dd]",
    cardShape: "rounded-sm border border-[#343a34]",
    countdownBg: "bg-[#111714]",
    countdownCard: "rounded-sm border border-[#c7a35c]",
    effect: "modern",
    frameBg: "bg-[#ded8ca]",
    galleryShape: "rounded-sm",
    heroContent: "pb-8 text-left",
    heroDateClass: "mt-5 inline-block border border-white/35 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white",
    heroEyebrowClass: "text-[10px] font-bold uppercase tracking-[0.32em]",
    heroImage: "/images/template-modern.png",
    heroOverlay: "bg-gradient-to-b from-black/10 via-transparent to-black/88",
    heroSection: "items-end",
    heroTitleClass: "wedding-modern mt-4 text-5xl font-black uppercase leading-[0.9] tracking-[0.04em]",
    primaryButton: "bg-[#26312d] text-white",
    sectionTitleClass: "text-[11px] font-black uppercase tracking-[0.22em]",
    surfaceBg: "bg-[#f3efe5]",
  },
};

type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getCountdown(targetDate: number | null): Countdown {
  if (!targetDate) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  const distance = Math.max(targetDate - Date.now(), 0);

  return {
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((distance / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((distance / (1000 * 60)) % 60),
    seconds: Math.floor((distance / 1000) % 60),
  };
}

function useCountdown(targetDate: number | null) {
  const [countdown, setCountdown] = useState<Countdown>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    setCountdown(getCountdown(targetDate));
    const interval = window.setInterval(() => {
      setCountdown(getCountdown(targetDate));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [targetDate]);

  return countdown;
}

export function LiveInvitationPreview({
  guestComments,
  onGuestCommentSubmit,
  onRsvpSubmit,
  recipientName = "Tamu Undangan",
  template,
  variant = "dashboard",
}: {
  guestComments?: GuestComment[];
  onGuestCommentSubmit?: (payload: {
    message: string;
    name: string;
  }) => Promise<GuestComment>;
  onRsvpSubmit?: (payload: RsvpPayload) => Promise<void>;
  recipientName?: string;
  template?: InvitationTemplate;
  variant?: "dashboard" | "standalone";
}) {
  const { data, invitationMeta } = useWeddingDataStore();
  const activeTemplate = template ?? data.template.draft;
  const style = templateStyles[activeTemplate];
  const isStandalone = variant === "standalone";
  const countdown = useCountdown(getScheduleTimestamp(data.schedule.reception));
  const scrollerRef = useRef<HTMLDivElement>(null);
  const musicIframeRef = useRef<HTMLIFrameElement>(null);
  const musicRetryTimerRef = useRef<number | null>(null);
  const wantsMusicPlayingRef = useRef(false);
  const [comments, setComments] = useState<GuestComment[]>(initialComments);
  const [commentName, setCommentName] = useState("");
  const [commentMessage, setCommentMessage] = useState("");
  const [guestName, setGuestName] = useState("");
  const [attendanceStatus, setAttendanceStatus] = useState("");
  const [guestCount, setGuestCount] = useState("1");
  const [attendanceReason, setAttendanceReason] = useState("");
  const [rsvpStatus, setRsvpStatus] = useState<"error" | "success" | null>(null);
  const [rsvpMessage, setRsvpMessage] = useState("");
  const [commentStatus, setCommentStatus] = useState<"error" | "success" | null>(
    null,
  );
  const [commentStatusMessage, setCommentStatusMessage] = useState("");
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isInvitationOpened, setIsInvitationOpened] = useState(false);
  const [shouldLoadMusic, setShouldLoadMusic] = useState(() =>
    Boolean(getYoutubeVideoId(data.music.youtubeUrl)),
  );
  const [mapEmbedSrc, setMapEmbedSrc] = useState(() =>
    getGoogleMapEmbedSrc(data.mapLink),
  );
  const coupleOrder = data.coupleOrder ?? "bride-first";
  const isBrideFirst = coupleOrder !== "groom-first";
  const firstPerson = isBrideFirst ? data.bride : data.groom;
  const secondPerson = isBrideFirst ? data.groom : data.bride;
  const firstFirstName = getFirstName(firstPerson.name);
  const secondFirstName = getFirstName(secondPerson.name);
  const orderedCoupleCards = isBrideFirst
    ? [
        {
          father: data.bride.father,
          mother: data.bride.mother,
          name: data.bride.name,
          photo: data.bride.photo,
          relation: "Putri dari",
        },
        {
          father: data.groom.father,
          mother: data.groom.mother,
          name: data.groom.name,
          photo: data.groom.photo,
          relation: "Putra dari",
        },
      ]
    : [
        {
          father: data.groom.father,
          mother: data.groom.mother,
          name: data.groom.name,
          photo: data.groom.photo,
          relation: "Putra dari",
        },
        {
          father: data.bride.father,
          mother: data.bride.mother,
          name: data.bride.name,
          photo: data.bride.photo,
          relation: "Putri dari",
        },
      ];
  const orderedAccounts = isBrideFirst
    ? [
        {
          account: data.bankAccounts.bride,
          label: "Mempelai wanita",
        },
        {
          account: data.bankAccounts.groom,
          label: "Mempelai pria",
        },
      ]
    : [
        {
          account: data.bankAccounts.groom,
          label: "Mempelai pria",
        },
        {
          account: data.bankAccounts.bride,
          label: "Mempelai wanita",
        },
      ];
  const heroLabel = data.heroLabel.trim() || "The Wedding Of";
  const shareUrl = getPublicInvitationUrl(data.slug);
  const galleryPhotos =
    data.photos.gallery.length > 0 ? data.photos.gallery : fallbackGallery;
  const gallerySignature = galleryPhotos.map((photo) => photo.url).join("|");
  const heroImage = data.photos.cover?.url ?? style.heroImage;
  const [youtubeOrigin, setYoutubeOrigin] = useState("");
  const youtubeAutoplaySrc = getYoutubeAutoplaySrc(
    data.music.youtubeUrl,
    youtubeOrigin,
  );
  const canShareInvitation = isInvitationPubliclyActive(invitationMeta);
  const shareDisabledReason = getShareDisabledReason(invitationMeta);

  const sendYoutubeCommand = useCallback(
    (command: "pauseVideo" | "playVideo" | "unMute") => {
      musicIframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({
          event: "command",
          func: command,
          args: [],
        }),
        "https://www.youtube.com",
      );
    },
    [],
  );

  const clearMusicRetry = useCallback(() => {
    if (musicRetryTimerRef.current) {
      window.clearTimeout(musicRetryTimerRef.current);
      musicRetryTimerRef.current = null;
    }
  }, []);

  const pauseMusic = useCallback(() => {
    wantsMusicPlayingRef.current = false;
    clearMusicRetry();
    sendYoutubeCommand("pauseVideo");
    setIsMusicPlaying(false);
  }, [clearMusicRetry, sendYoutubeCommand]);

  const startMusic = useCallback(
    ({ retryAfterMs = 0 } = {}) => {
      if (youtubeAutoplaySrc === "about:blank") {
        pauseMusic();
        return;
      }

      wantsMusicPlayingRef.current = true;
      setShouldLoadMusic(true);
      sendYoutubeCommand("playVideo");
      sendYoutubeCommand("unMute");
      setIsMusicPlaying(true);

      clearMusicRetry();

      if (retryAfterMs > 0) {
        musicRetryTimerRef.current = window.setTimeout(() => {
          if (!wantsMusicPlayingRef.current) return;

          sendYoutubeCommand("playVideo");
          sendYoutubeCommand("unMute");
          musicRetryTimerRef.current = null;
        }, retryAfterMs);
      }
    },
    [clearMusicRetry, pauseMusic, sendYoutubeCommand, youtubeAutoplaySrc],
  );

  useEffect(() => {
    setYoutubeOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    return () => {
      clearMusicRetry();
    };
  }, [clearMusicRetry]);

  useEffect(() => {
    wantsMusicPlayingRef.current = false;
    clearMusicRetry();
    setIsMusicPlaying(false);
    setShouldLoadMusic(youtubeAutoplaySrc !== "about:blank");
  }, [clearMusicRetry, youtubeAutoplaySrc]);

  useEffect(() => {
    if (!isStandalone || isInvitationOpened) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isInvitationOpened, isStandalone]);

  useEffect(() => {
    if (!guestComments) return;
    setComments(guestComments);
  }, [guestComments]);

  useEffect(() => {
    let isActive = true;

    setMapEmbedSrc(getGoogleMapEmbedSrc(data.mapLink));

    if (!isGoogleMapsShortLink(data.mapLink)) return;

    async function resolveShortMapLink() {
      try {
        const response = await fetch(
          `/api/resolve-map-url?url=${encodeURIComponent(data.mapLink)}`,
        );

        if (!response.ok) return;

        const result = (await response.json()) as { embedSrc?: string };

        if (isActive && result.embedSrc) {
          setMapEmbedSrc(result.embedSrc);
        }
      } catch {
        // Keep the immediate embed fallback if the short link cannot be resolved.
      }
    }

    void resolveShortMapLink();

    return () => {
      isActive = false;
    };
  }, [data.mapLink]);

  useEffect(() => {
    const revealRoot = isStandalone ? document : scrollerRef.current;
    if (!revealRoot) return;

    const revealItems = Array.from(
      revealRoot.querySelectorAll<HTMLElement>(".jw-scroll-reveal"),
    );

    if (revealItems.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("jw-scroll-reveal-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        root: isStandalone ? null : scrollerRef.current,
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.16,
      },
    );

    revealItems.forEach((item, index) => {
      item.classList.add(
        index % 2 === 0 ? "jw-scroll-reveal-left" : "jw-scroll-reveal-right",
      );
      item.style.transitionDelay = `${(index % 3) * 120}ms`;
      if (isElementInRevealRange(item, scrollerRef.current, isStandalone)) {
        item.classList.add("jw-scroll-reveal-visible");
        return;
      }

      observer.observe(item);
    });

    return () => observer.disconnect();
  }, [activeTemplate, gallerySignature, isStandalone]);

  function handleOpenInvitation() {
    startMusic({ retryAfterMs: 1000 });
    setIsInvitationOpened(true);
  }

  async function handleRsvpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!guestName.trim() || !attendanceStatus.trim()) {
      setRsvpStatus("error");
      setRsvpMessage("Nama dan status kehadiran wajib diisi.");
      return;
    }

    setIsSubmittingRsvp(true);
    setRsvpStatus(null);
    setRsvpMessage("");

    try {
      await onRsvpSubmit?.({
        attendanceStatus,
        guestCount: Math.max(Number(guestCount) || 1, 1),
        guestName: guestName.trim(),
        reason: attendanceReason.trim(),
      });
      setRsvpStatus("success");
      setRsvpMessage("Konfirmasi kehadiran berhasil terkirim.");
      setGuestName("");
      setAttendanceStatus("");
      setGuestCount("1");
      setAttendanceReason("");
    } catch (error) {
      setRsvpStatus("error");
      setRsvpMessage(
        error instanceof Error
          ? error.message
          : "Konfirmasi belum berhasil dikirim.",
      );
    } finally {
      setIsSubmittingRsvp(false);
    }
  }

  async function handleCommentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!commentName.trim() || !commentMessage.trim()) return;

    setIsSubmittingComment(true);
    setCommentStatus(null);
    setCommentStatusMessage("");

    try {
      const nextComment =
        (await onGuestCommentSubmit?.({
          message: commentMessage.trim(),
          name: commentName.trim(),
        })) ??
        {
        id: `comment-${Date.now()}`,
        message: commentMessage.trim(),
        name: commentName.trim(),
        submittedAt: new Date().toISOString(),
        };

      if (!guestComments) {
        setComments((currentComments) => [nextComment, ...currentComments]);
      }
      setCommentName("");
      setCommentMessage("");
      setCommentStatus("success");
      setCommentStatusMessage("Komentar berhasil terkirim.");
    } catch (error) {
      setCommentStatus("error");
      setCommentStatusMessage(
        error instanceof Error ? error.message : "Komentar belum berhasil dikirim.",
      );
    } finally {
      setIsSubmittingComment(false);
    }
  }

  function handleMusicToggle() {
    if (isMusicPlaying) {
      pauseMusic();
      return;
    }

    startMusic({ retryAfterMs: 1000 });
  }

  async function handleShare() {
    if (!data.slug.trim() || !canShareInvitation) return;

    if (navigator.share) {
      try {
        await navigator.share({ title: heroLabel, url: shareUrl });
        return;
      } catch {
        // Fall back to copying the public URL when native share is unavailable.
      }
    }

    await navigator.clipboard?.writeText(shareUrl);
  }

  const phoneFrame = (
    <div
      className={`relative w-full overflow-hidden ${style.surfaceBg} ${
        isStandalone
          ? "max-w-[700px]"
          : "aspect-[1320/2868] max-w-[360px] rounded-[32px] border-[8px] border-[#252b27] shadow-2xl"
      }`}
    >
      <TemplateEffect type={style.effect} />
      {shouldLoadMusic ? (
        <iframe
          ref={musicIframeRef}
          className="pointer-events-none absolute h-px w-px opacity-0"
          title="YouTube music player"
          src={youtubeAutoplaySrc}
          allow="autoplay; encrypted-media; picture-in-picture"
          onLoad={() => {
            if (wantsMusicPlayingRef.current) {
              startMusic({ retryAfterMs: 1000 });
            }
          }}
        />
      ) : null}
            {!isInvitationOpened ? (
              <InvitationEnvelope
                coupleName={`${firstFirstName} & ${secondFirstName}`}
                isStandalone={isStandalone}
                onOpen={handleOpenInvitation}
                recipientName={recipientName}
                template={activeTemplate}
              />
            ) : null}
            {!isStandalone ? (
              <div className="pointer-events-none absolute left-1/2 top-2 z-50 h-5 w-24 -translate-x-1/2 rounded-full bg-[#252b27]" />
            ) : null}
            <button
              type="button"
              onClick={handleMusicToggle}
              className={`z-40 flex h-11 w-11 items-center justify-center rounded-full border border-[#d6b86e]/70 bg-[#17211c] text-white shadow-[0_12px_34px_rgba(0,0,0,0.28)] transition hover:bg-[#26312d] ${
                isStandalone ? "fixed top-4" : "absolute right-3 top-3"
              }`}
              style={
                isStandalone
                  ? { right: "max(1rem, calc((100vw - 700px) / 2 + 1rem))" }
                  : undefined
              }
              aria-label={isMusicPlaying ? "Pause musik" : "Resume musik"}
              title={isMusicPlaying ? "Pause musik" : "Resume musik"}
            >
              {isMusicPlaying ? (
                <Pause size={17} aria-hidden="true" />
              ) : (
                <Play size={17} aria-hidden="true" />
              )}
            </button>
            <div
              ref={scrollerRef}
              className={
                isStandalone
                  ? "min-h-screen overflow-visible scroll-smooth"
                  : "h-full overflow-y-auto scroll-smooth"
              }
            >
              <section
                className={`relative flex overflow-hidden ${style.heroSection} ${
                  isStandalone ? "min-h-screen" : "h-full min-h-[674px]"
                }`}
              >
                <PreviewImage
                  src={heroImage}
                  alt={`Foto besar mempelai ${firstPerson.name} dan ${secondPerson.name}`}
                  priority
                  className="object-cover"
                  sizes="310px"
                />
                <div className={`absolute inset-0 ${style.heroOverlay}`} />
                <HeroOrnament type={style.effect} />
                <div className={`relative z-10 w-full px-6 text-white jw-rise ${style.heroContent}`}>
                  <p className={style.heroEyebrowClass}>
                    {heroLabel}
                  </p>
                  <h3 className={style.heroTitleClass}>
                    {firstFirstName}
                    <span
                      className={`block ${
                        activeTemplate === "floral"
                          ? "text-3xl"
                          : activeTemplate === "modern"
                            ? "text-2xl text-[#d6a348]"
                            : "text-2xl"
                      }`}
                    >
                      &
                    </span>
                    {secondFirstName}
                  </h3>
                  <p className={style.heroDateClass}>
                    {formatEventDate(data.schedule.reception)}
                  </p>
                </div>
              </section>

              <section className="space-y-4 px-5 py-5">
                <div className="jw-scroll-reveal">
                  <TemplateDivider type={style.effect} />
                </div>
                <section className={`jw-scroll-reveal rounded-lg px-3 py-5 text-center ${style.countdownBg}`}>
                  <div className={`${style.countdownCard} bg-white px-3 py-4 shadow-sm`}>
                    <div className="grid grid-cols-4 gap-2">
                      <CountdownItem label="Hari" value={countdown.days} />
                      <CountdownItem label="Jam" value={countdown.hours} />
                      <CountdownItem label="Menit" value={countdown.minutes} />
                      <CountdownItem label="Detik" value={countdown.seconds} />
                    </div>
                  </div>
                  <button className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#91aaa0] px-6 text-sm font-semibold text-white">
                    <CalendarDays size={17} aria-hidden="true" />
                    Save The Date
                  </button>
                </section>

                <section className={`jw-scroll-reveal p-4 text-center ${style.cardBg} ${style.cardShape}`}>
                  <p className={`${style.sectionTitleClass} ${style.accentText}`}>
                    Selamat datang
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[#4d594f]">
                    {data.welcomeText}
                  </p>
                </section>

                <section className={`jw-scroll-reveal p-4 text-center ${style.cardBg} ${style.cardShape}`}>
                  <p className={`${style.sectionTitleClass} ${style.accentText}`}>
                    Mempelai
                  </p>
                  <div className="mt-4 grid gap-3">
                    {orderedCoupleCards.map((person) => (
                      <CoupleCard
                        key={person.name}
                        father={person.father}
                        mother={person.mother}
                        name={person.name}
                        photo={person.photo}
                        relation={person.relation}
                      />
                    ))}
                  </div>
                </section>

                <section className={`jw-scroll-reveal p-4 text-center ${style.cardBg} ${style.cardShape}`}>
                  <div className="flex flex-col items-center gap-2">
                    <CalendarDays
                      size={18}
                      className="text-[#bd8b32]"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-sm font-semibold">Tanggal akad</p>
                      <p className="text-xs text-[#6e7a72]">
                        {formatEventDate(data.schedule.ceremony)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col items-center gap-2">
                    <CalendarDays
                      size={18}
                      className="text-[#bd8b32]"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-sm font-semibold">Tanggal resepsi</p>
                      <p className="text-xs text-[#6e7a72]">
                        {formatEventDate(data.schedule.reception)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col items-center gap-2">
                    <Building2
                      size={18}
                      className="text-[#bd8b32]"
                      aria-hidden="true"
                    />
                    <p className="text-sm text-[#4d594f]">{data.venue}</p>
                  </div>
                </section>

                <div className="jw-scroll-reveal">
                  <TemplateDivider type={style.effect} />
                </div>

                <section className={`jw-scroll-reveal p-4 ${style.cardBg} ${style.cardShape}`}>
                  <p className={`text-center ${style.sectionTitleClass} ${style.accentText}`}>
                    Kisah kami
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[#4d594f]">
                    {data.storyText}
                  </p>
                </section>

                <section className="jw-scroll-reveal">
                  <p className="text-xs font-semibold uppercase text-[#758178]">
                    Moment yang berharga
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#8a5362]">
                    Menciptakan kenangan adalah hadiah yang tak ternilai
                    harganya.
                  </p>
                  <div className="mt-3 space-y-2">
                    {galleryPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className={`jw-scroll-reveal relative w-full overflow-hidden bg-[#f6f4ee] ${style.galleryShape}`}
                      >
                        <NaturalPreviewImage
                          src={photo.url}
                          alt={photo.name}
                        />
                      </div>
                    ))}
                  </div>
                </section>

                <section className={`jw-scroll-reveal overflow-hidden ${style.cardBg} ${style.cardShape}`}>
                  <div className="flex items-center gap-2 px-3 py-3 text-xs font-semibold uppercase text-[#758178]">
                    <MapPin size={14} aria-hidden="true" />
                    Lokasi acara
                  </div>
                  <iframe
                    className={`${isStandalone ? "h-60" : "h-44"} w-full border-0`}
                    title={`Peta lokasi ${data.venue}`}
                    src={mapEmbedSrc}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </section>

                <form
                  onSubmit={handleRsvpSubmit}
                  className={`jw-scroll-reveal p-3 ${style.cardBg} ${style.cardShape}`}
                >
                  <p className="text-xs font-semibold uppercase text-[#758178]">
                    Konfirmasi kehadiran
                  </p>
                  <input
                    className="mt-3 h-10 w-full rounded-lg border border-[#e4dfd4] bg-white px-3 text-sm text-ink outline-none placeholder:text-[#9aa29a]"
                    placeholder="Nama tamu"
                    value={guestName}
                    onChange={(event) => setGuestName(event.target.value)}
                  />
                  <select
                    className="mt-3 h-10 w-full rounded-lg border border-[#e4dfd4] bg-white px-3 text-sm text-ink outline-none"
                    value={attendanceStatus}
                    onChange={(event) => setAttendanceStatus(event.target.value)}
                  >
                    <option value="" disabled>
                      Pilih status kehadiran
                    </option>
                    <option value="Hadir">Hadir</option>
                    <option value="Tidak bisa hadir">Tidak bisa hadir</option>
                  </select>
                  <input
                    className="mt-3 h-10 w-full rounded-lg border border-[#e4dfd4] bg-white px-3 text-sm text-ink outline-none placeholder:text-[#9aa29a]"
                    placeholder="Jumlah tamu"
                    inputMode="numeric"
                    value={guestCount}
                    onChange={(event) => setGuestCount(event.target.value)}
                  />
                  <textarea
                    className="mt-3 min-h-20 w-full resize-none rounded-lg border border-[#e4dfd4] bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-[#9aa29a]"
                    placeholder="Alasan jika tidak bisa hadir"
                    value={attendanceReason}
                    onChange={(event) => setAttendanceReason(event.target.value)}
                  />
                  {rsvpMessage ? (
                    <p
                      className={`mt-3 rounded-lg px-3 py-2 text-xs font-semibold ${
                        rsvpStatus === "success"
                          ? "bg-[#eef8ef] text-[#3d7246]"
                          : "bg-[#fff2f0] text-[#a64f3f]"
                      }`}
                    >
                      {rsvpMessage}
                    </p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={isSubmittingRsvp}
                    className={`mt-3 inline-flex h-10 w-full items-center justify-center rounded-lg px-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-75 ${style.primaryButton}`}
                  >
                    {isSubmittingRsvp ? "Mengirim..." : "Kirim konfirmasi"}
                  </button>
                </form>

                <section className="jw-scroll-reveal space-y-3">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase text-[#758178]">
                    <Banknote size={14} aria-hidden="true" />
                    Rekening hadiah
                  </p>
                  {orderedAccounts.map(({ account, label }) => (
                    <AccountCard
                      key={label}
                      label={label}
                      bank={account.bankName}
                      number={account.number}
                      owner={account.accountName}
                    />
                  ))}
                </section>

                <section className={`jw-scroll-reveal p-3 ${style.cardBg} ${style.cardShape}`}>
                  <p className="text-xs font-semibold uppercase text-[#758178]">
                    Komentar
                  </p>
                  <div className="mt-3 max-h-64 space-y-3 overflow-y-auto pr-1">
                    {comments.length === 0 ? (
                      <div className="rounded-lg bg-white px-3 py-4 text-center text-sm text-[#8b928b]">
                        Belum ada komentar
                      </div>
                    ) : (
                      comments.map((comment) => (
                      <article
                        key={comment.id}
                        className="rounded-lg bg-white px-3 py-3 text-left"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="min-w-0 truncate text-sm font-semibold text-[#4d594f]">
                            {comment.name}
                          </p>
                          <time className="shrink-0 text-[11px] font-semibold text-[#8b928b]">
                            {formatCommentDate(comment.submittedAt)}
                          </time>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[#4d594f]">
                          {comment.message}
                        </p>
                      </article>
                      ))
                    )}
                  </div>
                </section>

                <form
                  onSubmit={handleCommentSubmit}
                  className={`jw-scroll-reveal block p-3 ${style.cardBg} ${style.cardShape}`}
                >
                  <p className="text-xs font-semibold uppercase text-[#758178]">
                    Tulis komentar
                  </p>
                  <input
                    className="mt-3 h-10 w-full rounded-lg border border-[#e4dfd4] bg-white px-3 text-sm text-ink outline-none placeholder:text-[#9aa29a]"
                    placeholder="Nama tamu"
                    value={commentName}
                    onChange={(event) => setCommentName(event.target.value)}
                  />
                  <textarea
                    className="mt-3 min-h-24 w-full resize-none rounded-lg border border-[#e4dfd4] bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-[#9aa29a]"
                    placeholder="Tulis doa atau ucapan di sini"
                    value={commentMessage}
                    onChange={(event) => setCommentMessage(event.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingComment}
                    className={`mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-75 ${style.primaryButton}`}
                  >
                    <Send size={16} aria-hidden="true" />
                    {isSubmittingComment ? "Mengirim..." : "Kirim komentar"}
                  </button>
                  {commentStatusMessage ? (
                    <p
                      className={`mt-3 rounded-lg px-3 py-2 text-xs font-semibold ${
                        commentStatus === "success"
                          ? "bg-[#eef8ef] text-[#3d7246]"
                          : "bg-[#fff2f0] text-[#a64f3f]"
                      }`}
                    >
                      {commentStatusMessage}
                    </p>
                  ) : null}
                </form>

                <footer className="pb-8 pt-5 text-center text-xs font-semibold text-[#4d594f]">
                  <Link href="/" className="hover:text-[#4d594f]">
                    © 2027 Jago Wedding Online. All rights reserved.
                  </Link>
                </footer>
              </section>
            </div>
          </div>
  );

  if (isStandalone) {
    return (
      <div
        className={`flex min-h-screen justify-center ${style.frameBg}`}
        data-template={activeTemplate}
        data-testid="template-standalone-preview"
      >
        <div className="w-full max-w-[700px]">
          {phoneFrame}
        </div>
      </div>
    );
  }

  return (
    <aside
      className="xl:sticky xl:top-24 xl:self-start"
      data-template={activeTemplate}
      data-testid="live-invitation-preview"
    >
      <div className="rounded-lg border border-[#e4dfd4] bg-white p-4 shadow-soft md:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Live preview</h2>
            <p className="mt-1 text-sm text-[#6e7a72]">
              {data.slug}.jago-wedding.up.railway.app
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleShare()}
            disabled={!canShareInvitation}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#e4dfd4] text-ink hover:bg-[#f6f4ee] disabled:cursor-not-allowed disabled:opacity-40"
            title={
              canShareInvitation ? "Bagikan undangan" : shareDisabledReason
            }
            aria-label={
              canShareInvitation ? "Bagikan undangan" : shareDisabledReason
            }
          >
            <Share2 size={18} aria-hidden="true" />
          </button>
        </div>

        <div className={`mt-5 flex justify-center rounded-lg p-4 ${style.frameBg}`}>
          {phoneFrame}
        </div>
      </div>
    </aside>
  );
}

function CountdownItem({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="wedding-serif text-3xl leading-none text-[#6f6f6f]">
        {String(value).padStart(2, "0")}
      </p>
      <p className="mt-3 text-xs font-semibold text-[#777]">{label}</p>
    </div>
  );
}

function CoupleCard({
  father,
  mother,
  name,
  photo,
  relation,
}: {
  father: string;
  mother: string;
  name: string;
  photo: PhotoAsset | null;
  relation: string;
}) {
  return (
    <div className="rounded-lg bg-white px-4 py-5">
      {photo ? (
        <div className="relative mx-auto mb-3 h-20 w-20 overflow-hidden rounded-full bg-[#f6f4ee]">
          <PreviewImage
            src={photo.url}
            alt={`Foto ${name}`}
            className="object-cover"
            sizes="80px"
          />
        </div>
      ) : null}
      <p className="wedding-serif text-2xl text-ink">{name}</p>
      <div className="mx-auto mt-3 flex max-w-[270px] items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-[#ded3bd]" />
        <span className="h-1.5 w-1.5 rotate-45 bg-[#bd8b32]" />
        <span className="h-px flex-1 bg-[#ded3bd]" />
      </div>
      <p className="mt-3 font-serif text-sm italic text-[#7a6c5c]">
        {relation}
      </p>
      <p className="mt-2 font-serif text-base leading-7 text-[#403a34]">
        Bapak <span className="font-semibold">{father || "-"}</span>
        <span className="block text-xs italic text-[#938575]">dan</span>
        Ibu <span className="font-semibold">{mother || "-"}</span>
      </p>
    </div>
  );
}

function AccountCard({
  bank,
  label,
  number,
  owner,
}: {
  bank: string;
  label: string;
  number: string;
  owner: string;
}) {
  return (
    <div className="rounded-lg bg-[#f6f4ee] p-3">
      <p className="text-xs font-semibold uppercase text-[#758178]">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#4d594f]">
            {bank} {number}
          </p>
          <p className="mt-1 text-xs text-[#758178]">a.n. {owner}</p>
        </div>
        <CopyButton value={number} />
      </div>
    </div>
  );
}

function InvitationEnvelope({
  coupleName,
  isStandalone,
  onOpen,
  recipientName,
  template,
}: {
  coupleName: string;
  isStandalone: boolean;
  onOpen: () => void;
  recipientName: string;
  template: InvitationTemplate;
}) {
  const envelopeTheme = {
    classic: {
      background: "bg-[#17211c] text-white",
      button: "bg-[#d9be81] text-[#17211c] hover:bg-[#ead49e] focus-visible:outline-[#d9be81]",
      couple: "wedding-editorial text-white",
      description: "text-white/60",
      label: "text-[#d9be81]",
      recipient: "font-serif text-white",
      salutation: "text-white/55",
    },
    minimalist: {
      background: "bg-[#f4f6f2] text-[#29352f]",
      button: "border border-[#29352f] bg-[#29352f] text-white hover:bg-[#415149] focus-visible:outline-[#29352f]",
      couple: "wedding-modern font-light uppercase text-[#29352f]",
      description: "text-[#68756d]",
      label: "text-[#68786f]",
      recipient: "wedding-modern uppercase text-[#29352f]",
      salutation: "text-[#7a857e]",
    },
    floral: {
      background: "bg-[#fff1f5] text-[#6f263d]",
      button: "bg-[#b95573] text-white hover:bg-[#9f3f5d] focus-visible:outline-[#b95573]",
      couple: "wedding-script text-[#a54161]",
      description: "text-[#8e6170]",
      label: "text-[#b95573]",
      recipient: "font-serif text-[#6f263d]",
      salutation: "text-[#a77a89]",
    },
    modern: {
      background: "bg-[#101412] text-white",
      button: "border border-[#d6a348] bg-[#d6a348] text-[#101412] hover:bg-[#e3b963] focus-visible:outline-[#d6a348]",
      couple: "wedding-modern font-black uppercase text-white",
      description: "text-white/55",
      label: "text-[#d6a348]",
      recipient: "wedding-modern font-bold uppercase text-white",
      salutation: "text-white/45",
    },
  }[template];

  return (
    <div
      className={`${
        isStandalone ? "fixed min-h-[100svh]" : "absolute min-h-full"
      } ${envelopeTheme.background} inset-0 z-[70] flex items-center justify-center overflow-hidden px-6 py-10 text-center`}
      role="dialog"
      aria-label="Pembuka undangan"
      aria-modal="true"
    >
      <EnvelopeBackdrop template={template} />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        <p className={`text-[11px] font-semibold uppercase tracking-[0.3em] ${envelopeTheme.label}`}>
          Wedding invitation
        </p>
        <p className={`mt-3 text-3xl leading-tight ${envelopeTheme.couple}`}>
          {coupleName}
        </p>

        <EnvelopeArtwork template={template} />

        <p className={`mt-9 text-xs uppercase tracking-[0.22em] ${envelopeTheme.salutation}`}>
          Kepada Yth.
        </p>
        <p className={`mt-2 text-xl font-semibold ${envelopeTheme.recipient}`}>
          {recipientName.trim() || "Tamu Undangan"}
        </p>
        <p className={`mt-2 max-w-xs text-sm leading-6 ${envelopeTheme.description}`}>
          Dengan hormat, kami mengundang Anda untuk merayakan hari bahagia kami.
        </p>

        <button
          type="button"
          onClick={onOpen}
          className={`mt-8 inline-flex h-12 w-full max-w-[300px] items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold shadow-[0_14px_30px_rgba(0,0,0,0.2)] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ${envelopeTheme.button}`}
        >
          <MailOpen size={18} aria-hidden="true" />
          Buka undangan
        </button>
      </div>
    </div>
  );
}

function EnvelopeBackdrop({ template }: { template: InvitationTemplate }) {
  if (template === "minimalist") {
    return (
      <div className="pointer-events-none absolute inset-0">
        <span className="absolute inset-x-8 top-8 h-px bg-[#29352f]/20" />
        <span className="absolute bottom-8 left-1/2 h-16 w-px bg-[#29352f]/15" />
      </div>
    );
  }

  if (template === "floral") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="jw-petal absolute -left-6 top-16 h-24 w-16 rounded-full opacity-50" />
        <span className="jw-petal absolute right-4 top-32 h-14 w-10 rounded-full opacity-40 [animation-delay:1s]" />
        <span className="jw-petal absolute bottom-20 left-12 h-12 w-8 rounded-full opacity-35 [animation-delay:2s]" />
      </div>
    );
  }

  if (template === "modern") {
    return (
      <div className="pointer-events-none absolute inset-0">
        <div className="jw-grain absolute inset-0 opacity-40" />
        <span className="absolute left-6 top-6 h-24 w-px bg-[#d6a348]/55" />
        <span className="absolute left-6 top-6 h-px w-24 bg-[#d6a348]/55" />
        <span className="absolute bottom-6 right-6 h-24 w-px bg-[#d6a348]/35" />
        <span className="absolute bottom-6 right-6 h-px w-24 bg-[#d6a348]/35" />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 opacity-70">
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full border border-[#d9be81]/25" />
      <div className="absolute -right-20 bottom-10 h-60 w-60 rounded-full border border-[#d9be81]/20" />
      <div className="absolute inset-x-10 top-1/2 h-px bg-gradient-to-r from-transparent via-[#d9be81]/25 to-transparent" />
    </div>
  );
}

function EnvelopeArtwork({ template }: { template: InvitationTemplate }) {
  if (template === "minimalist") {
    return (
      <div className="relative mt-10 w-full max-w-[350px] pt-[62%] drop-shadow-[0_20px_30px_rgba(41,53,47,0.14)]">
        <div className="absolute inset-0 border border-[#8e9a92] bg-white">
          <div className="absolute inset-x-0 top-0 h-[58%] border-b border-[#aab4ad] bg-[#fafbf9] [clip-path:polygon(0_0,100%_0,50%_100%)]" />
          <span className="wedding-modern absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xl font-light uppercase tracking-[0.18em] text-[#445149]">
            RSVP
          </span>
        </div>
      </div>
    );
  }

  if (template === "floral") {
    return (
      <div className="relative mt-9 w-full max-w-[350px] pt-[68%] drop-shadow-[0_22px_34px_rgba(111,38,61,0.18)]">
        <div className="absolute inset-0 overflow-hidden rounded-[28px] border border-[#eeb8c9] bg-[#f8dce5]">
          <div className="absolute inset-x-0 top-0 h-[60%] bg-[#fff7f9] [clip-path:polygon(0_0,100%_0,50%_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-[60%] bg-[#f4cbd8] [clip-path:polygon(0_100%,50%_0,100%_100%)]" />
          <span className="absolute left-5 top-5 h-10 w-7 rotate-[-28deg] rounded-full bg-[#d87e9a]/45" />
          <span className="absolute right-6 top-7 h-8 w-6 rotate-[32deg] rounded-full bg-[#c95f80]/35" />
        </div>
        <div className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/70 bg-[#b95573] text-white shadow-md">
          <Heart size={21} fill="currentColor" aria-hidden="true" />
        </div>
      </div>
    );
  }

  if (template === "modern") {
    return (
      <div className="relative mt-10 w-full max-w-[350px] pt-[64%] drop-shadow-[0_26px_34px_rgba(0,0,0,0.4)]">
        <div className="absolute inset-0 overflow-hidden border border-[#d6a348] bg-[#171d1a]">
          <div className="absolute inset-x-0 top-0 h-[58%] border-b border-[#d6a348]/70 bg-[#202823] [clip-path:polygon(0_0,100%_0,50%_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-[56%] bg-[#0e1210] [clip-path:polygon(0_100%,50%_0,100%_100%)]" />
          <span className="wedding-modern absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border border-[#d6a348] bg-[#101412] px-4 py-3 text-xs font-black uppercase tracking-[0.28em] text-[#d6a348]">
            Open
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mt-10 w-full max-w-[360px] pt-[66%] drop-shadow-[0_24px_38px_rgba(0,0,0,0.32)]">
      <div className="absolute inset-0 overflow-hidden rounded-lg bg-[#e8dcc3]">
        <div className="absolute inset-x-0 top-0 h-[58%] bg-[#f5ecd9] [clip-path:polygon(0_0,100%_0,50%_100%)]" />
        <div className="absolute inset-y-0 left-0 w-[55%] bg-[#d9c9aa] [clip-path:polygon(0_0,100%_50%,0_100%)]" />
        <div className="absolute inset-y-0 right-0 w-[55%] bg-[#dfcfb2] [clip-path:polygon(100%_0,0_50%,100%_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[58%] bg-[#eee2ca] [clip-path:polygon(0_100%,50%_0,100%_100%)]" />
      </div>
      <div className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-[#f2dfb4] bg-[#9d3f45] text-[#f8e8c5] shadow-lg">
        <Heart size={24} fill="currentColor" aria-hidden="true" />
      </div>
    </div>
  );
}

function TemplateEffect({
  type,
}: {
  type: "classic" | "minimalist" | "floral" | "modern";
}) {
  if (type === "floral") {
    return (
      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
        <span className="jw-petal absolute left-5 top-24 h-10 w-7 rounded-full" />
        <span className="jw-petal absolute right-8 top-44 h-8 w-6 rounded-full [animation-delay:1.2s]" />
        <span className="jw-petal absolute bottom-32 left-10 h-7 w-5 rounded-full [animation-delay:2.1s]" />
      </div>
    );
  }

  if (type === "modern") {
    return (
      <div className="pointer-events-none absolute inset-0 z-10 opacity-45">
        <div className="jw-grain absolute inset-0" />
        <span className="absolute left-0 top-20 h-px w-full bg-[#d6a348]/50" />
        <span className="absolute bottom-28 right-0 h-16 w-1/2 border-y border-[#d6a348]/40" />
      </div>
    );
  }

  if (type === "minimalist") {
    return (
      <div className="pointer-events-none absolute inset-x-8 top-10 z-10 h-px overflow-hidden bg-white/30">
        <span className="jw-line-sweep block h-full w-2/3 bg-white/80" />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <span className="jw-gold-orb absolute left-5 top-28 h-20 w-20 rounded-full" />
      <span className="jw-gold-orb absolute bottom-24 right-2 h-24 w-24 rounded-full [animation-delay:1.4s]" />
    </div>
  );
}

function HeroOrnament({
  type,
}: {
  type: "classic" | "minimalist" | "floral" | "modern";
}) {
  if (type === "floral") {
    return (
      <div className="pointer-events-none absolute inset-x-5 bottom-28 z-10 h-28 rounded-t-full border-x border-t border-white/45" />
    );
  }

  if (type === "modern") {
    return (
      <div className="pointer-events-none absolute bottom-8 left-5 z-10 h-32 w-px bg-[#d6a348]" />
    );
  }

  if (type === "minimalist") {
    return (
      <div className="pointer-events-none absolute inset-y-12 left-6 z-10 w-px bg-white/45" />
    );
  }

  return (
    <div className="pointer-events-none absolute inset-4 z-10 rounded-[22px] border border-white/35" />
  );
}

function TemplateDivider({
  type,
}: {
  type: "classic" | "minimalist" | "floral" | "modern";
}) {
  if (type === "floral") {
    return (
      <div className="flex items-center justify-center gap-2 py-1 text-[#b95573]">
        <span className="h-px w-12 bg-[#efbfd0]" />
        <span className="wedding-script text-2xl leading-none">&</span>
        <span className="h-px w-12 bg-[#efbfd0]" />
      </div>
    );
  }

  if (type === "modern") {
    return (
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-[#26312d]">
        <span className="h-px bg-[#26312d]" />
        <span>Wedding</span>
        <span className="h-px bg-[#26312d]" />
      </div>
    );
  }

  if (type === "minimalist") {
    return <div className="mx-auto h-10 w-px bg-[#d5ded7]" />;
  }

  return (
    <div className="mx-auto flex w-28 items-center gap-2 py-1">
      <span className="h-px flex-1 bg-[#d8c6a5]" />
      <span className="h-2 w-2 rounded-full bg-[#bd8b32]" />
      <span className="h-px flex-1 bg-[#d8c6a5]" />
    </div>
  );
}

function PreviewImage({
  alt,
  className,
  priority,
  sizes,
  src,
}: {
  alt: string;
  className: string;
  priority?: boolean;
  sizes: string;
  src: string;
}) {
  if (src.startsWith("blob:") || src.startsWith("data:")) {
    return (
      // Blob/data URLs from local uploads cannot be rendered by next/image.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={`absolute inset-0 h-full w-full ${className}`}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      className={className}
      sizes={sizes}
    />
  );
}

function NaturalPreviewImage({ alt, src }: { alt: string; src: string }) {
  return (
    // Natural gallery photos must keep their own aspect ratio.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="block h-auto w-full" />
  );
}

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || "Mempelai";
}

function getPublicInvitationUrl(slug: string) {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) return "";

  const publicDomain =
    process.env.NEXT_PUBLIC_PUBLIC_INVITATION_DOMAIN ??
    "jago-wedding.up.railway.app";

  return `https://${normalizedSlug}.${publicDomain}`;
}

function isInvitationPubliclyActive(invitationMeta: InvitationMeta | null) {
  return Boolean(
    invitationMeta?.paymentStatus === "paid" &&
      invitationMeta.status === "active" &&
      invitationMeta.expiredAt &&
      !isExpired(invitationMeta.expiredAt),
  );
}

function getShareDisabledReason(invitationMeta: InvitationMeta | null) {
  if (!invitationMeta) {
    return "Data undangan belum selesai dimuat";
  }

  if (invitationMeta.status === "expired" || isExpired(invitationMeta.expiredAt)) {
    return "Masa aktif undangan sudah habis. Perpanjang paket untuk membagikan.";
  }

  if (invitationMeta.paymentStatus !== "paid") {
    return "Bayar paket dulu agar undangan bisa dibagikan.";
  }

  return "Undangan belum aktif.";
}

function isExpired(expiredAt?: string) {
  if (!expiredAt) return false;

  const expiredTime = Date.parse(expiredAt);
  return Number.isNaN(expiredTime) ? false : expiredTime <= Date.now();
}

function isElementInRevealRange(
  element: HTMLElement,
  scroller: HTMLDivElement | null,
  isStandalone: boolean,
) {
  const rect = element.getBoundingClientRect();
  const bottomOffset = 0.12;

  if (isStandalone || !scroller) {
    return rect.top < window.innerHeight * (1 - bottomOffset) && rect.bottom > 0;
  }

  const scrollerRect = scroller.getBoundingClientRect();
  return (
    rect.top < scrollerRect.bottom - scrollerRect.height * bottomOffset &&
    rect.bottom > scrollerRect.top
  );
}

function getScheduleTimestamp(schedule: { date: string; time: string }) {
  if (!schedule.date.trim()) return null;

  const timestamp = Date.parse(
    `${schedule.date}T${schedule.time || "00:00"}:00+07:00`,
  );

  return Number.isNaN(timestamp) ? null : timestamp;
}

function formatEventDate(schedule: { date: string; time: string }) {
  const timestamp = getScheduleTimestamp(schedule);
  if (!timestamp) return "Tanggal belum diisi";

  const date = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    timeZone: "Asia/Jakarta",
    weekday: "long",
    year: "numeric",
  }).format(new Date(timestamp));
  const time = schedule.time ? schedule.time.replace(":", ".") : "00.00";

  return `${date}, ${time} WIB`;
}

function formatCommentDate(submittedAt: string) {
  const date = new Date(submittedAt);

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: "Asia/Jakarta",
    year: "numeric",
  })
    .format(date)
    .replace(".", ":");
}

function getYoutubeAutoplaySrc(url: string, origin = "") {
  const videoId = getYoutubeVideoId(url);
  if (!videoId) return "about:blank";

  const params = new URLSearchParams({
    autoplay: "0",
    controls: "0",
    enablejsapi: "1",
    loop: "1",
    playlist: videoId,
    playsinline: "1",
  });

  if (origin) {
    params.set("origin", origin);
  }

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

function getYoutubeVideoId(url: string) {
  const trimmedUrl = url.trim();
  const directMatch = trimmedUrl.match(/youtu\.be\/([^?&/]+)/);
  const watchMatch = trimmedUrl.match(/[?&]v=([^?&]+)/);
  const embedMatch = trimmedUrl.match(/youtube\.com\/embed\/([^?&/]+)/);

  return directMatch?.[1] ?? watchMatch?.[1] ?? embedMatch?.[1] ?? null;
}
