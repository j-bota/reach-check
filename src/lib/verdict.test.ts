import { describe, it, expect } from "vitest";
import { analyse } from "./reach";
import { compare } from "./mandate";
import { DEMOS } from "./demos";
import { verdict, actionMatrix } from "./verdict";

const run = (id: string) => { const d = DEMOS.find(x => x.id === id)!; return compare(analyse(d.config, 1), d.mandate); };

describe("verdict", () => {
  it("n8n demo with send action is not green and its matrix flags the send row", () => {
    const a = run("n8n-workflow");
    expect(verdict(a)).not.toBe("green");
    expect(actionMatrix(a).some(r => r.action === "send" && r.status !== "within")).toBe(true);
  });
  it("MCP demo without recognised actions is never green", () => {
    expect(verdict(run("mcp-assistant"))).not.toBe("green");
  });
  it("unconfirmed mandate marks rows as not compared", () => {
    const d = DEMOS.find(x => x.id === "n8n-workflow")!;
    const a = compare(analyse(d.config, 1), { ...d.mandate, confirmed: false });
    expect(actionMatrix(a).every(r => r.status === "not-compared")).toBe(true);
  });
});

describe("demo colours", () => {
  it("ChatGPT connector with hidden instruction is red", () => expect(verdict(run("chatgpt-connector"))).toBe("red"));
  it("n8n auto-sender breaking a Never rule is red", () => expect(verdict(run("n8n-auto-sender"))).toBe("red"));
  it("n8n inbox reader that only reads is green", () => expect(verdict(run("n8n-inbox-reader"))).toBe("green"));
  it("Gmail assistant is yellow", () => expect(verdict(run("email-assistant"))).toBe("yellow"));
});
