"use client";
import { PageTitle } from "@/components/page-title";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <html lang="ru">
      <body>
        <div style={{ padding: 32, fontFamily: "sans-serif" }}>
          <PageTitle>Критическая ошибка</PageTitle>
          <p>{error.message}</p>
        </div>
      </body>
    </html>
  );
}
