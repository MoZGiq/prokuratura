import { useStore } from "../store";
import { TEMPLATES } from "../data/templates";
import { Card, Empty } from "../components/ui";
import { daysLeft, fmtShort } from "../utils/format";
import { navigate } from "../router";

export function Dashboard() {
  const { data } = useStore();
  const active = data.cases.filter((c) => c.status === "Зарегистрирован" || c.status === "В работе");
  const urgent = active
    .map((c) => ({ c, left: daysLeft(c.deadline) }))
    .filter((x) => x.left !== null && x.left <= 5)
    .sort((a, b) => (a.left as number) - (b.left as number));

  const stats = [
    { label: "Всего материалов", value: data.cases.length, icon: "🗄️", to: "/cases" },
    { label: "В работе", value: active.length, icon: "🔎", to: "/cases" },
    { label: "Документов", value: data.docs.length, icon: "📝", to: "/docs" },
    { label: "В подборке норм", value: data.basket.length, icon: "📚", to: "/law" },
  ];

  return (
    <div>
      <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 p-6 text-white shadow-lg sm:p-8">
        <div className="text-sm font-medium text-amber-300">Рабочее место сотрудника</div>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Учёт материалов, протоколы и подбор норм права</h1>
        <p className="mt-3 max-w-2xl text-sm text-blue-100 sm:text-base">
          Регистрируйте обращения и проверки, формируйте процессуальные документы по шаблонам, подбирайте статьи
          законов и сразу печатайте готовые листы формата А4.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => navigate("/cases?new=1")}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400 cursor-pointer"
          >
            + Зарегистрировать материал
          </button>
          <button
            onClick={() => navigate("/docs/new")}
            className="rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold hover:bg-white/10 cursor-pointer"
          >
            Создать документ
          </button>
          <button
            onClick={() => navigate("/law")}
            className="rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold hover:bg-white/10 cursor-pointer"
          >
            Подобрать статьи
          </button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <button key={s.label} onClick={() => navigate(s.to)} className="text-left cursor-pointer">
            <Card className="p-4 transition hover:shadow-md">
              <div className="text-2xl">{s.icon}</div>
              <div className="mt-2 text-3xl font-bold text-blue-950">{s.value}</div>
              <div className="text-sm text-slate-500">{s.label}</div>
            </Card>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-bold">Контроль сроков</h2>
          {urgent.length === 0 ? (
            <Empty>Нет материалов с истекающими сроками 👍</Empty>
          ) : (
            <Card className="divide-y divide-slate-100">
              {urgent.map(({ c, left }) => (
                <a
                  key={c.id}
                  href={`#/cases?open=${c.id}`}
                  className="flex items-center justify-between gap-3 p-3 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">№ {c.number} · {c.applicant || c.subject || "без названия"}</div>
                    <div className="text-xs text-slate-500">Срок: {fmtShort(c.deadline)}</div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      (left as number) < 0
                        ? "bg-red-100 text-red-700"
                        : (left as number) <= 2
                        ? "bg-amber-100 text-amber-800"
                        : "bg-sky-100 text-sky-800"
                    }`}
                  >
                    {(left as number) < 0 ? `просрочено ${-(left as number)} дн.` : (left as number) === 0 ? "сегодня" : `${left} дн.`}
                  </span>
                </a>
              ))}
            </Card>
          )}

          <h2 className="mb-3 mt-8 text-lg font-bold">Последние документы</h2>
          {data.docs.length === 0 ? (
            <Empty>Документов пока нет</Empty>
          ) : (
            <Card className="divide-y divide-slate-100">
              {data.docs.slice(0, 5).map((d) => (
                <a key={d.id} href={`#/docs/${d.id}`} className="block p-3 hover:bg-slate-50">
                  <div className="text-sm font-semibold">{d.title}</div>
                  <div className="text-xs text-slate-500">№ {d.number} от {fmtShort(d.date)}</div>
                </a>
              ))}
            </Card>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-lg font-bold">Быстрое создание документа</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {TEMPLATES.map((t) => (
              <a
                key={t.id}
                href={`#/docs/new?tpl=${t.id}`}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-blue-300 hover:shadow-md"
              >
                <span className="text-2xl">{t.emoji}</span>
                <span className="text-sm font-semibold leading-snug text-slate-800">{t.short}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
