import { type Assessment } from "@/lib/mandate";
import { type Demo } from "@/lib/demos";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{title}</h3><div className="mt-2 text-sm">{children}</div></div>;
}

export function DemoSummary({ demo, assessment: a }: { demo: Demo; assessment: Assessment }) {
  const declared = a.tools.map(t => t.name);
  return <section aria-label="Demo explanation" className="space-y-5 rounded-lg border border-primary bg-card p-5">
    <div>
      <p className="text-sm font-semibold text-primary">Demo — sample data</p>
      <h2 className="mt-1 text-2xl font-extrabold">{demo.title}</h2>
      <p className="mt-1 text-muted-foreground">{demo.tagline}</p>
      <p className="mt-2 text-sm text-muted-foreground">Fictional sample scenario, not a live integration. The sample mandate is a demo preset, not a real owner attestation.</p>
    </div>
    <Block title="What the sample mandate allows">
      <p>{a.mandate.instruction}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">{a.mandate.rules.map(r => <li key={r.id}>{r.type} {r.action} / {r.resource}{r.conditions ? ` — ${r.conditions}` : ""}</li>)}</ul>
    </Block>
    <Block title="What the supplied configuration declares or configures">
      <p>Format: {a.format}. {a.servers.length} configured server(s), {a.tools.length} declared tool(s), {a.actions.length} recognised configured action(s).</p>
      {!!declared.length && <p className="mt-2 break-all font-mono text-xs text-muted-foreground">Declared tools: {declared.join(", ")}</p>}
      {!!a.actions.length && <ul className="mt-2 list-disc space-y-1 pl-5">{a.actions.map((c, i) => <li key={i}>{c.action} / {c.resource} — {c.integration}</li>)}</ul>}
    </Block>
    <Block title="What mismatch was found and why it matters">
      {a.mismatches.length ? <ul className="list-disc space-y-1 pl-5">{a.mismatches.map(f => <li key={f.id}><strong>{f.title}:</strong> {f.explanation} {f.rule ? `(${f.rule})` : ""}</li>)}</ul>
        : <p>{demo.note}</p>}
    </Block>
    <Block title="What could not be verified">
      <p>Runtime permissions: {a.runtimePermissions}. Approval behaviour, credential scope and actual execution are not established by this review.</p>
    </Block>
  </section>;
}
