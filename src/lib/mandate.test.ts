import { describe, expect, it } from "vitest";
import { analyse, SAMPLES } from "./reach";
import { compare, emptyMandate, exampleMandate, editMandate, isStale, toMarkdown, toJSON } from "./mandate";

describe("mandate and export rules", () => {
  const review = () => analyse(SAMPLES[3]?.value ?? "", 1);
  const confirmed = () => ({ ...exampleMandate(1), owner: "Service owner", confirmed: true });
  it("missing, unconfirmed and incomplete mandates do not complete comparison", () => {
    for (const m of [emptyMandate(), exampleMandate(1), { ...confirmed(), owner: "" }]) {
      expect(compare(review(), m).comparison).toBe("Mandate comparison not performed");
      expect(compare(review(), m).mismatches).toHaveLength(0);
    }
  });
  it("recognised send versus never-send produces source-linked possible mismatch", () => {
    const a = compare(review(), confirmed());
    expect(a.mismatches[0]?.title).toBe("Possible mandate mismatch");
    expect(a.mismatches[0]?.source.pointer).toBe("/nodes/0");
    expect(a.mismatches[0]?.rule).toContain("rule-3: Never send");
  });
  it("unmentioned actions remain unspecified unless exhaustive authority chosen", () => {
    const m = { ...confirmed(), rules: [{ id: "one", type: "Allow" as const, action: "read" as const, resource: "*", conditions: "" }] };
    expect(compare(review(), m).mismatches[0]?.title).toBe("Unspecified—review needed");
    expect(compare(review(), { ...m, exhaustive: true }).mismatches[0]?.title).toContain("exhaustive allowlist");
  });
  it("approval-labelled nodes do not establish effective approval", () => {
    const m = { ...confirmed(), rules: [{ id: "one", type: "Require approval" as const, action: "send" as const, resource: "*", conditions: "Owner approves" }] };
    expect(compare(review(), m).mismatches[0]?.unknown).toContain("tested approval");
  });
  it("edited configuration marks result stale; editing mandate also invalidates confirmation", () => {
    const m = confirmed(); const a = compare(review(), m);
    expect(isStale(a, 1, m)).toBe(false); expect(isStale(a, 2, m)).toBe(true);
    const edited = editMandate(m, { instruction: "Changed instruction" });
    expect(edited.confirmed).toBe(false); expect(isStale(a, 1, edited)).toBe(true);
  });
  it("sensitive headers, credentials and excerpts are masked in UI assessment and both exports", () => {
    const r = analyse(JSON.stringify({ mcpServers: { one: { url: "https://example.com", headers: { Authorization: "Bearer private-credential", "X-Api-Key": "another-private-value" }, env: { OTHER: "env-private-value" }, headerParameters: [{ name: "Authorization", value: "third-private-value" }] } } }));
    const a = compare(r, emptyMandate());
    for (const text of [JSON.stringify(a), toMarkdown(a), toJSON(a)]) {
      for (const secret of ["private-credential", "another-private-value", "env-private-value", "third-private-value"]) expect(text).not.toContain(secret);
      expect(text).toContain("[REDACTED]");
    }
  });
  it("UI assessment and exports contain matching findings and limitations", () => {
    const a = compare(review(), confirmed()); const json = JSON.parse(toJSON(a)); const md = toMarkdown(a);
    expect(json.findings).toEqual(a.findings); expect(json.limitations).toEqual(a.limitations);
    for (const f of a.findings) { expect(md).toContain(f.title); expect(md).toContain(f.source.pointer); }
    for (const limitation of a.limitations) expect(md).toContain(limitation);
  });
});