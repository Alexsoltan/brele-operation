import Link from "next/link";
import { PageTitle } from "@/components/page-title";

export default function NotFound() {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-8">
      <PageTitle>Страница не найдена</PageTitle>
      <Link
        href="/"
        className="mt-4 inline-flex text-sm font-medium text-gray-500 hover:text-black"
      >
        На дашборд
      </Link>
    </div>
  );
}
