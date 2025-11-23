"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Shell } from "../../_components/Shell";
import { api } from "@/lib/api";
import type { User, UserRole } from "@/lib/types";

const EMPTY_USER: User = {
  name: "",
  email: "",
  role: "user",
  active: true,
  note: "",
};

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();

  const rawId = params?.id as string | undefined;
  const isNew = rawId === "new";
  const id = !isNew && rawId ? Number(rawId) : null;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // načtení existujícího uživatele / nové položky
  useEffect(() => {
    async function loadExisting() {
      try {
        setLoading(true);
        setError(null);
        const data = await api<User>(`/users/${id}`);
        setUser(data);
      } catch (e) {
        console.error(e);
        setError("Nepodařilo se načíst uživatele.");
      } finally {
        setLoading(false);
      }
    }

    function loadNew() {
      setUser(EMPTY_USER);
      setLoading(false);
    }

    if (isNew) {
      loadNew();
    } else if (id && !Number.isNaN(id)) {
      loadExisting();
    } else {
      setError("Neplatné ID uživatele.");
      setLoading(false);
    }
  }, [id, isNew]);

  function updateField<K extends keyof User>(key: K, value: User[K]) {
    if (!user) return;
    setUser({ ...user, [key]: value });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (!user.name.trim()) {
      setError("Jméno uživatele je povinné.");
      return;
    }
    if (!user.email.trim()) {
      setError("E-mail je povinný.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload: User = {
        ...user,
        role: (user.role ?? "user") as UserRole,
        active: user.active ?? true,
      };

      if (isNew) {
        await api<User>("/users", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else {
        await api<User>(`/users/${user.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      }

      router.push("/users");
    } catch (e) {
      console.error(e);
      setError(
        isNew
          ? "Uživatele se nepodařilo vytvořit."
          : "Změny se nepodařilo uložit."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (isNew || !user?.id) return;
    if (!window.confirm("Opravdu chceš tohoto uživatele trvale smazat?")) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await api(`/users/${user.id}`, { method: "DELETE" });
      router.push("/users");
    } catch (e) {
      console.error(e);
      setError("Uživatele se nepodařilo smazat.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Shell>
        <section className="space-y-3">
          <p className="text-sm text-slate-500">Načítám uživatele…</p>
        </section>
      </Shell>
    );
  }

  if (!user) {
    return (
      <Shell>
        <section className="space-y-3">
          <p className="text-sm text-red-600">
            {error ?? "Uživatele se nepodařilo načíst."}
          </p>
          <Link
            href="/users"
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            ← Zpět na uživatele
          </Link>
        </section>
      </Shell>
    );
  }

  return (
    <Shell>
      <section className="space-y-5">
        {/* hlavička detailu */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Link
              href="/users"
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              ← Zpět na uživatele
            </Link>
            <h2 className="text-xl font-semibold text-slate-900">
              {isNew ? "Nový uživatel" : user.name || "Bez jména"}
            </h2>
          </div>
        </div>

        {/* chyba */}
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* formulář – dva sloupce */}
        <form
          onSubmit={handleSave}
          className="grid gap-4 md:grid-cols-[2fr_1.5fr]"
        >
          {/* levý sloupec */}
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">
                Základní informace o uživateli
              </h3>

              <div className="space-y-3">
                {/* jméno */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    Jméno (povinné)
                  </label>
                  <input
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
                    value={user.name}
                    onChange={(e) => updateField("name", e.target.value)}
                  />
                </div>

                {/* email */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    E-mail (povinné)
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
                    value={user.email}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                </div>

                {/* role */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    Role
                  </label>
                  <select
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
                    value={user.role ?? "user"}
                    onChange={(e) =>
                      updateField("role", e.target.value as UserRole)
                    }
                  >
                    <option value="user">Uživatel</option>
                    <option value="manager">Manažer</option>
                    <option value="admin">Administrátor</option>
                  </select>
                </div>

                {/* aktivní */}
                <div className="flex items-center gap-2">
                  <input
                    id="user-active"
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    checked={user.active ?? true}
                    onChange={(e) => updateField("active", e.target.checked)}
                  />
                  <label
                    htmlFor="user-active"
                    className="text-xs font-medium text-slate-600"
                  >
                    Uživatel je aktivní
                  </label>
                </div>

                {/* poznámka */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    Poznámka
                  </label>
                  <textarea
                    className="min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
                    value={user.note ?? ""}
                    onChange={(e) => updateField("note", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* pravý sloupec – akce */}
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Po úpravě údajů nezapomeň uložit změny.
              </div>
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
              >
                {saving
                  ? isNew
                    ? "Vytvářím…"
                    : "Ukládám…"
                  : isNew
                  ? "Vytvořit uživatele"
                  : "Uložit změny"}
              </button>
            </div>

            {!isNew && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm flex items-center justify-between">
                <div className="text-xs text-rose-700">
                  Smazáním uživatele ho odstraníš z databáze. Tuto akci nelze
                  vrátit zpět.
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleDelete}
                  className="rounded-md bg-rose-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-rose-700 disabled:bg-rose-300 disabled:cursor-not-allowed"
                >
                  Smazat uživatele
                </button>
              </div>
            )}
          </div>
        </form>
      </section>
    </Shell>
  );
}
