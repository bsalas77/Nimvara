# Nimvara extension capabilities

**Status:** development boundary, 2026-08-28

Nimvara now has three explicit integration surfaces. They are intentionally narrower than a general automation runtime.

## HTTP API

The local service in `app/server/index.mjs` exposes JSON endpoints under `/api/`. Existing surfaces include workspace open, Markdown read/write, search, workspace state, link diagnostics, history/checkpoints, snapshots, restore, attachment reveal, ingestion preview/commit/cancel, and capability reporting.

The API binds to `127.0.0.1` only. CORS is limited to the Tauri local origin. Request bodies are capped at 1 MiB. Paths are validated against the selected workspace; metadata and symlink traversal are blocked. The API is not an authenticated remote service and must not be exposed beyond the local machine.

## MCP server

`app/server/mcp-server.mjs` is a dependency-free stdio MCP bridge. Launch it with `NIMVARA_WORKSPACE` set to an existing workspace. It exposes read-only tools:

- `nimvara_capabilities`
- `nimvara_list_notes`
- `nimvara_read_note`
- `nimvara_search`
- `nimvara_note_context`
- `nimvara_diagnostics` (aggregate-only workspace health facts)

There is deliberately no MCP write tool. A future reviewed-write capability must remain inside the desktop approval/checkpoint flow and require typed, bounded actions. MCP input and note text are untrusted data.

The disposable JSON-RPC diagnostics smoke command is `node tools/mcp-diagnostics-smoke.mjs`. It creates a temporary note, requests `nimvara_diagnostics`, and asserts that only aggregate data is returned; it never uses or modifies a user vault. Run it outside restricted sandboxes that prohibit child processes.

Example host configuration:

```json
{
  "mcpServers": {
    "nimvara": {
      "command": "node",
      "args": ["E:/Obisian Project/Lantern-Project/app/server/mcp-server.mjs"],
      "env": { "NIMVARA_WORKSPACE": "E:/Notes" }
    }
  }
}
```

Use the bundled/runtime-managed Node executable in the shipped application or a future embedded host; end users should not be required to install Node for the desktop product. The example is for development integration until the installer bundles the bridge.

## AI provider and plugin boundary

The native Tauri command surface already includes local provider detection, hardware reporting, model manifest/hash verification, verified model import, read-only source-cited questions, and checkpoint-compatible edit proposals. The optional provider foundation supports loopback local endpoints and explicitly approved HTTPS paid endpoints. It does not persist API keys, silently download models, or give the model a file-writing tool.

An AI “plugin” should therefore be an adapter, not an unrestricted extension. Required contract:

1. declare provider, endpoint class, model, license, and data-retention behavior;
2. receive only the user-approved question/instruction and selected source excerpts;
3. return a typed answer or Markdown proposal with source references;
4. never execute note text, macros, scripts, or tool instructions from ingested content;
5. never write directly to the workspace;
6. expose cancellation, size, timeout, and cost limits;
7. route every durable edit through the existing expected-hash, checkpointed Save path.

The extension registry now also supports Ed25519 verification against an explicit session-scoped trusted-key set, bounded package verification, and versioned installation that refuses overwrite and never executes or enables code automatically. Production gates still open: protected OS credential vault for persistent trusted keys, provider compatibility tests, streaming/cancellation, signed model manifests, adversarial prompt-injection/data-exfiltration testing, measured retrieval/citation quality, and a permission-isolated extension host.

## Common feature order after the trust gate

The competitive backlog orders the next common knowledge-tool capabilities as follows:

1. safety center and two-device conflict qualification;
2. Obsidian migration rehearsal and large-vault performance budgets;
3. capture-first Android/iPad/iPhone workflows;
4. indexed search, quick switcher, tabs, backlinks, block references, and attachment management;
5. daily notes, tasks, templates, properties, saved views, and calendar support;
6. verified backup lifecycle and safe local AI;
7. visual canvas, web extension, handwriting/PDF workflows, collaboration, and a permissioned extension SDK.

Feature breadth must not move ahead of the data-safety and migration gates.
