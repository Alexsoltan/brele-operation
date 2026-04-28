import type { Metadata } from "next";
import "./globals.css";
import { AppSidebar } from "@/components/app-sidebar";

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
    <html lang="ru">
      <body className="bg-[#f3f3f1] text-gray-950 antialiased">
        <AppSidebar />

        <main className="min-h-screen pl-64">
          <div className="mx-auto max-w-[1500px] px-8 py-8">{children}</div>
        </main>
      </body>
    </html>
  );
}
