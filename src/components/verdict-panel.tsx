import { ShieldAlert, ShieldCheck, ShieldQuestion, Server, Zap, GitCompare, HelpCircle, CheckCircle2, XCircle, AlertTriangle, MinusCircle } from "lucide-react";
import type { Assessment } from "@/lib/mandate";
import { actionMatrix, verdict, type Flag, type RowStatus } from "@/lib/verdict";
import { useT } from "@/lib/i18n";

const S = {
  en: {
    red: ["Red flag — possible conflict", "Something configured here may cross a line the owner set, or the configuration contains a suspicious instruction."],
    yellow: ["Yellow flag — needs review", "Some actions are unspecified, need approval, or could not be compared. Check before trusting this agent."],
    green: ["Green flag — no mismatch found", "Every recognised action fits the confirmed mandate. Runtime permissions are still not checked."],
    allowed: "Within mandate", review: "Review", conflict: "Conflict", unknown: "Not compared",
    servers: "Servers", actions: "Actions", mism: "Mismatches", unk: "Unverified tools",
    matrix: "Action matrix", colAction: "Configured action", colRule: "Mandate rule", colStatus: "Status", noRows: "No configured actions recognised — nothing to place in the matrix.", evidence: "Evidence",
  },
  pt: {
    red: ["Bandeira vermelha — possível conflito", "Algo configurado pode ultrapassar um limite definido pelo responsável, ou a configuração contém uma instrução suspeita."],
    yellow: ["Bandeira amarela — requer revisão", "Algumas ações não estão especificadas, exigem aprovação ou não puderam ser comparadas. Verifique antes de confiar neste agente."],
    green: ["Bandeira verde — sem incompatibilidades", "Todas as ações reconhecidas cabem no mandato confirmado. As permissões em execução continuam por verificar."],
    allowed: "Dentro do mandato", review: "Rever", conflict: "Conflito", unknown: "Não comparado",
    servers: "Servidores", actions: "Ações", mism: "Incompatibilidades", unk: "Ferramentas por verificar",
    matrix: "Matriz de ações", colAction: "Ação configurada", colRule: "Regra do mandato", colStatus: "Estado", noRows: "Nenhuma ação configurada reconhecida — nada para mostrar na matriz.", evidence: "Evidência",
  },
};
const TONE: Record<Flag, { box: string; text: string; icon: typeof ShieldAlert }> = {
  red: { box: "border-risk-high bg-risk-high-bg", text: "text-risk-high", icon: ShieldAlert },
  yellow: { box: "border-risk-medium bg-risk-medium-bg", text: "text-risk-medium", icon: ShieldQuestion },
  green: { box: "border-risk-low bg-risk-low-bg", text: "text-risk-low", icon: ShieldCheck },
};
const ROW: Record<RowStatus, { pill: string; icon: typeof XCircle; key: "allowed" | "review" | "conflict" | "unknown"; bar: string }> = {
  conflict: { pill: "bg-risk-high text-primary-foreground", icon: XCircle, key: "conflict", bar: "bg-risk-high" },
  review: { pill: "bg-risk-medium text-primary-foreground", icon: AlertTriangle, key: "review", bar: "bg-risk-medium" },
  within: { pill: "bg-risk-low text-primary-foreground", icon: CheckCircle2, key: "allowed", bar: "bg-risk-low" },
  "not-compared": { pill: "bg-muted text-muted-foreground", icon: MinusCircle, key: "unknown", bar: "bg-muted-foreground" },
};

export function VerdictPanel({ assessment: a }: { assessment: Assessment }) {
  const { lang } = useT(); const s = S[lang];
  const flag = verdict(a); const tone = TONE[flag]; const Icon = tone.icon; const [title, body] = s[flag];
  const rows = actionMatrix(a);
  const counts = (["within", "review", "conflict", "not-compared"] as RowStatus[]).map(k => [k, rows.filter(r => r.status === k).length] as const).filter(([, n]) => n);
  const unknownTools = a.tools.filter(t => t.capabilities === "Unknown").length;
  const stats = [
    { icon: Server, label: s.servers, n: a.servers.length, tone: "text-primary" },
    { icon: Zap, label: s.actions, n: a.actions.length, tone: "text-primary" },
    { icon: GitCompare, label: s.mism, n: a.mismatches.length, tone: a.mismatches.length ? "text-risk-high" : "text-risk-low" },
    { icon: HelpCircle, label: s.unk, n: unknownTools, tone: unknownTools ? "text-risk-medium" : "text-risk-low" },
  ];
  return <section className="space-y-6">
    <div role="status" key={flag + a.versions.input + a.versions.mandate} className={`animate-fade-up rounded-xl border-2 p-5 ${tone.box}`}>
      <div className="flex items-start gap-4">
        <span className={`grid size-14 shrink-0 place-items-center rounded-full bg-background ${tone.text} ${flag === "red" ? "animate-flag-pulse" : ""}`}><Icon className="size-8"/></span>
        <div className="min-w-0"><h2 className={`text-2xl font-extrabold ${tone.text}`}>{title}</h2><p className="mt-1">{body}</p></div>
      </div>
      {!!rows.length && <><div className="mt-4 flex h-3 overflow-hidden rounded-full bg-background">{counts.map(([k, n]) => <div key={k} className={`${ROW[k].bar} animate-grow-x`} style={{ width: `${(n / rows.length) * 100}%` }}/>)}</div>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold">{counts.map(([k, n]) => <li key={k} className="flex items-center gap-1.5"><span className={`size-2.5 rounded-full ${ROW[k].bar}`}/>{n} {s[ROW[k].key]}</li>)}</ul></>}
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{stats.map((x, i) => { const I = x.icon; return <div key={x.label} style={{ animationDelay: `${i * 70}ms` }} className="animate-fade-up rounded-lg border bg-card p-4 shadow-sm"><I className={`size-5 ${x.tone}`}/><p className={`mt-2 text-3xl font-extrabold ${x.tone}`}>{x.n}</p><p className="text-xs font-medium text-muted-foreground">{x.label}</p></div>; })}</div>
    <div><h2 className="mb-3 text-2xl font-bold">{s.matrix}</h2>
      {!rows.length ? <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">{s.noRows}</p> :
      <div className="space-y-2">{rows.map((r, i) => { const R = ROW[r.status]; const RI = R.icon; return <article key={i} style={{ animationDelay: `${i * 80}ms` }} className="animate-fade-up grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
        <div className="min-w-0"><p className="text-xs text-muted-foreground">{s.colAction}</p><p className="break-words font-mono font-semibold">{r.action} / {r.resource}</p><p className="text-xs text-muted-foreground">{r.integration}</p></div>
        <div className="min-w-0"><p className="text-xs text-muted-foreground">{s.colRule}</p><p className="break-words text-sm">{r.rule}</p></div>
        <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${R.pill} ${r.status === "conflict" ? "animate-flag-pulse" : ""}`}><RI className="size-4"/>{s[R.key]}</span>
        <details className="sm:col-span-3"><summary className="cursor-pointer text-xs font-semibold text-primary">{s.evidence}</summary><pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap break-all rounded bg-muted p-2 text-xs">{r.excerpt}</pre></details>
      </article>; })}</div>}
    </div>
  </section>;
}
