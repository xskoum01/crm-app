// src/app/leads/[id]/page.tsx
"use client";

// ============== Importy ==============
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Shell } from "../../_components/Shell";
import { api } from "@/lib/api";

// ============== Status leada ==============
type LeadStatus = "new" | "contacted" | "in_progress" | "won" | "lost";

const STATUS_OPTIONS: {
  value: LeadStatus;
  label: string;
  color: string;
}[] = [
  {
    value: "new",
    label: "Nový",
    color: "bg-sky-100 text-sky-700",
  },
  {
    value: "contacted",
    label: "Kontaktovaný",
    color: "bg-indigo-100 text-indigo-700",
  },
  {
    value: "in_progress",
    label: "V jednání",
    color: "bg-amber-100 text-amber-700",
  },
  {
    value: "won",
    label: "Převeden na zákazníka",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    value: "lost",
    label: "Ztracený",
    color: "bg-rose-100 text-rose-700",
  },
];

// ============== Typ a výchozí hodnoty ==============

type Lead = {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  note?: string;
  status?: LeadStatus;
};

const EMPTY_LEAD: Lead = {
  name: "",
  email: "",
  phone: "",
  source: "",
  note: "",
  status: "new",
};

// ============== Hlavní komponenta detailu leada ==============

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();

  // id z URL – `/leads/new` vs `/leads/5`
  const rawId = params?.id as string | undefined;
  const isNew = rawId === "new";
  const id = !isNew && rawId ? Number(rawId) : null;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Načtení při otevření stránky (nový vs existující)
  useEffect(() => {
    async function loadExisting() {
      try {
        setLoading(true);
        setError(null);
        const data = await api<Lead>(`/leads/${id}`);
        setLead({
          ...data,
          status: data.status ?? "new",
        });
      } catch (e) {
        console.error(e);
        setError("Nepodařilo se načíst potenciálního zákazníka.");
      } finally {
        setLoading(false);
      }
    }

    function loadNew() {
      setLead(EMPTY_LEAD);
      setLoading(false);
    }

    if (isNew) {
      loadNew();
    } else if (id && !Number.isNaN(id)) {
      loadExisting();
    } else {
      setError("Neplatné ID potenciálního zákazníka.");
      setLoading(false);
    }
  }, [id, isNew]);

  // Změna jednoho pole ve formuláři
  function updateField<K extends keyof Lead>(key: K, value: Lead[K]) {
    if (!lead) return;
    setLead({ ...lead, [key]: value });
  }

  // Uložení (create / update)
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!lead) return;

    if (!lead.name.trim()) {
      setError("Jméno je povinné.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload: Lead = {
        ...lead,
        status: lead.status ?? "new",
      };

      if (isNew) {
        await api<Lead>("/leads", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else {
        await api<Lead>(`/leads/${lead.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      }

      router.push("/leads");
    } catch (e) {
      console.error(e);
      setError(
        isNew
          ? "Potenciálního zákazníka se nepodařilo vytvořit."
          : "Změny se nepodařilo uložit."
      );
    } finally {
      setSaving(false);
    }
  }

  // Smazání
  async function handleDelete() {
    if (isNew || !lead?.id) return;
    if (
      !window.confirm(
        "Opravdu chceš tohoto potenciálního zákazníka trvale smazat?"
      )
    ) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await api(`/leads/${lead.id}`, { method: "DELETE" });
      router.push("/leads");
    } catch (e) {
      console.error(e);
      setError("Potenciálního zákazníka se nepodařilo smazat.");
    } finally {
      setSaving(false);
    }
  }

  // Loading / chyba
  if (loading) {
    return (
      <Shell>
        <section className="space-y-3">
          <p className="text-sm text-slate-500">
            Načítám potenciálního zákazníka…
          </p>
        </section>
      </Shell>
    );
  }

  if (!lead) {
    return (
      <Shell>
        <section className="space-y-3">
          <p className="text-sm text-red-600">
            {error ?? "Kontaktní osobu se nepodařilo načíst."}
          </p>
          <Link
            href="/leads"
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            ← Zpět na potenciální zákazníky
          </Link>
        </section>
      </Shell>
    );
  }

  // vybraná status možnost pro barevný štítek
  const currentStatus =
    STATUS_OPTIONS.find((s) => s.value === (lead.status ?? "new")) ??
    STATUS_OPTIONS[0];

  // Vykreslení formuláře
  return (
    <Shell>
      <section className="space-y-5">
        {/* hlavička + zpět + stav vpravo jako u zákazníka */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Link
              href="/leads"
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              ← Zpět na potenciální zákazníky
            </Link>
            <h2 className="text-xl font-semibold text-slate-900">
              {isNew ? "Nový kontakt" : lead.name || "Bez jména"}
            </h2>
            {lead.email && (
              <p className="text-sm text-slate-500">{lead.email}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Stav</span>
            <select
              className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
              value={lead.status ?? "new"}
              onChange={(e) =>
                updateField("status", e.target.value as LeadStatus)
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

        {/* formulář – dva sloupce */}
        <form
          onSubmit={handleSave}
          className="grid gap-4 md:grid-cols-[2fr_1.5fr]"
        >
          {/* VLEVO: údaje o leadovi */}
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">
                Kontaktní údaje
              </h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    Jméno / název (povinné)
                  </label>
                  <input
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
                    placeholder="Např. Jan Novák"
                    value={lead.name}
                    onChange={(e) => updateField("name", e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    E-mail
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
                    placeholder="např. jan.novak@example.com"
                    value={lead.email ?? ""}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    Telefon
                  </label>
                  <input
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
                    placeholder="např. +420 777 123 456"
                    value={lead.phone ?? ""}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    Zdroj (odkud je)
                  </label>
                  <input
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
                    placeholder="např. doporučení, web, Facebook…"
                    value={lead.source ?? ""}
                    onChange={(e) => updateField("source", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* poznámka */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">
                Poznámky
              </h3>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                  Interní poznámka
                </label>
                <textarea
                  className="min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
                  placeholder="Např. hledá byt v Praze, preferuje telefonát…"
                  value={lead.note ?? ""}
                  onChange={(e) => updateField("note", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* VPRAVO: tlačítka */}
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
                  ? "Vytvořit kontakt"
                  : "Uložit změny"}
              </button>
            </div>

            {!isNew && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm flex items-center justify-between">
                <div className="text-xs text-rose-700">
                  Odstraněním kontaktu ho smažeš z databáze. Tuto akci nelze
                  vrátit zpět.
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleDelete}
                  className="rounded-md bg-rose-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-rose-700 disabled:bg-rose-300 disabled:cursor-not-allowed"
                >
                  Smazat kontakt
                </button>
              </div>
            )}
          </div>
        </form>
      </section>
    </Shell>
  );
}
