"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("admin@brele.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error || "Не удалось войти");
        return;
      }

      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#1f1f1f] px-6">
      <section className="w-full max-w-md rounded-[36px] bg-[#f3f3f1] p-8 shadow-xl">
        <div className="mb-8">
          <img
            src="/logo.png"
            alt="Brele"
            className="h-auto w-32 object-contain"
          />

          <h1 className="mt-8 font-heading text-3xl font-semibold tracking-[-0.04em]">
            Вход
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Введите email и пароль, чтобы открыть панель Brele.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-xs font-medium text-gray-500">Email</span>

            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              className="h-[50px] w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-black"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-medium text-gray-500">Пароль</span>

            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
              className="h-[50px] w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-black"
            />
          </label>

          {error ? (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className="inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-black px-4 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            Войти
          </button>
        </form>
      </section>
    </main>
  );
}