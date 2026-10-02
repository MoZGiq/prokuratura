import { useMemo, useState } from "react";
import { useStore, uid } from "../store";
import { CODES, artLabel, consultantSearchUrl, type Article, type CodeKey } from "../data/articles";
import { Button, Card, Label, Modal, PageHeader } from "../components/ui";
import { CodeBadge, filterArticles } from "../components/ArticlePicker";
import { Sheet } from "../components/Sheet";
import type { Block } from "../data/templates";
import { fmtLong, todayISO } from "../utils/format";

export function Law() {
  const { articles, data, toggleBasket, clearBasket } = useStore();
  const [q, setQ] = useState("");
  const [code, setCode] = useState("");
  const [open, setOpen] = useState<Article | null>(null);
  const [adding, setAdding] = useState(false);

  const list = useMemo(() => filterArticles(articles, q, code), [articles, q, code]);
  const basket = data.basket
    .map((id) => articles.find((a) => a.id === id))
    .filter((a): a is Article => !!a);

  const printBlocks: Block[] = [
    { t: "org", text: (data.settings.organ || "").toUpperCase() },
    { t: "title", text: "ПОДБОРКА НОРМ ПРАВА" },
    { t: "sub", text: fmtLong(todayISO()) },
    ...basket.flatMap<Block>((a) => [
      { t: "h", text: `${artLabel(a)}` },
      { t: "plain", text: a.title },
      {
        t: "small",
        text: a.text?.trim() ? a.text.trim() : `${a.summary} (краткое содержание; актуальный текст — в КонсультантПлюс)`,
      },
    ]),
    { t: "gap" },
    { t: "small", text: "Источник: правовая система КонсультантПлюс (www.consultant.ru)." },
  ];

  return (
    <div>
      <PageHeader
        title="Законодательство"
        subtitle="Подбирайте статьи кодексов и законов, формируйте подборку, печатайте её или прикрепляйте к документам. Полный текст открывается в КонсультантПлюс."
        actions={
          <>
            <Button onClick={() => setAdding(true)}>+ Добавить статью</Button>
            <Button variant="primary" disabled={basket.length === 0} onClick={() => window.print()}>
              🖨️ Печать подборки ({basket.length})
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] print:hidden">
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            <input
              className="field-input max-w-md"
              placeholder="Поиск: номер статьи, название, слова из описания…"
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
          </div>

          {/* Поиск прямо в КонсультантПлюс */}
          <Card className="mb-4 flex flex-wrap items-center gap-3 border-blue-200 bg-blue-50 p-3">
            <div className="min-w-0 flex-1 text-sm text-blue-950">
              <b>Нужной статьи нет?</b> Найдите её в КонсультантПлюс, а затем добавьте сюда вместе с текстом.
            </div>
            <a
              href={`https://www.consultant.ru/search/?q=${encodeURIComponent(q || "")}`}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="primary">Искать «{q || "…"}» в КонсультантПлюс ↗</Button>
            </a>
          </Card>

          <div className="mb-2 text-xs text-slate-500">Найдено: {list.length}</div>
          <div className="space-y-2">
            {list.map((a) => {
              const inBasket = data.basket.includes(a.id);
              return (
                <Card key={a.id} className={`p-3 ${inBasket ? "border-blue-400 ring-1 ring-blue-300" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setOpen(a)}
                          className="text-left font-bold text-blue-950 hover:underline cursor-pointer"
                        >
                          {artLabel(a)}
                        </button>
                        <CodeBadge code={a.code} />
                        {a.custom && (
                          <span className="rounded-md bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">моя</span>
                        )}
                        {a.text && (
                          <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                            с текстом
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-sm font-medium text-slate-800">{a.title}</div>
                      <div className="mt-1 text-sm text-slate-500 line-clamp-2">{a.summary}</div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1.5">
                      <Button variant={inBasket ? "primary" : "secondary"} onClick={() => toggleBasket(a.id)}>
                        {inBasket ? "✓ В подборке" : "+ В подборку"}
                      </Button>
                      <Button variant="ghost" onClick={() => setOpen(a)}>
                        Подробнее
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Подборка */}
        <aside>
          <Card className="sticky top-4 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-bold">📚 Моя подборка</h3>
              {basket.length > 0 && (
                <button onClick={clearBasket} className="text-xs text-slate-500 hover:text-red-600 cursor-pointer">
                  очистить
                </button>
              )}
            </div>
            {basket.length === 0 ? (
              <p className="text-sm text-slate-500">
                Добавляйте статьи кнопкой «+ В подборку». Подборку можно распечатать или подставить в документ.
              </p>
            ) : (
              <ul className="max-h-[50vh] space-y-1.5 overflow-y-auto">
                {basket.map((a) => (
                  <li key={a.id} className="flex items-start justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-sm">
                    <span>
                      <b>{artLabel(a)}</b>
                      <span className="block text-xs text-slate-500 line-clamp-1">{a.title}</span>
                    </span>
                    <button onClick={() => toggleBasket(a.id)} className="text-slate-400 hover:text-red-600 cursor-pointer">
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 space-y-2">
              <Button variant="gold" className="w-full" disabled={basket.length === 0} onClick={() => window.print()}>
                🖨️ Распечатать подборку
              </Button>
              <a href="#/docs/new" className="block">
                <Button className="w-full">📝 Создать документ</Button>
              </a>
            </div>
          </Card>

          <Card className="mt-4 p-4">
            <h3 className="mb-2 text-sm font-bold">Кодексы и законы на КонсультантПлюс</h3>
            <ul className="space-y-1.5 text-sm">
              {Object.values(CODES).map((c) => (
                <li key={c.key}>
                  <a href={c.url} target="_blank" rel="noreferrer" className="text-blue-800 hover:underline">
                    {c.short} ↗
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>

      <div className="hidden print:block">
        <Sheet blocks={printBlocks} />
      </div>

      {open && <ArticleModal id={open.id} onClose={() => setOpen(null)} />}
      {adding && <AddArticle onClose={() => setAdding(false)} />}
    </div>
  );
}

function ArticleModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { articles, setArticleText, toggleBasket, data, deleteCustomArticle } = useStore();
  const a = articles.find((x) => x.id === id);
  const [text, setText] = useState(a?.text || "");
  if (!a) return null;
  const inBasket = data.basket.includes(a.id);

  return (
    <Modal title={`${artLabel(a)}`} onClose={onClose} wide>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <CodeBadge code={a.code} />
        <span className="text-sm text-slate-500">{CODES[a.code].name}</span>
      </div>
      <h3 className="text-lg font-bold">{a.title}</h3>
      <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
        <b>Краткое пояснение:</b> {a.summary}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={consultantSearchUrl(a)} target="_blank" rel="noreferrer">
          <Button variant="primary">Найти статью в КонсультантПлюс ↗</Button>
        </a>
        <a href={CODES[a.code].url} target="_blank" rel="noreferrer">
          <Button>Открыть {CODES[a.code].short} ↗</Button>
        </a>
      </div>

      <div className="mt-5">
        <Label hint="скопируйте текст статьи из КонсультантПлюс и вставьте сюда — он попадёт в выписку к документу">
          Текст статьи
        </Label>
        <textarea
          rows={9}
          className="field-input"
          placeholder="Вставьте актуальный текст статьи…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      <div className="mt-4 flex flex-wrap justify-between gap-2">
        <div>
          {a.custom && (
            <Button
              variant="danger"
              onClick={() => {
                if (confirm("Удалить эту статью из справочника?")) {
                  deleteCustomArticle(a.id);
                  onClose();
                }
              }}
            >
              Удалить
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => toggleBasket(a.id)}>{inBasket ? "Убрать из подборки" : "+ В подборку"}</Button>
          <Button
            variant="primary"
            onClick={() => {
              setArticleText(a.id, text);
              onClose();
            }}
          >
            Сохранить текст
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function AddArticle({ onClose }: { onClose: () => void }) {
  const { addCustomArticle } = useStore();
  const [code, setCode] = useState<CodeKey>("koap");
  const [number, setNumber] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");

  return (
    <Modal title="Добавить статью в справочник" onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const art: Article = {
            id: `custom-${uid()}`,
            code,
            number: number.trim(),
            title: title.trim(),
            summary: text.trim().slice(0, 220) || "Добавлено пользователем.",
            custom: true,
            text: text.trim() || undefined,
          };
          addCustomArticle(art);
          onClose();
        }}
      >
        <div>
          <Label>Кодекс / закон</Label>
          <select className="field-input" value={code} onChange={(e) => setCode(e.target.value as CodeKey)}>
            {Object.values(CODES).map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-[120px_1fr] gap-3">
          <div>
            <Label>№ статьи</Label>
            <input required className="field-input" placeholder="19.5" value={number} onChange={(e) => setNumber(e.target.value)} />
          </div>
          <div>
            <Label>Название статьи</Label>
            <input required className="field-input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
        </div>
        <div>
          <Label hint="необязательно">Текст статьи из КонсультантПлюс</Label>
          <textarea rows={7} className="field-input" value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" variant="primary">
            Добавить
          </Button>
        </div>
      </form>
    </Modal>
  );
}
