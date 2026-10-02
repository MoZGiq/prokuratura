import { useState, type ReactNode } from "react";
import { cn } from "../utils/cn";
import { useStore } from "../store";

const NAV = [
  { to: "/", label: "Главная", icon: "🏛️", match: (p: string) => p === "/" },
  { to: "/cases", label: "Реестр материалов", icon: "🗄️", match: (p: string) => p.startsWith("/cases") },
  { to: "/docs", label: "Документы и протоколы", icon: "📝", match: (p: string) => p.startsWith("/docs") },
  { to: "/law", label: "Законодательство", icon: "📚", match: (p: string) => p.startsWith("/law") },
  { to: "/settings", label: "Настройки и данные", icon: "⚙️", match: (p: string) => p.startsWith("/settings") },
];

export function Layout({ path, children }: { path: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { data } = useStore();

  const nav = (
    <nav className="flex flex-col gap-1 p-3">
      {NAV.map((n) => (
        <a
          key={n.to}
          href={"#" + n.to}
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
            n.match(path)
              ? "bg-white/15 text-white"
              : "text-blue-100 hover:bg-white/10 hover:text-white"
          )}
        >
          <span className="text-lg">{n.icon}</span>
          {n.label}
        </a>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen lg:flex print:block">
      {/* Мобильная шапка */}
      <header className="sticky top-0 z-40 flex items-center justify-between bg-blue-950 px-4 py-3 text-white lg:hidden print:hidden">
        <div className="flex items-center gap-2 font-bold">
          <span className="text-xl">⚖️</span> АРМ прокуратуры
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="rounded-md border border-white/30 px-3 py-1 text-sm cursor-pointer"
        >
          {open ? "Закрыть" : "Меню"}
        </button>
      </header>
      {open && (
        <div className="bg-blue-950 lg:hidden print:hidden">{nav}</div>
      )}

      {/* Боковая панель */}
      <aside className="hidden w-64 shrink-0 flex-col bg-blue-950 text-white lg:flex print:hidden">
        <div className="sticky top-0 flex h-screen flex-col">
          <div className="border-b border-white/10 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-2xl">
                ⚖️
              </div>
              <div>
                <div className="font-bold leading-tight">АРМ сотрудника прокуратуры</div>
                <div className="text-xs text-blue-200 mt-0.5">Учёт · Протоколы · Нормы права</div>
              </div>
            </div>
          </div>
          {nav}
          <div className="mt-auto p-4 text-xs text-blue-200/80 leading-relaxed">
            <div className="rounded-lg bg-white/5 p-3">
              <div className="font-semibold text-blue-100 mb-1">Данные в браузере</div>
              Материалов: {data.cases.length} · Документов: {data.docs.length}
              <div className="mt-1">Делайте резервную копию в разделе «Настройки».</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8 print:p-0">
        <div className="mx-auto max-w-6xl print:max-w-none">{children}</div>
      </main>
    </div>
  );
}
