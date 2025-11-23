// ======================= 1) Client režim =======================
"use client";

// ======================= 2) Importy =======================
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shell } from "../_components/Shell";
import { api } from "@/lib/api";

// ======================= 3) Typy a statusy =======================

// Stejný typ zákazníka jako na detail stránce – doplněný o status.
export type CustomerStatus = "active" | "inactive" | "negotiation";

type Customer = {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  note?: string;
  status?: CustomerStatus | null;
};

// Převod status → text + barvy (tailwind třídy)
const STATUS_CONFIG: Record<
  CustomerStatus,
  { label: string; pillClass: string }
> = {
  active: {
    label: "Aktivní",
    pillClass: "bg-emerald-100 text-emerald-700",
  },
  inactive: {
    label: "Neaktivní",
    pillClass: "bg-slate-200 text-slate-700",
  },
  negotiation: {
    label: "V jednání",
    pillClass: "bg-amber-100 text-amber-700",
  },
};

// ======================= 4) Hlavní komponenta =======================
export default function CustomersPage() {
  const router = useRouter();

  const [items, setItems] = useState<Customer[]>([]);
  const [filtered, setFiltered] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------- 4.1) Načtení zákazníků ----------
  async function loadCustomers() {
    try {
      setLoading(true);
      setError(null);

      const data = await api<Customer[]>("/customers");
      setItems(data);
      setFiltered(applyFilter(data, search));
    } catch (e) {
      console.error(e);
      setError("Nepodařilo se načíst zákazníky.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- 4.2) Filtrování ----------
  function applyFilter(list: Customer[], term: string) {
    if (!term) return list;

    const t = term.toLowerCase();
    return list.filter(
      (c) =>
        c.name?.toLowerCase().includes(t) ||
        c.email?.toLowerCase().includes(t) ||
        c.phone?.toLowerCase().includes(t)
    );
  }

  useEffect(() => {
    setFiltered(applyFilter(items, search));
  }, [items, search]);

  // ---------- 4.3) Mazání ----------
  async function handleDelete(id?: number) {
    if (!id) return;
    if (!window.confirm("Opravdu chceš tohoto zákazníka smazat?")) return;

    try {
      await api(`/customers/${id}`, { method: "DELETE" });
      await loadCustomers();
    } catch (e) {
      console.error(e);
      setError("Zákazníka se nepodařilo smazat.");
    }
  }

  // ======================= 5) Vykreslení =======================
  return (
    <Shell>
      <section className="space-y-5">
        {/* Horní lišta */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Zákazníci</h2>
            <p className="text-sm text-slate-500">
              Seznam majitelů nemovitostí, se kterými máš smlouvy.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="hidden md:inline">
              {items.length} zákazník
              {items.length === 1 ? "" : "ů"} v systému
            </span>
            <button
              type="button"
              onClick={() => router.push("/customers/new")}
              className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1"
            >
              Přidat zákazníka
            </button>
          </div>
        </div>

        {/* Vyhledávání */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-sm">
            <input
              type="text"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
              placeholder="Hledat podle jména, e-mailu nebo telefonu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {loading && (
            <span className="text-xs text-slate-500">Načítám zákazníky…</span>
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
                Seznam zákazníků
              </h3>
              <p className="text-xs text-slate-500">
                Kliknutím na řádek můžeš zobrazit detail a upravit údaje.
              </p>
            </div>
          </div>

          {filtered.length === 0 && !loading ? (
            <div className="flex h-32 items-center justify-center text-xs text-slate-500">
              Zatím tu žádní zákazníci nejsou. Přidej prvního pomocí tlačítka
              „Přidat zákazníka“.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((c) => {
                const statusKey =
                  (c.status as CustomerStatus | undefined) ?? "active";
                const statusCfg = STATUS_CONFIG[statusKey];

                return (
                  <li
                    key={c.id}
                    className="flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50 cursor-pointer"
                    onClick={() => router.push(`/customers/${c.id}`)}
                  >
                    {/* Levá část – jméno + kontakty */}
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
                        {c.note && (
                          <span className="line-clamp-1 max-w-xs">
                            Poznámka:{" "}
                            <span className="text-slate-900">{c.note}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Pravá část – status + Smazat */}
                    <div className="flex items-center gap-4">
                      {/* barevný štítek statusu */}
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-medium ${statusCfg.pillClass}`}
                      >
                        {statusCfg.label}
                      </span>

                      {/* tlačítko Smazat */}
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
