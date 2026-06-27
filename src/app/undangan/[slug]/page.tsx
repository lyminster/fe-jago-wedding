import { PublicInvitationClient } from "@/components/public-invitation-client";
import type { GuestComment } from "@/components/live-invitation-preview";
import type {
  InvitationTemplate,
} from "@/components/wedding-data-store";
import { fetchPublicInvitation } from "@/lib/public-invitation-server";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:8080";

type ApiEnvelope<T> = {
  data: T;
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
  const [data, messagesResponse] = await Promise.all([
    fetchPublicInvitation(slug),
    fetch(
      `${API_BASE_URL}/api/public/invitations/${encodeURIComponent(slug)}/messages`,
      { cache: "no-store" },
    ),
  ]);

  if (!data || !messagesResponse.ok) {
    return null;
  }

  const messagesEnvelope =
    (await messagesResponse.json()) as ApiEnvelope<PublicGuestMessage[]>;

  return {
    comments: (messagesEnvelope.data ?? []).map(mapGuestMessage),
    data,
    template: data.template.saved as InvitationTemplate,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchPublicInvitation(slug);

  if (!data) {
    return {
      title: "Undangan tidak ditemukan",
      robots: { index: false, follow: false },
    };
  }

  const orderedNames =
    data.coupleOrder === "groom-first"
      ? [data.groom.name, data.bride.name]
      : [data.bride.name, data.groom.name];
  const [firstName, secondName] = orderedNames.map(
    (name, index) => name.trim() || (index === 0 ? "Mempelai" : "Pasangan"),
  );
  const coupleName = `${firstName} & ${secondName}`;
  const title = `Undangan Pernikahan ${coupleName}`;
  const description = `Dengan penuh sukacita, ${coupleName} mengundang Anda untuk hadir dan memberikan doa restu pada hari pernikahan mereka.`;
  const path = `/undangan/${encodeURIComponent(slug)}`;
  const imageUrl = `${path}/opengraph-image`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "id_ID",
      siteName: "Jago Wedding Online",
      url: path,
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `Undangan pernikahan ${coupleName}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function PublicInvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ to?: string | string[] }>;
}) {
  const { slug } = await params;
  const { to } = await searchParams;
  const recipientName = Array.isArray(to) ? to[0] : to;
  const publicData = await fetchPublicData(slug);

  if (!publicData) {
    redirect(await getMainLandingUrl());
  }

  return (
    <PublicInvitationClient
      initialComments={publicData.comments}
      initialData={publicData.data}
      initialTemplate={publicData.template}
      recipientName={recipientName}
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
