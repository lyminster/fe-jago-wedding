"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Link2,
  LogOut,
  LockKeyhole,
  Palette,
  Sparkles,
  UploadCloud,
  UsersRound,
} from "lucide-react";
import {
  type InvitationMeta,
  useWeddingDataStore,
} from "@/components/wedding-data-store";
import { clearBackendSession } from "@/lib/backend-api";

type SidebarItem = {
  href: string;
  icon: typeof LayoutDashboard;
  id: "dashboard" | "template" | "media" | "rsvp";
  label: string;
};

const sidebarItems: SidebarItem[] = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    id: "dashboard",
    label: "Undangan saya",
  },
  {
    href: "/dashboard/template",
    icon: Palette,
    id: "template",
    label: "Template",
  },
  {
    href: "/dashboard/media",
    icon: UploadCloud,
    id: "media",
    label: "Foto & Media",
  },
  { href: "/dashboard/rsvp", icon: UsersRound, id: "rsvp", label: "RSVP" },
];

export function DashboardSidebar({
  active,
}: {
  active: SidebarItem["id"];
}) {
  const router = useRouter();
  const { data, invitationMeta } = useWeddingDataStore();
  const brideName = getFirstName(data.bride.name);
  const groomName = getFirstName(data.groom.name);
  const isGroomFirst = data.coupleOrder === "groom-first";
  const invitationName =
    brideName === "Mempelai" && groomName === "Mempelai"
      ? "Undangan baru"
      : isGroomFirst
        ? `${groomName} & ${brideName}`
        : `${brideName} & ${groomName}`;
  const slugLabel = data.slug.trim() || "slug-belum-diisi";
  const packageStatus = getPackageStatus(invitationMeta);

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-[#e4dfd4] bg-white px-4 py-6 sm:block">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-white">
          <Sparkles size={20} aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold">Jago Wedding</p>
          <p className="text-xs text-[#758178]">Customer Dashboard</p>
        </div>
      </div>

      <nav className="mt-8 space-y-1" aria-label="Dashboard navigation">
        {sidebarItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
              item.id === active
                ? "bg-[#eef3eb] font-semibold text-ink"
                : "text-[#68746c] hover:bg-[#f6f4ee]"
            }`}
          >
            <item.icon size={18} aria-hidden="true" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase text-[#8d928c]">
            Paket user
          </p>
          <span className="rounded-md bg-[#eef3eb] px-2 py-1 text-[11px] font-semibold text-[#47604b]">
            1 undangan
          </span>
        </div>
        <div className="rounded-lg border border-[#e8e3d8] bg-white px-3 py-3">
          <p className="text-sm font-semibold">{invitationName}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-[#758178]">
            <Link2 size={13} aria-hidden="true" />
            {slugLabel}
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span
              className={`rounded-md px-2 py-1 text-[11px] font-semibold ${packageStatus.badgeClass}`}
            >
              {packageStatus.label}
            </span>
            <span className="text-right text-xs text-[#758178]">
              {packageStatus.note}
            </span>
          </div>
        </div>
        <button
          className="mt-3 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-[#e4dfd4] bg-[#f7f5ef] px-3 py-2.5 text-sm font-semibold text-[#8b928b]"
          disabled
        >
          <LockKeyhole size={16} aria-hidden="true" />
          Kuota undangan penuh
        </button>
        <button
          type="button"
          onClick={() => {
            clearBackendSession();
            router.replace("/login");
          }}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-[#e4dfd4] px-3 py-2.5 text-sm font-semibold text-[#59645d] hover:bg-[#f6f4ee]"
        >
          <LogOut size={16} aria-hidden="true" />
          Keluar
        </button>
      </div>
    </aside>
  );
}

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || "Mempelai";
}

function getPackageStatus(invitationMeta: InvitationMeta | null) {
  if (
    invitationMeta?.paymentStatus === "paid" &&
    invitationMeta.status === "active" &&
    !isExpired(invitationMeta.expiredAt)
  ) {
    return {
      badgeClass: "bg-[#e4f2e6] text-[#3d7246]",
      label: "Aktif",
      note: `sampai ${formatShortDate(invitationMeta.expiredAt)}`,
    };
  }

  if (invitationMeta?.status === "expired") {
    return {
      badgeClass: "bg-[#f6e7e4] text-[#a64f3f]",
      label: "Kedaluwarsa",
      note: "Perlu bayar lagi",
    };
  }

  if (invitationMeta?.status === "pending_payment") {
    return {
      badgeClass: "bg-[#f3ead9] text-[#8a6227]",
      label: "Menunggu bayar",
      note: "Belum aktif",
    };
  }

  return {
    badgeClass: "bg-[#f3ead9] text-[#8a6227]",
    label: "Draft",
    note: "Belum aktif",
  };
}

function isExpired(expiredAt?: string) {
  if (!expiredAt) return false;

  const expiredTime = Date.parse(expiredAt);

  return !Number.isNaN(expiredTime) && Date.now() >= expiredTime;
}

function formatShortDate(dateValue?: string) {
  if (!dateValue) return "-";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Jakarta",
  }).format(date);
}
