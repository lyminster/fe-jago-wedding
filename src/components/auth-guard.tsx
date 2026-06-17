"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearBackendSession,
  getStoredBackendSession,
  loadCurrentAuthSession,
} from "@/lib/backend-api";
import { useWeddingDataStore } from "@/components/wedding-data-store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setInvitationMeta, setWeddingData } = useWeddingDataStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function validateSession() {
      if (!getStoredBackendSession()) {
        router.replace("/login");
        return;
      }

      try {
        const session = await loadCurrentAuthSession();
        if (!isMounted) return;

        setInvitationMeta(session.invitation);
        setWeddingData(session.invitation.data);
        setIsReady(true);
      } catch {
        clearBackendSession();
        router.replace("/login");
      }
    }

    void validateSession();

    return () => {
      isMounted = false;
    };
  }, [router, setInvitationMeta, setWeddingData]);

  if (!isReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-porcelain px-4 text-ink">
        <div className="rounded-lg border border-[#e4dfd4] bg-white px-5 py-4 text-sm font-semibold shadow-soft">
          Memeriksa sesi login...
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
