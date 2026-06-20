import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CreditCard,
  Gift,
  HeartHandshake,
  Images,
  MapPin,
  Music2,
  Palette,
  Sparkles,
  Users,
} from "lucide-react";
import { LandingSessionRedirect } from "@/components/landing-session-redirect";

const features = [
  {
    description: "Cover full screen, countdown, RSVP, kisah pasangan, dan komentar tamu.",
    icon: CalendarCheck,
    title: "Alur undangan lengkap",
  },
  {
    description: "Upload cover, foto mempelai, gallery 20 foto, dan musik YouTube.",
    icon: Images,
    title: "Foto & media rapi",
  },
  {
    description: "Google Maps, rekening hadiah, tombol copy, dan data RSVP tamu.",
    icon: MapPin,
    title: "Siap dibagikan ke tamu",
  },
  {
    description: "Pembayaran paket via Midtrans untuk VA, QRIS, e-wallet, dan kartu.",
    icon: CreditCard,
    title: "Pembayaran online",
  },
];

const templateShowcase = [
  {
    accent: "bg-[#bd8b32]",
    bg: "bg-[#fbf8f0]",
    id: "classic",
    image: "/images/template-classic.png",
    label: "Classic Elegant",
    overlay: "bg-gradient-to-b from-black/0 via-black/8 to-black/88",
    titleClass: "wedding-editorial text-3xl drop-shadow-[0_3px_12px_rgba(0,0,0,0.95)]",
  },
  {
    accent: "bg-[#6f7f68]",
    bg: "bg-white",
    id: "minimalist",
    image: "/images/template-minimalist.png",
    label: "Minimalist White",
    overlay: "bg-gradient-to-b from-black/0 via-black/6 to-black/84",
    titleClass: "wedding-modern text-xl font-bold uppercase tracking-[0.08em] drop-shadow-[0_3px_12px_rgba(0,0,0,0.95)]",
  },
  {
    accent: "bg-[#b95573]",
    bg: "bg-[#fff5f7]",
    id: "floral",
    image: "/images/template-floral.png",
    label: "Floral Romantic",
    overlay: "bg-gradient-to-b from-black/0 via-black/8 to-black/86",
    titleClass: "wedding-script text-4xl leading-none drop-shadow-[0_3px_12px_rgba(0,0,0,0.95)]",
  },
  {
    accent: "bg-[#26312d]",
    bg: "bg-[#f0ece3]",
    id: "modern",
    image: "/images/template-modern.png",
    label: "Modern Dark",
    overlay: "bg-gradient-to-b from-black/0 via-black/18 to-black/92",
    titleClass: "wedding-modern text-2xl font-black uppercase tracking-[0.04em] drop-shadow-[0_3px_12px_rgba(0,0,0,0.95)]",
  },
];

const workflow = [
  {
    icon: Users,
    text: "Register atau login, lalu dashboard langsung mengambil data akun tersebut.",
    title: "Akun sendiri",
  },
  {
    icon: Palette,
    text: "Pilih template, masukkan detail acara, upload foto, dan cek live preview.",
    title: "Edit visual",
  },
  {
    icon: Gift,
    text: "Aktifkan paket pembayaran agar undangan bisa disimpan dan dipakai.",
    title: "Bayar paket",
  },
  {
    icon: HeartHandshake,
    text: "Bagikan link undangan, lalu pantau RSVP tamu dari dashboard.",
    title: "Bagikan link",
  },
];

const footerLinks = {
  bantuan: ["Pusat bantuan", "Panduan pembayaran", "Kontak support"],
  legal: ["Syarat layanan", "Kebijakan privasi", "Status sistem"],
  produk: ["Template", "Foto & media", "RSVP", "Payment gateway"],
};

