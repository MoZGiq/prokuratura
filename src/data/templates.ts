import { CODES, artLabel, type Article } from "./articles";
import type { CaseRec, DocRec } from "../types";
import { fmtLong } from "../utils/format";

export interface FieldDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "date" | "time" | "select";
  placeholder?: string;
  options?: string[];
  fromCase?: keyof CaseRec;
  rows?: number;
  group?: string;
}

export type BlockType =
  | "org"
  | "meta"
  | "title"
  | "sub"
  | "p"
  | "plain"
  | "right"
  | "li"
  | "sig"
  | "gap"
  | "h"
  | "small";

export interface Block {
  t: BlockType;
  text?: string;
  a?: string;
  b?: string;
}

export interface Ctx {
  f: (key: string, len?: number) => string;
  ft: (key: string, lines?: number) => string;
  d: (key: string) => string;
  violated: string;
  doc: DocRec;
}

export interface Template {
  id: string;
  title: string;
  short: string;
  description: string;
  emoji: string;
  suggested: string[]; // id статей, предлагаемых по умолчанию
  articlesLabel: string;
  fields: FieldDef[];
  render: (c: Ctx) => Block[];
}

const U = (n: number) => "_".repeat(n);

function head(c: Ctx, title: string, sub?: string): Block[] {
  const { doc } = c;
  return [
    { t: "org", text: (doc.organ || U(30)).toUpperCase() },
    { t: "meta", a: doc.city || U(15), b: fmtLong(c.d("__date")) },
    { t: "title", text: title },
    {
      t: "sub",
      text: `${sub ? sub + " " : ""}№ ${c.f("__number", 8)}`,
    },
  ];
}

function person(c: Ctx): string {
  const { doc } = c;
  return [doc.signerPosition, doc.signerRank, doc.signerName]
    .filter((x) => x && x.trim())
    .join(" ") || U(30);
}

function sign(c: Ctx): Block[] {
  const { doc } = c;
  return [
    { t: "gap" },
    {
      t: "sig",
      a: [doc.signerPosition, doc.signerRank].filter(Boolean).join("\n") || U(25),
      b: doc.signerName || U(18),
    },
  ];
}

const caseFrom = (k: keyof CaseRec): { fromCase: keyof CaseRec } => ({ fromCase: k });

/* ───────────────────────────────────────────── */

