import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const workspace = await mkdtemp(path.join(os.tmpdir(), "nimvara-mcp-smoke-"));
await writeFile(path.join(workspace, "Private.md"), "private content");
const child = spawn(process.execPath, [path.join(root, "app", "server", "mcp-server.mjs")], { env: { ...process.env, NIMVARA_WORKSPACE: workspace }, stdio: ["pipe", "pipe", "pipe"] });
try {
  const response = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("MCP diagnostics response timed out")), 5_000);
    let buffer = "";
    child.stdout.on("data", (chunk) => {
      buffer += chunk;
      const line = buffer.split(/\r?\n/).find((item) => item.trim());
      if (!line) return;
      clearTimeout(timer);
      try { resolve(JSON.parse(line)); } catch (error) { reject(error); }
    });
    child.once("error", reject);
    child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "nimvara_diagnostics", arguments: {} } })}\n`);
  });
  const serialized = JSON.stringify(response);
  if (!serialized.includes("markdownCount") || serialized.includes("Private.md") || serialized.includes("private content") || serialized.includes(workspace)) throw new Error("MCP diagnostics privacy assertion failed.");
  console.log(JSON.stringify({ verified: true, tool: "nimvara_diagnostics", aggregateOnly: true }));
} finally {
  child.kill();
  await rm(workspace, { recursive: true, force: true });
}
