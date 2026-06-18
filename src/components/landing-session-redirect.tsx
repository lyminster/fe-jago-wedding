"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  clearBackendSession,
  getStoredBackendSession,
  loadCurrentAuthSession,
} from "@/lib/backend-api";

export function LandingSessionRedirect() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    async function redirectActiveSession() {
      if (!getStoredBackendSession()) return;

      try {
        await loadCurrentAuthSession();
        if (isMounted) {
          router.replace("/dashboard");
        }
      } catch {
        clearBackendSession();
      }
    }

    void redirectActiveSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return null;
}
