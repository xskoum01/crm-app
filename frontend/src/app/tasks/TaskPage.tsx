"use client";

import { useEffect, useState, FormEvent } from "react";
import { Shell } from "../_components/Shell";
import { Input } from "../_components/Input";
import { api } from "@/lib/api";
import type { Assignee, Task } from "@/lib/types";

type Props = {
  assignee: Assignee;
  title: string;
};

export function TaskPage({ assignee, title }: Props) {
  const [items, setItems] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: 2,
    due_date: "",
  });

  async function load() {
    setLoading(true);
    try {
      const data = await api<Task[]>(`/tasks?assignee=${assignee}`);
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignee]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await api<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        assignee,
        due_date: form.due_date || null,
      }),
    });
    setForm({ title: "", description: "", priority: 2, due_date: "" });
    setShowForm(false);
    load();
  }

  async function toggleDone(task: Task) {
    await api<Task>(`/tasks/${task.id}?done=${String(!task.done)}`, {
      method: "PATCH",
    });
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm("Smazat úkol?")) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001"}/tasks/${id}`, {
      method: "DELETE",
    });
    load();
  }

  return (
    <Shell>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-semibold mb-1">{title}</h1>
            <p className="text-sm text-slate-500">
              Úkoly, které můžeš odškrtávat jako hotové.
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="px-4 py-2 rounded-full text-sm bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Nový úkol
          </button>
        </div>

        {showForm && (
          <div className="mb-6 bg-white rounded-xl shadow p-4">
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <Input
                label="Název úkolu"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Priorita
                </label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.priority}
                  onChange={(e) =>
                    setForm({ ...form, priority: Number(e.target.value) })
                  }
                >
                  <option value={1}>Vysoká</option>
                  <option value={2}>Střední</option>
                  <option value={3}>Nízká</option>
                </select>
              </div>
              <Input
                label="Do kdy (datum)"
                type="date"
                value={form.due_date}
                onChange={(e) =>
                  setForm({ ...form, due_date: e.target.value })
                }
              />
              <div className="col-span-2">
                <label className="block text-xs text-slate-500 mb-1">
                  Popis úkolu
                </label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-3 py-2 text-sm rounded-full border"
                >
                  Zavřít
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm rounded-full bg-indigo-600 text-white"
                >
                  Uložit
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow">
          <div className="border-b px-4 py-2 text-xs text-slate-500 uppercase">
            Seznam úkolů
          </div>
          {loading ? (
            <div className="p-4 text-sm text-slate-500">Načítám…</div>
          ) : items.length === 0 ? (
            <div className="p-4 text-sm text-slate-500">
              Zatím žádné úkoly.
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((t) => (
                <li
                  key={t.id}
                  className="px-4 py-3 flex items-center justify-between hover:bg-slate-50"
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={t.done}
                      onChange={() => toggleDone(t)}
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
                        <span>
                          Priorita:{" "}
                          {t.priority === 1
                            ? "vysoká"
                            : t.priority === 2
                            ? "střední"
                            : "nízká"}
                        </span>
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
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Smazat
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Shell>
  );
}