export const TEMPLATES: Template[] = [
  {
    id: "ap-postanovlenie",
    title: "Постановление о возбуждении дела об административном правонарушении",
    short: "Постановление о возбуждении дела об АП",
    description:
      "Выносится прокурором при выявлении признаков правонарушения (ст. 28.4 КоАП РФ, ст. 25 ФЗ «О прокуратуре РФ»).",
    emoji: "⚖️",
    suggested: ["koap-28.4", "koap-25.1"],
    articlesLabel: "Квалификация (статья КоАП РФ, предусматривающая ответственность)",
    fields: [
      { key: "personName", label: "Лицо, в отношении которого возбуждается дело (ФИО / наименование)", type: "text", ...caseFrom("subject") },
      { key: "personData", label: "Сведения о лице (дата и место рождения, паспорт, адрес; для юрлица — ИНН, ОГРН, адрес)", type: "textarea", rows: 3, ...caseFrom("subjectAddress") },
      { key: "place", label: "Место совершения правонарушения", type: "text" },
      { key: "eventDate", label: "Время (дата) совершения правонарушения", type: "text", placeholder: "например, 12.03.2026 в 10:30" },
      { key: "essence", label: "Событие правонарушения", type: "textarea", rows: 5, ...caseFrom("description") },
      { key: "evidence", label: "Доказательства (материалы проверки, документы, объяснения)", type: "textarea", rows: 3 },
      { key: "victim", label: "Потерпевший (если есть)", type: "text", placeholder: "не установлен" },
      { key: "transfer", label: "Орган (суд), которому направляются материалы для рассмотрения", type: "text" },
    ],
    render: (c) => [
      ...head(c, "ПОСТАНОВЛЕНИЕ", "о возбуждении дела об административном правонарушении"),
      { t: "p", text: `Я, ${person(c)}, рассмотрев материалы проверки, проведённой ${c.doc.organ || U(20)},` },
      { t: "h", text: "УСТАНОВИЛ:" },
      { t: "p", text: `Проверкой установлено, что ${c.ft("essence", 4)}` },
      { t: "p", text: `Место совершения правонарушения: ${c.f("place", 40)}. Время (дата) совершения: ${c.f("eventDate", 25)}.` },
      { t: "p", text: `Лицо, в отношении которого возбуждается дело: ${c.f("personName", 35)}. Сведения о лице: ${c.ft("personData", 2)}` },
      { t: "p", text: `Потерпевший: ${c.f("victim", 30)}.` },
      { t: "p", text: `Факт совершения правонарушения подтверждается: ${c.ft("evidence", 2)}` },
      { t: "p", text: `Указанные действия (бездействие) содержат признаки административного правонарушения, ответственность за которое предусмотрена ${c.violated}.` },
      { t: "p", text: "Лицу, в отношении которого возбуждено дело, разъяснены права, предусмотренные ст. 25.1 КоАП РФ, а также положения ст. 51 Конституции РФ." },
      { t: "p", text: "На основании изложенного, руководствуясь ст. 25 ФЗ «О прокуратуре Российской Федерации», ст. 28.4 КоАП РФ," },
      { t: "h", text: "ПОСТАНОВИЛ:" },
      { t: "li", text: `1. Возбудить дело об административном правонарушении в отношении ${c.f("personName", 35)} по признакам правонарушения, предусмотренного ${c.violated}.` },
      { t: "li", text: "2. Копию настоящего постановления вручить (направить) лицу, в отношении которого возбуждено дело." },
      { t: "li", text: `3. Материалы дела направить для рассмотрения в ${c.f("transfer", 40)}.` },
      ...sign(c),
      { t: "gap" },
      { t: "plain", text: "С постановлением ознакомлен(а), права и обязанности разъяснены. Копию получил(а):" },
      { t: "sig", a: `«___» ______________ 20___ г.`, b: U(18) },
    ],
  },
  {
    id: "objasnenie",
    title: "Объяснение (протокол опроса)",
    short: "Объяснение",
    description: "Фиксация пояснений заявителя, свидетеля или проверяемого лица в ходе проверки.",
    emoji: "🗣️",
    suggested: ["koap-17.9"],
    articlesLabel: "Нормы, о которых предупреждено лицо",
    fields: [
      { key: "place", label: "Место получения объяснения", type: "text", placeholder: "каб. №, адрес" },
      { key: "timeStart", label: "Время начала", type: "time" },
      { key: "timeEnd", label: "Время окончания", type: "time" },
      { key: "role", label: "Процессуальное положение опрашиваемого", type: "select", options: ["Заявитель", "Свидетель", "Лицо, в отношении которого проводится проверка", "Должностное лицо организации", "Иное"] },
      { key: "personName", label: "ФИО опрашиваемого", type: "text", ...caseFrom("applicant") },
      { key: "birth", label: "Дата и место рождения", type: "text" },
      { key: "address", label: "Адрес проживания / регистрации", type: "text", ...caseFrom("applicantAddress") },
      { key: "docData", label: "Документ, удостоверяющий личность", type: "text", placeholder: "паспорт серия, номер, кем и когда выдан" },
      { key: "job", label: "Место работы, должность", type: "text" },
      { key: "phone", label: "Контактный телефон", type: "text" },
      { key: "statement", label: "Показания (со слов опрашиваемого)", type: "textarea", rows: 10 },
    ],
    render: (c) => [
      ...head(c, "ОБЪЯСНЕНИЕ"),
      { t: "plain", text: `Время начала: ${c.f("timeStart", 8)}   Время окончания: ${c.f("timeEnd", 8)}` },
      { t: "plain", text: `Место получения объяснения: ${c.f("place", 40)}` },
      { t: "plain", text: `Я, ${c.f("personName", 35)}, ${c.f("birth", 25)}, проживающий(ая) по адресу: ${c.f("address", 40)}; документ: ${c.f("docData", 35)}; место работы, должность: ${c.f("job", 30)}; тел.: ${c.f("phone", 15)}.` },
      { t: "plain", text: `Процессуальное положение: ${c.f("role", 25)}.` },
      { t: "p", text: "Объяснение даю добровольно. Мне разъяснены права и обязанности, положения ст. 51 Конституции РФ. Об ответственности за дачу заведомо ложных сведений (ст. 17.9 КоАП РФ), в том числе об ответственности по иным нормам, предупреждён(а)." },
      { t: "plain", text: `По существу заданных вопросов могу пояснить следующее: ${c.ft("statement", 9)}` },
      { t: "p", text: "С моих слов записано верно, мною прочитано. Замечаний и дополнений не имею." },
      { t: "sig", a: "Объяснение дал(а):", b: U(18) },
      ...sign(c).map((b) => (b.t === "sig" ? { ...b, a: "Опросил:\n" + b.a } : b)),
    ],
  },
  {
    id: "predstavlenie",
    title: "Представление об устранении нарушений закона",
    short: "Представление",
    description: "Акт прокурорского реагирования (ст. 24 ФЗ «О прокуратуре РФ») — вносится должностному лицу, полномочному устранить нарушения.",
    emoji: "📜",
    suggested: ["prok-24"],
    articlesLabel: "Нарушенные нормы права",
    fields: [
      { key: "addressee", label: "Кому (должность, наименование организации, ФИО)", type: "textarea", rows: 3, ...caseFrom("subject") },
      { key: "checkBasis", label: "Основание и предмет проведённой проверки", type: "textarea", rows: 3, placeholder: "в связи с обращением гр. ... о ..." },
      { key: "violations", label: "Выявленные нарушения закона", type: "textarea", rows: 8, ...caseFrom("description") },
      { key: "causes", label: "Причины и условия, способствовавшие нарушениям", type: "textarea", rows: 3 },
    ],
    render: (c) => [
      { t: "right", text: c.ft("addressee", 3) },
      { t: "gap" },
      ...head(c, "ПРЕДСТАВЛЕНИЕ", "об устранении нарушений закона"),
      { t: "p", text: `${c.doc.organ || U(20)} проведена проверка ${c.ft("checkBasis", 2)}` },
      { t: "p", text: `Проверкой установлено: ${c.ft("violations", 6)}` },
      { t: "p", text: `Изложенное свидетельствует о нарушении требований: ${c.violated}.` },
      { t: "p", text: `Причины и условия, способствовавшие нарушениям: ${c.ft("causes", 2)}` },
      { t: "p", text: "На основании изложенного, руководствуясь ст. 24 ФЗ «О прокуратуре Российской Федерации»," },
      { t: "h", text: "ТРЕБУЮ:" },
      { t: "li", text: "1. Безотлагательно рассмотреть настоящее представление с участием представителя прокуратуры; о времени и месте рассмотрения заблаговременно уведомить прокуратуру." },
      { t: "li", text: "2. Принять конкретные меры по устранению допущенных нарушений закона, причин и условий, им способствующих." },
      { t: "li", text: "3. Рассмотреть вопрос о привлечении к ответственности должностных лиц, допустивших нарушения закона." },
      { t: "li", text: "4. О результатах рассмотрения представления и принятых мерах в письменной форме сообщить прокурору в течение месяца со дня внесения представления." },
      ...sign(c),
    ],
  },
  {
    id: "predostereghenie",
    title: "Предостережение о недопустимости нарушения закона",
    short: "Предостережение",
    description: "Объявляется при наличии сведений о готовящихся противоправных деяниях (ст. 25.1 ФЗ «О прокуратуре РФ»).",
    emoji: "⚠️",
    suggested: ["prok-25.1"],
    articlesLabel: "Нормы, нарушение которых недопустимо",
    fields: [
      { key: "addressee", label: "Кому (должность, наименование, ФИО)", type: "textarea", rows: 3, ...caseFrom("subject") },
      { key: "facts", label: "Сведения о готовящихся противоправных деяниях", type: "textarea", rows: 8, ...caseFrom("description") },
      { key: "term", label: "Срок информирования прокуратуры о принятых мерах", type: "text", placeholder: "в установленный законом срок" },
    ],
    render: (c) => [
      { t: "right", text: c.ft("addressee", 3) },
      { t: "gap" },
      ...head(c, "ПРЕДОСТЕРЕЖЕНИЕ", "о недопустимости нарушения закона"),
      { t: "p", text: `В ${c.doc.organ || U(20)} поступили сведения о том, что ${c.ft("facts", 6)}` },
      { t: "p", text: `Указанные действия (бездействие) могут привести к нарушению требований: ${c.violated}.` },
      { t: "p", text: "На основании изложенного, руководствуясь ст. 25.1 ФЗ «О прокуратуре Российской Федерации»," },
      { t: "h", text: "ОБЪЯВЛЯЮ ПРЕДОСТЕРЕЖЕНИЕ" },
      { t: "p", text: "о недопустимости нарушения закона. Предлагаю принять меры по недопущению нарушения закона, устранению причин и условий, способствующих такому нарушению, и о принятых мерах проинформировать прокуратуру " + c.f("term", 25) + "." },
      { t: "p", text: "Предостережение может быть обжаловано вышестоящему прокурору либо в суд." },
      ...sign(c),
    ],
  },
  {
    id: "trebovanie",
    title: "Требование о предоставлении документов и сведений",
    short: "Требование",
    description: "Требование прокурора о предоставлении документов, материалов и информации при проверке (ст. 6, 22 ФЗ «О прокуратуре РФ»).",
    emoji: "📎",
    suggested: ["prok-6", "prok-22", "koap-17.7"],
    articlesLabel: "Правовое основание требования",
    fields: [
      { key: "addressee", label: "Кому (должность, наименование, ФИО)", type: "textarea", rows: 3, ...caseFrom("subject") },
      { key: "checkBasis", label: "Основание проведения проверки", type: "textarea", rows: 3, placeholder: "в связи с поступившим обращением гр. ... (вх. № ...)" },
      { key: "docsList", label: "Перечень запрашиваемых документов и сведений", type: "textarea", rows: 8, placeholder: "1. ...\n2. ..." },
      { key: "deadline", label: "Срок предоставления", type: "date" },
      { key: "delivery", label: "Куда и как представить", type: "text", placeholder: "в каб. №, на e-mail, нарочно" },
    ],
    render: (c) => [
      { t: "right", text: c.ft("addressee", 3) },
      { t: "gap" },
      ...head(c, "ТРЕБОВАНИЕ", "о предоставлении документов и сведений"),
      { t: "p", text: `В ${c.doc.organ || U(20)} проводится проверка ${c.ft("checkBasis", 2)}` },
      { t: "p", text: `В соответствии с ${c.violated}, требую в срок до ${fmtLong(c.d("deadline"))} представить (${c.f("delivery", 25)}) следующие документы и сведения:` },
      { t: "plain", text: c.ft("docsList", 6) },
      { t: "p", text: "Документы представить в виде заверенных надлежащим образом копий. В случае невозможности представления какого-либо документа указать причины." },
      { t: "p", text: "Невыполнение законных требований прокурора влечёт ответственность, предусмотренную ст. 17.7 КоАП РФ." },
      ...sign(c),
    ],
  },
  {
    id: "spravka",
    title: "Справка о результатах проверки",
    short: "Справка по проверке",
    description: "Итоговый документ проверки: что проверено, что установлено, какие приняты меры.",
    emoji: "🗂️",
    suggested: [],
    articlesLabel: "Нормы права, применённые при проверке",
    fields: [
      { key: "basis", label: "Основание проверки", type: "textarea", rows: 3, placeholder: "обращение, задание, план и т.д." },
      { key: "object", label: "Проверяемый объект (организация, орган)", type: "text", ...caseFrom("subject") },
      { key: "period", label: "Проверяемый период", type: "text" },
      { key: "found", label: "Установлено в ходе проверки", type: "textarea", rows: 8, ...caseFrom("description") },
      { key: "conclusion", label: "Выводы и принятые меры", type: "textarea", rows: 5 },
      { key: "attach", label: "Приложения", type: "textarea", rows: 2 },
    ],
    render: (c) => [
      ...head(c, "СПРАВКА", "о результатах проверки"),
      { t: "p", text: `Основание проверки: ${c.ft("basis", 2)}` },
      { t: "p", text: `Проверяемый объект: ${c.f("object", 40)}. Проверяемый период: ${c.f("period", 20)}.` },
      { t: "p", text: `В ходе проверки установлено: ${c.ft("found", 6)}` },
      { t: "p", text: `С учётом норм права: ${c.violated}.` },
      { t: "p", text: `Выводы и принятые меры: ${c.ft("conclusion", 4)}` },
      { t: "plain", text: `Приложения: ${c.ft("attach", 2)}` },
      ...sign(c),
    ],
  },
  {
    id: "priem",
    title: "Протокол личного приёма гражданина",
    short: "Протокол приёма",
    description: "Запись обращения гражданина на личном приёме и принятого по нему решения.",
    emoji: "🧾",
    suggested: ["fz59-13", "fz59-10"],
    articlesLabel: "Нормативные основания приёма",
    fields: [
      { key: "timeStart", label: "Время начала приёма", type: "time" },
      { key: "applicant", label: "ФИО заявителя", type: "text", ...caseFrom("applicant") },
      { key: "address", label: "Адрес, телефон, e-mail", type: "text", ...caseFrom("applicantAddress") },
      { key: "summary", label: "Содержание устного обращения", type: "textarea", rows: 8, ...caseFrom("description") },
      { key: "decision", label: "Принятое решение", type: "select", options: ["Обращение принято к рассмотрению, зарегистрировано", "Заявителю дано устное разъяснение", "Рекомендовано обратиться в иной орган (с разъяснением)", "Предложено изложить обращение письменно"] },
      { key: "explain", label: "Разъяснения, срок и порядок ответа", type: "textarea", rows: 4 },
    ],
    render: (c) => [
      ...head(c, "ПРОТОКОЛ", "личного приёма гражданина"),
      { t: "plain", text: `Время начала приёма: ${c.f("timeStart", 8)}` },
      { t: "plain", text: `Заявитель: ${c.f("applicant", 35)}` },
      { t: "plain", text: `Адрес, контакты: ${c.f("address", 45)}` },
      { t: "p", text: `Содержание обращения: ${c.ft("summary", 6)}` },
      { t: "p", text: `Принятое решение: ${c.f("decision", 45)}` },
      { t: "p", text: `Разъяснения: ${c.ft("explain", 3)}` },
      { t: "p", text: "Заявителю разъяснено, что письменный ответ по существу обращения будет дан в порядке и сроки, установленные законодательством (в течение 30 дней со дня регистрации)." },
      { t: "sig", a: "Заявитель:", b: U(18) },
      ...sign(c).map((b) => (b.t === "sig" ? { ...b, a: "Приём провёл:\n" + b.a } : b)),
    ],
  },
  {
    id: "otvet",
    title: "Ответ заявителю на обращение",
    short: "Ответ заявителю",
    description: "Мотивированный ответ на обращение с разъяснением порядка обжалования (ст. 10 ФЗ «О прокуратуре РФ», 59-ФЗ).",
    emoji: "✉️",
    suggested: ["prok-10", "fz59-12"],
    articlesLabel: "Нормативные основания ответа",
    fields: [
      { key: "applicant", label: "Заявитель (ФИО)", type: "text", ...caseFrom("applicant") },
      { key: "address", label: "Адрес заявителя", type: "text", ...caseFrom("applicantAddress") },
      { key: "ref", label: "На обращение от … № …", type: "text", placeholder: "от 01.03.2026 № 123" },
      { key: "result", label: "Результаты рассмотрения (по существу доводов)", type: "textarea", rows: 8 },
      { key: "measures", label: "Принятые меры", type: "textarea", rows: 4 },
    ],
    render: (c) => [
      { t: "right", text: `${c.f("applicant", 25)}\n${c.f("address", 35)}` },
      { t: "gap" },
      ...head(c, "ОТВЕТ", "на обращение"),
      { t: "plain", text: `На Ваше обращение ${c.f("ref", 25)} сообщаю следующее.` },
      { t: "p", text: c.ft("result", 6) },
      { t: "p", text: `Принятые меры: ${c.ft("measures", 3)}` },
      { t: "p", text: `Правовые основания: ${c.violated}.` },
      { t: "p", text: "В случае несогласия с принятым решением Вы вправе обжаловать его вышестоящему прокурору либо в суд (ст. 10 ФЗ «О прокуратуре Российской Федерации»). Решение прокурора не препятствует Вашему обращению за защитой прав в суд." },
      ...sign(c),
    ],
  },
];

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

