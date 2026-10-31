import { Plus, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ACTIONS, RULE_TYPES, canConfirm, type Mandate, type MandateRule } from "@/lib/mandate";
import { useT } from "@/lib/i18n";

export const fieldClass = "w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function MandateEditor({ mandate, change, confirm, example }: { mandate: Mandate; change: (patch: Partial<Mandate>) => void; confirm: () => void; example: () => void }) {
  const { t } = useT();
  function update(id: string, patch: Partial<MandateRule>) { change({ rules: mandate.rules.map(r => r.id === id ? { ...r, ...patch } : r) }); }
  return <section className="space-y-5" aria-labelledby="mandate-heading">
    <div><p className="text-sm font-semibold text-primary">{t.mStep}</p><h1 id="mandate-heading" className="mt-2 text-3xl font-extrabold">{t.mTitle}</h1></div>
    <label className="block font-semibold">{t.mInstruction}<textarea className={`${fieldClass} mt-2 font-normal`} rows={4} value={mandate.instruction} onChange={e => change({ instruction: e.target.value })}/></label>
    <Button variant="outline" onClick={example}>{t.mExample}</Button>
    <label className="block font-semibold">{t.mOwner}<input className={`${fieldClass} mt-2 font-normal`} value={mandate.owner} onChange={e => change({ owner: e.target.value })}/></label>
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">{t.mDelegation}</h2><Button variant="outline" onClick={() => change({ rules: [...mandate.rules, { id: `rule-${Date.now()}`, type: "Allow", action: "read", resource: "", conditions: "" }] })}><Plus/>{t.mAdd}</Button></div>
    {!mandate.rules.length && <p className="text-muted-foreground">{t.mNoRules}</p>}
    {mandate.rules.map((r, i) => <fieldset key={r.id} className="rounded-lg border p-4"><legend className="px-1 text-sm font-semibold">{t.mRule} {i + 1}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">{t.mType}<select className={fieldClass} value={r.type} onChange={e => update(r.id, { type: e.target.value as MandateRule["type"] })}>{RULE_TYPES.map(x => <option key={x}>{x}</option>)}</select></label>
        <label className="text-sm font-medium">{t.mAction}<select className={fieldClass} value={r.action} onChange={e => update(r.id, { action: e.target.value as MandateRule["action"] })}>{ACTIONS.map(x => <option key={x}>{x}</option>)}</select></label>
        <label className="text-sm font-medium">{t.mResource}<input className={fieldClass} value={r.resource} placeholder={t.mResourcePh} onChange={e => update(r.id, { resource: e.target.value })}/></label>
        <label className="text-sm font-medium">{t.mConditions}<input className={fieldClass} value={r.conditions} onChange={e => update(r.id, { conditions: e.target.value })}/></label>
      </div><Button title={t.mRemove} aria-label={`${t.mRemove} ${i + 1}`} variant="ghost" size="icon" className="mt-2" onClick={() => change({ rules: mandate.rules.filter(x => x.id !== r.id) })}><Trash2/></Button>
    </fieldset>)}
    <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 size-4 accent-primary" checked={mandate.exhaustive} onChange={e => change({ exhaustive: e.target.checked })}/>{t.mExhaustive}</label>
    <p className="text-sm text-muted-foreground">{t.mHint}</p>
    <div className="border-t pt-4"><p role="status" className="mb-3 font-semibold">{mandate.confirmed ? t.mConfirmed : t.mUnconfirmed}</p><Button disabled={!canConfirm(mandate) || mandate.confirmed} onClick={confirm}><Check/>{t.mConfirm}</Button></div>
  </section>;
}
