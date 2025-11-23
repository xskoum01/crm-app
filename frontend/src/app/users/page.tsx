"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shell } from "../_components/Shell";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

export default function UsersPage() {
  const router = useRouter();

  const [items, setItems] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function applyFilter(list: User[], term: string) {
    if (!term) return list;
    const t = term.toLowerCase();
    return list.filter((u) => {
      const name = u.name?.toLowerCase() ?? "";
      const email = u.email?.toLowerCase() ?? "";
      const role = u.role?.toLowerCase() ?? "";
      return (
        name.includes(t) ||
        email.includes(t) ||
        role.includes(t)
      );
    });
  }

  const filtered = applyFilter(items, search);

  async function loadUsers() {
    try {
      setLoading(true);
      setError(null);
      const data = await api<User[]>("/users");
      setItems(data);
    } catch (e) {
      console.error(e);
      setError("Nepodařilo se načíst uživatele.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(id?: number) {
    if (!id) return;
    if (!window.confirm("Opravdu chceš tohoto uživatele smazat?")) return;

    try {
      await api(`/users/${id}`, { method: "DELETE" });
      await loadUsers();
    } catch (e) {
      console.error(e);
      setError("Uživatele se nepodařilo smazat.");
    }
  }

  return (
    <Shell>
      <section className="space-y-5">
        {/* Hlavička */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Uživatelé</h2>
            <p className="text-sm text-slate-500">
              Správa uživatelů systému a jejich rolí.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="hidden md:inline">
              {items.length} uživatelů v systému
            </span>
            <button
              type="button"
              onClick={() => router.push("/users/new")}
              className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1"
            >
              Nový uživatel
            </button>
          </div>
        </div>

        {/* Hledání */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-sm">
            <input
              type="text"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
              placeholder="Hledat podle jména, e-mailu nebo role…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {loading && (
            <span className="text-xs text-slate-500">Načítám uživatele…</span>
          )}
        </div>

        {/* Chyba */}
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Seznam */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Seznam uživatelů
              </h3>
              <p className="text-xs text-slate-500">
                Kliknutím na řádek otevřeš detail a můžeš uživatele upravit.
              </p>
            </div>
          </div>

          {filtered.length === 0 && !loading ? (
            <div className="flex h-32 items-center justify-center text-xs text-slate-500">
              Zatím tu žádní uživatelé nejsou. Přidej prvního pomocí „Nový
              uživatel“.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((u) => {
                const isActive = u.active ?? true;
                return (
                  <li
                    key={u.id}
                    className="flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50 cursor-pointer"
                    onClick={() => router.push(`/users/${u.id}`)}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-slate-900">
                        {u.name || "Bez jména"}
                      </span>
                      <div className="flex flex-wrap gap-3 text-[11px] text-slate-500">
                        <span>
                          E-mail:{" "}
                          <span className="text-slate-900">
                            {u.email || "—"}
                          </span>
                        </span>
                        {u.role && (
                          <span>
                            Role:{" "}
                            <span className="text-slate-900">{u.role}</span>
                          </span>
                        )}
                        <span>
                          Stav:{" "}
                          <span
                            className={
                              isActive ? "text-emerald-600" : "text-slate-500"
                            }
                          >
                            {isActive ? "Aktivní" : "Neaktivní"}
                          </span>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(u.id);
                      }}
                      className="text-xs font-medium text-rose-600 hover:text-rose-700"
                    >
                      Smazat
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </Shell>
  );
}
