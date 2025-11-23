"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Shell } from "../../../_components/Shell";
import { api } from "@/lib/api";
import type { Task, Customer, TaskStatus } from "@/lib/types";

const ASSIGNEE = "vlada" as const;

const EMPTY_TASK: Task = {
  id: 0,
  title: "",
  description: "",
  priority: 2,
  due_date: "",
  assignee: ASSIGNEE,
  done: false,
  status: "todo",
  customer_id: undefined,
};

// mapování statusů na popisek + barvy badge
const STATUS_META: Record<
  TaskStatus,
  { label: string; className: string }
> = {
  todo: {
    label: "Plánováno",
    className: "bg-slate-100 text-slate-700",
  },
  in_progress: {
    label: "Pracuje se na tom",
    className: "bg-amber-100 text-amber-700",
  },
  done: {
    label: "Hotovo",
    className: "bg-emerald-100 text-emerald-700",
  },
};

function getStatusMeta(status: TaskStatus | undefined) {
  return STATUS_META[status ?? "todo"];
}

export default function VladaTaskDetailPage() {
  const params = useParams();
  const router = useRouter();

  const rawId = params?.id as string | undefined;
  const isNew = rawId === "new";
  const id = !isNew && rawId ? Number(rawId) : null;

  const [task, setTask] = useState<Task | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Načtení existujícího úkolu / příprava prázdného
  useEffect(() => {
    async function loadExisting() {
      try {
        setLoading(true);
        setError(null);
        const data = await api<Task>(`/tasks/${id}`);

        // Normalizace – když backend ještě nemá status,
        // dopočítáme ho z done (true -> done, false -> todo).
        const normalised: Task = {
          ...data,
          status: data.status ?? (data.done ? "done" : "todo"),
        };

        setTask(normalised);
      } catch (e) {
        console.error(e);
        setError("Nepodařilo se načíst úkol.");
      } finally {
        setLoading(false);
      }
    }

    function loadNew() {
      setTask(EMPTY_TASK);
      setLoading(false);
    }

    if (isNew) {
      loadNew();
    } else if (id && !Number.isNaN(id)) {
      loadExisting();
    } else {
      setError("Neplatné ID úkolu.");
      setLoading(false);
    }
  }, [id, isNew]);

  // Načtení zákazníků pro lookup
  useEffect(() => {
    async function loadCustomers() {
      try {
        const data = await api<Customer[]>("/customers");
        setCustomers(data);
      } catch (e) {
        console.error("Nepodařilo se načíst zákazníky pro lookup.", e);
      }
    }
    loadCustomers();
  }, []);

  function updateField<K extends keyof Task>(key: K, value: Task[K]) {
    if (!task) return;
    setTask({ ...task, [key]: value });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!task) return;

    if (!task.title.trim()) {
      setError("Název úkolu je povinný.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const status: TaskStatus = task.status ?? "todo";
      const done = status === "done";

      const payload: Task = {
        ...task,
        assignee: ASSIGNEE,
        status,
        done,
        // prázdné datum pošleme jako null/undefined
        due_date: (task.due_date as string | undefined) || undefined,
        // customer_id – pokud není nic vybráno, radši undefined
        customer_id: task.customer_id ?? undefined,
      };

      if (isNew) {
        await api<Task>("/tasks", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else {
        await api<Task>(`/tasks/${task.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      }

      router.push("/tasks/vlada");
    } catch (e) {
      console.error(e);
      setError(
        isNew ? "Úkol se nepodařilo vytvořit." : "Změny se nepodařilo uložit."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (isNew || !task?.id) return;
    if (!window.confirm("Opravdu chceš tento úkol trvale smazat?")) return;

    try {
      setSaving(true);
      setError(null);
      await api(`/tasks/${task.id}`, { method: "DELETE" });
      router.push("/tasks/vlada");
    } catch (e) {
      console.error(e);
      setError("Úkol se nepodařilo smazat.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Shell>
        <section className="space-y-3">
          <p className="text-sm text-slate-500">Načítám úkol…</p>
        </section>
      </Shell>
    );
  }

  if (!task) {
    return (
      <Shell>
        <section className="space-y-3">
          <p className="text-sm text-red-600">
            {error ?? "Úkol se nepodařilo načíst."}
          </p>
          <Link
            href="/tasks/vlada"
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            ← Zpět na Vláďovy úkoly
          </Link>
        </section>
      </Shell>
    );
  }

  const statusMeta = getStatusMeta(task.status as TaskStatus | undefined);

  return (
    <Shell>
      <section className="space-y-5">
        {/* hlavička detailu */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <Link
              href="/tasks/vlada"
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              ← Zpět na Vláďovy úkoly
            </Link>
            <h2 className="text-xl font-semibold text-slate-900">
              {isNew ? "Nový úkol" : task.title || "Bez názvu"}
            </h2>
          </div>

          {/* pravá část – stav úkolu */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Stav</span>
            <select
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
              value={task.status ?? "todo"}
              onChange={(e) =>
                updateField("status", e.target.value as TaskStatus)
              }
            >
              <option value="todo">Plánováno</option>
              <option value="in_progress">Pracuje se na tom</option>
              <option value="done">Hotovo</option>
            </select>
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-medium ${statusMeta.className}`}
            >
              {statusMeta.label}
            </span>
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
          {/* LEVÝ SLOUPEC – informace o úkolu */}
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">
                Základní informace o úkolu
              </h3>

              <div className="space-y-3">
                {/* název */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    Název úkolu (povinné)
                  </label>
                  <input
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
                    value={task.title}
                    onChange={(e) => updateField("title", e.target.value)}
                  />
                </div>

                {/* priorita + datum + zákazník */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">
                      Priorita
                    </label>
                    <select
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
                      value={task.priority ?? 2}
                      onChange={(e) =>
                        updateField("priority", Number(e.target.value))
                      }
                    >
                      <option value={1}>Vysoká</option>
                      <option value={2}>Střední</option>
                      <option value={3}>Nízká</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">
                      Do kdy (datum)
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
                      value={task.due_date?.slice(0, 10) ?? ""}
                      onChange={(e) =>
                        updateField(
                          "due_date",
                          (e.target.value || "") as Task["due_date"]
                        )
                      }
                    />
                  </div>

                  {/* lookup na zákazníka */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">
                      Zákazník
                    </label>
                    <select
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
                      value={task.customer_id ?? ""}
                      onChange={(e) =>
                        updateField(
                          "customer_id",
                          e.target.value
                            ? Number(e.target.value)
                            : (undefined as unknown as Task["customer_id"])
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

                {/* popis */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    Popis úkolu
                  </label>
                  <textarea
                    className="min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
                    value={task.description ?? ""}
                    onChange={(e) =>
                      updateField("description", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* PRAVÝ SLOUPEC – akce */}
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Po úpravě nezapomeň úkol uložit.
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
                    ? "Vytvořit úkol"
                    : "Uložit změny"}
                </button>
              </div>

              <div className="text-xs text-slate-500">
                Aktuální stav:{" "}
                <span
                  className={`ml-1 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${statusMeta.className}`}
                >
                  {statusMeta.label}
                </span>
                <p className="mt-2 text-[11px] text-slate-500">
                  Podle stavu „Hotovo“ se automaticky nastavuje i příznak
                  dokončení.
                </p>
              </div>
            </div>

            {!isNew && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm flex items-center justify-between">
                <div className="text-xs text-rose-700">
                  Smazáním úkolu ho odstraníš z databáze. Tuto akci nelze vrátit
                  zpět.
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleDelete}
                  className="rounded-md bg-rose-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-rose-700 disabled:bg-rose-300 disabled:cursor-not-allowed"
                >
                  Smazat úkol
                </button>
              </div>
            )}
          </div>
        </form>
      </section>
    </Shell>
  );
}
