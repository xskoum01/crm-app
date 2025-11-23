"use client";

// ============== Importy ==============
// useState/useEffect – práce se stavem a načítáním dat.
// useRouter – přechod na detail / nový záznam.
// Shell – layout s menu + headerem.
// api – helper na volání backendu (/leads).
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shell } from "../_components/Shell";
import { api } from "@/lib/api";

// ============== Datový typ ==============
// Struktura potenciálního zákazníka (lead):
// id      – číslo v DB (nepovinné, nový lead ho ještě nemá)
// name    – jméno / název
// email   – kontaktní mail
// phone   – telefon
// source  – odkud lead přišel (např. web, doporučení…)
// note    – interní poznámka
type Lead = {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  note?: string;
};

// ============== Hlavní komponenta – seznam leadů ==============
// Stejná logika jako u customers:
// - načte všechny leady,
// - umožní vyhledávání,
// - klik na řádek → /leads/[id],
// - tlačítko "Přidat" → /leads/new,
// - tlačítko "Smazat" na pravé straně.
export default function LeadsPage() {
  const router = useRouter();

  const [items, setItems] = useState<Lead[]>([]);
  const [filtered, setFiltered] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Načtení leadů z API
  async function loadLeads() {
    try {
      setLoading(true);
      setError(null);
      const data = await api<Lead[]>("/leads");
      setItems(data);
      setFiltered(applyFilter(data, search));
    } catch (e) {
      console.error(e);
      setError("Nepodařilo se načíst potenciální zákazníky.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtrování podle jména / emailu / telefonu / zdroje
  function applyFilter(list: Lead[], term: string) {
    if (!term) return list;
    const t = term.toLowerCase();
    return list.filter(
      (c) =>
        c.name?.toLowerCase().includes(t) ||
        c.email?.toLowerCase().includes(t) ||
        c.phone?.toLowerCase().includes(t) ||
        c.source?.toLowerCase().includes(t)
    );
  }

  // kdykoliv se změní seznam nebo text ve vyhledávání, přepočti filtered
  useEffect(() => {
    setFiltered(applyFilter(items, search));
  }, [items, search]);

  // Smazání leada
  async function handleDelete(id?: number) {
    if (!id) return;
    if (!window.confirm("Opravdu chceš tohoto potenciálního zákazníka smazat?"))
      return;

    try {
      await api(`/leads/${id}`, { method: "DELETE" });
      await loadLeads();
    } catch (e) {
      console.error(e);
      setError("Potenciálního zákazníka se nepodařilo smazat.");
    }
  }

  return (
    <Shell>
      <section className="space-y-5">
        {/* Hlavička stránky + tlačítko "Přidat" */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Potenciální zákazníci
            </h2>
            <p className="text-sm text-slate-500">
              Kontakty, se kterými zatím nemáš podepsanou smlouvu.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="hidden md:inline">
              {items.length} potenciální zákazník
              {items.length === 1 ? "" : "ů"} v systému
            </span>
            <button
              type="button"
              onClick={() => router.push("/leads/new")}
              className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1"
            >
              Přidat kontakt
            </button>
          </div>
        </div>

        {/* Vyhledávání */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-sm">
            <input
              type="text"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
              placeholder="Hledat podle jména, e-mailu, telefonu nebo zdroje..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {loading && (
            <span className="text-xs text-slate-500">
              Načítám potenciální zákazníky…
            </span>
          )}
        </div>

        {/* Chyba */}
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Karta se seznamem */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Seznam potenciálních zákazníků
              </h3>
              <p className="text-xs text-slate-500">
                Kliknutím na řádek můžeš zobrazit detail a upravit údaje.
              </p>
            </div>
          </div>

          {filtered.length === 0 && !loading ? (
            <div className="flex h-32 items-center justify-center text-xs text-slate-500">
              Zatím žádné kontakty. Přidej prvního pomocí tlačítka „Přidat
              kontakt“.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50 cursor-pointer"
                  onClick={() => router.push(`/leads/${c.id}`)}
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-slate-900">
                      {c.name || "Bez jména"}
                    </span>
                    <div className="flex flex-wrap gap-3 text-[11px] text-slate-500">
                      {c.email && (
                        <span>
                          E-mail:{" "}
                          <span className="text-slate-900">{c.email}</span>
                        </span>
                      )}
                      {c.phone && (
                        <span>
                          Telefon:{" "}
                          <span className="text-slate-900">{c.phone}</span>
                        </span>
                      )}
                      {c.source && (
                        <span>
                          Zdroj:{" "}
                          <span className="text-slate-900">{c.source}</span>
                        </span>
                      )}
                      {c.note && (
                        <span className="line-clamp-1 max-w-xs">
                          Poznámka:{" "}
                          <span className="text-slate-900">{c.note}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(c.id);
                    }}
                    className="text-xs font-medium text-rose-600 hover:text-rose-700"
                  >
                    Smazat
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </Shell>
  );
}
