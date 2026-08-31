import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { validateExtensionManifest } from "../server/extension-manifest.mjs";

const root = path.resolve(import.meta.dirname, "..");

test("MCP bridge is read-only and declares expected tools", async () => {
  const source = await readFile(path.join(root, "server", "mcp-server.mjs"), "utf8");
  for (const tool of ["nimvara_capabilities", "nimvara_list_notes", "nimvara_read_note", "nimvara_search", "nimvara_note_context", "nimvara_diagnostics"]) assert.match(source, new RegExp(tool));
  assert.doesNotMatch(source, /saveMarkdown|restoreSnapshot|write_note|delete_note/);
});

test("extension capability contract documents local API and guarded AI", async () => {
  const doc = await readFile(path.join(root, "..", "implementation", "EXTENSION-CAPABILITIES.md"), "utf8");
  assert.match(doc, /127\.0\.0\.1/);
  assert.match(doc, /no MCP write tool/);
  assert.match(doc, /never write directly to the workspace/);
  assert.match(doc, /checkpointed Save path/);
});

test("release surfaces use the packaged development version", async () => {
  const server = await readFile(path.join(root, "server", "index.mjs"), "utf8");
  const launcher = await readFile(path.join(root, "server", "desktop-launcher.mjs"), "utf8");
  assert.match(server, /version: "0\.7\.0-dev"/);
  assert.match(launcher, /version = "0\.7\.0-dev"/);
});

test("extension manifests are narrowly permissioned and unsigned builds are explicit", () => {
  const manifest = validateExtensionManifest({ id: "example.reader", name: "Reader", version: "1.2.3", permissions: ["notes:read", "search:read"] });
  assert.equal(manifest.status, "unsigned-development");
  assert.deepEqual(manifest.permissions, ["notes:read", "search:read"]);
  assert.throws(() => validateExtensionManifest({ id: "bad", name: "Bad", version: "1.0.0", permissions: ["notes:write"] }), /Unsupported extension permissions/);
  assert.throws(() => validateExtensionManifest({ id: "bad", name: "Bad", version: "latest" }), /semantic version/);
});

test("extension validation is exposed as a local API surface", async () => {
  const source = await readFile(path.join(root, "server", "index.mjs"), "utf8");
  assert.match(source, /\/api\/extensions\/validate/);
  assert.match(source, /validateExtensionManifest/);
});
