import { useEffect, useMemo, useState } from "react";
import { Pause, Play, RotateCcw, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { analyse } from "@/lib/reach";
import { compare } from "@/lib/mandate";
import { DEMOS, type Demo } from "@/lib/demos";
import { useT, PT_DEMOS } from "@/lib/i18n";
import { VerdictPanel } from "@/components/verdict-panel";

const S = {
  en: { title: "Watch a demo run", steps: ["1. Reading the configuration", "2. Loading the owner's rules", "3. Comparing actions with rules", "4. Verdict"], pause: "Pause", play: "Play", replay: "Replay", open: "Open full review", close: "Close", sample: "Fictional sample — runs entirely in your browser." },
  pt: { title: "Veja uma demonstração", steps: ["1. A ler a configuração", "2. A carregar as regras do responsável", "3. A comparar ações com regras", "4. Veredicto"], pause: "Pausa", play: "Reproduzir", replay: "Repetir", open: "Abrir análise completa", close: "Fechar", sample: "Exemplo fictício — corre apenas no seu navegador." },
};
const STEP_MS = [3200, 3000, 2200];

export function AutoDemo({ onOpen, onClose }: { onOpen: (d: Demo) => void; onClose: () => void }) {
  const { lang } = useT(); const s = S[lang];
  const [id, setId] = useState(DEMOS[2]?.id ?? DEMOS[0]!.id);
  const demo = DEMOS.find(d => d.id === id)!;
  const [step, setStep] = useState(0); const [tick, setTick] = useState(0); const [playing, setPlaying] = useState(true);
  const assessment = useMemo(() => compare(analyse(demo.config, 1), demo.mandate), [demo]);
  const lines = demo.config.split("\n");
  useEffect(() => { setStep(0); setTick(0); setPlaying(true); }, [id]);
  useEffect(() => {
    if (!playing || step >= 3) return;
    const iv = setInterval(() => setTick(t => t + 1), 100);
    return () => clearInterval(iv);
  }, [playing, step]);
  useEffect(() => { if (step < 3 && tick * 100 >= STEP_MS[step]!) { setStep(x => x + 1); setTick(0); } }, [tick, step]);
  const frac = step < 3 ? Math.min(1, (tick * 100) / STEP_MS[step]!) : 1;
  const shownLines = step === 0 ? Math.ceil(lines.length * frac) : lines.length;
  const shownRules = step === 1 ? Math.ceil(demo.mandate.rules.length * frac) : step > 1 ? demo.mandate.rules.length : 0;
  const title = (d: Demo) => lang === "pt" ? PT_DEMOS[d.id]?.title ?? d.title : d.title;

  return <section aria-label={s.title} className="animate-fade-up space-y-4 rounded-xl border-2 border-primary bg-card p-5 shadow-lg">
    <div className="flex items-center justify-between gap-2"><h2 className="text-xl font-extrabold">{s.title}</h2><Button variant="ghost" size="icon" aria-label={s.close} onClick={onClose}><X/></Button></div>
    <div role="tablist" className="flex flex-wrap gap-2">{DEMOS.map(d => <button key={d.id} role="tab" aria-selected={d.id === id} onClick={() => setId(d.id)} className={`rounded-full border px-3 py-1 text-xs font-bold transition-all active:scale-95 ${d.id === id ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"}`}>{title(d)}</button>)}</div>
    <ol className="grid grid-cols-4 gap-1">{s.steps.map((label, i) => <li key={i} className="min-w-0"><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-[width] duration-100" style={{ width: `${i < step ? 100 : i === step ? frac * 100 : 0}%` }}/></div><p className={`mt-1 truncate text-[11px] font-semibold ${i === step ? "text-primary" : "text-muted-foreground"}`}>{label}</p></li>)}</ol>
    <div className="min-h-64">
      {step === 0 && <pre key="cfg" className="animate-fade-up max-h-72 overflow-hidden whitespace-pre-wrap break-all rounded-lg bg-muted p-3 font-mono text-xs">{lines.slice(0, shownLines).join("\n")}<span className="animate-pulse">▍</span></pre>}
      {step === 1 && <ul key="rules" className="space-y-2">{demo.mandate.rules.slice(0, shownRules).map(r => <li key={r.id} className="animate-fade-up rounded-lg border p-3 text-sm"><b>{r.type}</b> <span className="font-mono">{r.action} / {r.resource}</span>{r.conditions && <span className="text-muted-foreground"> — {r.conditions}</span>}</li>)}</ul>}
      {step === 2 && <div key="scan" className="animate-fade-up space-y-2">{assessment.actions.length ? assessment.actions.map((c, i) => <div key={i} className="flex items-center gap-3 rounded-lg border p-3 font-mono text-sm"><span className="size-3 animate-pulse rounded-full bg-primary"/>{c.action} / {c.resource}</div>) : assessment.tools.map((tl, i) => <div key={i} className="flex items-center gap-3 rounded-lg border p-3 font-mono text-sm"><span className="size-3 animate-pulse rounded-full bg-risk-medium"/>{tl.name}</div>)}</div>}
      {step === 3 && <div key="v" className="animate-fade-up"><VerdictPanel assessment={assessment}/></div>}
    </div>
    <div className="flex flex-wrap items-center gap-2">
      {step < 3 ? <Button variant="outline" onClick={() => setPlaying(p => !p)}>{playing ? <><Pause/>{s.pause}</> : <><Play/>{s.play}</>}</Button>
        : <Button variant="outline" onClick={() => { setStep(0); setTick(0); setPlaying(true); }}><RotateCcw/>{s.replay}</Button>}
      <Button onClick={() => onOpen(demo)}>{s.open}<ArrowRight/></Button>
      <p className="text-xs text-muted-foreground">{s.sample}</p>
    </div>
  </section>;
}
