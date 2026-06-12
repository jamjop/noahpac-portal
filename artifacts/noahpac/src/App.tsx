import { Switch, Route, Router as WouterRouter } from "wouter";
import Home from "@/pages/Home";
import ToolPage from "@/pages/ToolPage";
import NotFound from "@/pages/not-found";

const tools = [
  { path: "/screener",    src: "/screener/index.html",   title: "USPSTF Screener" },
  { path: "/vaccines",    src: "/vaccines/index.html",   title: "Immunization Schedule" },
  { path: "/calculators", src: "/calculators/index.html",title: "Medical Calculators" },
  { path: "/opioids",     src: "/opioids/index.html",    title: "Opioid Conversion" },
  { path: "/sti",         src: "/sti/index.html",        title: "STI Treatment" },
  { path: "/abx",         src: "/abx/index.html",        title: "Antibiotic Reference" },
  { path: "/labs",        src: "/labs/index.html",       title: "Lab Reference" },
  { path: "/tccc",        src: "/tccc/index.html",       title: "TCCC / MARCH PAWS" },
  { path: "/lookup",      src: "/lookup/index.html",     title: "Code & Drug Lookup" },
  { path: "/drugref",     src: "/drugref/index.html",    title: "Drug Reference" },
  { path: "/peds",        src: "/peds/index.html",       title: "Pediatric Dosing" },
];

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      {tools.map(({ path, src, title }) => (
        <Route key={path} path={path}>
          {() => <ToolPage src={src} title={title} />}
        </Route>
      ))}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Router />
    </WouterRouter>
  );
}

export default App;
