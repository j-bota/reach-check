import { describe, it, expect } from "vitest";
import { analyse } from "./reach";
import { canConfirm, compare } from "./mandate";
import { DEMOS, DEMO_EXPORT_NOTICE } from "./demos";

describe("demo scenarios run through the real engine", () => {
  it("every demo configuration parses and every demo mandate is confirmable", () => {
    for (const d of DEMOS) {
      expect(() => analyse(d.config)).not.toThrow();
      expect(canConfirm(d.mandate)).toBe(true);
      expect(d.mandate.confirmed).toBe(true);
    }
  });
  it("the n8n demo produces a recognised send action and a computed mandate mismatch", () => {
    const demo = DEMOS.find(d => d.id === "n8n-workflow")!;
    const review = analyse(demo.config);
    expect(review.actions.some(a => a.action === "send")).toBe(true);
    const assessment = compare(review, demo.mandate);
    expect(assessment.comparison).toBe("Compared with confirmed mandate");
    expect(assessment.mismatches.length).toBeGreaterThan(0);
    expect(assessment.mismatches.some(f => f.rule?.includes("Require approval"))).toBe(true);
  });
  it("the email demo declares a send_email tool without inferring a send capability", () => {
    const demo = DEMOS.find(d => d.id === "email-assistant")!;
    const review = analyse(demo.config);
    expect(review.tools.map(t => t.name)).toContain("send_email");
    expect(review.actions).toEqual([]);
    expect(review.tools.every(t => t.capabilities === "Unknown")).toBe(true);
    expect(demo.note).toMatch(/does not treat a tool name as proof/i);
  });
  it("the MCP assistant demo declares edit_file without inferring a write capability", () => {
    const demo = DEMOS.find(d => d.id === "mcp-assistant")!;
    const review = analyse(demo.config);
    expect(review.tools.map(t => t.name)).toContain("edit_file");
    expect(review.actions).toEqual([]);
  });
  it("runtime permissions stay unverified in every demo", () => {
    for (const d of DEMOS) {
      expect(analyse(d.config).runtimePermissions).toBe("Not checked");
    }
  });
  it("the export notice identifies sample data", () => {
    expect(DEMO_EXPORT_NOTICE).toMatch(/SAMPLE DATA/);
    expect(DEMO_EXPORT_NOTICE).toMatch(/fictional/i);
  });
});
