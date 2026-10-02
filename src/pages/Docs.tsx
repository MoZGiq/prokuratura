import { useState } from "react";
import { useStore } from "../store";
import { TEMPLATES, getTemplate } from "../data/templates";
import { Button, Card, Empty, PageHeader } from "../components/ui";
import { fmtShort } from "../utils/format";

export function DocsList() {
  const { data, deleteDoc } = useStore();
  const [q, setQ] = useState("");
  const s = q.trim().toLowerCase();
  const list = data.docs.filter(
    (d) => !s || `${d.title} ${d.number} ${Object.values(d.fields).join(" ")}`.toLowerCase().includes(s)
  );

  return (
    <div>
      <PageHeader
        title="Документы и протоколы"
        subtitle="Созданные документы сохраняются автоматически в браузере. Откройте документ, чтобы отредактировать или распечатать."
        actions={
          <a href="#/docs/new">
            <Button variant="primary">+ Новый документ</Button>
          </a>
        }
      />
      <input
        className="field-input mb-4 max-w-sm"
        placeholder="Поиск по документам…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {list.length === 0 ? (
        <Empty>
          {data.docs.length === 0 ? "Документов пока нет. Создайте первый по одному из шаблонов." : "Ничего не найдено."}
        </Empty>
      ) : (
        <Card className="divide-y divide-slate-100">
          {list.map((d) => {
            const t = getTemplate(d.templateId);
            const c = data.cases.find((x) => x.id === d.caseId);
            return (
              <div key={d.id} className="flex items-center gap-3 p-3 hover:bg-slate-50">
                <span className="text-2xl">{t?.emoji ?? "📄"}</span>
                <a href={`#/docs/${d.id}`} className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-900">{d.title}</div>
                  <div className="text-xs text-slate-500">
                    № {d.number} от {fmtShort(d.date)}
                    {c && ` · материал № ${c.number}`}
                  </div>
                </a>
                <Button variant="ghost" onClick={() => confirm("Удалить документ?") && deleteDoc(d.id)}>
                  🗑️
                </Button>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

export function TemplateChooser({ caseId }: { caseId?: string }) {
  return (
    <div>
      <PageHeader title="Новый документ" subtitle="Выберите шаблон процессуального документа." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((t) => (
          <a
            key={t.id}
            href={`#/docs/new?tpl=${t.id}${caseId ? `&case=${caseId}` : ""}`}
            className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-400 hover:shadow-md"
          >
            <div className="text-3xl">{t.emoji}</div>
            <div className="mt-2 font-bold text-slate-900 group-hover:text-blue-900">{t.title}</div>
            <p className="mt-1 text-sm text-slate-500">{t.description}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
