import type { Metadata } from "next";
import { IBM_Plex_Sans, Rubik } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/app-sidebar";

const rubik = Rubik({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
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
    <html lang="ru" className={`${rubik.variable} ${ibmPlexSans.variable}`}>
      <body className="bg-[#f3f3f1] font-body text-gray-950 antialiased">
        <AppSidebar />

        <main className="min-h-screen pl-64">
          <div className="mx-auto max-w-[1500px] px-8 py-8">{children}</div>
        </main>
      </body>
    </html>
  );
}