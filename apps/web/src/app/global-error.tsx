"use client";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <html lang="ru">
      <body>
        <div style={{ padding: 32, fontFamily: "sans-serif" }}>
          <h1>Критическая ошибка</h1>
          <p>{error.message}</p>
        </div>
      </body>
    </html>
  );
}
