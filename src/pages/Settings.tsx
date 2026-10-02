import { useRef, useState } from "react";
import { useStore } from "../store";
import { Button, Card, Label, PageHeader } from "../components/ui";
import { download, todayISO } from "../utils/format";
import type { AppData, Settings as S } from "../types";

export function SettingsPage() {
  const { data, saveSettings, replaceAll, resetAll } = useStore();
  const [s, setS] = useState<S>(data.settings);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof S, v: string) => setS((p) => ({ ...p, [k]: v }));

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(""), 3500);
  };

  const onImport = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as AppData;
      if (!parsed || typeof parsed !== "object" || !("cases" in parsed || "docs" in parsed)) {
        throw new Error("bad");
      }
      if (confirm("Заменить текущие данные данными из файла?")) {
        replaceAll(parsed);
        flash("Данные успешно загружены из файла");
      }
    } catch {
      alert("Не удалось прочитать файл. Выберите файл резервной копии, сохранённый на этом сайте.");
    }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title="Настройки и данные" subtitle="Реквизиты для шапки и подписи документов, резервное копирование." />

      <Card className="mb-6 p-5">
        <h2 className="mb-1 font-bold">Реквизиты по умолчанию</h2>
        <p className="mb-4 text-sm text-slate-500">Подставляются в новые документы (в каждом документе их можно изменить).</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Наименование органа прокуратуры</Label>
            <input className="field-input" value={s.organ} onChange={(e) => set("organ", e.target.value)} />
          </div>
          <div>
            <Label>Место составления</Label>
            <input className="field-input" value={s.city} onChange={(e) => set("city", e.target.value)} />
          </div>
          <div>
            <Label>Должность</Label>
            <input className="field-input" value={s.signerPosition} onChange={(e) => set("signerPosition", e.target.value)} />
          </div>
          <div>
            <Label>Классный чин / звание</Label>
            <input className="field-input" value={s.signerRank} onChange={(e) => set("signerRank", e.target.value)} />
          </div>
          <div>
            <Label>ФИО (например, И.И. Иванов)</Label>
            <input className="field-input" value={s.signerName} onChange={(e) => set("signerName", e.target.value)} />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => {
              saveSettings(s);
              flash("Настройки сохранены");
            }}
          >
            Сохранить
          </Button>
          {msg && <span className="text-sm font-medium text-emerald-700">{msg}</span>}
        </div>
      </Card>

      <Card className="mb-6 p-5">
        <h2 className="mb-1 font-bold">Резервная копия данных</h2>
        <p className="mb-4 text-sm text-slate-500">
          Все данные хранятся только в этом браузере (localStorage) и никуда не отправляются. Чтобы перенести их на другой компьютер или
          не потерять при очистке браузера, сохраните файл резервной копии.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            onClick={() => download(`prokuratura-backup-${todayISO()}.json`, JSON.stringify(data, null, 2))}
          >
            ⬇️ Скачать резервную копию
          </Button>
          <Button onClick={() => fileRef.current?.click()}>⬆️ Загрузить из файла</Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImport(f);
              e.target.value = "";
            }}
          />
        </div>
        <div className="mt-4 text-sm text-slate-600">
          Сейчас: материалов — <b>{data.cases.length}</b>, документов — <b>{data.docs.length}</b>, своих статей —{" "}
          <b>{data.customArticles.length}</b>.
        </div>
      </Card>

      <Card className="border-red-200 p-5">
        <h2 className="mb-1 font-bold text-red-700">Очистка данных</h2>
        <p className="mb-3 text-sm text-slate-500">Удалит все материалы, документы, подборку и свои статьи из этого браузера.</p>
        <Button
          variant="danger"
          onClick={() => confirm("Точно удалить ВСЕ данные? Действие необратимо.") && resetAll()}
        >
          Удалить все данные
        </Button>
      </Card>

      <p className="mt-6 text-xs leading-relaxed text-slate-500">
        Это независимый учебно-вспомогательный инструмент, а не официальный сайт органов прокуратуры. Шаблоны документов носят
        справочный характер: перед использованием сверяйте их с действующими нормативными актами и ведомственными приказами. Краткие
        пояснения к статьям составлены для ориентира — актуальный текст см. в КонсультантПлюс. Не публикуйте персональные данные в
        открытом репозитории: данные из этой программы хранятся только в вашем браузере.
      </p>
    </div>
  );
}
