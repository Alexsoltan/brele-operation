"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit3, Eye, EyeOff, Lock, Plus, Search, Trash2, Users } from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { UIModal } from "@/components/ui-modal";
import { UiSelect } from "@/components/ui-select";

type UserRole = "ADMIN" | "MANAGER" | "ANALYST";

type UserItem = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

type CurrentUser = {
  id: string;
  role: UserRole;
};

type FormState = {
  id?: string;
  email: string;
  name: string;
  role: UserRole;
  password: string;
};

const emptyForm: FormState = {
  email: "",
  name: "",
  role: "ANALYST",
  password: "",
};

const roleOptions = [
  { value: "ADMIN", label: "Админ" },
  { value: "MANAGER", label: "Менеджер" },
  { value: "ANALYST", label: "Аналитик" },
];

function roleLabel(role: UserRole) {
  if (role === "ADMIN") return "Админ";
  if (role === "MANAGER") return "Менеджер";
  return "Аналитик";
}

function roleTone(role: UserRole) {
  if (role === "ADMIN") return "bg-black text-white";
  if (role === "MANAGER") return "bg-[#d9ff3f] text-black";
  return "bg-gray-100 text-gray-600";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function sortUsers(users: UserItem[]) {
  const roleOrder: Record<UserRole, number> = {
    ADMIN: 0,
    MANAGER: 1,
    ANALYST: 2,
  };

  return [...users].sort((left, right) => {
    const roleDelta = roleOrder[left.role] - roleOrder[right.role];
    if (roleDelta !== 0) return roleDelta;

    return (
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    );
  });
}

export default function UsersSettingsPage() {
  const [items, setItems] = useState<UserItem[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const [meResponse, usersResponse] = await Promise.all([
        fetch("/api/me"),
        fetch("/api/users"),
      ]);

      if (meResponse.ok) {
        const me = await meResponse.json();
        setCurrentUser({ id: me.id, role: me.role });
      }

      if (usersResponse.status === 403 || usersResponse.status === 401) {
        setItems([]);
        setError("Раздел доступен только администраторам.");
        return;
      }

      if (!usersResponse.ok) {
        throw new Error("Не удалось загрузить пользователей");
      }

      const data = await usersResponse.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Не удалось загрузить пользователей",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filteredItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return items;

    return items.filter((item) => {
      return (
        item.email.toLowerCase().includes(search) ||
        item.name?.toLowerCase().includes(search) ||
        roleLabel(item.role).toLowerCase().includes(search)
      );
    });
  }, [items, query]);

  function openCreateModal() {
    setForm(emptyForm);
    setError(null);
    setShowPassword(false);
    setModalOpen(true);
  }

  function openEditModal(item: UserItem) {
    setForm({
      id: item.id,
      email: item.email,
      name: item.name ?? "",
      role: item.role,
      password: "",
    });
    setError(null);
    setShowPassword(false);
    setModalOpen(true);
  }

  async function saveForm() {
    if (!form.email.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        form.id ? `/api/users/${form.id}` : "/api/users",
        {
          method: form.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email,
            name: form.name,
            role: form.role,
            password: form.password,
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Не удалось сохранить пользователя");
      }

      const savedUser = (await response.json()) as UserItem;

      setItems((current) => {
        const exists = current.some((item) => item.id === savedUser.id);

        if (exists) {
          return sortUsers(
            current.map((item) => (item.id === savedUser.id ? savedUser : item)),
          );
        }

        return sortUsers([...current, savedUser]);
      });

      setModalOpen(false);
      setForm(emptyForm);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Не удалось сохранить пользователя",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser() {
    if (!deleteTarget) return;

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Не удалось удалить пользователя");
      }

      setItems((current) =>
        current.filter((item) => item.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Не удалось удалить пользователя",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[34px] bg-[#1f1f1f] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.12)]">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-[#d9ff3f] px-3 py-1 text-xs font-bold text-black">
              Admin only
            </div>

            <h1 className="font-heading text-3xl font-semibold tracking-[-0.05em]">
              Пользователи
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
              Управление доступом к сервису: пользователи, роли и смена пароля.
              Раздел доступен только администраторам.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            disabled={Boolean(error && items.length === 0)}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[#d9ff3f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={16} />
            Добавить пользователя
          </button>
        </div>
      </section>

      <section className="rounded-[34px] border border-gray-200 bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.06)]">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск по имени, email или роли"
              className="h-12 w-full rounded-2xl border border-gray-200 bg-[#f3f3f1] pl-10 pr-4 text-sm outline-none transition focus:border-black"
            />
          </div>
        </div>

        {error ? (
          <div className="mb-5 rounded-2xl border border-[#ffd7d7] bg-[#fff5f5] px-4 py-3 text-sm font-medium text-[#7f1d1d]">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-[26px] border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">
            Загружаем пользователей...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-[30px] border border-dashed border-gray-200 bg-[#fbfbfa] p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#d9ff3f] text-black">
              <Users size={22} />
            </div>

            <h3 className="text-lg font-semibold text-gray-950">
              Пользователей не найдено
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Добавь пользователя и назначь ему роль для доступа к рабочему
              пространству.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[28px] border border-gray-200">
            <div className="grid grid-cols-[1.4fr_1fr_0.7fr_0.75fr_90px] bg-[#f3f3f1] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              <div>Пользователь</div>
              <div>Email</div>
              <div>Роль</div>
              <div>Создан</div>
              <div className="text-right">Действия</div>
            </div>

            <div className="divide-y divide-gray-100">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1.4fr_1fr_0.7fr_0.75fr_90px] items-center px-4 py-4 transition hover:bg-[#fbfbfa]"
                >
                  <div>
                    <div className="font-semibold text-gray-950">
                      {item.name || "Без имени"}
                    </div>
                    {item.id === currentUser?.id ? (
                      <div className="mt-1 text-xs text-gray-400">
                        Текущий пользователь
                      </div>
                    ) : null}
                  </div>

                  <div className="text-sm text-gray-600">{item.email}</div>

                  <div>
                    <span
                      className={[
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                        roleTone(item.role),
                      ].join(" ")}
                    >
                      {roleLabel(item.role)}
                    </span>
                  </div>

                  <div className="text-sm text-gray-500">
                    {formatDate(item.createdAt)}
                  </div>

                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-black"
                    >
                      <Edit3 size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      disabled={item.id === currentUser?.id}
                      className="rounded-full p-2 text-gray-400 transition hover:bg-[#ffd7d7] hover:text-[#7f1d1d] disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <UIModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? "Редактировать пользователя" : "Добавить пользователя"}
        width="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-xs font-semibold text-gray-500">Имя</span>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Борис Брелёв"
                className="h-12 w-full rounded-2xl border border-gray-200 bg-[#f3f3f1] px-4 text-sm outline-none focus:border-black"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold text-gray-500">Email</span>
              <input
                value={form.email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email: event.target.value }))
                }
                placeholder="user@company.com"
                className="h-12 w-full rounded-2xl border border-gray-200 bg-[#f3f3f1] px-4 text-sm outline-none focus:border-black"
              />
            </label>
          </div>

          <UiSelect
            label="Роль"
            value={form.role}
            options={roleOptions}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, role: value as UserRole }))
            }
          />

          <label className="block space-y-2 pt-3">
            <span className="flex items-center gap-2 text-xs font-semibold text-gray-500">
              <Lock size={13} />
              {form.id ? "Новый пароль" : "Пароль"}
            </span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, password: event.target.value }))
                }
                placeholder={
                  form.id
                    ? "Оставь пустым, если пароль менять не нужно"
                    : "Пароль"
                }
                className="h-12 w-full rounded-2xl border border-gray-200 bg-[#f3f3f1] px-4 pr-12 text-sm outline-none focus:border-black"
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-white hover:text-black"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>

          {error ? (
            <div className="rounded-2xl border border-[#ffd7d7] bg-[#fff5f5] px-4 py-3 text-sm font-medium text-[#7f1d1d]">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
            >
              Отмена
            </button>

            <button
              type="button"
              onClick={saveForm}
              disabled={saving || !form.email.trim()}
              className="rounded-2xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {saving ? "Сохраняем..." : "Сохранить"}
            </button>
          </div>
        </div>
      </UIModal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Удалить пользователя?"
        description={
          <>
            Пользователь{" "}
            <span className="font-semibold text-gray-950">
              {deleteTarget?.email}
            </span>{" "}
            потеряет доступ к сервису.
          </>
        }
        confirmText="Удалить"
        loadingText="Удаляем..."
        isLoading={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteUser}
      />
    </div>
  );
}
