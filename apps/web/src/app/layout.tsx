import React from "react";
import type { Metadata } from "next";
import { IBM_Plex_Sans, Rubik } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/app-sidebar";

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
        <AppSidebar />

        <main className="min-h-screen pl-72">
          {/* тонкая рамка как в референсе */}
          <div className="min-h-screen p-2.5 pl-0">
            
            {/* контентная область */}
            <div className="min-h-[calc(100vh-20px)] overflow-hidden rounded-[36px] bg-[#f3f3f1] px-8 py-8 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]">
              
              <div className="mx-auto max-w-[1500px]">
                {children}
              </div>

            </div>
          </div>
        </main>
      </body>
    </html>
  );
}