import { type Mandate } from "./mandate";

export interface Demo {
  id: string;
  title: string;
  tagline: string;
  config: string;
  mandate: Mandate;
  /** Honest note about what the engine can and cannot establish for this scenario. */
  note: string;
}

export const DEMO_EXPORT_NOTICE = "DEMO — SAMPLE DATA. The configuration and mandate in this export are fictional samples supplied with ReachCheck, not a real owner attestation or a live integration.";

const demoMandate = (instruction: string, rules: Mandate["rules"]): Mandate => ({
  instruction,
  owner: "Sample owner (fictional demo)",
  confirmed: true,
  exhaustive: true,
  rules,
  version: 1,
});

export const DEMOS: Demo[] = [
  {
    id: "email-assistant",
    title: "Email assistant",
    tagline: "An assistant should draft replies, but its configuration includes sending email.",
    config: JSON.stringify({
      mcpServers: {
        gmail: {
          url: "https://mcp.example.com/gmail",
          tools: [
            { name: "search_email", description: "Search incoming email.", annotations: { readOnlyHint: true } },
            { name: "draft_reply", description: "Create a draft reply to a message." },
            { name: "send_email", description: "Send an email message.", annotations: { destructiveHint: true } },
          ],
        },
      },
    }, null, 2),
    mandate: demoMandate("Read incoming customer enquiries and prepare draft replies. A person sends every reply. The agent must never send email.", [
      { id: "rule-1", type: "Allow", action: "read", resource: "incoming customer enquiries", conditions: "For preparing draft replies only" },
      { id: "rule-2", type: "Must", action: "draft", resource: "customer replies", conditions: "A person sends every reply" },
      { id: "rule-3", type: "Never", action: "send", resource: "*", conditions: "The agent never sends email" },
    ]),
    note: "The declared send_email tool is publisher-provided metadata. The engine does not treat a tool name as proof of a send capability, so no mandate mismatch is computed for this format — the concern is shown as declared metadata with unknown capabilities.",
  },
  {
    id: "mcp-assistant",
    title: "Claude / MCP assistant",
    tagline: "An assistant should only read documents, but its declared tools also include editing files.",
    config: JSON.stringify({
      mcpServers: {
        filesystem: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/documents"],
          tools: [
            { name: "read_file", description: "Read the contents of a file.", annotations: { readOnlyHint: true } },
            { name: "list_directory", description: "List files in a directory.", annotations: { readOnlyHint: true } },
            { name: "edit_file", description: "Edit the contents of a file.", annotations: { destructiveHint: true } },
          ],
        },
      },
    }, null, 2),
    mandate: demoMandate("Read documents in the shared folder to answer questions. The assistant must never modify or delete files.", [
      { id: "rule-1", type: "Allow", action: "read", resource: "documents", conditions: "Read-only access for answering questions" },
      { id: "rule-2", type: "Never", action: "write", resource: "*", conditions: "The assistant never modifies files" },
      { id: "rule-3", type: "Never", action: "delete", resource: "*", conditions: "" },
    ]),
    note: "The declared edit_file tool is publisher-provided metadata. The engine cannot verify what it does in this deployment, so capabilities stay Unknown rather than being inferred from the name.",
  },
  {
    id: "n8n-workflow",
    title: "n8n workflow",
    tagline: "A workflow should prepare a response for approval, but includes a configured email-send step.",
    config: JSON.stringify({
      nodes: [
        { name: "Read enquiry", type: "n8n-nodes-base.gmail", typeVersion: 2, parameters: { resource: "message", operation: "get", messageId: "msg-123" } },
        { name: "Send reply", type: "n8n-nodes-base.gmail", typeVersion: 2, parameters: { resource: "message", operation: "send", sendTo: "customer@example.com" } },
      ],
    }, null, 2),
    mandate: demoMandate("Read incoming customer enquiries and prepare draft replies. Every reply requires a person's approval before sending.", [
      { id: "rule-1", type: "Allow", action: "read", resource: "incoming customer enquiries", conditions: "For preparing draft replies only" },
      { id: "rule-2", type: "Must", action: "draft", resource: "customer replies", conditions: "A person approves every reply" },
      { id: "rule-3", type: "Require approval", action: "send", resource: "*", conditions: "A person approves every reply before sending" },
    ]),
    note: "This snapshot uses the one n8n operation family the engine recognises (Gmail v2 message operations), so the configured send step is real engine output and the mandate comparison is computed, not hardcoded.",
  },
];
