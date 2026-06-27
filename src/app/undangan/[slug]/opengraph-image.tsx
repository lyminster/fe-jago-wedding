import { fetchPublicInvitation } from "@/lib/public-invitation-server";
import { ImageResponse } from "next/og";

export const alt = "Undangan pernikahan digital dari Jago Wedding Online";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL?.trim() ??
  "https://jago-wedding.up.railway.app";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await fetchPublicInvitation(slug);
  const orderedNames =
    data?.coupleOrder === "groom-first"
      ? [data.groom.name, data.bride.name]
      : [data?.bride.name, data?.groom.name];
  const firstName = orderedNames[0]?.trim() || "Mempelai";
  const secondName = orderedNames[1]?.trim() || "Pasangan";
  const coverUrl =
    data?.photos.cover?.url || new URL("/images/couple-hero.png", appUrl).toString();

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#1f3028",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
          width: "100%",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverUrl}
          alt=""
          height="630"
          width="1200"
          style={{
            height: "100%",
            objectFit: "cover",
            position: "absolute",
            width: "100%",
          }}
        />
        <div
          style={{
            background:
              "linear-gradient(180deg, rgba(14,24,19,0.10) 0%, rgba(14,24,19,0.35) 42%, rgba(14,24,19,0.92) 100%)",
            display: "flex",
            inset: 0,
            position: "absolute",
          }}
        />
        <div
          style={{
            alignItems: "center",
            color: "white",
            display: "flex",
            flexDirection: "column",
            marginTop: 220,
            padding: "48px 80px",
            position: "relative",
            textAlign: "center",
          }}
        >
          <div
            style={{
              color: "#f5df9a",
              display: "flex",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            The Wedding Of
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Georgia, serif",
              fontSize: 68,
              fontWeight: 700,
              lineHeight: 1.08,
              marginTop: 18,
              maxWidth: 1040,
            }}
          >
            {firstName} &amp; {secondName}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              marginTop: 24,
              opacity: 0.9,
            }}
          >
            Buka undangan dan berikan doa restu Anda
          </div>
        </div>
      </div>
    ),
    size,
  );
}
