import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { ArrowRight, Download, Copy, Upload, ShieldCheck, AlertTriangle, Play, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MandateEditor, fieldClass } from "@/components/mandate-editor";
import { AssessmentReview } from "@/components/assessment-review";
import { DemoSummary } from "@/components/demo-review";
import { VerdictPanel } from "@/components/verdict-panel";
import { analyse, SAMPLES } from "@/lib/reach";
import { compare, editMandate, emptyMandate, exampleMandate, isStale, toMarkdown, toJSON, type Assessment, type Mandate } from "@/lib/mandate";
import { DEMOS, DEMO_EXPORT_NOTICE, type Demo } from "@/lib/demos";
import { LangProvider, useT, PT_DEMOS, PT_SAMPLES, type Lang } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "ReachCheck — configuration and mandate review" },
    { name: "description", content: "Compare your agent's supplied configuration with owner-confirmed authority. Review evidence, possible mismatches and draft assessments locally." },
    { property: "og:title", content: "ReachCheck — configuration and mandate review" },
    { property: "og:description", content: "Evidence-led review of configured actions, confirmed mandates and missing verification." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: () => <LangProvider><Index/></LangProvider>,
});
function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
type Screen = "import" | "mandate" | "review" | "export";
type Flag = "red" | "yellow" | "green";
const FLAG_KEY = { red: "flagRed", yellow: "flagYellow", green: "flagGreen" } as const;
const FLAG: Record<Flag, { label: string; card: string; dot: string; badge: string }> = {
  red: { label: "Red flag", card: "border-risk-high bg-risk-high-bg", dot: "bg-risk-high", badge: "bg-risk-high text-primary-foreground" },
  yellow: { label: "Yellow flag", card: "border-risk-medium bg-risk-medium-bg", dot: "bg-risk-medium", badge: "bg-risk-medium text-primary-foreground" },
  green: { label: "Green flag", card: "border-risk-low bg-risk-low-bg", dot: "bg-risk-low", badge: "bg-risk-low text-primary-foreground" },
};
const DEMO_FLAGS: Record<string, Flag> = { "email-assistant": "red", "mcp-assistant": "yellow", "n8n-workflow": "yellow" };
const SAMPLE_FLAGS: Flag[] = ["yellow", "green", "red", "red"];
const DEFAULT_SAMPLE = 3;
function FlagBadge({ flag }: { flag: Flag }) {
  const { t } = useT();
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${FLAG[flag].badge} ${flag === "red" ? "animate-flag-pulse" : ""}`}><span className="size-2 rounded-full bg-primary-foreground"/>{t[FLAG_KEY[flag]]}</span>;
}
function FlagLegend() {
  const { t } = useT();
  const items: [Flag, string][] = [["red", t.legendRed], ["yellow", t.legendYellow], ["green", t.legendGreen]];
  return <ul className="grid gap-2 rounded-lg border p-3 text-sm sm:grid-cols-3">{items.map(([f, desc], i) => <li key={f} style={{ animationDelay: `${i * 100}ms` }} className="animate-fade-up flex items-start gap-2"><span className={`mt-1 size-3 shrink-0 rounded-full ${FLAG[f].dot}`}/><span><b>{t[FLAG_KEY[f]]}</b> — {desc}</span></li>)}</ul>;
}
function Index() {
  const { t, lang, setLang } = useT();
  const [input, setInput] = useState(SAMPLES[DEFAULT_SAMPLE]?.value ?? ""); const [inputVersion, setInputVersion] = useState(1);
  const [sampleIdx, setSampleIdx] = useState<number | null>(DEFAULT_SAMPLE); const [path, setPath] = useState<"demo" | "own">("demo");
  const [mandate, setMandate] = useState<Mandate>(emptyMandate);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [screen, setScreen] = useState<Screen>("import"); const [error, setError] = useState("");
  const [copied, setCopied] = useState(false); const [importing, setImporting] = useState(false);
  const [demoId, setDemoId] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const demo = DEMOS.find(d => d.id === demoId) ?? null;
  const stale = !!assessment && isStale(assessment, inputVersion, mandate);
  const md = useMemo(() => assessment ? toMarkdown(assessment) : "", [assessment]);
  const mdOut = demo ? `> ${DEMO_EXPORT_NOTICE}\n\n${md}` : md;
  const jsonOut = () => assessment ? (demo ? JSON.stringify({ demoSampleData: true, notice: DEMO_EXPORT_NOTICE, assessment: JSON.parse(toJSON(assessment)) }, null, 2) : toJSON(assessment)) : "";
  function changeInput(value: string) { setInput(value); setInputVersion(v => v + 1); setDemoId(null); setError(""); }
  function changeMandate(patch: Partial<Mandate>) { setMandate(m => editMandate(m, patch)); setError(""); }
  function go(s: Screen) { setScreen(s); setError(""); window.scrollTo(0, 0); }
  function startDemo(d: Demo) {
    const v = inputVersion + 1;
    setInput(d.config); setInputVersion(v); setMandate(d.mandate); setDemoId(d.id); setError("");
    try { setAssessment(compare(analyse(d.config, v), d.mandate)); go("review"); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to inspect configuration."); }
  }
  function ownConfig() { setDemoId(null); setInput(""); setSampleIdx(null); setPath("own"); setMandate(emptyMandate()); setAssessment(null); go("import"); }
  function importConfig() { setDemoId(null); try { analyse(input, inputVersion); go("mandate"); } catch (e) { setError(e instanceof Error ? e.message : "Unable to inspect configuration."); } }
  function review() { try { setAssessment(compare(analyse(input, inputVersion), mandate)); go("review"); } catch (e) { setError(e instanceof Error ? e.message : "Unable to inspect configuration."); } }
  return <div className="min-h-screen bg-background font-sans text-foreground">
    <header className="border-b"><div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4"><Button variant="ghost" className="px-0 text-lg font-extrabold" onClick={() => go("import")}>Reach<span className="-ml-2 text-primary">Check</span></Button><span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">{demo && <span className="rounded bg-primary px-2 py-1 font-semibold text-primary-foreground">{t.demoBadge}</span>}<ShieldCheck className="size-4"/><span className="hidden sm:inline">{t.browserLocal}</span><span role="group" aria-label="Language / Idioma" className="ml-1 inline-flex overflow-hidden rounded-md border">{(["en", "pt"] as Lang[]).map(l => <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} className={`px-2 py-1 font-bold uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${lang === l ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>{l}</button>)}</span></span></div></header>
    <main className="mx-auto max-w-3xl px-5 py-8">
      <nav aria-label="Review steps" className="mb-8 grid grid-cols-4 border-b">{(["import", "mandate", "review", "export"] as const).map((s,i) => <Button key={s} variant="ghost" className={`h-auto min-w-0 rounded-none px-1 py-3 text-xs capitalize sm:text-sm ${screen === s ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`} disabled={(s === "review" || s === "export") && !assessment} onClick={() => go(s)}>{i + 1}. {t.steps[s]}</Button>)}</nav>
      {stale && <div role="alert" className="mb-6 flex items-start gap-3 rounded-md bg-risk-medium-bg p-4 text-risk-medium"><AlertTriangle className="mt-1 size-5 shrink-0"/><div><p className="font-bold">{t.staleTitle}</p><p className="text-sm">{t.staleBody}</p><Button className="mt-3" variant="outline" onClick={() => go("mandate")}>{t.staleBtn}</Button></div></div>}
      {error && <p role="alert" className="mb-5 break-words rounded-md border border-destructive p-3 text-destructive">{error}</p>}
      {screen === "import" && <section className="space-y-6">
        <div><h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">{t.heroA}<span className="text-primary">{t.heroB}</span></h1><p className="mt-3 text-lg text-muted-foreground">{t.heroSub}</p></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" aria-pressed={path === "demo"} onClick={() => { setPath("demo"); document.getElementById("demos")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} className={`rounded-lg border-2 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${path === "demo" ? "border-primary bg-accent" : "border-border"}`}><h2 className="flex items-center gap-2 font-bold"><Play className="size-4 text-primary"/>{t.tryDemo}</h2><p className="mt-1 text-sm text-muted-foreground">{t.tryDemoSub}</p></button>
          <button type="button" aria-pressed={path === "own"} onClick={() => { setPath("own"); const t = document.getElementById("config-input") as HTMLTextAreaElement | null; t?.scrollIntoView({ behavior: "smooth", block: "center" }); t?.focus({ preventScroll: true }); }} className={`rounded-lg border-2 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${path === "own" ? "border-primary bg-accent" : "border-border"}`}><h2 className="flex items-center gap-2 font-bold"><FileJson className="size-4 text-primary"/>{t.checkMine}</h2><p className="mt-1 text-sm text-muted-foreground">{t.checkMineSub}</p></button>
        </div>
        <FlagLegend/>
        <div id="demos" className={`scroll-mt-6 rounded-lg transition-all ${path === "demo" ? "ring-2 ring-primary/40 ring-offset-4 ring-offset-background" : ""}`}><h2 className="mb-2 font-semibold">{t.pickDemo}</h2><div className="grid gap-3 sm:grid-cols-3">{DEMOS.map((d, i) => { const f = DEMO_FLAGS[d.id] ?? "yellow"; return <button key={d.id} type="button" onClick={() => startDemo(d)} style={{ animationDelay: `${i * 80}ms` }} className={`animate-fade-up group rounded-lg border-2 p-4 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${FLAG[f].card}`}><FlagBadge flag={f}/><p className="mt-3 text-xs font-bold uppercase tracking-wide text-primary">{lang === "pt" ? PT_DEMOS[d.id]?.title ?? d.title : d.title}</p><p className="mt-2 text-sm">{lang === "pt" ? PT_DEMOS[d.id]?.tagline ?? d.tagline : d.tagline}</p><p className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary opacity-70 transition-opacity group-hover:opacity-100">{t.openReview}<ArrowRight className="size-3 transition-transform group-hover:translate-x-1"/></p></button>; })}</div><p className="mt-2 text-xs text-muted-foreground">{t.demoNote}</p></div>
        <div><div className="mb-2 flex items-center justify-between gap-2"><p className="font-semibold">{t.orExample}</p>{input && <Button variant="ghost" size="sm" onClick={() => { changeInput(""); setSampleIdx(null); }}>{t.clear}</Button>}</div><div className="grid gap-2 sm:grid-cols-2">{SAMPLES.map((s, i) => { const f = SAMPLE_FLAGS[i] ?? "yellow"; const active = sampleIdx === i; return <button key={s.label} type="button" aria-pressed={active} onClick={() => { changeInput(s.value); setSampleIdx(i); setPath("own"); }} className={`flex items-center gap-3 rounded-md border-2 p-3 text-left text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? FLAG[f].card + " shadow-md" : "border-border"}`}><span className={`size-3 shrink-0 rounded-full ${FLAG[f].dot} ${f === "red" ? "animate-flag-pulse" : ""}`}/><span>{lang === "pt" ? PT_SAMPLES[i] ?? s.label : s.label}</span></button>; })}</div></div>
        <label className="block font-semibold">{t.pasteLabel}<textarea id="config-input" key={sampleIdx ?? "custom"} className={`${fieldClass} animate-fade-up mt-2 p-4 font-mono text-sm`} rows={10} spellCheck={false} placeholder='{ "mcpServers": { ... } }' value={input} onChange={e => { changeInput(e.target.value); setSampleIdx(null); }}/></label>
        <div className="flex flex-wrap gap-3"><Button className="h-auto py-3" disabled={!input.trim() || importing} onClick={importConfig}>{t.importBtn}<ArrowRight/></Button><Button variant="outline" className="h-auto py-3" disabled={importing} onClick={() => file.current?.click()}><Upload/>{importing ? t.reading : t.importFile}</Button><input type="file" ref={file} className="hidden" accept=".json,application/json" aria-label="Import JSON file" onChange={async e => { const uploaded = e.target.files?.[0]; if (!uploaded) return; setImporting(true); try { changeInput(await uploaded.text()); setSampleIdx(null); } catch { setError(t.fileError); } finally { setImporting(false); e.target.value = ""; } }}/></div>
        <p className="text-sm text-muted-foreground">{t.supported}</p>
        <p className="flex items-start gap-2 text-sm text-muted-foreground"><ShieldCheck className="size-4 shrink-0"/>{t.privacy}</p>
      </section>}
      {screen === "mandate" && <><MandateEditor mandate={mandate} change={changeMandate} confirm={() => setMandate(m => ({ ...m, confirmed: true }))} example={() => setMandate(m => exampleMandate(m.version + 1))}/><div className="mt-6 flex flex-wrap gap-3"><Button onClick={review}>{mandate.confirmed ? t.analyse : t.reviewNoMandate}<ArrowRight/></Button><Button variant="ghost" onClick={() => go("import")}>{t.backConfig}</Button></div></>}
      {screen === "review" && assessment && <><div className="mb-8"><VerdictPanel assessment={assessment}/></div>{demo && <div className="mb-8 space-y-4"><DemoSummary demo={demo} assessment={assessment}/><div className="flex flex-wrap gap-3"><Button variant="outline" onClick={() => go("import")}>{t.viewSample}</Button><Button variant="outline" onClick={() => go("mandate")}>{t.editSample}</Button><Button variant="outline" onClick={() => { setDemoId(null); setAssessment(null); go("import"); }}>{t.anotherDemo}</Button><Button variant="ghost" onClick={ownConfig}>{t.checkMine}</Button></div></div>}<AssessmentReview assessment={assessment}/><div className="mt-8 border-t pt-5"><Button disabled={stale} onClick={() => go("export")}>{t.exportDraft}<ArrowRight/></Button>{stale && <Button variant="outline" className="ml-2" onClick={review}>{t.reanalyse}</Button>}</div></>}
      {screen === "export" && assessment && <section className="space-y-5"><p className="text-sm font-semibold text-primary">{t.exportStep}</p><h1 className="text-3xl font-extrabold">{t.draftTitle}</h1>{demo && <p role="note" className="rounded-md bg-risk-medium-bg p-3 text-sm font-semibold text-risk-medium">{DEMO_EXPORT_NOTICE}</p>}<p className="text-muted-foreground">{assessment.draftLabel}</p>{lang !== "en" && <p className="text-sm text-muted-foreground">{t.exportLangNote}</p>}<p className="text-sm">Input v{assessment.versions.input} · Analysis v{assessment.versions.analysis} · Mandate v{assessment.versions.mandate}</p><div className="flex flex-wrap gap-3"><Button disabled={stale} onClick={() => download(demo ? "ReachCheck-demo-draft.md" : "ReachCheck-draft.md", mdOut, "text/markdown")}><Download/>{t.dlMd}</Button><Button variant="outline" disabled={stale} onClick={() => download(demo ? "ReachCheck-demo-draft.json" : "ReachCheck-draft.json", jsonOut(), "application/json")}><Download/>{t.dlJson}</Button><Button variant="outline" disabled={stale} onClick={async () => { try { await navigator.clipboard.writeText(mdOut); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { setError(t.copyError); } }}><Copy/>{copied ? t.copied : t.copyMd}</Button></div><pre className="max-h-[640px] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-muted p-4 font-mono text-sm">{mdOut}</pre></section>}
    </main><footer className="mt-8 border-t"><p className="mx-auto max-w-3xl px-5 py-6 text-sm text-muted-foreground">{t.footer}</p></footer>
  </div>;
}
