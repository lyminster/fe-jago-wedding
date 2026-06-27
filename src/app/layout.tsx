import type { Metadata } from "next";
import "./globals.css";

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL?.trim() ??
  "https://jago-wedding.up.railway.app";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  applicationName: "Jago Wedding Online",
  title: {
    default: "Jago Wedding Online - Undangan Pernikahan Digital",
    template: "%s | Jago Wedding Online",
  },
  description:
    "Buat undangan pernikahan digital dengan template elegan, musik, galeri foto, lokasi, RSVP, dan amplop digital dalam satu halaman.",
  keywords: [
    "undangan pernikahan digital",
    "undangan online",
    "website pernikahan",
    "wedding invitation Indonesia",
    "undangan nikah",
  ],
  authors: [{ name: "Jago Wedding Online", url: appUrl }],
  creator: "Jago Wedding Online",
  publisher: "Jago Wedding Online",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: "Jago Wedding Online",
    title: "Jago Wedding Online - Undangan Pernikahan Digital",
    description:
      "Buat dan bagikan undangan pernikahan digital yang elegan, lengkap dengan RSVP, galeri, musik, dan lokasi acara.",
    images: [
      {
        url: "/images/couple-hero.png",
        alt: "Jago Wedding Online",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jago Wedding Online - Undangan Pernikahan Digital",
    description:
      "Buat dan bagikan undangan pernikahan digital yang elegan dalam satu halaman.",
    images: ["/images/couple-hero.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
