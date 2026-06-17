"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { RsvpTable } from "@/components/rsvp-table";
import { useWeddingDataStore } from "@/components/wedding-data-store";
import {
  getBackendErrorMessage,
  loadRsvpsFromBackend,
  type BackendRSVP,
} from "@/lib/backend-api";

export default function RsvpPage() {
  const { data, setInvitationMeta, setWeddingData } = useWeddingDataStore();
  const initialDataRef = useRef(data);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rsvps, setRsvps] = useState<BackendRSVP[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadRsvps() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await loadRsvpsFromBackend(initialDataRef.current);
        if (!isMounted) return;

        setInvitationMeta(result.invitation);
        setWeddingData(result.invitation.data);
        setRsvps(result.rsvps);
      } catch (error) {
        if (!isMounted) return;

        setErrorMessage(getBackendErrorMessage(error));
        setRsvps([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadRsvps();

    return () => {
      isMounted = false;
    };
  }, [setInvitationMeta, setWeddingData]);

  const rsvpStats = useMemo(() => getRsvpStats(rsvps, isLoading), [rsvps, isLoading]);

  return (
    <main className="min-h-screen bg-porcelain text-ink">
      <div className="flex min-h-screen">
        <DashboardSidebar active="rsvp" />

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[#e4dfd4] bg-porcelain/95 px-4 py-4 backdrop-blur md:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm text-[#6e7a72]">Dashboard customer</p>
                <h1 className="mt-1 text-2xl font-semibold text-ink md:text-3xl">
                  RSVP Tamu
                </h1>
              </div>
            </div>
          </header>

          <div className="flex-1 space-y-5 p-4 md:p-6">
            <section className="grid gap-3 md:grid-cols-3">
              {rsvpStats.map((item) => (
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

            <RsvpTable
              errorMessage={errorMessage}
              isLoading={isLoading}
              rsvps={rsvps}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function getRsvpStats(rsvps: BackendRSVP[], isLoading: boolean) {
  if (isLoading) {
    return [
      { label: "Total RSVP", value: "...", note: "Mengambil data tamu" },
      { label: "Akan hadir", value: "...", note: "Termasuk jumlah rombongan" },
      { label: "Tidak hadir", value: "...", note: "Dengan alasan jika ada" },
    ];
  }

  const attendingGuests = rsvps
    .filter((rsvp) => isAttending(rsvp.attendanceStatus))
    .reduce((total, rsvp) => total + Math.max(rsvp.guestCount, 1), 0);
  const notAttendingCount = rsvps.filter((rsvp) =>
    isNotAttending(rsvp.attendanceStatus),
  ).length;

  return [
    { label: "Total RSVP", value: String(rsvps.length), note: "Semua respons tamu" },
    {
      label: "Akan hadir",
      value: String(attendingGuests),
      note: "Termasuk jumlah rombongan",
    },
    {
      label: "Tidak hadir",
      value: String(notAttendingCount),
      note: "Dengan alasan jika ada",
    },
  ];
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
