import { PublicInvitationClient } from "@/components/public-invitation-client";
import type { GuestComment } from "@/components/live-invitation-preview";
import type {
  InvitationTemplate,
  WeddingData,
} from "@/components/wedding-data-store";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:8080";

type ApiEnvelope<T> = {
  data: T;
};

type PublicInvitation = {
  data: WeddingData;
};

type PublicGuestMessage = {
  createdAt: string;
  guestName: string;
  id: string;
  message: string;
};

function mapGuestMessage(message: PublicGuestMessage): GuestComment {
  return {
    id: message.id,
    message: message.message,
    name: message.guestName,
    submittedAt: message.createdAt,
  };
}

async function fetchPublicData(slug: string) {
  const [invitationResponse, messagesResponse] = await Promise.all([
    fetch(`${API_BASE_URL}/api/public/invitations/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    }),
    fetch(
      `${API_BASE_URL}/api/public/invitations/${encodeURIComponent(slug)}/messages`,
      { cache: "no-store" },
    ),
  ]);

  if (!invitationResponse.ok || !messagesResponse.ok) {
    return null;
  }

  const invitationEnvelope =
    (await invitationResponse.json()) as ApiEnvelope<PublicInvitation>;
  const messagesEnvelope =
    (await messagesResponse.json()) as ApiEnvelope<PublicGuestMessage[]>;

  return {
    comments: (messagesEnvelope.data ?? []).map(mapGuestMessage),
    data: invitationEnvelope.data.data,
    template: invitationEnvelope.data.data.template.saved as InvitationTemplate,
  };
}

export default async function PublicInvitationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const publicData = await fetchPublicData(slug);

  if (!publicData) {
    redirect(await getMainLandingUrl());
  }

  return (
    <PublicInvitationClient
      initialComments={publicData.comments}
      initialData={publicData.data}
      initialTemplate={publicData.template}
      slug={slug}
    />
  );
}

async function getMainLandingUrl() {
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configuredAppUrl) return configuredAppUrl;

  const host = (await headers()).get("host") ?? "";
  const protocol =
    host.includes("localhost") || host.includes("lvh.me") ? "http" : "https";

  if (host.includes(".lvh.me") || host.includes(".localhost")) {
    const port = host.includes(":") ? `:${host.split(":").at(-1)}` : "";
    return `${protocol}://localhost${port}`;
  }

  if (host.endsWith(".jago-wedding.up.railway.app")) {
    return `${protocol}://jago-wedding.up.railway.app`;
  }

  return "/";
}
