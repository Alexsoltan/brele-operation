"use client";

import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-8">
      <h1 className="text-xl font-semibold">Что-то пошло не так</h1>
      <p className="mt-2 text-sm text-gray-500">{error.message}</p>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-2xl bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Повторить
        </button>

        <Link
          href="/"
          className="rounded-2xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600"
        >
          На дашборд
        </Link>
      </div>
    </div>
  );
}
