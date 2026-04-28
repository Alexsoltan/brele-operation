import type { Metadata } from "next";
import { AppSidebar } from "@/components/app-sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brele Operations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="bg-[#f3f3f1] text-black">
        <div className="flex min-h-screen">
          <AppSidebar />

          <main className="ml-72 flex-1 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}