// src/app/_components/Shell.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  children: React.ReactNode;
};

function NavItem({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={`block text-sm px-6 py-2 ${
        active
          ? "bg-indigo-50 text-indigo-600 font-semibold border-r-4 border-indigo-500"
          : "text-slate-700 hover:bg-slate-50"
      }`}
    >
      {label}
    </Link>
  );
}

export function Shell({ children }: Props) {
  return (
    <div className="h-screen flex bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="w-60 border-r bg-white flex flex-col">
        <div className="px-6 py-4 font-semibold text-lg text-slate-900">
          Mini CRM
        </div>
        <nav className="mt-2 flex flex-col gap-1">
          <NavItem href="/customers" label="Zákazníci" />
          <NavItem href="/leads" label="Potenciální zákazníci" />
          <NavItem href="/tasks/vlada" label="Vláďovy úkoly" />
          <NavItem href="/tasks/petr" label="Petrovy úkoly" />
          <NavItem href="/meetings" label="Schůzky" />
          <NavItem href="/users" label="Uživatelé" />
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-14 border-b flex items-center justify-between px-8 bg-white">
          <div className="text-sm font-medium text-slate-900">
            Systém správy zákazníků a úkolů
          </div>
          <div className="text-sm font-semibold text-slate-900">
            Mini CRM
          </div>
        </header>
        <section className="flex-1 overflow-auto p-8 bg-slate-50">
          {children}
        </section>
      </main>
    </div>
  );
}
