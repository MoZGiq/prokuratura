import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppData, CaseRec, DocRec, Settings } from "./types";
import { BUILTIN_ARTICLES, type Article } from "./data/articles";

const KEY = "prosecutor-arm-v1";

export const DEFAULT_SETTINGS: Settings = {
  organ: "Прокуратура ________ района",
  city: "г. ________",
  signerPosition: "Старший помощник прокурора",
  signerRank: "младший советник юстиции",
  signerName: "",
};

const EMPTY: AppData = {
  version: 1,
  settings: DEFAULT_SETTINGS,
  cases: [],
  docs: [],
  customArticles: [],
  articleTexts: {},
  basket: [],
};

function load(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    return normalize(parsed);
  } catch {
    return EMPTY;
  }
}

export function normalize(p: Partial<AppData>): AppData {
  return {
    version: 1,
    settings: { ...DEFAULT_SETTINGS, ...(p.settings || {}) },
    cases: Array.isArray(p.cases) ? p.cases : [],
    docs: Array.isArray(p.docs) ? p.docs : [],
    customArticles: Array.isArray(p.customArticles) ? p.customArticles : [],
    articleTexts: p.articleTexts && typeof p.articleTexts === "object" ? p.articleTexts : {},
    basket: Array.isArray(p.basket) ? p.basket : [],
  };
}

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

interface Ctx {
  data: AppData;
  articles: Article[];
  getArticle: (id: string) => Article | undefined;
  saveCase: (c: CaseRec) => void;
  deleteCase: (id: string) => void;
  saveDoc: (d: DocRec) => void;
  deleteDoc: (id: string) => void;
  saveSettings: (s: Settings) => void;
  toggleBasket: (id: string) => void;
  clearBasket: () => void;
  setArticleText: (id: string, text: string) => void;
  addCustomArticle: (a: Article) => void;
  deleteCustomArticle: (id: string) => void;
  replaceAll: (d: AppData) => void;
  resetAll: () => void;
  nextCaseNumber: () => string;
  nextDocNumber: () => string;
}

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* хранилище переполнено или недоступно */
    }
  }, [data]);

  const articles = useMemo(() => {
    const all = [...BUILTIN_ARTICLES, ...data.customArticles];
    return all.map((x) =>
      data.articleTexts[x.id] ? { ...x, text: data.articleTexts[x.id] } : x
    );
  }, [data.customArticles, data.articleTexts]);

  const getArticle = useCallback(
    (id: string) => articles.find((x) => x.id === id),
    [articles]
  );

  const upsert = <T extends { id: string }>(list: T[], item: T) =>
    list.some((x) => x.id === item.id)
      ? list.map((x) => (x.id === item.id ? item : x))
      : [item, ...list];

  const value: Ctx = {
    data,
    articles,
    getArticle,
    saveCase: (c) => setData((d) => ({ ...d, cases: upsert(d.cases, c) })),
    deleteCase: (id) =>
      setData((d) => ({
        ...d,
        cases: d.cases.filter((x) => x.id !== id),
        docs: d.docs.map((x) => (x.caseId === id ? { ...x, caseId: "" } : x)),
      })),
    saveDoc: (doc) => setData((d) => ({ ...d, docs: upsert(d.docs, doc) })),
    deleteDoc: (id) => setData((d) => ({ ...d, docs: d.docs.filter((x) => x.id !== id) })),
    saveSettings: (s) => setData((d) => ({ ...d, settings: s })),
    toggleBasket: (id) =>
      setData((d) => ({
        ...d,
        basket: d.basket.includes(id) ? d.basket.filter((x) => x !== id) : [...d.basket, id],
      })),
    clearBasket: () => setData((d) => ({ ...d, basket: [] })),
    setArticleText: (id, text) =>
      setData((d) => {
        const t = { ...d.articleTexts };
        if (text.trim()) t[id] = text;
        else delete t[id];
        return { ...d, articleTexts: t };
      }),
    addCustomArticle: (art) =>
      setData((d) => ({ ...d, customArticles: [...d.customArticles, art] })),
    deleteCustomArticle: (id) =>
      setData((d) => ({
        ...d,
        customArticles: d.customArticles.filter((x) => x.id !== id),
        basket: d.basket.filter((x) => x !== id),
      })),
    replaceAll: (nd) => setData(normalize(nd)),
    resetAll: () => setData(EMPTY),
    nextCaseNumber: () => {
      const y = new Date().getFullYear();
      const n =
        data.cases.filter((c) => c.number.endsWith(`/${y}`)).length + 1;
      return `${String(n).padStart(3, "0")}/${y}`;
    },
    nextDocNumber: () => {
      const y = new Date().getFullYear();
      return String(data.docs.length + 1) + "/" + y;
    },
  };

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): Ctx {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("StoreProvider missing");
  return c;
}
