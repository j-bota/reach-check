import { describe, it, expect } from "vitest";
import { analyse, SAMPLES } from "./reach";
describe("evidence-led configuration rules", () => {
  it("a server is not a tool and has unknown inventory", () => {
    const r = analyse('{"mcpServers":{"one":{"url":"https://example.com"}}}');
    expect(r.servers).toHaveLength(1); expect(r.tools).toHaveLength(0);
    expect(r.servers[0]?.inventory).toBe("not-provided"); expect(r.coverage).toBe("Incomplete");
    expect(r.runtimePermissions).toBe("Not checked"); expect(r.findings[0]?.evidence).toBe("Unknown");
  });
  it("an explicitly empty inventory does not prove deployment capabilities", () => {
    const r = analyse('{"mcpServers":{"one":{"tools":[]}}}');
    expect(r.servers[0]?.inventory).toBe("declared"); expect(r.tools).toHaveLength(0);
    expect(r.findings[0]?.unknown).toContain("deployed server"); expect(r.coverage).toBe("Incomplete");
  });
  it("search_email metadata cannot establish send or read permissions", () => {
    const r = analyse(SAMPLES[1]?.value ?? ""); expect(r.actions).toEqual([]);
    expect(r.tools[0]?.capabilities).toBe("Unknown"); expect(r.controls[0]?.status).toBe("Source-provided hint");
  });
  it("poisoned descriptions create concerns, never send capabilities", () => {
    const r = analyse(SAMPLES[2]?.value ?? ""); expect(r.actions).toEqual([]);
    expect(r.findings[0]?.evidence).toBe("Heuristic concern");
    expect(r.findings[0]?.source.pointer).toBe("/mcpServers/weather/tools/0/description");
  });
  it("unknown tools and unsupported objects never default to read", () => {
    expect(analyse('[{"name":"mystery"}]').tools[0]?.capabilities).toBe("Unknown");
    expect(analyse('{"unexpected":123}').findings[0]?.evidence).toBe("Unknown");
  });
  it("invalid JSON and malformed structures provide useful errors", () => {
    expect(() => analyse("{")).toThrow(/Invalid JSON/);
    expect(() => analyse('{"mcpServers":{"one":{"tools":"bad"}}}')).toThrow(/Invalid MCP/);
    expect(() => analyse('{"nodes":[{"name":"bad"}]}')).toThrow(/Invalid n8n/);
  });
  it("only exact supported operations and versions classify configured actions", () => {
    const r = analyse(SAMPLES[3]?.value ?? ""); expect(r.actions[0]?.action).toBe("send");
    expect(analyse('{"nodes":[{"name":"send","type":"custom.send","parameters":{"operation":"send"}}]}').actions).toEqual([]);
  });
});
