import "server-only";

import { cache } from "react";
import type { WeddingData } from "@/components/wedding-data-store";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:8080";

type ApiEnvelope<T> = {
  data: T;
};

type PublicInvitation = {
  data: WeddingData;
};

export const fetchPublicInvitation = cache(async (slug: string) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/public/invitations/${encodeURIComponent(slug)}`,
      { cache: "no-store" },
    );

    if (!response.ok) return null;

    const envelope = (await response.json()) as ApiEnvelope<PublicInvitation>;
    return envelope.data?.data ?? null;
  } catch {
    return null;
  }
});