/* ───────────── сборка документа ───────────── */

export function buildBlocks(
  doc: DocRec,
  tpl: Template,
  articles: Article[],
  blank: boolean
): Block[] {
  const val = (k: string): string => {
    if (blank) return "";
    if (k === "__date") return doc.date;
    if (k === "__number") return doc.number;
    return (doc.fields[k] || "").trim();
  };
  const c: Ctx = {
    doc,
    f: (k, len = 24) => val(k) || U(len),
    ft: (k, lines = 3) => {
      const v = val(k);
      if (v) return v;
      return Array.from({ length: lines }, () => U(70)).join("\n");
    },
    d: (k) => val(k),
    violated: articles.length
      ? articles.map(artLabel).join(", ")
      : "ст. ____ ________ РФ",
  };
  const blocks = tpl.render(c);

  if (doc.includeExtract && articles.length) {
    blocks.push({ t: "gap" });
    blocks.push({ t: "h", text: "Приложение. Выписка из норм права" });
    for (const a of articles) {
      blocks.push({ t: "plain", text: `${artLabel(a)}. ${a.title}` });
      blocks.push({
        t: "small",
        text: a.text?.trim()
          ? a.text.trim()
          : `${a.summary} (краткое содержание; полный актуальный текст — в системе КонсультантПлюс: ${CODES[a.code].url})`,
      });
    }
  }
  return blocks;
}
