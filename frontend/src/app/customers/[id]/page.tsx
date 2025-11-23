"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Shell } from "../../_components/Shell";
import { api } from "@/lib/api";

// ------------------------- Status zákazníka -------------------------
// Kódy statusu, které si posíláme do backendu
type CustomerStatus = "active" | "inactive" | "negotiation";

// Možnosti do selectu + CSS barvy pro barevný štítek
const STATUS_OPTIONS: {
  value: CustomerStatus;
  label: string;
  color: string;
}[] = [
  {
    value: "active",
    label: "Aktivní",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    value: "negotiation",
    label: "V jednání",
    color: "bg-amber-100 text-amber-700",
  },
  {
    value: "inactive",
    label: "Neaktivní",
    color: "bg-slate-200 text-slate-700",
  },
];

// ------------------------- Datový typ zákazníka -------------------------

type Customer = {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  note?: string;
  status?: CustomerStatus;
};

const EMPTY_CUSTOMER: Customer = {
  name: "",
  email: "",
  phone: "",
  note: "",
  status: "active",
};

// ------------------------- Komponenta detailu -------------------------

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();

  const rawId = params?.id as string | undefined;
  const isNew = rawId === "new";
  const id = !isNew && rawId ? Number(rawId) : null;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // načtení dat při otevření stránky
  useEffect(() => {
    async function loadExisting() {
      try {
        setLoading(true);
        setError(null);
        const data = await api<Customer>(`/customers/${id}`);
        setCustomer(data);
      } catch (e) {
        console.error(e);
        setError("Nepodařilo se načíst zákazníka.");
      } finally {
        setLoading(false);
      }
    }

    function loadNew() {
      setCustomer(EMPTY_CUSTOMER);
      setLoading(false);
    }

    if (isNew) {
      loadNew();
    } else if (id && !Number.isNaN(id)) {
      loadExisting();
    } else {
      setError("Neplatné ID zákazníka.");
      setLoading(false);
    }
  }, [id, isNew]);

  // helper na změnu jednoho pole
  function updateField<K extends keyof Customer>(key: K, value: Customer[K]) {
    if (!customer) return;
    setCustomer({ ...customer, [key]: value });
  }

  // uložení (create / update)
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!customer) return;

    if (!customer.name.trim()) {
      setError("Jméno je povinné.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload: Customer = {
        ...customer,
        status: customer.status ?? "active",
      };

      if (isNew) {
        await api<Customer>("/customers", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else {
        await api<Customer>(`/customers/${customer.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      }

      router.push("/customers");
    } catch (e) {
      console.error(e);
      setError(
        isNew
          ? "Zákazníka se nepodařilo vytvořit."
          : "Změny se nepodařilo uložit."
      );
    } finally {
      setSaving(false);
    }
  }

  // smazání
  async function handleDelete() {
    if (isNew || !customer?.id) return;
    if (!window.confirm("Opravdu chceš tohoto zákazníka trvale smazat?")) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await api(`/customers/${customer.id}`, { method: "DELETE" });
      router.push("/customers");
    } catch (e) {
      console.error(e);
      setError("Zákazníka se nepodařilo smazat.");
    } finally {
      setSaving(false);
    }
  }

  // loading / chyba
  if (loading) {
    return (
      <Shell>
        <section className="space-y-3">
          <p className="text-sm text-slate-500">Načítám zákazníka…</p>
        </section>
      </Shell>
    );
  }

  if (!customer) {
    return (
      <Shell>
        <section className="space-y-3">
          <p className="text-sm text-red-600">
            {error ?? "Zákazníka se nepodařilo načíst."}
          </p>
          <Link
            href="/customers"
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            ← Zpět na zákazníky
          </Link>
        </section>
      </Shell>
    );
  }

  // vybraná status možnost pro barevný štítek
  const currentStatus =
    STATUS_OPTIONS.find((s) => s.value === (customer.status ?? "active")) ??
    STATUS_OPTIONS[0];

  return (
    <Shell>
      <section className="space-y-5">
        {/* horní řádek – vlevo jméno, vpravo status (zarovnáno na střed) */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Link
              href="/customers"
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              ← Zpět na zákazníky
            </Link>
            <h2 className="text-xl font-semibold text-slate-900">
              {isNew ? "Nový zákazník" : customer.name || "Bez jména"}
            </h2>
            {customer.email && (
              <p className="text-sm text-slate-500">{customer.email}</p>
            )}
          </div>

          {/* Status podobně jako u nemovitosti – select + barevný chip */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Status</span>
            <select
              className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
              value={customer.status ?? "active"}
              onChange={(e) =>
                updateField("status", e.target.value as CustomerStatus)
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

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* zbytek formuláře stejný jako předtím – dva sloupce */}
        <form
          onSubmit={handleSave}
          className="grid gap-4 md:grid-cols-[2fr_1.5fr]"
        >
          {/* levý sloupec */}
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">
                Základní údaje
              </h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    Jméno a příjmení (povinné)
                  </label>
                  <input
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
                    placeholder="Např. Jan Novák"
                    value={customer.name}
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
                    value={customer.email ?? ""}
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
                    value={customer.phone ?? ""}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                </div>
              </div>
            </div>

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
                  placeholder="Např. preferuje komunikaci e-mailem…"
                  value={customer.note ?? ""}
                  onChange={(e) => updateField("note", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* pravý sloupec */}
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
                  ? "Vytvořit zákazníka"
                  : "Uložit změny"}
              </button>
            </div>

            {!isNew && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm flex items-center justify-between">
                <div className="text-xs text-rose-700">
                  Odstraněním zákazníka smažeš tuto položku z databáze. Tuto
                  akci nelze vrátit zpět.
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleDelete}
                  className="rounded-md bg-rose-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-rose-700 disabled:bg-rose-300 disabled:cursor-not-allowed"
                >
                  Smazat zákazníka
                </button>
              </div>
            )}
          </div>
        </form>
      </section>
    </Shell>
  );
}
