// src/app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-semibold mb-2 text-slate-900">Mini CRM</h1>
        <p className="text-sm text-slate-500 mb-6">
          Vyber v levém menu Zákazníky, Potenciální zákazníky nebo úkoly.
        </p>
        <Link
          href="/customers"
          className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-indigo-600 text-white text-sm hover:bg-indigo-700"
        >
          Přejít na zákazníky
        </Link>
      </div>
    </div>
  );
}
