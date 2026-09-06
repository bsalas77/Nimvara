/**
 * Minimal, read-only MCP stdio bridge for Nimvara.
 *
 * The bridge is intentionally dependency-free and never exposes a write tool.
 * Set NIMVARA_WORKSPACE to an absolute workspace folder before launching it.
 */
import { createInterface } from "node:readline";
import { canonicalRoot, diagnosticsReport, listMarkdown, readMarkdown, searchMarkdown, noteContext } from "./lantern-core.mjs";

const protocol = "2024-11-05";
let workspace = process.env.NIMVARA_WORKSPACE ? await canonicalRoot(process.env.NIMVARA_WORKSPACE, false) : null;

function result(id, value) {
  return { jsonrpc: "2.0", id, result: value };
}

function error(id, code, message) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

async function call(id, method, params = {}) {
  if (method === "initialize") return result(id, { protocolVersion: protocol, capabilities: { tools: { listChanged: false }, resources: {} }, serverInfo: { name: "nimvara", version: "0.7.2-dev" } });
  if (method === "notifications/initialized") return null;
  if (method === "tools/list") return result(id, { tools: [
    { name: "nimvara_capabilities", description: "Report the current read-only workspace, API, and AI boundary capabilities.", inputSchema: { type: "object", properties: {} } },
    { name: "nimvara_list_notes", description: "List Markdown notes in the selected workspace.", inputSchema: { type: "object", properties: {} } },
    { name: "nimvara_read_note", description: "Read one Markdown note by relative path.", inputSchema: { type: "object", required: ["path"], properties: { path: { type: "string" } } } },
    { name: "nimvara_search", description: "Search note content and paths using Nimvara's local index boundary.", inputSchema: { type: "object", required: ["query"], properties: { query: { type: "string" } } } },
    { name: "nimvara_note_context", description: "Return headings, links, backlinks, and diagnostics for a note.", inputSchema: { type: "object", required: ["path"], properties: { path: { type: "string" } } } },
    { name: "nimvara_diagnostics", description: "Return aggregate privacy-safe workspace diagnostics without note contents or identifying paths.", inputSchema: { type: "object", properties: {} } }
  ] });
  if (method !== "tools/call") return error(id, -32601, `Unsupported method: ${method}`);
  if (!workspace) return error(id, -32001, "Set NIMVARA_WORKSPACE to an existing workspace before using tools.");
  const name = params.name;
  let value;
  if (name === "nimvara_capabilities") value = { workspace: "read-only Markdown access", httpApi: "available at /api/* when the desktop service is running", mcp: "read-only stdio tools", ai: "optional adapter; local loopback or explicitly approved HTTPS; no MCP write tool" };
  else if (name === "nimvara_list_notes") value = await listMarkdown(workspace);
  else if (name === "nimvara_read_note") value = await readMarkdown(workspace, params.arguments?.path);
  else if (name === "nimvara_search") value = await searchMarkdown(workspace, params.arguments?.query);
  else if (name === "nimvara_note_context") value = await noteContext(workspace, params.arguments?.path);
  else if (name === "nimvara_diagnostics") value = await diagnosticsReport(workspace, "0.7.2-dev");
  else return error(id, -32602, `Unknown or non-read-only tool: ${name}`);
  return result(id, { content: [{ type: "text", text: JSON.stringify(value) }], structuredContent: value });
}

const input = createInterface({ input: process.stdin, crlfDelay: Infinity });
for await (const line of input) {
  if (!line.trim()) continue;
  let message;
  try { message = JSON.parse(line); } catch { process.stdout.write(`${JSON.stringify(error(null, -32700, "Invalid JSON-RPC message."))}\n`); continue; }
  try {
    const response = await call(message.id ?? null, message.method, message.params);
    if (response) process.stdout.write(`${JSON.stringify(response)}\n`);
  } catch (caught) {
    process.stdout.write(`${JSON.stringify(error(message.id ?? null, -32000, caught.message))}\n`);
  }
}
