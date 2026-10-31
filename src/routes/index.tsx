import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { analyse, SAMPLES, toMarkdown, type Level, type Report } from "@/lib/reach";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Reach Check — see what your AI agent can really do" },
      {
        name: "description",
        content: "Paste your MCP config and instantly see every tool your AI agent can use, hidden risks, and what needs human sign-off.",
      },
      { property: "og:title", content: "Reach Check — see what your AI agent can really do" },
      { property: "og:description", content: "Instant, in-browser risk check for MCP servers and AI agent tools." },
    ],
  }),
  component: Index,
});

const chip: Record<Level, string> = {
  low: "bg-risk-low-bg text-risk-low",
  medium: "bg-risk-medium-bg text-risk-medium",
  high: "bg-risk-high-bg text-risk-high",
};
const label: Record<Level, string> = { low: "Low", medium: "Medium", high: "High" };

function Chip({ level }: { level: Level }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-semibold ${chip[level]}`}>
      <span className="h-2 w-2 rounded-full bg-current" />
      {label[level]}
    </span>
  );
}

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function Index() {
  const [input, setInput] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [screen, setScreen] = useState<"home" | "results" | "export">("home");
  const [copied, setCopied] = useState(false);
  const md = useMemo(() => (report ? toMarkdown(report) : ""), [report]);

  const check = () => {
    try {
      setReport(analyse(input));
      setError("");
      setScreen("results");
      window.scrollTo(0, 0);
    } catch {
      setError("That doesn't look like valid JSON. Check for missing commas or brackets.");
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <button onClick={() => setScreen("home")} className="text-lg font-extrabold tracking-tight">
            Reach<span className="text-primary">Check</span>
          </button>
          {report && (
            <nav className="flex gap-1 text-sm font-medium">
              {(["home", "results", "export"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setScreen(s)}
                  className={`rounded-full px-3 py-1.5 capitalize ${screen === s ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  {s}
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
        {screen === "home" && (
          <section className="space-y-6">
            <div>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                See what your AI agent can <span className="text-primary">really</span> do.
              </h1>
              <p className="mt-3 text-lg text-muted-foreground">
                Paste the tools you've connected to Claude, ChatGPT or n8n and get a plain-language map of its reach and risks.
              </p>
            </div>
            <label className="block">
              <span className="mb-2 block text-base font-semibold">Paste your MCP config or tool list (JSON)</span>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={12}
                spellCheck={false}
                placeholder='{ "mcpServers": { ... } }'
                className="w-full rounded-lg border-2 border-input bg-background p-4 font-mono text-sm outline-none focus:border-primary"
              />
            </label>
            {error && <p className="font-medium text-destructive">{error}</p>}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={check}
                disabled={!input.trim()}
                className="rounded-lg bg-primary px-6 py-3.5 text-lg font-bold text-primary-foreground disabled:opacity-40"
              >
                Check my agent
              </button>
              <select
                value=""
                onChange={(e) => {
                  setInput(SAMPLES[Number(e.target.value)]!.value);
                  setError("");
                }}
                className="rounded-lg border-2 border-input bg-background px-4 py-3.5 text-lg font-semibold"
              >
                <option value="" disabled>
                  Try an example ▾
                </option>
                {SAMPLES.map((s, i) => (
                  <option key={s.label} value={i}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-sm text-muted-foreground">🔒 Your config is checked in your browser and not stored.</p>
          </section>
        )}

        {screen === "results" && report && (
          <section className="space-y-8">
            <div className="rounded-xl border-2 p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Overall risk</p>
              <div className="mt-2 flex items-center gap-3">
                <span className={`rounded-lg px-4 py-1.5 text-3xl font-extrabold ${chip[report.overall]}`}>
                  {label[report.overall]}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Stat n={report.tools.length} t="tools" />
                <Stat n={report.warnings.length} t="warnings" />
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-2xl font-bold">Reach</h2>
              <div className="space-y-3">
                {report.tools.map((t, i) => (
                  <div key={i} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">{t.server}</p>
                        <p className="font-mono font-medium">{t.tool}</p>
                      </div>
                      <Chip level={t.level} />
                    </div>
                    <p className="mt-2">
                      <span className="font-semibold">Can:</span> {t.capabilities.join(" · ")}
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-semibold text-foreground">Touches:</span> {t.data.join(", ") || "—"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-2xl font-bold">Warnings</h2>
              {report.warnings.length === 0 && <p className="text-muted-foreground">No warnings found. 🎉</p>}
              <div className="space-y-3">
                {report.warnings.map((w, i) => (
                  <div key={i} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip level={w.severity} />
                      <p className="font-semibold break-all">{w.title}</p>
                    </div>
                    <p className="mt-2"><span className="font-semibold">Why it matters:</span> {w.why}</p>
                    <p className="mt-1"><span className="font-semibold">How to fix:</span> {w.fix}</p>
                  </div>
                ))}
              </div>
            </div>

            {report.signOff.length > 0 && (
              <div className="rounded-xl bg-risk-high-bg p-5">
                <h2 className="mb-2 text-2xl font-bold text-risk-high">Needs human sign-off</h2>
                <ul className="list-disc space-y-1 pl-5">
                  {report.signOff.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => setScreen("export")}
              className="w-full rounded-lg bg-primary px-6 py-3.5 text-lg font-bold text-primary-foreground"
            >
              Export for my policy →
            </button>
          </section>
        )}

        {screen === "export" && report && (
          <section className="space-y-5">
            <h1 className="text-3xl font-extrabold">Export</h1>
            <p className="text-muted-foreground">The REACH section of your Agent Behaviour Policy. Secrets are masked.</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => download("REACH.md", md, "text/markdown")}
                className="rounded-lg bg-primary px-5 py-3 font-bold text-primary-foreground"
              >
                Download REACH section
              </button>
              <button
                onClick={() => download("reach.json", JSON.stringify(report, null, 2), "application/json")}
                className="rounded-lg border-2 border-primary px-5 py-3 font-bold text-primary"
              >
                Download JSON
              </button>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(md);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="rounded-lg border-2 px-5 py-3 font-bold"
              >
                {copied ? "Copied!" : "Copy to clipboard"}
              </button>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-muted p-4 font-mono text-sm">{md}</pre>
          </section>
        )}
      </main>

      <footer className="border-t">
        <p className="mx-auto max-w-3xl px-5 py-6 text-sm text-muted-foreground">
          Not a compliance assessment. Built at Vibathon Algarve 2026.
        </p>
      </footer>
    </div>
  );
}

function Stat({ n, t }: { n: number; t: string }) {
  return (
    <div className="rounded-lg bg-muted p-3">
      <p className="text-3xl font-extrabold">{n}</p>
      <p className="text-muted-foreground">{t}</p>
    </div>
  );
}
