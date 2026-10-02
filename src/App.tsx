import { StoreProvider } from "./store";
import { Layout } from "./components/Layout";
import { useRoute } from "./router";
import { Dashboard } from "./pages/Dashboard";
import { Cases } from "./pages/Cases";
import { DocsList, TemplateChooser } from "./pages/Docs";
import { DocEditor } from "./pages/DocEditor";
import { Law } from "./pages/Law";
import { SettingsPage } from "./pages/Settings";

function Router() {
  const route = useRoute();
  const [root, sub] = route.segments;

  let page;
  if (!root) page = <Dashboard />;
  else if (root === "cases") page = <Cases />;
  else if (root === "docs") {
    if (!sub) page = <DocsList />;
    else if (sub === "new") {
      const tpl = route.params.get("tpl") || undefined;
      const caseId = route.params.get("case") || undefined;
      page = tpl ? (
        <DocEditor key={`new-${tpl}-${caseId}`} id="new" tplId={tpl} caseId={caseId} />
      ) : (
        <TemplateChooser caseId={caseId} />
      );
    } else page = <DocEditor key={sub} id={sub} />;
  } else if (root === "law") page = <Law />;
  else if (root === "settings") page = <SettingsPage />;
  else page = <Dashboard />;

  return <Layout path={route.path}>{page}</Layout>;
}

export default function App() {
  return (
    <StoreProvider>
      <Router />
    </StoreProvider>
  );
}
