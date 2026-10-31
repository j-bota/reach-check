import { useEffect, useMemo, useState } from "react";
import { Pause, Play, RotateCcw, ArrowRight, X, Bot, FileJson, ScrollText, Flag as FlagIcon, CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { analyse } from "@/lib/reach";
import { compare } from "@/lib/mandate";
import { DEMOS, type Demo } from "@/lib/demos";
import { actionMatrix, verdict, type Flag, type RowStatus } from "@/lib/verdict";
import { useT, PT_DEMOS } from "@/lib/i18n";
import { VerdictPanel } from "@/components/verdict-panel";

const S = {
  en: {
    title: "Watch the agent's journey", pause: "Pause", play: "Play", replay: "Replay", open: "Open full review", close: "Close",
    sample: "Fictional sample — runs entirely in your browser.",
    intro: "Meet the agent. Let's see what it has been set up to do.",
    config: "Step 1 — The agent's setup is read, line by line.",
    rules: "Step 2 — These are the owner's rules. What is the agent allowed to do?",
    gate: (n: number, total: number) => `Step 3 — Checkpoint ${n} of ${total}: does this action fit the rules?`,
    verdict: "Step 4 — Final verdict.",
    green: "Fits the rules", yellow: "Needs review", red: "Possible conflict", grey: "Not compared",
    toolUnknown: "Declared tool — what it really does is unknown",
    finish: "Finish",
  },
  pt: {
    title: "Veja o percurso do agente", pause: "Pausa", play: "Reproduzir", replay: "Repetir", open: "Abrir análise completa", close: "Fechar",
    sample: "Exemplo fictício — corre apenas no seu navegador.",
    intro: "Conheça o agente. Vamos ver o que foi configurado para fazer.",
    config: "Passo 1 — A configuração do agente é lida, linha a linha.",
    rules: "Passo 2 — Estas são as regras do responsável. O que pode o agente fazer?",
    gate: (n: number, total: number) => `Passo 3 — Ponto de controlo ${n} de ${total}: esta ação cumpre as regras?`,
    verdict: "Passo 4 — Veredicto final.",
    green: "Cumpre as regras", yellow: "Requer revisão", red: "Possível conflito", grey: "Não comparado",
    toolUnknown: "Ferramenta declarada — o que faz realmente é desconhecido",
    finish: "Fim",
  },
};
type Light = "green" | "yellow" | "red" | "grey";
const LIGHT: Record<Light, { bg: string; text: string; ring: string; icon: typeof CheckCircle2 }> = {
  green: { bg: "bg-risk-low", text: "text-risk-low", ring: "border-risk-low bg-risk-low-bg", icon: CheckCircle2 },
  yellow: { bg: "bg-risk-medium", text: "text-risk-medium", ring: "border-risk-medium bg-risk-medium-bg", icon: AlertTriangle },
  red: { bg: "bg-risk-high", text: "text-risk-high", ring: "border-risk-high bg-risk-high-bg", icon: XCircle },
  grey: { bg: "bg-muted-foreground", text: "text-muted-foreground", ring: "border-border bg-muted", icon: HelpCircle },
};
const fromStatus: Record<RowStatus, Light> = { conflict: "red", review: "yellow", within: "green", "not-compared": "grey" };
const TOTAL_MS = 60000; const INTRO = 5000, CONFIG = 12000, RULES = 11000, VERDICT = 10000;

export function AutoDemo({ onOpen, onClose }: { onOpen: (d: Demo) => void; onClose: () => void }) {
  const { lang } = useT(); const s = S[lang];
  const [id, setId] = useState(DEMOS[2]?.id ?? DEMOS[0]!.id);
  const demo = DEMOS.find(d => d.id === id)!;
  const [ms, setMs] = useState(0); const [playing, setPlaying] = useState(true);
  const assessment = useMemo(() => compare(analyse(demo.config, 1), demo.mandate), [demo]);
  const gates = useMemo(() => {
    const rows = actionMatrix(assessment);
    if (rows.length) return rows.map(r => ({ label: `${r.action} / ${r.resource}`, sub: r.rule, light: fromStatus[r.status] }));
    return assessment.tools.map(t => ({ label: t.name, sub: s.toolUnknown, light: "yellow" as Light }));
  }, [assessment, s]);
  const finalFlag: Flag = verdict(assessment);
  const GATE = (TOTAL_MS - INTRO - CONFIG - RULES - VERDICT) / Math.max(1, gates.length);
  const t1 = INTRO, t2 = t1 + CONFIG, t3 = t2 + RULES, t4 = t3 + GATE * gates.length;
  useEffect(() => { setMs(0); setPlaying(true); }, [id]);
  useEffect(() => { if (!playing || ms >= TOTAL_MS) return; const iv = setInterval(() => setMs(m => Math.min(TOTAL_MS, m + 100)), 100); return () => clearInterval(iv); }, [playing, ms >= TOTAL_MS]);

  const phase = ms < t1 ? "intro" : ms < t2 ? "config" : ms < t3 ? "rules" : ms < t4 ? "gates" : "verdict";
  const gateIdx = phase === "gates" ? Math.floor((ms - t3) / GATE) : phase === "verdict" ? gates.length : -1;
  const gateFrac = phase === "gates" ? ((ms - t3) % GATE) / GATE : 0;
  const revealed = (i: number) => i < gateIdx || (i === gateIdx && gateFrac > 0.45);
  const lines = demo.config.split("\n");
  const shownLines = phase === "config" ? Math.ceil(lines.length * ((ms - t1) / CONFIG)) : lines.length;
  const shownRules = phase === "rules" ? Math.ceil(demo.mandate.rules.length * ((ms - t2) / (RULES * 0.8))) : demo.mandate.rules.length;
  // Agent position along the track: start (0) → each gate → finish (100)
  const stops = gates.length + 1;
  const posOf = (i: number) => 8 + ((i + 1) / stops) * 84;
  const agentPos = phase === "verdict" ? 92 : phase === "gates" ? posOf(gateIdx) - (gateFrac < 0.3 ? 4 : 0) : 6;
  const caption = phase === "intro" ? s.intro : phase === "config" ? s.config : phase === "rules" ? s.rules : phase === "gates" ? s.gate(gateIdx + 1, gates.length) : s.verdict;
  const agentLight: Light = phase === "verdict" ? finalFlag : gateIdx >= 0 && revealed(gateIdx) ? gates[gateIdx]!.light : "grey";
  const title = (d: Demo) => lang === "pt" ? PT_DEMOS[d.id]?.title ?? d.title : d.title;
  const done = ms >= TOTAL_MS;

  return <section aria-label={s.title} className="animate-fade-up space-y-5 rounded-2xl border-2 border-primary bg-card p-5 shadow-xl">
    <div className="flex items-center justify-between gap-2"><h2 className="text-2xl font-extrabold">{s.title}</h2><Button variant="ghost" size="icon" aria-label={s.close} onClick={onClose}><X/></Button></div>
    <div role="tablist" className="flex flex-wrap gap-2">{DEMOS.map(d => <button key={d.id} role="tab" aria-selected={d.id === id} onClick={() => setId(d.id)} className={`rounded-full border px-3 py-1 text-xs font-bold transition-all active:scale-95 ${d.id === id ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"}`}>{title(d)}</button>)}</div>

    {/* Game track */}
    <div className="relative h-40 overflow-hidden rounded-xl border bg-muted/40 px-4">
      <div className="absolute inset-x-6 top-[88px] h-2 rounded-full bg-border"/>
      <div className="absolute left-6 top-[88px] h-2 rounded-full bg-primary/50 transition-[width] duration-[2500ms] ease-linear" style={{ width: `calc(${agentPos}% - 1.5rem)` }} aria-hidden/>
      {gates.map((g, i) => { const on = revealed(i); const L = LIGHT[g.light]; const Ic = L.icon; const left = posOf(i); return <div key={i} className="absolute top-[52px] -translate-x-1/2 text-center" style={{ left: `${left}%` }}>
        <div className={`mx-auto grid size-20 place-items-center rounded-full border-4 transition-all duration-700 ${on ? `${L.ring} scale-110` : "border-dashed border-border bg-background"} ${on && g.light === "red" ? "animate-flag-pulse" : ""}`}>{on ? <Ic className={`size-9 ${L.text} animate-fade-up`}/> : <span className="text-lg font-bold text-muted-foreground">{i + 1}</span>}</div>
      </div>; })}
      <div className="absolute top-[52px] -translate-x-1/2" style={{ left: "94%" }}><FlagIcon className={`size-8 ${phase === "verdict" ? LIGHT[finalFlag].text : "text-muted-foreground"} transition-colors duration-700`}/></div>
      <div className="absolute top-2 -translate-x-1/2 transition-[left] duration-[2500ms] ease-linear" style={{ left: `${agentPos}%` }}>
        <div className={`grid size-14 place-items-center rounded-2xl text-primary-foreground shadow-lg transition-colors duration-700 animate-agent-bob ${agentLight === "grey" ? "bg-primary" : LIGHT[agentLight].bg}`}><Bot className="size-8"/></div>
      </div>
    </div>

    <p key={caption} aria-live="polite" className="animate-fade-up min-h-14 rounded-lg bg-accent p-4 text-lg font-bold">{caption}</p>

    <div className="min-h-56">
      {phase === "intro" && <div className="animate-fade-up flex items-center gap-4 rounded-lg border p-5"><Bot className="size-16 text-primary animate-agent-bob"/><div><p className="text-xl font-extrabold">{title(demo)}</p><p className="text-muted-foreground">{lang === "pt" ? PT_DEMOS[demo.id]?.tagline ?? demo.tagline : demo.tagline}</p></div></div>}
      {phase === "config" && <div className="animate-fade-up"><p className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground"><FileJson className="size-4"/>config.json</p><pre className="max-h-64 overflow-hidden whitespace-pre-wrap break-all rounded-lg bg-muted p-3 font-mono text-xs">{lines.slice(0, shownLines).join("\n")}<span className="animate-pulse">▍</span></pre></div>}
      {phase === "rules" && <div className="animate-fade-up"><p className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground"><ScrollText className="size-4"/>{demo.mandate.owner}</p><ul className="space-y-2">{demo.mandate.rules.slice(0, shownRules).map(r => <li key={r.id} className="animate-fade-up rounded-lg border-l-4 border-primary bg-background p-3"><b>{r.type}</b> <span className="font-mono">{r.action} / {r.resource}</span>{r.conditions && <span className="block text-sm text-muted-foreground">{r.conditions}</span>}</li>)}</ul></div>}
      {phase === "gates" && gates[gateIdx] && (() => { const g = gates[gateIdx]!; const on = revealed(gateIdx); const L = LIGHT[g.light]; const Ic = L.icon; return <div key={gateIdx} className={`animate-fade-up rounded-xl border-4 p-5 transition-colors duration-700 ${on ? L.ring : "border-dashed"}`}>
        <p className="font-mono text-xl font-bold break-words">{g.label}</p><p className="mt-2 text-sm text-muted-foreground break-words">{g.sub}</p>
        <div className="mt-4 flex items-center gap-3">{on ? <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-base font-extrabold text-primary-foreground ${L.bg} animate-fade-up ${g.light === "red" ? "animate-flag-pulse" : ""}`}><Ic className="size-5"/>{s[g.light]}</span> : <span className="flex gap-2">{(["red", "yellow", "green"] as const).map((c, k) => <span key={c} style={{ animationDelay: `${k * 200}ms` }} className={`size-5 animate-pulse rounded-full ${LIGHT[c].bg}`}/>)}</span>}</div>
      </div>; })()}
      {phase === "verdict" && <div className="animate-fade-up"><VerdictPanel assessment={assessment}/></div>}
    </div>

    <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-[width] duration-100 ease-linear" style={{ width: `${(ms / TOTAL_MS) * 100}%` }}/></div>
    <div className="flex flex-wrap items-center gap-2">
      {!done ? <Button variant="outline" onClick={() => setPlaying(p => !p)}>{playing ? <><Pause/>{s.pause}</> : <><Play/>{s.play}</>}</Button>
        : <Button variant="outline" onClick={() => { setMs(0); setPlaying(true); }}><RotateCcw/>{s.replay}</Button>}
      <Button onClick={() => onOpen(demo)}>{s.open}<ArrowRight/></Button>
      <span className="text-xs tabular-nums text-muted-foreground">{Math.floor(ms / 1000)}s / 60s</span>
      <p className="text-xs text-muted-foreground">{s.sample}</p>
    </div>
  </section>;
}
