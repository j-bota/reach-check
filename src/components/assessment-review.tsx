import { type Assessment } from "@/lib/mandate";
import { type Source, type Finding } from "@/lib/reach";
import { useT } from "@/lib/i18n";

export function EvidenceView({ source }: { source: Source }) {
  const { t } = useT();
  return <details className="mt-3"><summary className="cursor-pointer text-sm font-semibold text-primary">{t.evidence}</summary><p className="mt-2 break-all font-mono text-xs text-muted-foreground">{source.pointer || "/"}</p><pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-md bg-muted p-3 text-xs">{source.excerpt}</pre></details>;
}
function FindingView({ finding: f }: { finding: Finding }) {
  const { t } = useT();
  return <article className="rounded-lg border p-4"><div className="flex flex-wrap gap-2 text-xs font-semibold"><span className={`rounded px-2 py-1 ${f.priority === "High" ? "bg-risk-high-bg text-risk-high" : "bg-muted text-muted-foreground"}`}>{t.priority}: {f.priority}</span><span className="rounded bg-muted px-2 py-1 text-muted-foreground">{t.evidenceLbl}: {f.evidence}</span></div><h3 className="mt-3 break-words text-lg font-bold">{f.title}</h3><p className="mt-2">{f.explanation}</p>{f.rule && <p className="mt-2 break-words text-sm"><strong>{t.mandateRule}:</strong> {f.rule}</p>}<p className="mt-2 text-sm"><strong>{t.stillUnknown}:</strong> {f.unknown}</p><p className="mt-2 text-sm"><strong>{t.nextVerify}:</strong> {f.next}</p><EvidenceView source={f.source}/></article>;
}
export function AssessmentReview({ assessment: a }: { assessment: Assessment }) {
  const { t } = useT();
  return <section className="space-y-8">
    <div className="border-b pb-6"><p className="text-sm font-semibold text-primary">{t.rStep}</p><h1 className="mt-2 text-3xl font-extrabold">{t.coverage}</h1>{t.engineNote && <p className="mt-2 text-sm text-muted-foreground">{t.engineNote}</p>}<p className="mt-5 font-semibold">{a.coverage}</p><p className="mt-2 font-semibold">{t.runtime}: {a.runtimePermissions}</p><p className="mt-2 text-sm text-muted-foreground">{a.draftLabel}</p></div>
    <div><h2 className="mb-3 text-2xl font-bold">{t.servers}</h2>{!a.servers.length && <p className="text-muted-foreground">{t.noServers}</p>}<div className="space-y-3">{a.servers.map((s,i) => <article className="rounded-lg border p-4" key={i}><h3 className="break-all font-semibold">{s.name}</h3><p className="mt-1">{s.inventory === "not-provided" ? t.invNone : t.invTools(s.declaredTools)}</p><p className="text-sm text-muted-foreground">{t.capsUnknown}</p><EvidenceView source={s.source}/></article>)}</div></div>
    <div><h2 className="mb-3 text-2xl font-bold">{t.actionsTitle}</h2>{!a.actions.length && <p className="text-muted-foreground">{t.noActions}</p>}<div className="space-y-3">{a.actions.map((c,i) => <article className="rounded-lg border p-4" key={i}><p className="break-words font-semibold">{c.action} / {c.resource}</p><p className="text-sm text-muted-foreground">{t.configuredOp} · {c.integration}</p><EvidenceView source={c.source}/></article>)}</div></div>
    {!!a.tools.length && <div><h2 className="mb-3 text-2xl font-bold">{t.toolMeta}</h2><div className="space-y-3">{a.tools.map((tl,i) => <article className="rounded-lg border p-4" key={i}><p className="break-all font-mono font-semibold">{tl.name}</p><p className="text-sm text-muted-foreground">{tl.server} · {t.capabilities}: {tl.capabilities}</p>{tl.hints.map((h,j) => <p className="mt-2 break-all text-sm" key={j}>{t.hint}: {h} — {t.notVerified}</p>)}<EvidenceView source={tl.source}/></article>)}</div></div>}
    <div><h2 className="mb-3 text-2xl font-bold">{t.mismatches}</h2><p className="font-semibold">{a.comparison}</p>{a.comparison === "Compared with confirmed mandate" && !a.mismatches.length && <p className="mt-2 text-muted-foreground">{t.noMismatch}</p>}<div className="mt-3 space-y-3">{a.mismatches.map(f => <FindingView key={f.id} finding={f}/>)}</div></div>
    <div><h2 className="mb-3 text-2xl font-bold">{t.findings}</h2><div className="space-y-3">{a.findings.filter(f => !f.id.startsWith("mandate-")).map(f => <FindingView key={f.id} finding={f}/>)}</div>{!a.findings.length && <p className="text-muted-foreground">{t.noFindings}</p>}</div>
    <div><h2 className="mb-3 text-2xl font-bold">{t.controls}</h2><ul className="space-y-3">{a.controls.map((c,i) => <li key={i} className="border-l-2 pl-3"><strong>{c.status}:</strong> {c.description}{c.source && <EvidenceView source={c.source}/>}</li>)}</ul></div>
    <div><h2 className="mb-3 text-2xl font-bold">{t.limits}</h2><ul className="list-disc space-y-2 pl-5 text-sm">{[...a.limitations,...a.questions].map((s,i) => <li key={i}>{s}</li>)}</ul></div>
    <div><h2 className="mb-3 text-2xl font-bold">{t.pending}</h2><ul className="list-disc space-y-2 pl-5 text-sm">{a.verification.map((s,i) => <li key={i}>{s}</li>)}</ul></div>
  </section>;
}
