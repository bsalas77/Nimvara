import { createServer } from "node:http";
import { watch } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  NimvaraError,
  buildLinkIndex,
  canonicalRoot,
  createSnapshot,
  listHistory,
  listMarkdown,
  listSnapshots,
  listWorkspaceFiles,
  migrateWorkspace,
  noteContext,
  planRename,
  applyRename,
  exportStatic,
  readAttachmentPreview,
  planSnapshotPrune,
  pruneSnapshots,
  readMarkdown,
  revealWorkspaceFile,
  restoreHistory,
  restoreSnapshot,
  saveConflictCopy,
  saveMarkdown,
  safetyState,
  searchMarkdown,
  workspaceState
} from "./lantern-core.mjs";
import {
  cancelPreview,
  commitPreview,
  ingestionCapabilities,
  previewLocalImport,
  previewUrlCapture
} from "./ingestion-core.mjs";
import { validateExtensionManifest } from "./extension-manifest.mjs";

let workspace = null;
let workspaceWatcher = null;
let watchMode = "inactive";
let watchTimer = null;
const watchClients = new Set();
const port = Number(process.env.LANTERN_PORT ?? 4317);
const publicRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public");
const sampleWorkspace = path.resolve(publicRoot, "../../sample-workspace");

async function body(request) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes > 1024 * 1024) throw new NimvaraError("REQUEST_TOO_LARGE", "API request exceeded 1 MiB.", 413);
    chunks.push(chunk);
  }
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
}

function send(response, status, payload) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "http://tauri.localhost"
  });
  response.end(JSON.stringify(payload));
}

function requireWorkspace() {
  if (!workspace) throw new NimvaraError("NO_WORKSPACE", "Open or create a workspace first.", 409);
  return workspace;
}

function publishWorkspaceChange(filename = null) {
  const normalized = filename ? String(filename).replaceAll("\\", "/") : null;
  if (normalized === ".lantern" || normalized?.startsWith(".lantern/")) return;
  clearTimeout(watchTimer);
  watchTimer = setTimeout(() => {
    const payload = `event: workspace-change\ndata: ${JSON.stringify({ path: normalized, at: new Date().toISOString() })}\n\n`;
    for (const client of watchClients) client.write(payload);
  }, 100);
}

function startWorkspaceWatcher(root) {
  workspaceWatcher?.close();
  workspaceWatcher = null;
  watchMode = "fallback-polling";
  try {
    workspaceWatcher = watch(root, { recursive: true, persistent: false }, (_event, filename) => publishWorkspaceChange(filename));
    workspaceWatcher.on("error", () => {
      workspaceWatcher?.close();
      workspaceWatcher = null;
      watchMode = "fallback-polling";
    });
    watchMode = "native-recursive";
  } catch {
    watchMode = "fallback-polling";
  }
}

