import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { ArrowRight, Download, Copy, Upload, ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MandateEditor, fieldClass } from "@/components/mandate-editor";
import { AssessmentReview } from "@/components/assessment-review";
import { analyse, SAMPLES } from "@/lib/reach";
import { compare, editMandate, emptyMandate, exampleMandate, isStale, toMarkdown, toJSON, type Assessment, type Mandate } from "@/lib/mandate";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "ReachCheck — configuration and mandate review" },
    { name: "description", content: "Compare your agent's supplied configuration with owner-confirmed authority. Review evidence, possible mismatches and draft assessments locally." },
    { property: "og:title", content: "ReachCheck — configuration and mandate review" },
    { property: "og:description", content: "Evidence-led review of configured actions, confirmed mandates and missing verification." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: Index,
});
function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
type Screen = "import" | "mandate" | "review" | "export";
function Index() {
  const [input, setInput] = useState(""); const [inputVersion, setInputVersion] = useState(1);
  const [mandate, setMandate] = useState<Mandate>(emptyMandate);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [screen, setScreen] = useState<Screen>("import"); const [error, setError] = useState("");
  const [copied, setCopied] = useState(false); const [importing, setImporting] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const stale = !!assessment && isStale(assessment, inputVersion, mandate);
  const md = useMemo(() => assessment ? toMarkdown(assessment) : "", [assessment]);
  function changeInput(value: string) { setInput(value); setInputVersion(v => v + 1); setError(""); }
  function changeMandate(patch: Partial<Mandate>) { setMandate(m => editMandate(m, patch)); setError(""); }
  function go(s: Screen) { setScreen(s); setError(""); window.scrollTo(0, 0); }
  function importConfig() { try { analyse(input, inputVersion); go("mandate"); } catch (e) { setError(e instanceof Error ? e.message : "Unable to inspect configuration."); } }
  function review() { try { setAssessment(compare(analyse(input, inputVersion), mandate)); go("review"); } catch (e) { setError(e instanceof Error ? e.message : "Unable to inspect configuration."); } }
  return <div className="min-h-screen bg-background font-sans text-foreground">
    <header className="border-b"><div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4"><Button variant="ghost" className="px-0 text-lg font-extrabold" onClick={() => go("import")}>Reach<span className="-ml-2 text-primary">Check</span></Button><span className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><ShieldCheck className="size-4"/>Browser-local review</span></div></header>
    <main className="mx-auto max-w-3xl px-5 py-8">
      <nav aria-label="Review steps" className="mb-8 grid grid-cols-4 border-b">{(["import", "mandate", "review", "export"] as const).map((s,i) => <Button key={s} variant="ghost" className={`h-auto min-w-0 rounded-none px-1 py-3 text-xs capitalize sm:text-sm ${screen === s ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`} disabled={(s === "review" || s === "export") && !assessment} onClick={() => go(s)}>{i + 1}. {s}</Button>)}</nav>
      {stale && <div role="alert" className="mb-6 flex items-start gap-3 rounded-md bg-risk-medium-bg p-4 text-risk-medium"><AlertTriangle className="mt-1 size-5 shrink-0"/><div><p className="font-bold">Previous result is stale</p><p className="text-sm">Configuration or mandate changed. Confirm any changed mandate and reanalyse before export.</p><Button className="mt-3" variant="outline" onClick={() => go("mandate")}>Review changed mandate</Button></div></div>}
      {error && <p role="alert" className="mb-5 break-words rounded-md border border-destructive p-3 text-destructive">{error}</p>}
      {screen === "import" && <section className="space-y-6">
        <div><h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">Compare your agent’s configuration with what you <span className="text-primary">authorised.</span></h1><p className="mt-3 text-lg text-muted-foreground">Review configured actions, possible mandate mismatches and the evidence still needed.</p></div>
        <label className="block font-semibold">Paste configuration or tool inventory (JSON)<textarea className={`${fieldClass} mt-2 p-4 font-mono text-sm`} rows={10} spellCheck={false} placeholder='{ "mcpServers": { ... } }' value={input} onChange={e => changeInput(e.target.value)}/></label>
        <div className="flex flex-wrap gap-3"><Button className="h-auto py-3" disabled={!input.trim() || importing} onClick={importConfig}>Import configuration<ArrowRight/></Button><Button variant="outline" className="h-auto py-3" disabled={importing} onClick={() => file.current?.click()}><Upload/>{importing ? "Reading file…" : "Import JSON file"}</Button><input type="file" ref={file} className="hidden" accept=".json,application/json" aria-label="Import JSON file" onChange={async e => { const uploaded = e.target.files?.[0]; if (!uploaded) return; setImporting(true); try { changeInput(await uploaded.text()); } catch { setError("The file could not be read. Try pasting the JSON instead."); } finally { setImporting(false); e.target.value = ""; } }}/></div>
        <label className="block text-sm font-semibold">Try an example<select className={`${fieldClass} mt-2`} value="" onChange={e => { const sample = SAMPLES[Number(e.target.value)]; if (sample) changeInput(sample.value); }}><option value="" disabled>Select a configuration snapshot</option>{SAMPLES.map((s,i) => <option key={s.label} value={i}>{s.label}</option>)}</select></label>
        <p className="text-sm text-muted-foreground">Supported: MCP mcpServers/servers, tool arrays or tools objects, and limited n8n Gmail v2 message operations. Other formats and operations remain unknown.</p>
        <p className="flex items-start gap-2 text-sm text-muted-foreground"><ShieldCheck className="size-4 shrink-0"/>Your configuration stays in this browser session. It is not stored, executed or sent to an AI service.</p>
      </section>}
      {screen === "mandate" && <><MandateEditor mandate={mandate} change={changeMandate} confirm={() => setMandate(m => ({ ...m, confirmed: true }))} example={() => setMandate(m => exampleMandate(m.version + 1))}/><div className="mt-6 flex flex-wrap gap-3"><Button onClick={review}>{mandate.confirmed ? "Analyse configuration and mandate" : "Review without mandate comparison"}<ArrowRight/></Button><Button variant="ghost" onClick={() => go("import")}>Back to configuration</Button></div></>}
      {screen === "review" && assessment && <><AssessmentReview assessment={assessment}/><div className="mt-8 border-t pt-5"><Button disabled={stale} onClick={() => go("export")}>Export draft assessment<ArrowRight/></Button>{stale && <Button variant="outline" className="ml-2" onClick={review}>Reanalyse</Button>}</div></>}
      {screen === "export" && assessment && <section className="space-y-5"><p className="text-sm font-semibold text-primary">04 / Draft export</p><h1 className="text-3xl font-extrabold">Draft assessment</h1><p className="text-muted-foreground">{assessment.draftLabel}</p><p className="text-sm">Input v{assessment.versions.input} · Analysis v{assessment.versions.analysis} · Mandate v{assessment.versions.mandate}</p><div className="flex flex-wrap gap-3"><Button disabled={stale} onClick={() => download("ReachCheck-draft.md", md, "text/markdown")}><Download/>Download Markdown</Button><Button variant="outline" disabled={stale} onClick={() => download("ReachCheck-draft.json", toJSON(assessment), "application/json")}><Download/>Download JSON</Button><Button variant="outline" disabled={stale} onClick={async () => { try { await navigator.clipboard.writeText(md); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { setError("Copy is unavailable here. Download the Markdown instead."); } }}><Copy/>{copied ? "Copied!" : "Copy Markdown"}</Button></div><pre className="max-h-[640px] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-muted p-4 font-mono text-sm">{md}</pre></section>}
    </main><footer className="mt-8 border-t"><p className="mx-auto max-w-3xl px-5 py-6 text-sm text-muted-foreground">Not runtime verification or security certification. Built at Vibathon Algarve 2026.</p></footer>
  </div>;
}
