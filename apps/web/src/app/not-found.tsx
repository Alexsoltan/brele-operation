import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-8">
      <h1 className="text-xl font-semibold">Страница не найдена</h1>
      <Link
        href="/"
        className="mt-4 inline-flex text-sm font-medium text-gray-500 hover:text-black"
      >
        На дашборд
      </Link>
    </div>
  );
}
