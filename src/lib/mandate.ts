import { type Action, type Finding, type Review, DRAFT_LABEL } from "./reach";
import { redact } from "./reach-security";

export type RuleType = "Allow" | "Require approval" | "Never" | "Must";
export interface MandateRule { id: string; type: RuleType; action: Action; resource: string; conditions: string }
export interface Mandate { instruction: string; owner: string; confirmed: boolean; exhaustive: boolean; rules: MandateRule[]; version: number }
export interface Assessment extends Review { mandate: Mandate; comparison: "Mandate comparison not performed" | "Compared with confirmed mandate"; mismatches: Finding[] }
export const ACTIONS: Action[] = ["read", "draft", "send", "export", "write", "delete", "pay", "run-code"];
export const RULE_TYPES: RuleType[] = ["Allow", "Require approval", "Never", "Must"];
export const BUSINESS_EXAMPLE = "Read incoming customer enquiries and prepare draft replies. A person sends every reply. The agent must never send email or export customer lists.";
export const emptyMandate = (): Mandate => ({ instruction: "", owner: "", confirmed: false, exhaustive: false, rules: [], version: 1 });
export function exampleMandate(version: number): Mandate {
  return { ...emptyMandate(), version, instruction: BUSINESS_EXAMPLE, rules: [
    { id: "rule-1", type: "Allow", action: "read", resource: "incoming customer enquiries", conditions: "For preparing draft replies only" },
    { id: "rule-2", type: "Must", action: "draft", resource: "customer replies", conditions: "A person sends every reply" },
    { id: "rule-3", type: "Never", action: "send", resource: "*", conditions: "A person sends every reply; the agent never sends email" },
    { id: "rule-4", type: "Never", action: "export", resource: "customer lists", conditions: "" },
  ] };
}
export function canConfirm(m: Mandate): boolean {
  return !!m.instruction.trim() && !!m.owner.trim() && m.rules.length > 0 && m.rules.every(r => !!r.resource.trim());
}
export function editMandate(m: Mandate, patch: Partial<Mandate>): Mandate {
  return { ...m, ...patch, confirmed: false, version: m.version + 1 };
}
export function isStale(a: Assessment, inputVersion: number, m: Mandate): boolean {
  return a.versions.input !== inputVersion || a.versions.mandate !== m.version || a.mandate.confirmed !== m.confirmed;
}

export function compare(review: Review, mandate: Mandate): Assessment {
  const confirmed = mandate.confirmed && canConfirm(mandate);
  const assessment: Assessment = { ...review, versions: { ...review.versions, mandate: mandate.version }, mandate: { ...mandate, confirmed }, comparison: confirmed ? "Compared with confirmed mandate" : "Mandate comparison not performed", mismatches: [], findings: [...review.findings], questions: [...review.questions], verification: [...review.verification] };
  if (!confirmed) { assessment.questions.push("Supply and confirm the original business instruction, structured rules and accountable owner before mandate comparison."); return redact(assessment) as Assessment; }
  for (const configured of review.actions) {
    const matching = mandate.rules.filter(r => r.action === configured.action);
    const definite = matching.filter(r => r.resource === "*" || r.resource.toLowerCase().trim() === configured.resource.toLowerCase().trim());
    const conflicts = matching.filter(r => r.type === "Never" || r.type === "Require approval" || r.conditions.trim());
    const unspecified = !definite.length;
    const relevant = conflicts.length ? conflicts : unspecified ? matching : [];
    const rules: (MandateRule | undefined)[] = relevant.length ? relevant : unspecified ? [undefined] : [];
    for (const rule of rules) {
      const f: Finding = {
        id: `mandate-${assessment.mismatches.length + 1}`, title: rule ? "Possible mandate mismatch" : mandate.exhaustive ? "Possible mandate mismatch — exhaustive allowlist" : "Unspecified—review needed",
        evidence: "Configured operation", priority: rule?.type === "Never" ? "High" : "Review", source: configured.source,
        rule: rule ? `${rule.id}: ${rule.type} ${rule.action} / ${rule.resource}${rule.conditions ? ` / ${rule.conditions}` : ""}` : "No matching confirmed rule",
        explanation: rule?.type === "Never" ? `The snapshot configures ${configured.action}. The owner prohibits this action within the rule's scope; a conflict is possible.` : rule?.type === "Require approval" ? "This action requires approval. The supplied snapshot does not establish an effective human approval path." : rule ? "The configured action requires scope or condition verification against the confirmed rule." : mandate.exhaustive ? "This action has no matching allowance in the owner's exhaustive allowlist." : "The confirmed mandate does not specify this action and scope. No authorisation or prohibition is inferred.",
        unknown: "Actual runtime permissions, resolved resource scope, conditions and tested approval behaviour. Scope matching only uses exact text or an explicit * scope.",
        next: "Ask the owner to resolve scope and conditions, inspect credential permissions, and test allowed and prohibited behaviour in isolation.",
      };
      assessment.findings.push(f); assessment.mismatches.push(f);
    }
  }
  for (const rule of mandate.rules.filter(r => r.type === "Must")) {
    if (!review.actions.some(a => a.action === rule.action && (rule.resource === "*" || rule.resource.toLowerCase() === a.resource.toLowerCase()))) {
      assessment.questions.push(`${rule.id}: Required work (${rule.action} / ${rule.resource}) is not demonstrated by recognised configured actions. Missing evidence is not proof the work cannot be performed.`);
    }
  }
  assessment.verification = [...new Set([...assessment.verification, ...assessment.findings.map(f => f.next), ...assessment.questions])];
  return redact(assessment) as Assessment;
}

