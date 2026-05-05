"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Mail } from "lucide-react";

type MailAccount = {
  id: string;
  email: string;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  username: string;
  isActive: boolean;
  lastSyncAt?: string | null;
  syncError?: string | null;
};

const emptyAccountForm = {
  email: "",
  password: "",
  imapHost: "imap.yandex.ru",
  imapPort: "993",
  imapSecure: true,
};

function formatDate(value?: string | null) {
  if (!value) return "Почта ещё не проверялась";
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MailAccountsSettings() {
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [accountForm, setAccountForm] = useState(emptyAccountForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [error, setError] = useState("");

  async function loadAccounts() {
    const response = await fetch("/api/mail-accounts", { cache: "no-store" });

    if (response.ok) {
      setAccounts(await response.json());
    }
  }

  useEffect(() => {
    loadAccounts().finally(() => setIsLoading(false));
  }, []);

  async function handleSaveAccount() {
    setIsSavingAccount(true);
    setError("");

    try {
      const response = await fetch("/api/mail-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: accountForm.email,
          username: accountForm.email,
          password: accountForm.password,
          imapHost: accountForm.imapHost,
          imapPort: Number(accountForm.imapPort),
          imapSecure: accountForm.imapSecure,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.error ?? "Не удалось сохранить подключение почты.",
        );
      }

      setAccountForm(emptyAccountForm);
      await loadAccounts();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Не удалось сохранить подключение почты.",
      );
    } finally {
      setIsSavingAccount(false);
    }
  }

  if (isLoading) {
    return <div className="p-6 text-sm text-gray-500">Загрузка почты...</div>;
  }

  return (
    <div className="grid grid-cols-[1fr_1.2fr] gap-4">
      <section className="rounded-3xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Mail size={17} />
          Личная почта для импорта
        </div>

        <div className="mt-4 grid gap-3">
          <input
            value={accountForm.email}
            onChange={(event) =>
              setAccountForm((prev) => ({ ...prev, email: event.target.value }))
            }
            placeholder="manager@company.ru"
            className="h-[46px] rounded-2xl border border-gray-200 bg-[#f3f3f1] px-4 text-sm outline-none focus:border-black"
          />

          <input
            value={accountForm.password}
            type="password"
            onChange={(event) =>
              setAccountForm((prev) => ({
                ...prev,
                password: event.target.value,
              }))
            }
            placeholder="Пароль приложения или почты"
            className="h-[46px] rounded-2xl border border-gray-200 bg-[#f3f3f1] px-4 text-sm outline-none focus:border-black"
          />

          <div className="grid grid-cols-[1fr_110px] gap-3">
            <input
              value={accountForm.imapHost}
              onChange={(event) =>
                setAccountForm((prev) => ({
                  ...prev,
                  imapHost: event.target.value,
                }))
              }
              className="h-[46px] rounded-2xl border border-gray-200 bg-[#f3f3f1] px-4 text-sm outline-none focus:border-black"
            />

            <input
              value={accountForm.imapPort}
              onChange={(event) =>
                setAccountForm((prev) => ({
                  ...prev,
                  imapPort: event.target.value,
                }))
              }
              className="h-[46px] rounded-2xl border border-gray-200 bg-[#f3f3f1] px-4 text-sm outline-none focus:border-black"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={accountForm.imapSecure}
              onChange={(event) =>
                setAccountForm((prev) => ({
                  ...prev,
                  imapSecure: event.target.checked,
                }))
              }
              className="h-4 w-4 accent-black"
            />
            Защищённое подключение
          </label>

          {error ? (
            <div className="rounded-2xl border border-[#ffd7d7] bg-[#fff5f5] px-4 py-3 text-sm font-medium text-[#7f1d1d]">
              {error}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleSaveAccount}
            disabled={
              isSavingAccount ||
              !accountForm.email.trim() ||
              !accountForm.password.trim()
            }
            className="inline-flex h-[46px] items-center justify-center gap-2 rounded-2xl bg-black px-4 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isSavingAccount ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Check size={16} />
            )}
            Сохранить подключение
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-5">
        <div className="text-sm font-semibold">Подключенные ящики</div>

        <div className="mt-4 space-y-2">
          {accounts.length === 0 ? (
            <div className="rounded-2xl bg-[#f3f3f1] p-4 text-sm text-gray-500">
              Почта ещё не подключена.
            </div>
          ) : (
            accounts.map((account) => (
              <div key={account.id} className="rounded-2xl bg-[#f3f3f1] p-4 text-sm">
                <div className="font-medium">{account.email}</div>
                <div className="mt-1 text-xs text-gray-500">
                  Последняя проверка: {formatDate(account.lastSyncAt)}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {account.imapHost}:{account.imapPort}
                </div>
                {account.syncError ? (
                  <div className="mt-2 text-xs text-red-600">
                    {account.syncError}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
