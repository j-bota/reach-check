import { type Assessment } from "@/lib/mandate";
import { type Demo } from "@/lib/demos";
import { useT } from "@/lib/i18n";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{title}</h3><div className="mt-2 text-sm">{children}</div></div>;
}

export function DemoSummary({ demo, assessment: a }: { demo: Demo; assessment: Assessment }) {
  const { t } = useT();
  const declared = a.tools.map(x => x.name);
  return <section aria-label={t.dExplain} className="space-y-5 rounded-lg border border-primary bg-card p-5">
    <div>
      <p className="text-sm font-semibold text-primary">{t.demoBadge}</p>
      <h2 className="mt-1 text-2xl font-extrabold">{demo.title}</h2>
      <p className="mt-1 text-muted-foreground">{demo.tagline}</p>
      <p className="mt-2 text-sm text-muted-foreground">{t.dFictional}</p>
    </div>
    <Block title={t.dAllows}>
      <p>{a.mandate.instruction}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">{a.mandate.rules.map(r => <li key={r.id}>{r.type} {r.action} / {r.resource}{r.conditions ? ` — ${r.conditions}` : ""}</li>)}</ul>
    </Block>
    <Block title={t.dDeclares}>
      <p>{t.dFormat(a.format, a.servers.length, a.tools.length, a.actions.length)}</p>
      {!!declared.length && <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{t.dDeclared}: {declared.join(", ")}</p>}
      {!!a.actions.length && <ul className="mt-2 list-disc space-y-1 pl-5">{a.actions.map((c, i) => <li key={i}>{c.action} / {c.resource} — {c.integration}</li>)}</ul>}
    </Block>
    <Block title={t.dMismatch}>
      {a.mismatches.length ? <ul className="list-disc space-y-1 pl-5">{a.mismatches.map(f => <li key={f.id}><strong>{f.title}:</strong> {f.explanation} {f.rule ? `(${f.rule})` : ""}</li>)}</ul>
        : <p>{demo.note}</p>}
    </Block>
    <Block title={t.dUnverified}>
      <p>{t.runtime}: {a.runtimePermissions}. {t.dUnverifiedBody}</p>
    </Block>
  </section>;
}
