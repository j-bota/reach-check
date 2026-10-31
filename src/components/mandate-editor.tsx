import { Plus, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ACTIONS, RULE_TYPES, canConfirm, type Mandate, type MandateRule } from "@/lib/mandate";

export const fieldClass = "w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function MandateEditor({ mandate, change, confirm, example }: { mandate: Mandate; change: (patch: Partial<Mandate>) => void; confirm: () => void; example: () => void }) {
  function update(id: string, patch: Partial<MandateRule>) { change({ rules: mandate.rules.map(r => r.id === id ? { ...r, ...patch } : r) }); }
  return <section className="space-y-5" aria-labelledby="mandate-heading">
    <div><p className="text-sm font-semibold text-primary">02 / Mandate</p><h1 id="mandate-heading" className="mt-2 text-3xl font-extrabold">What is this agent authorised to do?</h1></div>
    <label className="block font-semibold">Original business instruction<textarea className={`${fieldClass} mt-2 font-normal`} rows={4} value={mandate.instruction} onChange={e => change({ instruction: e.target.value })}/></label>
    <Button variant="outline" onClick={example}>Use customer enquiry example</Button>
    <label className="block font-semibold">Owner name or role<input className={`${fieldClass} mt-2 font-normal`} value={mandate.owner} onChange={e => change({ owner: e.target.value })}/></label>
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">Structured delegation</h2><Button variant="outline" onClick={() => change({ rules: [...mandate.rules, { id: `rule-${Date.now()}`, type: "Allow", action: "read", resource: "", conditions: "" }] })}><Plus/>Add rule</Button></div>
    {!mandate.rules.length && <p className="text-muted-foreground">No rules supplied. Add delegation rules or review the example before confirmation.</p>}
    {mandate.rules.map((r, i) => <fieldset key={r.id} className="rounded-lg border p-4"><legend className="px-1 text-sm font-semibold">Rule {i + 1}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Rule type<select className={fieldClass} value={r.type} onChange={e => update(r.id, { type: e.target.value as MandateRule["type"] })}>{RULE_TYPES.map(t => <option key={t}>{t}</option>)}</select></label>
        <label className="text-sm font-medium">Action<select className={fieldClass} value={r.action} onChange={e => update(r.id, { action: e.target.value as MandateRule["action"] })}>{ACTIONS.map(t => <option key={t}>{t}</option>)}</select></label>
        <label className="text-sm font-medium">Resource / scope<input className={fieldClass} value={r.resource} placeholder="Resource or * for all scopes" onChange={e => update(r.id, { resource: e.target.value })}/></label>
        <label className="text-sm font-medium">Conditions<input className={fieldClass} value={r.conditions} onChange={e => update(r.id, { conditions: e.target.value })}/></label>
      </div><Button title="Remove rule" aria-label={`Remove rule ${i + 1}`} variant="ghost" size="icon" className="mt-2" onClick={() => change({ rules: mandate.rules.filter(x => x.id !== r.id) })}><Trash2/></Button>
    </fieldset>)}
    <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 size-4 accent-primary" checked={mandate.exhaustive} onChange={e => change({ exhaustive: e.target.checked })}/>Treat these rules as an exhaustive allowlist. Actions outside the list are not authorised.</label>
    <p className="text-sm text-muted-foreground">Otherwise, unmentioned actions are Unspecified—review needed. Scope matching uses exact text or an explicit *; conditions require verification.</p>
    <div className="border-t pt-4"><p role="status" className="mb-3 font-semibold">{mandate.confirmed ? "Owner-confirmed mandate" : "Unconfirmed — review the instruction and rules"}</p><Button disabled={!canConfirm(mandate) || mandate.confirmed} onClick={confirm}><Check/>Confirm reviewed mandate</Button></div>
  </section>;
}