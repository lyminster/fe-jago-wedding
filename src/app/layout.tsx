import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jago Wedding Online",
  description: "UI prototype for the wedding invitation builder dashboard.",
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
