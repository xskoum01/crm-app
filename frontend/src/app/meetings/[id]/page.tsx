"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Shell } from "../../_components/Shell";
import { api } from "@/lib/api";
import type { Meeting, MeetingStatus, Customer, User } from "@/lib/types";

// ------------------------- Status schůzky -------------------------

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

// ------------------------- Prázdná schůzka -------------------------

const EMPTY_MEETING: Meeting = {
  id: 0,
  title: "",
  date: "",
  time: "",
  customer_id: undefined,
  note: "",
  status: "planned",
  user_ids: [],
};

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();

  const rawId = params?.id as string | undefined;
  const isNew = rawId === "new";
  const id = !isNew && rawId ? Number(rawId) : null;

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // načtení existující / nové schůzky
  useEffect(() => {
    async function loadExisting() {
      try {
        setLoading(true);
        setError(null);
        const data = await api<Meeting>(`/meetings/${id}`);
        setMeeting({
          ...data,
          status: data.status ?? "planned",
          user_ids: data.user_ids ?? [],
        });
      } catch (e) {
        console.error(e);
        setError("Nepodařilo se načíst schůzku.");
      } finally {
        setLoading(false);
      }
    }

    function loadNew() {
      setMeeting(EMPTY_MEETING);
      setLoading(false);
    }

    if (isNew) {
      loadNew();
    } else if (id && !Number.isNaN(id)) {
      loadExisting();
    } else {
      setError("Neplatné ID schůzky.");
      setLoading(false);
    }
  }, [id, isNew]);

  // zákazníci pro lookup
  useEffect(() => {
    async function loadCustomers() {
      try {
        const data = await api<Customer[]>("/customers");
        setCustomers(data);
      } catch (e) {
        console.error("Nepodařilo se načíst zákazníky pro schůzky.", e);
      }
    }
    loadCustomers();
  }, []);

  // uživatelé pro lookup
  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await api<User[]>("/users");
        setUsers(data);
      } catch (e) {
        console.error("Nepodařilo se načíst uživatele pro schůzky.", e);
      }
    }
    loadUsers();
  }, []);

  function updateField<K extends keyof Meeting>(key: K, value: Meeting[K]) {
    if (!meeting) return;
    setMeeting({ ...meeting, [key]: value });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!meeting) return;

    if (!meeting.title.trim()) {
      setError("Název schůzky je povinný.");
      return;
    }

    if (!meeting.date || !meeting.date.toString().trim()) {
      setError("Datum schůzky je povinné.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const status: MeetingStatus = meeting.status ?? "planned";

      const payload = {
        title: meeting.title.trim(),
        date: meeting.date?.slice(0, 10) ?? "",
        time: meeting.time || undefined,
        customer_id: meeting.customer_id ?? undefined,
        note: meeting.note ?? undefined,
        status,
        user_ids: meeting.user_ids ?? [],
      };

      if (isNew) {
        await api<Meeting>("/meetings", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else {
        await api<Meeting>(`/meetings/${meeting.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      }

      router.push("/meetings");
    } catch (e) {
      console.error(e);
      setError(
        isNew
          ? "Schůzku se nepodařilo vytvořit."
          : "Změny se nepodařilo uložit."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (isNew || !meeting?.id) return;
    if (!window.confirm("Opravdu chceš tuto schůzku trvale smazat?")) return;

    try {
      setSaving(true);
      setError(null);
      await api(`/meetings/${meeting.id}`, { method: "DELETE" });
      router.push("/meetings");
    } catch (e) {
      console.error(e);
      setError("Schůzku se nepodařilo smazat.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Shell>
        <section className="space-y-3">
          <p className="text-sm text-slate-500">Načítám schůzku…</p>
        </section>
      </Shell>
    );
  }

  if (!meeting) {
    return (
      <Shell>
        <section className="space-y-3">
          <p className="text-sm text-red-600">
            {error ?? "Schůzku se nepodařilo načíst."}
          </p>
          <Link
            href="/meetings"
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            ← Zpět na schůzky
          </Link>
        </section>
      </Shell>
    );
  }

  const currentStatus =
    STATUS_OPTIONS.find((s) => s.value === (meeting.status ?? "planned")) ??
    STATUS_OPTIONS[0];

  return (
    <Shell>
      <section className="space-y-5">
        {/* hlavička – vlevo název, vpravo stav se štítkem */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Link
              href="/meetings"
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              ← Zpět na schůzky
            </Link>
            <h2 className="text-xl font-semibold text-slate-900">
              {isNew ? "Nová schůzka" : meeting.title || "Bez názvu"}
            </h2>
            {meeting.date && (
              <p className="text-sm text-slate-500">
                {new Date(meeting.date).toLocaleDateString("cs-CZ")}
                {meeting.time ? ` • ${meeting.time}` : ""}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Stav</span>
            <select
              className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
              value={meeting.status ?? "planned"}
              onChange={(e) =>
                updateField("status", e.target.value as MeetingStatus)
              }
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-medium ${currentStatus.color}`}
            >
              {currentStatus.label}
            </span>
          </div>
        </div>

        {/* chyba */}
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* formulář */}
        <form
          onSubmit={handleSave}
          className="grid gap-4 md:grid-cols-[2fr_1.5fr]"
        >
          {/* levý sloupec */}
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">
                Informace o schůzce
              </h3>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    Název schůzky (povinné)
                  </label>
                  <input
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
                    value={meeting.title}
                    onChange={(e) => updateField("title", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">
                      Datum (povinné)
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
                      value={meeting.date?.slice(0, 10) ?? ""}
                      onChange={(e) =>
                        updateField(
                          "date",
                          (e.target.value || "") as Meeting["date"]
                        )
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">
                      Čas
                    </label>
                    <input
                      type="time"
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
                      value={meeting.time ?? ""}
                      onChange={(e) =>
                        updateField(
                          "time",
                          (e.target.value || "") as Meeting["time"]
                        )
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">
                      Zákazník
                    </label>
                    <select
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
                      value={meeting.customer_id ?? ""}
                      onChange={(e) =>
                        updateField(
                          "customer_id",
                          e.target.value
                            ? Number(e.target.value)
                            : (undefined as unknown as Meeting["customer_id"])
                        )
                      }
                    >
                      <option value="">Bez přiřazení</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Uživatelé – multi select */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    Uživatelé (můžeš vybrat více)
                  </label>
                  <select
                    multiple
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300 min-h-[80px]"
                    value={(meeting.user_ids ?? []).map(String)}
                    onChange={(e) => {
                      const values = Array.from(
                        e.target.selectedOptions
                      ).map((opt) => Number(opt.value));
                      updateField(
                        "user_ids",
                        values as unknown as Meeting["user_ids"]
                      );
                    }}
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400">
                    Podrž Ctrl (Windows) nebo Command (Mac) pro výběr více
                    položek.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    Poznámka
                  </label>
                  <textarea
                    className="min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
                    value={meeting.note ?? ""}
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
                  ? "Vytvořit schůzku"
                  : "Uložit změny"}
              </button>
            </div>

            {!isNew && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm flex items-center justify-between">
                <div className="text-xs text-rose-700">
                  Smazáním schůzky ji odstraníš z databáze. Tuto akci nelze
                  vrátit zpět.
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleDelete}
                  className="rounded-md bg-rose-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-rose-700 disabled:bg-rose-300 disabled:cursor-not-allowed"
                >
                  Smazat schůzku
                </button>
              </div>
            )}
          </div>
        </form>
      </section>
    </Shell>
  );
}
