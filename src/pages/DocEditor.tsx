import { useMemo, useState } from "react";
import { useStore, uid } from "../store";
import { buildBlocks, getTemplate, type FieldDef } from "../data/templates";
import type { DocRec } from "../types";
import { Button, Card, Label } from "../components/ui";
import { Sheet } from "../components/Sheet";
import { ArticlePicker, CodeBadge } from "../components/ArticlePicker";
import { artLabel, consultantSearchUrl } from "../data/articles";
import { todayISO } from "../utils/format";
import { navigate } from "../router";

export function DocEditor({
  id,
  tplId,
  caseId,
}: {
  id: string; // "new" или id документа
  tplId?: string;
  caseId?: string;
}) {
  const store = useStore();
  const { data, getArticle, saveDoc, deleteDoc, nextDocNumber } = store;

  const [doc, setDoc] = useState<DocRec | null>(() => {
    if (id !== "new") return data.docs.find((d) => d.id === id) || null;
    const tpl = tplId ? getTemplate(tplId) : undefined;
    if (!tpl) return null;
    const s = data.settings;
    const base: DocRec = {
      id: uid(),
      templateId: tpl.id,
      caseId: caseId || "",
      title: tpl.short,
      number: nextDocNumber(),
      date: todayISO(),
      city: s.city,
      organ: s.organ,
      signerPosition: s.signerPosition,
      signerRank: s.signerRank,
      signerName: s.signerName,
      fields: {},
      articleIds: tpl.suggested.filter((x) => !!getArticle(x)),
      includeExtract: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return caseId ? applyCase(base, caseId) : base;
  });
  const [saved, setSaved] = useState(id !== "new");
  const [blank, setBlank] = useState(false);
  const [picker, setPicker] = useState(false);
  const [showReq, setShowReq] = useState(false);

  function applyCase(d: DocRec, cid: string): DocRec {
    const tpl = getTemplate(d.templateId);
    const c = data.cases.find((x) => x.id === cid);
    if (!tpl || !c) return { ...d, caseId: cid };
    const fields = { ...d.fields };
    for (const f of tpl.fields) {
      if (f.fromCase && !fields[f.key]) {
        const v = c[f.fromCase];
        if (typeof v === "string" && v) fields[f.key] = v;
      }
    }
    return { ...d, caseId: cid, fields };
  }

  const tpl = doc ? getTemplate(doc.templateId) : undefined;
  const arts = useMemo(
    () => (doc ? doc.articleIds.map((x) => getArticle(x)).filter((x) => !!x) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [doc?.articleIds, store.articles]
  ) as NonNullable<ReturnType<typeof getArticle>>[];

  if (!doc || !tpl) {
    return (
      <Card className="p-8 text-center">
        <p className="mb-4 text-slate-600">Документ не найден.</p>
        <a href="#/docs">
          <Button variant="primary">К списку документов</Button>
        </a>
      </Card>
    );
  }

  const upd = (patch: Partial<DocRec>) => {
    setDoc((d) => (d ? { ...d, ...patch } : d));
    setSaved(false);
  };
  const setField = (k: string, v: string) => upd({ fields: { ...doc.fields, [k]: v } });

  const save = () => {
    saveDoc({ ...doc, updatedAt: Date.now() });
    setSaved(true);
    if (id === "new") navigate(`/docs/${doc.id}`);
  };

  const print = () => {
    save();
    setTimeout(() => window.print(), 150);
  };

  const blocks = buildBlocks(doc, tpl, arts, blank);

  const renderField = (f: FieldDef) => {
    const v = doc.fields[f.key] || "";
    return (
      <div key={f.key}>
        <Label>{f.label}</Label>
        {f.type === "textarea" ? (
          <textarea
            rows={f.rows || 3}
            className="field-input"
            placeholder={f.placeholder}
            value={v}
            onChange={(e) => setField(f.key, e.target.value)}
          />
        ) : f.type === "select" ? (
          <select className="field-input" value={v} onChange={(e) => setField(f.key, e.target.value)}>
            <option value="">— выберите —</option>
            {f.options?.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        ) : (
          <input
            type={f.type}
            className="field-input"
            placeholder={f.placeholder}
            value={v}
            onChange={(e) => setField(f.key, e.target.value)}
          />
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Панель действий */}
      <div className="sticky top-0 z-30 -mx-4 mb-5 flex flex-wrap items-center gap-2 border-b border-slate-200 bg-[#eef1f6]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 print:hidden">
        <a href="#/docs" className="text-sm text-slate-500 hover:text-slate-800">
          ← Документы
        </a>
        <div className="mr-auto ml-2 min-w-0">
          <div className="truncate font-bold text-slate-900">
            {tpl.emoji} {tpl.title}
          </div>
          <div className="text-xs text-slate-500">{saved ? "Сохранено" : "Есть несохранённые изменения"}</div>
        </div>
        <div className="flex rounded-lg border border-slate-300 bg-white p-0.5 text-sm">
          <button
            onClick={() => setBlank(false)}
            className={`rounded-md px-3 py-1.5 cursor-pointer ${!blank ? "bg-blue-900 text-white" : "text-slate-600"}`}
          >
            С заполнением
          </button>
          <button
            onClick={() => setBlank(true)}
            className={`rounded-md px-3 py-1.5 cursor-pointer ${blank ? "bg-blue-900 text-white" : "text-slate-600"}`}
          >
            Пустой бланк
          </button>
        </div>
        <Button onClick={save}>💾 Сохранить</Button>
        <Button variant="gold" onClick={print}>
          🖨️ Печать
        </Button>
        {id !== "new" && (
          <Button
            variant="danger"
            onClick={() => {
              if (confirm("Удалить документ?")) {
                deleteDoc(doc.id);
                navigate("/docs");
              }
            }}
          >
            🗑️
          </Button>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[430px_minmax(0,1fr)] print:block">
        {/* Форма */}
        <div className="space-y-4 print:hidden">
          <Card className="p-4">
            <Label hint="подставит данные заявителя и описание">Материал из реестра</Label>
            <select
              className="field-input"
              value={doc.caseId}
              onChange={(e) => {
                const cid = e.target.value;
                setDoc((d) => (d ? (cid ? applyCase(d, cid) : { ...d, caseId: "" }) : d));
                setSaved(false);
              }}
            >
              <option value="">— без привязки —</option>
              {data.cases.map((c) => (
                <option key={c.id} value={c.id}>
                  № {c.number} · {c.applicant || c.subject || c.kind}
                </option>
              ))}
            </select>
          </Card>

          <Card className="p-4">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="font-bold">Статьи и нормы права</h3>
              <Button onClick={() => setPicker(true)}>📚 Подобрать</Button>
            </div>
            <p className="mb-3 text-xs text-slate-500">{tpl.articlesLabel}</p>
            {arts.length === 0 ? (
              <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
                Статьи не выбраны — в документе останутся пустые места для заполнения от руки.
              </p>
            ) : (
              <ul className="space-y-2">
                {arts.map((a) => (
                  <li key={a.id} className="flex items-start gap-2 rounded-lg border border-slate-200 p-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">{artLabel(a)}</span>
                        <CodeBadge code={a.code} />
                      </div>
                      <div className="text-xs text-slate-500">{a.title}</div>
                      <a
                        href={consultantSearchUrl(a)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-800 hover:underline"
                      >
                        открыть в КонсультантПлюс ↗
                      </a>
                    </div>
                    <button
                      className="text-slate-400 hover:text-red-600 cursor-pointer"
                      onClick={() => upd({ articleIds: doc.articleIds.filter((x) => x !== a.id) })}
                      aria-label="Убрать"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={doc.includeExtract}
                onChange={(e) => upd({ includeExtract: e.target.checked })}
              />
              Приложить выписку из норм права
            </label>
          </Card>

          <Card className="space-y-3 p-4">
            <h3 className="font-bold">Содержание документа</h3>
            {tpl.fields.map(renderField)}
          </Card>

          <Card className="p-4">
            <button
              onClick={() => setShowReq(!showReq)}
              className="flex w-full items-center justify-between font-bold cursor-pointer"
            >
              Реквизиты и подпись <span>{showReq ? "▲" : "▼"}</span>
            </button>
            {showReq && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Номер</Label>
                    <input className="field-input" value={doc.number} onChange={(e) => upd({ number: e.target.value })} />
                  </div>
                  <div>
                    <Label>Дата</Label>
                    <input type="date" className="field-input" value={doc.date} onChange={(e) => upd({ date: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Наименование органа</Label>
                  <input className="field-input" value={doc.organ} onChange={(e) => upd({ organ: e.target.value })} />
                </div>
                <div>
                  <Label>Место составления</Label>
                  <input className="field-input" value={doc.city} onChange={(e) => upd({ city: e.target.value })} />
                </div>
                <div>
                  <Label>Должность</Label>
                  <input className="field-input" value={doc.signerPosition} onChange={(e) => upd({ signerPosition: e.target.value })} />
                </div>
                <div>
                  <Label>Классный чин / звание</Label>
                  <input className="field-input" value={doc.signerRank} onChange={(e) => upd({ signerRank: e.target.value })} />
                </div>
                <div>
                  <Label>ФИО (инициалы и фамилия)</Label>
                  <input className="field-input" value={doc.signerName} onChange={(e) => upd({ signerName: e.target.value })} />
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Предпросмотр листа */}
        <div className="min-w-0">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 print:hidden">
            Предпросмотр листа А4 {blank && "— пустой бланк"}
          </div>
          <Sheet blocks={blocks} />
        </div>
      </div>

      {picker && (
        <ArticlePicker
          selected={doc.articleIds}
          onChange={(ids) => upd({ articleIds: ids })}
          onClose={() => setPicker(false)}
        />
      )}
    </div>
  );
}
