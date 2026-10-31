import type { Assessment } from "./mandate";

export type Flag = "red" | "yellow" | "green";
export type RowStatus = "conflict" | "review" | "within" | "not-compared";
export interface MatrixRow { action: string; resource: string; integration: string; rule: string; status: RowStatus; pointer: string; excerpt: string }

/** Per configured action: compare against computed mismatches only — nothing inferred. */
export function actionMatrix(a: Assessment): MatrixRow[] {
  const compared = a.comparison === "Compared with confirmed mandate";
  return a.actions.map(c => {
    const hits = a.mismatches.filter(m => m.source.pointer === c.source.pointer);
    const rule = a.mandate.rules.find(r => r.action === c.action);
    const status: RowStatus = !compared ? "not-compared" : hits.some(h => h.priority === "High") ? "conflict" : hits.length ? "review" : "within";
    return { action: c.action, resource: c.resource, integration: c.integration, rule: hits[0]?.rule ?? (rule ? `${rule.type} ${rule.action} / ${rule.resource}` : "—"), status, pointer: c.source.pointer, excerpt: c.source.excerpt };
  });
}

/** Overall flag. Green never means "safe": only no mismatch within the inspected configuration. */
export function verdict(a: Assessment): Flag {
  if (a.findings.some(f => f.priority === "High")) return "red";
  if (a.comparison !== "Compared with confirmed mandate" || a.mismatches.length || !a.actions.length) return "yellow";
  return "green";
}