export function toMarkdown(a: Assessment): string {
  const safe = redact(a) as Assessment;
  const list = (items: string[]) => items.length ? items.map(s => `- ${s}`).join("\n") : "- None recorded within the inspected scope.";
  const findings = safe.findings.map(f => `### ${f.title}\n\nPriority: ${f.priority} · Evidence: ${f.evidence}\n\nSource: ${f.source.pointer || "/"}\n\n${f.rule ? `Mandate rule: ${f.rule}\n\n` : ""}Identified: ${f.explanation}\n\nUnknown: ${f.unknown}\n\nNext verification: ${f.next}\n\nSource excerpt (JSON text):\n${f.source.excerpt}`).join("\n\n");
  return `# ReachCheck — draft assessment\n\n${DRAFT_LABEL}\n\n## Review scope and versions\n\nFormat: ${safe.format}\nCoverage: ${safe.coverage}\nConfigured servers: ${safe.servers.length} · Declared tools: ${safe.tools.length}\nRuntime permissions: ${safe.runtimePermissions}\nInput version: ${safe.versions.input} · Analysis version: ${safe.versions.analysis} · Mandate version: ${safe.versions.mandate}\n\n## Business requirement and delegation\n\n${safe.mandate.instruction || "Not supplied"}\n\nOwner: ${safe.mandate.owner || "Not supplied"}\nConfirmation: ${safe.mandate.confirmed ? "Owner-confirmed" : "Unconfirmed"}\nComparison: ${safe.comparison}\nUnmentioned actions: ${safe.mandate.exhaustive ? "Exhaustive allowlist chosen" : "Unspecified—review needed"}\n\n${list(safe.mandate.rules.map(r => `${r.id}: ${r.type} ${r.action} / ${r.resource} / ${r.conditions || "No additional conditions"}`))}\n\n## Recognised configured actions and source references\n\n${list(safe.actions.map(c => `${c.action} / ${c.resource} — ${c.integration} — ${c.source.pointer}\n  Source excerpt: ${c.source.excerpt}`))}\n\n## Declared metadata (capabilities Unknown)\n\n${list(safe.tools.map(t => `${t.server} / ${t.name} — ${t.source.pointer}\n  Source excerpt: ${t.source.excerpt}`))}\n\n## Possible mismatches\n\n${safe.comparison === "Mandate comparison not performed" ? safe.comparison : safe.mismatches.length ? list(safe.mismatches.map(f => `${f.id}: ${f.title} — ${f.source.pointer} — ${f.rule}`)) : "No mismatches found in the inspected configuration. Coverage limitations still apply; this is not a safety assurance."}\n\n## Findings and evidence\n\n${findings || "No findings recorded within the inspected scope; coverage limitations still apply."}\n\n## Proposed or source-declared controls\n\n${list(safe.controls.map(c => `${c.status}: ${c.description}${c.source ? ` — ${c.source.pointer}` : ""}`))}\n\n## Verification checklist and pending evidence\n\n${list(safe.verification)}\n\n## Unsupported areas and remaining questions\n\n${list([...safe.limitations, ...safe.questions])}\n\n## Changes requiring reassessment\n\n${list(safe.reassessWhen)}\n`;
}

export function toJSON(a: Assessment): string { return JSON.stringify(redact(a), null, 2); }