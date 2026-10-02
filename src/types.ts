export const CASE_KINDS = [
  "Обращение гражданина",
  "Проверка исполнения законов",
  "Материал для возбуждения дела об АП",
  "Материал доследственной проверки",
  "Надзор по уголовному делу",
  "Иное",
] as const;

export const CASE_STATUSES = [
  "Зарегистрирован",
  "В работе",
  "Проверка завершена",
  "Направлен по подведомственности",
  "Исполнен / списан в дело",
] as const;

export type CaseStatus = (typeof CASE_STATUSES)[number];

export interface CaseRec {
  id: string;
  number: string;
  date: string; // ISO
  kind: string;
  status: string;
  applicant: string;
  applicantAddress: string;
  subject: string; // лицо / организация, в отношении которых проверка
  subjectAddress: string;
  description: string;
  executor: string;
  deadline: string; // ISO
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export interface DocRec {
  id: string;
  templateId: string;
  caseId: string;
  title: string;
  number: string;
  date: string;
  city: string;
  organ: string;
  signerPosition: string;
  signerRank: string;
  signerName: string;
  fields: Record<string, string>;
  articleIds: string[];
  includeExtract: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Settings {
  organ: string;
  city: string;
  signerPosition: string;
  signerRank: string;
  signerName: string;
}

export interface AppData {
  version: 1;
  settings: Settings;
  cases: CaseRec[];
  docs: DocRec[];
  customArticles: import("./data/articles").Article[];
  articleTexts: Record<string, string>; // id -> вставленный текст из КонсультантПлюс
  basket: string[]; // подборка статей
}
