"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shell } from "../_components/Shell";
import { api } from "@/lib/api";
import type { Meeting, MeetingStatus, Customer, User } from "@/lib/types";

// stejné barvy/labely jako v detailu
const STATUS_OPTIONS: {
  value: MeetingStatus;
  label: string;
  color: string;
}[] = [
  {
    value: "planned",
    label: "Naplánováno",
    color: "bg-sky-100 text-sky-700",
  },
  {
    value: "done",
    label: "Proběhla",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    value: "cancelled",
    label: "Zrušeno",
    color: "bg-rose-100 text-rose-700",
  },
];

export default function MeetingsPage() {
  const router = useRouter();

  const [items, setItems] = useState<Meeting[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customerNameById = new Map(
    customers.map((c) => [c.id, c.name] as const)
  );
  const userNameById = new Map(users.map((u) => [u.id, u.name] as const));

  function applyFilter(list: Meeting[], term: string) {
    if (!term) return list;
    const t = term.toLowerCase();
    return list.filter((m) => {
      const title = m.title?.toLowerCase() ?? "";
      const note = m.note?.toLowerCase() ?? "";
      const customerName =
        customerNameById.get(m.customer_id ?? -1)?.toLowerCase() ?? "";

      const userNamesJoined = (m.user_ids ?? [])
        .map((id) => userNameById.get(id)?.toLowerCase() ?? "")
        .join(" ");

      const statusLabel =
        STATUS_OPTIONS.find(
          (s) => s.value === (m.status ?? "planned")
        )?.label.toLowerCase() ?? "";

      return (
        title.includes(t) ||
        note.includes(t) ||
        customerName.includes(t) ||
        userNamesJoined.includes(t) ||
        statusLabel.includes(t)
      );
    });
  }

  const filtered = applyFilter(items, search);

  async function loadMeetings() {
    try {
      setLoading(true);
      setError(null);
      const data = await api<Meeting[]>("/meetings");
      setItems(data);
    } catch (e) {
      console.error(e);
      setError("Nepodařilo se načíst schůzky.");
    } finally {
      setLoading(false);
    }
  }

  async function loadCustomers() {
    try {
      const data = await api<Customer[]>("/customers");
      setCustomers(data);
    } catch (e) {
      console.error("Nepodařilo se načíst zákazníky pro schůzky.", e);
    }
  }

  async function loadUsers() {
    try {
      const data = await api<User[]>("/users");
      setUsers(data);
    } catch (e) {
      console.error("Nepodařilo se načíst uživatele pro schůzky.", e);
    }
  }

  useEffect(() => {
    loadMeetings();
    loadCustomers();
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(id?: number) {
    if (!id) return;
    if (!window.confirm("Opravdu chceš tuto schůzku smazat?")) return;
    try {
      await api(`/meetings/${id}`, { method: "DELETE" });
      await loadMeetings();
    } catch (e) {
      console.error(e);
      setError("Schůzku se nepodařilo smazat.");
    }
  }

  return (
    <Shell>
      <section className="space-y-5">
        {/* hlavička */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Schůzky</h2>
            <p className="text-sm text-slate-500">
              Přehled naplánovaných i proběhlých schůzek se zákazníky.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="hidden md:inline">
              {items.length} schůzek v systému
            </span>
            <button
              type="button"
              onClick={() => router.push("/meetings/new")}
              className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1"
            >
              Nová schůzka
            </button>
          </div>
        </div>

        {/* hledání */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-sm">
            <input
              type="text"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
              placeholder="Hledat podle názvu, zákazníka, uživatele nebo poznámky…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {loading && (
            <span className="text-xs text-slate-500">Načítám schůzky…</span>
          )}
        </div>

        {/* chyba */}
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* seznam */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Seznam schůzek
              </h3>
              <p className="text-xs text-slate-500">
                Kliknutím na řádek otevřeš detail a můžeš schůzku upravit.
              </p>
            </div>
          </div>

          {filtered.length === 0 && !loading ? (
            <div className="flex h-32 items-center justify-center text-xs text-slate-500">
              Zatím tu žádné schůzky nejsou. Přidej první pomocí „Nová
              schůzka“.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((m) => {
                const customerName =
                  (m.customer_id && customerNameById.get(m.customer_id)) ||
                  "Bez zákazníka";

                const statusOption =
                  STATUS_OPTIONS.find(
                    (s) => s.value === (m.status ?? "planned")
                  ) ?? STATUS_OPTIONS[0];

                const dateStr = m.date
                  ? new Date(m.date).toLocaleDateString("cs-CZ")
                  : "bez data";

                const assignedUsers =
                  (m.user_ids ?? [])
                    .map((id) => userNameById.get(id) || "Neznámý uživatel")
                    .join(", ") || "Bez uživatele";

                return (
                  <li
                    key={m.id}
                    className="flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50 cursor-pointer"
                    onClick={() => router.push(`/meetings/${m.id}`)}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-slate-900">
                        {m.title || "Bez názvu"}
                      </span>
                      <div className="flex flex-wrap gap-3 text-[11px] text-slate-500">
                        <span>
                          Zákazník:{" "}
                          <span className="text-slate-900">
                            {customerName}
                          </span>
                        </span>
                        <span>
                          Termín:{" "}
                          <span className="text-slate-900">
                            {dateStr}
                            {m.time ? ` ${m.time}` : ""}
                          </span>
                        </span>
                        <span>
                          Uživatelé:{" "}
                          <span className="text-slate-900">
                            {assignedUsers}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-medium ${statusOption.color}`}
                      >
                        {statusOption.label}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(m.id);
                        }}
                        className="text-xs font-medium text-rose-600 hover:text-rose-700"
                      >
                        Smazat
                      </button>
                    </div>
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
