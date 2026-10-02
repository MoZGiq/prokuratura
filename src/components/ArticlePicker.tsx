import { useMemo, useState } from "react";
import { CODES, artLabel, consultantSearchUrl, type Article, type CodeKey } from "../data/articles";
import { useStore } from "../store";
import { Button, Modal } from "./ui";

export function filterArticles(list: Article[], q: string, code: string): Article[] {
  const s = q.trim().toLowerCase();
  return list.filter((a) => {
    if (code && a.code !== code) return false;
    if (!s) return true;
    const hay = `${a.number} ст ${a.title} ${a.summary} ${CODES[a.code].short} ${CODES[a.code].name} ${a.text || ""}`.toLowerCase();
    return s.split(/\s+/).every((w) => hay.includes(w));
  });
}

export function CodeBadge({ code }: { code: CodeKey }) {
  return (
    <span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-semibold ${CODES[code].color}`}>
      {CODES[code].short}
    </span>
  );
}

export function ArticlePicker({
  selected,
  onChange,
  onClose,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
  onClose: () => void;
}) {
  const { articles, data } = useStore();
  const [q, setQ] = useState("");
  const [code, setCode] = useState("");
  const list = useMemo(() => filterArticles(articles, q, code), [articles, q, code]);

  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <Modal title="Подбор статей законодательства" onClose={onClose} wide>
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          autoFocus
          className="field-input max-w-sm"
          placeholder="Номер статьи или слова: «19.5», «взятка»…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="field-input max-w-xs" value={code} onChange={(e) => setCode(e.target.value)}>
          <option value="">Все кодексы и законы</option>
          {Object.values(CODES).map((c) => (
            <option key={c.key} value={c.key}>
              {c.short}
            </option>
          ))}
        </select>
        {data.basket.length > 0 && (
          <Button onClick={() => onChange(Array.from(new Set([...selected, ...data.basket])))}>
            + Добавить всю подборку ({data.basket.length})
          </Button>
        )}
      </div>
      <p className="mb-3 text-xs text-slate-500">
        Выбрано: <b>{selected.length}</b>. Если нужной статьи нет в списке — добавьте её в разделе «Законодательство» (можно вставить
        текст из КонсультантПлюс).
      </p>
      <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
        {list.length === 0 && <div className="py-6 text-center text-sm text-slate-500">Ничего не найдено</div>}
        {list.map((a) => {
          const on = selected.includes(a.id);
          return (
            <div
              key={a.id}
              className={`flex items-start gap-3 rounded-lg border p-3 ${on ? "border-blue-400 bg-blue-50" : "border-slate-200"}`}
            >
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 cursor-pointer"
                checked={on}
                onChange={() => toggle(a.id)}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold">{artLabel(a)}</span>
                  <CodeBadge code={a.code} />
                </div>
                <div className="text-sm text-slate-700">{a.title}</div>
              </div>
              <a
                href={consultantSearchUrl(a)}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-xs font-medium text-blue-800 hover:underline"
              >
                КонсультантПлюс ↗
              </a>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex justify-end">
        <Button variant="primary" onClick={onClose}>
          Готово
        </Button>
      </div>
    </Modal>
  );
}
