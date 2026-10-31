import { describe, it, expect } from "vitest";
import { analyse, SAMPLES, toMarkdown } from "./reach";

describe("reach rules", () => {
  it("safe sample is low risk", () => {
    expect(analyse(SAMPLES[0].value).overall).toBe("low");
  });
  it("risky sample flags root, http, unpinned, secret, sign-off", () => {
    const r = analyse(SAMPLES[1].value);
    const titles = r.warnings.map((w) => w.title).join("\n");
    expect(r.overall).toBe("high");
    expect(titles).toMatch(/Over-broad access on "filesystem"/);
    expect(titles).toMatch(/"crm" uses plain http/);
    expect(titles).toMatch(/"shell" runs an unpinned package/);
    expect(titles).toMatch(/Secret in plain text/);
    expect(titles).not.toContain("9f8a7b6c5d4e3f2a1b0c");
    expect(r.signOff.length).toBeGreaterThanOrEqual(3);
  });
  it("poisoned sample flags hidden instructions", () => {
    const w = analyse(SAMPLES[2].value).warnings.find((x) => x.title.startsWith("Hidden"));
    expect(w?.why).toMatch(/zero-width/);
    expect(w?.why).toMatch(/HTML comment/);
  });
  it("markdown export never contains the raw secret", () => {
    expect(toMarkdown(analyse(SAMPLES[1].value))).not.toContain("9f8a7b6c5d4e3f2a1b0c");
  });
});
