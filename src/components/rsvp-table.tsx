import { UserCheck, UserX } from "lucide-react";
import type { BackendRSVP } from "@/lib/backend-api";

type RsvpTableProps = {
  errorMessage?: string | null;
  isLoading?: boolean;
  rsvps: BackendRSVP[];
};

export function RsvpTable({
  errorMessage,
  isLoading = false,
  rsvps,
}: RsvpTableProps) {
  const attendingCount = rsvps.filter((rsvp) =>
    isAttending(rsvp.attendanceStatus),
  ).length;
  const notAttendingCount = rsvps.filter((rsvp) =>
    isNotAttending(rsvp.attendanceStatus),
  ).length;

  return (
    <section className="rounded-lg border border-[#e4dfd4] bg-white p-4 shadow-soft md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">RSVP tamu</h2>
          <p className="mt-1 text-sm text-[#6e7a72]">
            List tamu yang akan datang dan tidak bisa datang.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-[#e4f2e6] px-3 py-2 text-xs font-semibold text-[#3d7246]">
            <UserCheck size={14} aria-hidden="true" />
            {attendingCount} hadir
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-[#f6e7e4] px-3 py-2 text-xs font-semibold text-[#a64f3f]">
            <UserX size={14} aria-hidden="true" />
            {notAttendingCount} tidak
          </span>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-[#e8e3d8]">
        <div className="hidden grid-cols-[1fr_120px_90px_1.2fr_130px] bg-[#f8f7f3] px-4 py-3 text-xs font-semibold uppercase text-[#758178] md:grid">
          <span>Nama tamu</span>
          <span>Status</span>
          <span>Jumlah</span>
          <span>Alasan</span>
          <span>Tanggal</span>
        </div>

        {isLoading ? (
          <EmptyTableState text="Mengambil data RSVP dari backend..." />
        ) : errorMessage ? (
          <EmptyTableState text={errorMessage} tone="error" />
        ) : rsvps.length === 0 ? (
          <EmptyTableState text="Belum ada RSVP untuk undangan ini." />
        ) : (
          rsvps.map((guest) => (
            <div
              key={guest.id}
              className="grid gap-3 border-b border-[#e8e3d8] px-4 py-3 text-sm last:border-b-0 md:grid-cols-[1fr_120px_90px_1.2fr_130px]"
            >
              <span className="font-semibold">{guest.guestName}</span>
              <span
                className={
                  isAttending(guest.attendanceStatus)
                    ? "text-[#3d7246]"
                    : "text-[#a64f3f]"
                }
              >
                {formatAttendanceStatus(guest.attendanceStatus)}
              </span>
              <span className="text-[#6e7a72]">
                {Math.max(guest.guestCount, 0)} orang
              </span>
              <span className="text-[#6e7a72]">{guest.reason || "-"}</span>
              <time className="text-[#6e7a72]">
                {formatRsvpDate(guest.createdAt)}
              </time>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function EmptyTableState({
  text,
  tone = "default",
}: {
  text: string;
  tone?: "default" | "error";
}) {
  return (
    <div
      className={`px-4 py-8 text-center text-sm ${
        tone === "error" ? "text-[#a64f3f]" : "text-[#6e7a72]"
      }`}
    >
      {text}
    </div>
  );
}

function formatAttendanceStatus(status: string) {
  if (isNotAttending(status)) return "Tidak hadir";
  if (isAttending(status)) return "Hadir";

  return status || "-";
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

function formatRsvpDate(createdAt: string) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: "Asia/Jakarta",
  })
    .format(date)
    .replace(".", ":");
}
