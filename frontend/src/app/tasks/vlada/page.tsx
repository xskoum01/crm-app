"use client";

// Seznam úkolů pro Vláďu – view se řádky, klik na řádek → detail na /tasks/vlada/[id],
// tlačítko "Nový úkol" → /tasks/vlada/new.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shell } from "../../_components/Shell";
import { api } from "@/lib/api";
import type { Task, TaskStatus } from "@/lib/types";


const ASSIGNEE = "vlada" as const;

// Jednoduché mapování statusu na text + barvy badge
function getStatusMeta(status?: string) {
  switch (status) {
    case "open":
      return {
        label: "Otevřený",
        className: "bg-sky-100 text-sky-700",
      };
    case "in_progress":
      return {
        label: "Rozpracovaný",
        className: "bg-amber-100 text-amber-700",
      };
    case "done":
      return {
        label: "Hotový",
        className: "bg-emerald-100 text-emerald-700",
      };
    case "cancelled":
      return {
        label: "Zrušený",
        className: "bg-slate-200 text-slate-700",
      };
    default:
      return {
        label: "Bez stavu",
        className: "bg-slate-100 text-slate-600",
      };
  }
}

export default function VladaTasksPage() {
  const router = useRouter();
  const [items, setItems] = useState<Task[]>([]);
  const [filtered, setFiltered] = useState<Task[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Načtení jen úkolů pro Vláďu (filtr v API přes query assignee)
  async function loadTasks() {
    try {
      setLoading(true);
      setError(null);
      const data = await api<Task[]>(`/tasks?assignee=${ASSIGNEE}`);
      setItems(data);
      setFiltered(applyFilter(data, search));
    } catch (e) {
      console.error(e);
      setError("Nepodařilo se načíst úkoly.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyFilter(list: Task[], term: string) {
    if (!term) return list;
    const t = term.toLowerCase();
    return list.filter(
      (task) =>
        task.title?.toLowerCase().includes(t) ||
        task.description?.toLowerCase().includes(t)
    );
  }

  useEffect(() => {
    setFiltered(applyFilter(items, search));
  }, [items, search]);

  // označení úkolu jako hotový / nehotový – rychlý toggle
  async function toggleDone(task: Task) {
    try {
      const newDone = !task.done;
      const newStatus: TaskStatus = newDone ? "done" : "todo";
  
      await api<Task>(`/tasks/${task.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...task,
          done: newDone,
          status: newStatus,
        }),
      });
  
      await loadTasks();
    } catch (e) {
      console.error(e);
      setError("Nepodařilo se změnit stav úkolu.");
    }
  }
  

  async function handleDelete(id?: number) {
    if (!id) return;
    if (!window.confirm("Opravdu chceš tento úkol smazat?")) return;

    try {
      await api(`/tasks/${id}`, { method: "DELETE" });
      await loadTasks();
    } catch (e) {
      console.error(e);
      setError("Úkol se nepodařilo smazat.");
    }
  }

  return (
    <Shell>
      <section className="space-y-5">
        {/* Hlavička */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Vláďovy úkoly
            </h2>
            <p className="text-sm text-slate-500">
              Seznam úkolů, které jsou přiřazené Vláďovi.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="hidden md:inline">
              {items.length} úkolů v systému
            </span>
            <button
              type="button"
              onClick={() => router.push("/tasks/vlada/new")}
              className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1"
            >
              Nový úkol
            </button>
          </div>
        </div>

        {/* Vyhledávání */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-sm">
            <input
              type="text"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
              placeholder="Hledat podle názvu nebo popisu…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {loading && (
            <span className="text-xs text-slate-500">
              Načítám Vláďovy úkoly…
            </span>
          )}
        </div>

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
                Seznam úkolů
              </h3>
              <p className="text-xs text-slate-500">
                Kliknutím na řádek otevřeš detail a můžeš schůzku upravit.
              </p>
            </div>
          </div>

          {filtered.length === 0 && !loading ? (
            <div className="flex h-32 items-center justify-center text-xs text-slate-500">
              Zatím žádné úkoly pro Vláďu.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((t) => {
                const statusMeta = getStatusMeta(t.status as string | undefined);

                return (
                  <li
                    key={t.id}
                    className="flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50 cursor-pointer"
                    onClick={() => router.push(`/tasks/vlada/${t.id}`)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox pro rychlé odškrtnutí bez otevření detailu */}
                      <input
                      type="checkbox"
                      className="mt-1"
                      checked={!!t.done}
                      // 1) Zastavíme klik, aby se neodpálilo onClick na <li>
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      // 2) Na změnu hodnoty jen přepneme stav úkolu
                      onChange={() => {
                        toggleDone(t);
                      }}
                    />

                      <div>
                        <div
                          className={`font-medium ${
                            t.done ? "line-through text-slate-400" : ""
                          }`}
                        >
                          {t.title}
                        </div>
                        <div className="text-xs text-slate-500 flex gap-3 mt-0.5">
                          {t.priority && (
                            <span>
                              Priorita:{" "}
                              {t.priority === 1
                                ? "vysoká"
                                : t.priority === 2
                                ? "střední"
                                : "nízká"}
                            </span>
                          )}
                          {t.due_date && (
                            <span>
                              Do:{" "}
                              {new Date(t.due_date).toLocaleDateString("cs-CZ")}
                            </span>
                          )}
                        </div>
                        {t.description && (
                          <div className="text-xs text-slate-500 mt-1">
                            {t.description}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pravá část – barevný status + Smazat */}
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-medium ${statusMeta.className}`}
                      >
                        {statusMeta.label}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(t.id);
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
