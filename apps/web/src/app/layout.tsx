import React from "react";
import type { Metadata } from "next";
import { IBM_Plex_Sans, Rubik } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

const rubik = Rubik({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Brele Operations",
  description: "Операционная панель Brele",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ru"
      className={`${rubik.variable ?? ""} ${ibmPlexSans.variable ?? ""}`}
    >
      <body className="bg-[#1f1f1f] font-body text-gray-950 antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}