const heroStickers = [
  {
    icon: Music2,
    label: "Musik",
    value: "YouTube",
  },
  {
    icon: MapPin,
    label: "Lokasi",
    value: "Maps",
  },
  {
    icon: CalendarCheck,
    label: "RSVP",
    value: "Live",
  },
  {
    icon: Gift,
    label: "Gift",
    value: "Rekening",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf6] text-[#17211c]">
      <LandingSessionRedirect />
      <section className="relative flex min-h-[94svh] items-stretch overflow-hidden bg-[#101713]">
        <Image
          src="/images/template-floral.png"
          alt="Preview undangan pernikahan online"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[58%_42%]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,12,10,0.92)_0%,rgba(7,12,10,0.76)_42%,rgba(7,12,10,0.36)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_42%,rgba(214,184,110,0.28),transparent_32%),radial-gradient(circle_at_22%_78%,rgba(185,85,115,0.2),transparent_28%)]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#fbfaf6] to-transparent" />
        <div className="absolute left-[7%] top-[22%] hidden h-16 w-32 rotate-[-12deg] rounded-[50%] border border-white/18 md:block" />
        <div className="absolute right-[32%] top-[15%] hidden h-10 w-24 rotate-12 rounded-[50%] border border-[#d6b86e]/35 md:block" />
        <div className="absolute bottom-[18%] right-[10%] hidden h-16 w-16 rotate-12 border-b border-r border-white/18 md:block" />

        <div className="relative z-10 flex w-full flex-col justify-between px-5 py-5 md:px-10 lg:px-14">
          <header className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3 text-white">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/14 backdrop-blur">
                <Music2 size={20} aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-semibold">
                  Jago Wedding
                </span>
                <span className="block text-xs text-white/68">
                  Online Invitation
                </span>
              </span>
            </Link>
            <nav className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-white/30 px-4 text-sm font-semibold text-white backdrop-blur hover:bg-white/10"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-white px-4 text-sm font-semibold text-[#17211c] hover:bg-[#f2eadc]"
              >
                Register
              </Link>
            </nav>
          </header>

          <div className="grid flex-1 items-center gap-8 py-10 text-white lg:grid-cols-[minmax(0,0.88fr)_minmax(420px,0.76fr)]">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/22 bg-black/28 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#e6cf8c] shadow-lg">
                <Sparkles size={14} aria-hidden="true" />
                Platform undangan pernikahan online
              </p>
              <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight md:text-6xl lg:text-7xl">
                Bikin undangan pernikahan yang terasa hidup sejak layar pertama.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/78 md:text-lg">
                Pilih template, upload foto, pasang musik, lokasi, rekening
                hadiah, RSVP, dan komentar tamu. Semua tersusun dalam satu
                link cantik untuk dibagikan.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#d6b86e] px-5 text-sm font-bold text-[#17211c] hover:bg-[#e4c77e]"
                >
                  Mulai buat undangan
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-white/30 px-5 text-sm font-bold text-white backdrop-blur hover:bg-white/10"
                >
                  Masuk dashboard
                </Link>
              </div>
              <div className="mt-8 flex max-w-2xl flex-wrap gap-3">
                {heroStickers.map((sticker) => (
                  <div
                    key={sticker.label}
                    className="inline-flex items-center gap-3 rounded-full border border-white/18 bg-white px-3 py-2 text-[#17211c] shadow-2xl"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef3eb] text-[#2d6844]">
                      <sticker.icon size={17} aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#758178]">
                        {sticker.label}
                      </span>
                      <span className="block text-sm font-bold">
                        {sticker.value}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative hidden min-h-[620px] lg:block">
              <div className="absolute right-10 top-4 h-[560px] w-[260px] rotate-2 overflow-hidden rounded-[42px] border-[9px] border-[#202622] bg-[#202622] shadow-2xl">
                <Image
                  src="/images/template-classic.png"
                  alt="Preview undangan dalam layar handphone"
                  fill
                  sizes="260px"
                  className="object-cover"
                />
                <div className="absolute left-1/2 top-3 h-5 w-24 -translate-x-1/2 rounded-full bg-[#202622]" />
                <div className="absolute inset-x-0 bottom-0 h-64 bg-[linear-gradient(0deg,rgba(0,0,0,0.94)_0%,rgba(0,0,0,0.66)_42%,rgba(0,0,0,0)_100%)]" />
                <div className="absolute inset-x-7 bottom-10 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/78">
                    The Wedding Of
                  </p>
                  <p className="wedding-editorial mt-3 text-4xl leading-none text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.95)]">
                    Alya & Dimas
                  </p>
                  <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/82">
                    13 Juli 2026
                  </p>
                </div>
              </div>
              <div className="absolute left-2 top-24 w-64 -rotate-6 overflow-hidden rounded-lg border-4 border-white bg-white text-[#17211c] shadow-2xl">
                <Image
                  src="/images/template-minimalist.png"
                  alt="Sticker preview gallery undangan"
                  width={520}
                  height={680}
                  className="h-56 w-full object-cover"
                />
                <div className="flex items-center justify-between px-4 py-3">
                  <p className="text-sm font-bold">Gallery moment</p>
                  <span className="rounded-full bg-[#fff0f4] px-2 py-1 text-[11px] font-bold text-[#b95573]">
                    20 foto
                  </span>
                </div>
              </div>
              <div className="absolute bottom-20 left-20 w-72 rotate-3 rounded-lg border border-white/20 bg-black/58 px-5 py-4 text-white shadow-2xl">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#e6cf8c]">
                  Dapatkan URL gratis undangan kalian
                </p>
                <p className="mt-2 text-sm font-semibold">
                  jago-wedding.up.railway.app/undangan/alya-dimas
                </p>
              </div>
              <div className="absolute right-0 top-28 rounded-full border border-white/18 bg-white px-4 py-3 text-sm font-bold text-[#17211c] shadow-2xl rotate-6">
                <span className="flex items-center gap-2">
                  <Sparkles size={15} className="text-[#bd8b32]" />
                  Save the date
                </span>
              </div>
              <div className="absolute bottom-44 right-0 rounded-full border border-white/18 bg-[#d6b86e] px-4 py-3 text-sm font-bold text-[#17211c] shadow-2xl -rotate-3">
                <span className="flex items-center gap-2">
                  <Gift size={15} aria-hidden="true" />
                  Gift transfer
                </span>
              </div>
              <div className="absolute left-32 top-0 h-20 w-20 rotate-12 rounded-full border border-[#d6b86e]/38" />
              <div className="absolute bottom-8 right-32 h-14 w-32 -rotate-6 rounded-[50%] border border-white/20" />
            </div>

            <div className="relative mt-8 block min-h-[360px] lg:hidden">
              <div className="absolute left-1/2 top-0 h-[340px] w-[158px] -translate-x-1/2 overflow-hidden rounded-[28px] border-[7px] border-[#202622] bg-[#202622] shadow-2xl">
                <Image
                  src="/images/template-classic.png"
                  alt="Preview undangan dalam layar handphone"
                  fill
                  sizes="158px"
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 h-44 bg-[linear-gradient(0deg,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.6)_48%,rgba(0,0,0,0)_100%)]" />
                <div className="absolute inset-x-4 bottom-8 text-center text-white">
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/78">
                    The Wedding Of
                  </p>
                  <p className="wedding-editorial mt-2 text-2xl leading-none">
                    Alya & Dimas
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-12 pt-4 md:px-10 lg:px-14">
        <div className="mx-auto grid max-w-6xl gap-3 md:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border border-[#e7dfd0] bg-white p-5 shadow-soft"
            >
              <feature.icon
                size={22}
                className="text-[#2d6844]"
                aria-hidden="true"
              />
              <h2 className="mt-4 text-base font-semibold">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#667269]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 py-12 md:px-10 lg:px-14">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div className="self-center">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#9a6e20]">
                Template siap pakai
              </p>
              <h2 className="mt-3 text-3xl font-semibold md:text-4xl">
                Empat tampilan landing page, bukan cuma beda warna.
              </h2>
              <p className="mt-4 text-base leading-8 text-[#667269]">
                Setiap template membawa rasa visual yang berbeda lewat font,
                layout, efek, dan cara foto ditampilkan. Data yang sama tetap
                bisa tampil elegan, minimal, romantis, atau modern.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {workflow.slice(0, 2).map((item) => (
                  <div
                    key={item.title}
                    className="rounded-lg border border-[#e7dfd0] bg-white p-4"
                  >
                    <item.icon
                      size={20}
                      className="text-[#2d6844]"
                      aria-hidden="true"
                    />
                    <p className="mt-3 text-sm font-semibold">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-[#667269]">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {templateShowcase.map((template) => (
                <Link
                  key={template.id}
                  href={`/templates/${template.id}`}
                  className={`rounded-lg border border-[#e7dfd0] p-4 shadow-soft ${template.bg}`}
                >
                  <div className="mx-auto aspect-[1320/2868] w-full max-w-[190px] overflow-hidden rounded-[28px] border-[7px] border-[#222824] bg-white shadow-xl">
                    <div className="relative h-full">
                      <Image
                        src={template.image}
                        alt={`Screenshot template ${template.label}`}
                        fill
                        sizes="190px"
                        className="object-cover"
                      />
                      <div className={`absolute inset-0 ${template.overlay}`} />
                      <div className="absolute inset-x-0 bottom-0 h-56 bg-[linear-gradient(0deg,rgba(0,0,0,0.94)_0%,rgba(0,0,0,0.74)_36%,rgba(0,0,0,0.3)_70%,rgba(0,0,0,0)_100%)]" />
                      <div className="absolute left-1/2 top-2 h-4 w-20 -translate-x-1/2 rounded-full bg-[#222824]" />
                      <div className="absolute inset-x-4 bottom-5 text-center text-white">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/88 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
                          The Wedding Of
                        </p>
                        <h3 className={`mt-2 ${template.titleClass}`}>
                          Alya & Dimas
                        </h3>
                        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.13em] text-white/88 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
                          13 Juli 2026
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{template.label}</p>
                    <span
                      className={`h-3 w-8 rounded-full ${template.accent}`}
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#eef3eb] px-5 py-14 md:px-10 lg:px-14">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="rounded-lg border border-[#d8e2d7] bg-white p-4 shadow-soft">
            <div className="rounded-lg border border-[#e4dfd4] bg-[#fbfaf6] p-4">
              <div className="flex items-center justify-between gap-3 border-b border-[#e4dfd4] pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7f8a81]">
                    Customer dashboard
                  </p>
                  <p className="mt-1 text-xl font-semibold text-[#17211c]">
                    Alya & Dimas
                  </p>
                </div>
                <span className="rounded-md bg-[#e4f2e6] px-3 py-2 text-xs font-bold text-[#3d7246]">
                  Aktif
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  ["Template", "Classic"],
                  ["Gallery", "20 foto"],
                  ["RSVP", "0 tamu"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-lg border border-[#e4dfd4] bg-white px-4 py-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7f8a81]">
                      {label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[#17211c]">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-[0.8fr_1.2fr]">
                <div className="rounded-lg border border-[#e4dfd4] bg-white p-4">
                  <p className="text-sm font-semibold text-[#17211c]">
                    Progress publikasi
                  </p>
                  <div className="mt-4 space-y-3">
                    {["Detail acara", "Foto & media", "Template", "Pembayaran"].map(
                      (item, index) => (
                        <div key={item} className="flex items-center gap-3">
                          <span
                            className={`h-3 w-3 rounded-full ${
                              index < 3 ? "bg-[#3d7246]" : "bg-[#bd8b32]"
                            }`}
                          />
                          <span className="text-sm text-[#59645d]">{item}</span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
                <div className="relative min-h-56 overflow-hidden rounded-lg border border-[#e4dfd4] bg-[#17211c]">
                  <Image
                    src="/images/template-minimalist.png"
                    alt="Preview dashboard undangan"
                    fill
                    sizes="520px"
                    className="object-cover opacity-[0.82]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#17211c]/86 via-[#17211c]/48 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5 text-white">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/68">
                      Live preview
                    </p>
                    <p className="mt-2 max-w-xs text-2xl font-semibold">
                      Data berubah, undangan ikut berubah.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#9a6e20]">
              Dashboard per user
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-[#17211c] md:text-4xl">
              Data undangan tidak bercampur antar akun.
            </h2>
            <p className="mt-4 text-base leading-8 text-[#667269]">
              Setelah register atau login, user hanya masuk ke dashboard
              miliknya. Detail acara, template, foto, media, pembayaran, dan
              RSVP diambil dari backend berdasarkan akun tersebut.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {workflow.slice(2).map((item) => (
                <div
                  key={item.title}
                  className="rounded-lg border border-[#d8e2d7] bg-white p-4 shadow-soft"
                >
                  <item.icon
                    size={20}
                    className="text-[#2d6844]"
                    aria-hidden="true"
                  />
                  <p className="mt-3 text-sm font-semibold text-[#17211c]">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#667269]">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-10 lg:px-14">
        <div className="mx-auto grid max-w-6xl overflow-hidden rounded-lg border border-[#e7dfd0] bg-[#17211c] shadow-soft md:grid-cols-[1fr_0.62fr]">
          <div className="p-6 text-white md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#d6b86e]">
              Coba sekarang
            </p>
            <h2 className="mt-2 max-w-2xl text-2xl font-semibold md:text-4xl">
              Mulai dari satu undangan, lalu publish setelah pembayaran aktif.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/68">
              Dashboard sudah terhubung ke backend, payment gateway, dan database
              PostgreSQL untuk menyimpan data undangan per user.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#d6b86e] px-5 text-sm font-bold text-[#17211c] hover:bg-[#e4c77e]"
              >
                Register
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-white/22 px-5 text-sm font-bold text-white hover:bg-white/10"
              >
                Login
              </Link>
            </div>
          </div>
          <div className="relative min-h-64">
            <Image
              src="/images/template-floral.png"
              alt="Preview akhir undangan digital"
              fill
              sizes="420px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,0.86)_0%,rgba(0,0,0,0.56)_34%,rgba(0,0,0,0.16)_68%,rgba(0,0,0,0)_100%)]" />
          </div>
        </div>
      </section>

      <footer className="border-t border-[#e7dfd0] bg-[#f3efe5] px-5 py-10 md:px-10 lg:px-14">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.2fr_repeat(3,1fr)]">
          <div>
            <Link href="/" className="flex items-center gap-3 text-[#17211c]">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#17211c] text-white">
                <Music2 size={20} aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-semibold">
                  Jago Wedding
                </span>
                <span className="block text-xs text-[#667269]">
                  Online Invitation
                </span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-[#667269]">
              Platform undangan digital untuk pasangan yang ingin membuat,
              mengatur, membayar, dan membagikan undangan dari satu tempat.
            </p>
            <p className="mt-5 text-sm font-semibold text-[#667269]">
              &copy; 2027 Jago Wedding Online. All rights reserved.
            </p>
          </div>

          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <p className="text-sm font-semibold capitalize text-[#17211c]">
                {group}
              </p>
              <ul className="mt-4 space-y-3 text-sm text-[#667269]">
                {links.map((link) => (
                  <li key={link}>{link}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </footer>
    </main>
  );
}
