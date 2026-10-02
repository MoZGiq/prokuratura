import { useEffect, useMemo, useState } from "react";
import { useStore, uid } from "../store";
import { CASE_KINDS, CASE_STATUSES, type CaseRec } from "../types";
import { Button, Card, Empty, Label, Modal, PageHeader } from "../components/ui";
import { daysLeft, fmtShort, todayISO } from "../utils/format";
import { TEMPLATES } from "../data/templates";
import { useRoute, navigate } from "../router";

const statusColor = (s: string) =>
  s === "Зарегистрирован"
    ? "bg-sky-100 text-sky-800"
    : s === "В работе"
    ? "bg-amber-100 text-amber-800"
    : s === "Проверка завершена"
    ? "bg-emerald-100 text-emerald-800"
    : "bg-slate-200 text-slate-700";

export function Cases() {
  const { data, deleteCase } = useStore();
  const route = useRoute();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<CaseRec | "new" | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);

  useEffect(() => {
    if (route.params.get("new")) {
      setEditing("new");
      navigate("/cases");
    }
    const o = route.params.get("open");
    if (o) {
      setViewing(o);
      navigate("/cases");
    }
  }, [route.params]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return data.cases.filter((c) => {
      if (status && c.status !== status) return false;
      if (!s) return true;
      return [c.number, c.applicant, c.subject, c.description, c.executor, c.kind]
        .join(" ")
        .toLowerCase()
        .includes(s);
    });
  }, [data.cases, q, status]);

  const viewed = data.cases.find((c) => c.id === viewing);

  return (
    <div>
      <PageHeader
        title="Реестр материалов"
        subtitle="Обращения, проверки и материалы. Данные сохраняются в вашем браузере и могут быть выгружены в файл."
        actions={
          <>
            <Button onClick={() => window.print()} disabled={list.length === 0}>
              🖨️ Печать журнала
            </Button>
            <Button variant="primary" onClick={() => setEditing("new")}>
              + Новый материал
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3 print:hidden">
        <input
          className="field-input max-w-sm"
          placeholder="Поиск по номеру, заявителю, существу…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="field-input max-w-xs" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Все статусы</option>
          {CASE_STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {list.length === 0 ? (
        <div className="print:hidden">
          <Empty>
            {data.cases.length === 0
              ? "Материалов пока нет. Нажмите «Новый материал», чтобы зарегистрировать первое обращение."
              : "Ничего не найдено по заданным условиям."}
          </Empty>
        </div>
      ) : (
        <>
          {/* Журнал для печати */}
          <div className="hidden print:block" style={{ fontFamily: "'Times New Roman', serif", color: "#000" }}>
            <h2 style={{ textAlign: "center", fontWeight: 700, fontSize: "14pt", marginBottom: "6pt" }}>
              ЖУРНАЛ УЧЁТА МАТЕРИАЛОВ
            </h2>
            <div style={{ textAlign: "center", marginBottom: "10pt" }}>по состоянию на {fmtShort(todayISO())}</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt" }}>
              <thead>
                <tr>
                  {["№", "Дата", "Вид", "Заявитель / проверяемое лицо", "Суть", "Исполнитель", "Срок", "Статус"].map((h) => (
                    <th key={h} style={{ border: "1px solid #000", padding: "3pt", textAlign: "left" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id} style={{ breakInside: "avoid" }}>
                    {[
                      c.number,
                      fmtShort(c.date),
                      c.kind,
                      [c.applicant, c.subject].filter(Boolean).join(" / "),
                      c.description,
                      c.executor,
                      fmtShort(c.deadline),
                      c.status,
                    ].map((v, i) => (
                      <td key={i} style={{ border: "1px solid #000", padding: "3pt", verticalAlign: "top" }}>
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Card className="overflow-hidden print:hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">№ / дата</th>
                    <th className="px-4 py-3">Вид</th>
                    <th className="px-4 py-3">Заявитель / лицо</th>
                    <th className="px-4 py-3">Срок</th>
                    <th className="px-4 py-3">Статус</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {list.map((c) => {
                    const left = daysLeft(c.deadline);
                    const active = c.status === "Зарегистрирован" || c.status === "В работе";
                    return (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 align-top">
                          <button onClick={() => setViewing(c.id)} className="font-semibold text-blue-900 hover:underline cursor-pointer">
                            № {c.number}
                          </button>
                          <div className="text-xs text-slate-500">{fmtShort(c.date)}</div>
                        </td>
                        <td className="px-4 py-3 align-top text-slate-700">{c.kind}</td>
                        <td className="px-4 py-3 align-top">
                          <div className="font-medium">{c.applicant || "—"}</div>
                          {c.subject && <div className="text-xs text-slate-500">в отношении: {c.subject}</div>}
                        </td>
                        <td className="px-4 py-3 align-top whitespace-nowrap">
                          {fmtShort(c.deadline)}
                          {active && left !== null && left < 0 && (
                            <div className="text-xs font-semibold text-red-600">просрочено</div>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(c.status)}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                          <Button variant="ghost" onClick={() => setEditing(c)}>
                            ✏️
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => confirm(`Удалить материал № ${c.number}?`) && deleteCase(c.id)}
                          >
                            🗑️
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {editing && <CaseForm initial={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      {viewed && (
        <CaseView
          c={viewed}
          onClose={() => setViewing(null)}
          onEdit={() => {
            setEditing(viewed);
            setViewing(null);
          }}
        />
      )}
    </div>
  );
}

function CaseForm({ initial, onClose }: { initial: CaseRec | null; onClose: () => void }) {
  const { saveCase, nextCaseNumber, data } = useStore();
  const [f, setF] = useState<CaseRec>(
    () =>
      initial || {
        id: uid(),
        number: nextCaseNumber(),
        date: todayISO(),
        kind: CASE_KINDS[0],
        status: CASE_STATUSES[0],
        applicant: "",
        applicantAddress: "",
        subject: "",
        subjectAddress: "",
        description: "",
        executor: data.settings.signerName,
        deadline: "",
        notes: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
  );
  const set = (k: keyof CaseRec, v: string) => setF((p) => ({ ...p, [k]: v }));

  const addDays = (n: number) => {
    const d = new Date(f.date || todayISO());
    d.setDate(d.getDate() + n);
    set("deadline", d.toISOString().slice(0, 10));
  };

  return (
    <Modal title={initial ? `Материал № ${f.number}` : "Новый материал"} onClose={onClose} wide>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveCase({ ...f, updatedAt: Date.now() });
          onClose();
        }}
        className="grid gap-4 sm:grid-cols-2"
      >
        <div>
          <Label>Регистрационный номер</Label>
          <input className="field-input" required value={f.number} onChange={(e) => set("number", e.target.value)} />
        </div>
        <div>
          <Label>Дата регистрации</Label>
          <input type="date" className="field-input" required value={f.date} onChange={(e) => set("date", e.target.value)} />
        </div>
        <div>
          <Label>Вид материала</Label>
          <select className="field-input" value={f.kind} onChange={(e) => set("kind", e.target.value)}>
            {CASE_KINDS.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </div>
        <div>
          <Label>Статус</Label>
          <select className="field-input" value={f.status} onChange={(e) => set("status", e.target.value)}>
            {CASE_STATUSES.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </div>
        <div>
          <Label>Заявитель (ФИО / организация)</Label>
          <input className="field-input" value={f.applicant} onChange={(e) => set("applicant", e.target.value)} />
        </div>
        <div>
          <Label>Адрес и контакты заявителя</Label>
          <input className="field-input" value={f.applicantAddress} onChange={(e) => set("applicantAddress", e.target.value)} />
        </div>
        <div>
          <Label>Лицо / организация, в отношении которых проводится проверка</Label>
          <input className="field-input" value={f.subject} onChange={(e) => set("subject", e.target.value)} />
        </div>
        <div>
          <Label>Адрес / реквизиты проверяемого</Label>
          <input className="field-input" value={f.subjectAddress} onChange={(e) => set("subjectAddress", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label>Краткое содержание (суть обращения / нарушения)</Label>
          <textarea rows={4} className="field-input" value={f.description} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div>
          <Label>Исполнитель</Label>
          <input className="field-input" value={f.executor} onChange={(e) => set("executor", e.target.value)} />
        </div>
        <div>
          <Label>Контрольный срок</Label>
          <div className="flex gap-2">
            <input type="date" className="field-input" value={f.deadline} onChange={(e) => set("deadline", e.target.value)} />
            <Button type="button" onClick={() => addDays(30)} title="30 дней со дня регистрации (ст. 12 59-ФЗ)">
              +30 дн.
            </Button>
          </div>
        </div>
        <div className="sm:col-span-2">
          <Label>Заметки</Label>
          <textarea rows={2} className="field-input" value={f.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" variant="primary">
            Сохранить
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function CaseView({ c, onClose, onEdit }: { c: CaseRec; onClose: () => void; onEdit: () => void }) {
  const { data } = useStore();
  const docs = data.docs.filter((d) => d.caseId === c.id);
  const row = (l: string, v: string) => (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{l}</div>
      <div className="text-sm text-slate-800 whitespace-pre-wrap">{v || "—"}</div>
    </div>
  );
  return (
    <Modal title={`Материал № ${c.number} от ${fmtShort(c.date)}`} onClose={onClose} wide>
      <div className="grid gap-4 sm:grid-cols-2">
        {row("Вид", c.kind)}
        {row("Статус", c.status)}
        {row("Заявитель", c.applicant)}
        {row("Контакты заявителя", c.applicantAddress)}
        {row("Проверяемое лицо", c.subject)}
        {row("Адрес / реквизиты", c.subjectAddress)}
        <div className="sm:col-span-2">{row("Содержание", c.description)}</div>
        {row("Исполнитель", c.executor)}
        {row("Контрольный срок", fmtShort(c.deadline))}
        {c.notes && <div className="sm:col-span-2">{row("Заметки", c.notes)}</div>}
      </div>

      <h3 className="mb-2 mt-6 font-bold">Документы по материалу</h3>
      {docs.length === 0 ? (
        <p className="text-sm text-slate-500">Документов нет.</p>
      ) : (
        <ul className="mb-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
          {docs.map((d) => (
            <li key={d.id}>
              <a href={`#/docs/${d.id}`} className="block px-3 py-2 text-sm hover:bg-slate-50">
                {d.title} <span className="text-slate-400">· № {d.number}</span>
              </a>
            </li>
          ))}
        </ul>
      )}

      <h3 className="mb-2 mt-4 font-bold">Создать документ по материалу</h3>
      <div className="flex flex-wrap gap-2">
        {TEMPLATES.map((t) => (
          <a
            key={t.id}
            href={`#/docs/new?tpl=${t.id}&case=${c.id}`}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:border-blue-400 hover:bg-blue-50"
          >
            {t.emoji} {t.short}
          </a>
        ))}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button onClick={onEdit}>✏️ Редактировать</Button>
        <Button variant="primary" onClick={onClose}>
          Закрыть
        </Button>
      </div>
    </Modal>
  );
}