export const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") return send(response, 204, {});
  const url = new URL(request.url, `http://${request.headers.host}`);
  try {
    if (request.method === "GET" && !url.pathname.startsWith("/api/")) {
      const names = { "/": "index.html", "/app.js": "app.js", "/styles.css": "styles.css" };
      const name = names[url.pathname];
      if (!name) return send(response, 404, { error: { code: "NOT_FOUND", message: "Static file not found." } });
      const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8" };
      const data = await readFile(path.join(publicRoot, name));
      response.writeHead(200, { "content-type": types[path.extname(name)], "cache-control": "no-store" });
      return response.end(data);
    }
    if (request.method === "GET" && url.pathname === "/api/status") return send(response, 200, { workspace, sampleWorkspace, version: "0.7.0-dev", ingestion: ingestionCapabilities, watchMode });
    if (request.method === "GET" && url.pathname === "/api/events") {
      response.writeHead(200, {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-store",
        "connection": "keep-alive"
      });
      response.write(`event: ready\ndata: ${JSON.stringify({ watchMode })}\n\n`);
      watchClients.add(response);
      request.on("close", () => watchClients.delete(response));
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/workspace") {
      const input = await body(request);
      workspace = await canonicalRoot(input.path, Boolean(input.create));
      startWorkspaceWatcher(workspace);
      return send(response, 200, { workspace, files: await listMarkdown(workspace) });
    }
    if (request.method === "GET" && url.pathname === "/api/files") return send(response, 200, await listMarkdown(requireWorkspace()));
    if (request.method === "GET" && url.pathname === "/api/workspace-files") return send(response, 200, await listWorkspaceFiles(requireWorkspace()));
    if (request.method === "POST" && url.pathname === "/api/migration/copy") { const input = await body(request); return send(response, 200, await migrateWorkspace(input.source, input.destination)); }
    if (request.method === "POST" && url.pathname === "/api/publishing/export") { const input = await body(request); return send(response, 200, await exportStatic(requireWorkspace(), input.destination, input.paths)); }
    if (request.method === "GET" && url.pathname === "/api/workspace-files") return send(response, 200, await listWorkspaceFiles(requireWorkspace()));
    if (request.method === "GET" && url.pathname === "/api/workspace-state") return send(response, 200, await workspaceState(requireWorkspace(), url.searchParams.get("path")));
    if (request.method === "GET" && url.pathname === "/api/safety") {
      const state = await safetyState(requireWorkspace(), url.searchParams.get("path"));
      return send(response, 200, { ...state, watchMode });
    }
    if (request.method === "GET" && url.pathname === "/api/note-context") return send(response, 200, await noteContext(requireWorkspace(), url.searchParams.get("path")));
    if (request.method === "GET" && url.pathname === "/api/link-diagnostics") return send(response, 200, await buildLinkIndex(requireWorkspace()));
    if (request.method === "GET" && url.pathname === "/api/file") return send(response, 200, await readMarkdown(requireWorkspace(), url.searchParams.get("path")));
    if (request.method === "POST" && url.pathname === "/api/file/rename-plan") { const input = await body(request); return send(response, 200, await planRename(requireWorkspace(), input.from, input.to)); }
    if (request.method === "POST" && url.pathname === "/api/file/rename") { const input = await body(request); return send(response, 200, await applyRename(requireWorkspace(), input.from, input.to)); }
    if (request.method === "PUT" && url.pathname === "/api/file") {
      const input = await body(request);
      return send(response, 200, await saveMarkdown(requireWorkspace(), input.path, input.content, input.expectedHash ?? null));
    }
    if (request.method === "POST" && url.pathname === "/api/file/save-copy") {
      const input = await body(request);
      return send(response, 200, await saveConflictCopy(requireWorkspace(), input.path, input.content));
    }
    if (request.method === "POST" && url.pathname === "/api/attachment/reveal") {
      const input = await body(request);
      return send(response, 200, await revealWorkspaceFile(requireWorkspace(), input.path));
    }
    if (request.method === "GET" && url.pathname === "/api/attachment/preview") return send(response, 200, await readAttachmentPreview(requireWorkspace(), url.searchParams.get("path")));
    if (request.method === "POST" && url.pathname === "/api/search") {
      const input = await body(request);
      return send(response, 200, await searchMarkdown(requireWorkspace(), input.query));
    }
    if (request.method === "GET" && url.pathname === "/api/history") return send(response, 200, await listHistory(requireWorkspace(), url.searchParams.get("path")));
    if (request.method === "POST" && url.pathname === "/api/history/restore") {
      const input = await body(request);
      return send(response, 200, await restoreHistory(requireWorkspace(), input.checkpointId, input.expectedHash));
    }
    if (request.method === "POST" && url.pathname === "/api/snapshots") {
      const input = await body(request);
      return send(response, 200, await createSnapshot(requireWorkspace(), input.destination));
    }
    if (request.method === "GET" && url.pathname === "/api/snapshots") return send(response, 200, await listSnapshots(url.searchParams.get("destination")));
    if (request.method === "POST" && url.pathname === "/api/snapshots/prune-plan") { const input = await body(request); return send(response, 200, await planSnapshotPrune(input.destination, input.keep)); }
    if (request.method === "POST" && url.pathname === "/api/snapshots/prune") { const input = await body(request); return send(response, 200, await pruneSnapshots(input.destination, input.keep, input.confirm)); }
    if (request.method === "POST" && url.pathname === "/api/snapshots/restore") {
      const input = await body(request);
      return send(response, 200, await restoreSnapshot(input.snapshotPath, input.destination));
    }
    if (request.method === "GET" && url.pathname === "/api/ingestion/capabilities") return send(response, 200, ingestionCapabilities);
    if (request.method === "POST" && url.pathname === "/api/extensions/validate") { const input = await body(request); return send(response, 200, validateExtensionManifest(input)); }
    if (request.method === "POST" && url.pathname === "/api/ingestion/preview-url") {
      const input = await body(request);
      return send(response, 200, await previewUrlCapture(requireWorkspace(), input.url));
    }
    if (request.method === "POST" && url.pathname === "/api/ingestion/preview-local") {
      const input = await body(request);
      return send(response, 200, await previewLocalImport(requireWorkspace(), input.path));
    }
    if (request.method === "POST" && url.pathname === "/api/ingestion/commit") {
      const input = await body(request);
      return send(response, 200, await commitPreview(requireWorkspace(), input.previewId, input.destinationFolder, input.noteName, { allowDuplicate: Boolean(input.allowDuplicate) }));
    }
    if (request.method === "POST" && url.pathname === "/api/ingestion/cancel") {
      const input = await body(request);
      return send(response, 200, cancelPreview(requireWorkspace(), input.previewId));
    }
    return send(response, 404, { error: { code: "NOT_FOUND", message: "Unknown Nimvara API route." } });
  } catch (error) {
    const known = error instanceof NimvaraError;
    send(response, known ? error.status : 500, {
      error: { code: known ? error.code : "INTERNAL", message: error.message, details: error.details }
    });
  }
});

export const ready = new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(port, "127.0.0.1", () => {
    console.log(`Nimvara is ready at http://127.0.0.1:${port}`);
    resolve({ port });
  });
});
