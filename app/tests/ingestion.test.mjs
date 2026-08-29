import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  MAX_LOCAL_BYTES,
  cancelPreview,
  commitPreview,
  isBlockedAddress,
  previewLocalImport,
  previewUrlCapture,
  sanitizeHtmlToMarkdown,
  validatePublicUrl
} from "../server/ingestion-core.mjs";
import { searchMarkdown, sha256 } from "../server/lantern-core.mjs";

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "lantern-ingest-"));
  const workspace = path.join(root, "Workspace");
  const sources = path.join(root, "Sources");
  await mkdir(workspace); await mkdir(sources);
  return { root, workspace, sources };
}

test("SSRF policy blocks schemes, credentials, local names, and private/special addresses", () => {
  for (const value of [
    "file:///etc/passwd", "ftp://example.com/a", "http://user:pass@example.com/",
    "http://localhost/", "http://service.local/", "http://127.0.0.1/", "http://10.2.3.4/",
    "http://169.254.169.254/latest/meta-data", "http://192.168.1.1/", "http://[::1]/"
  ]) assert.throws(() => validatePublicUrl(value));
  assert.equal(validatePublicUrl("https://example.org/path#fragment").href, "https://example.org/path");
  assert.equal(isBlockedAddress("8.8.8.8"), false);
  assert.equal(isBlockedAddress("172.20.1.1"), true);
});

test("HTML sanitizer discards active content, handlers, forms, and javascript URLs", () => {
  const html = `<html><head><title>Café &amp; Research</title><link rel="canonical" href="/clean"></head><body onload="steal()"><h1>Useful</h1><script>alert(1)</script><style>.x{}</style><p>Hello <b>world</b>.</p><a href="javascript:steal()">bad</a><form><input value="secret"></form></body></html>`;
  const result = sanitizeHtmlToMarkdown(html, "https://example.org/source");
  assert.equal(result.title, "Café & Research");
  assert.equal(result.canonicalUrl, "https://example.org/clean");
  assert.match(result.markdown, /# Useful/);
  assert.match(result.markdown, /Hello world/);
  assert.doesNotMatch(result.markdown, /alert|steal|secret|javascript|onload|<script/i);
});

test("URL preview is read-only, records canonical provenance, and commits searchable Markdown", async (t) => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  const fetcher = async () => ({
    url: "https://example.org/article?utm_source=test",
    contentType: "text/html; charset=utf-8",
    body: Buffer.from(`<title>Unicode 🏮</title><link rel="canonical" href="https://example.org/article"><article><h1>Capture</h1><p>Searchable ingestion phrase.</p><script>bad()</script></article>`)
  });
  const before = await readdir(f.workspace);
  const preview = await previewUrlCapture(f.workspace, "https://example.org/article", fetcher);
  assert.deepEqual(await readdir(f.workspace), before);
  assert.equal(preview.provenance.canonicalUrl, "https://example.org/article");
  assert.equal(preview.provenance.extractorStatus, "lossy");
  const committed = await commitPreview(f.workspace, preview.id, "Captured", "Unicode 🏮.md");
  const note = await readFile(path.join(f.workspace, ...committed.notePath.split("/")), "utf8");
  assert.match(note, /lantern-provenance:v1/);
  assert.match(note, /canonical-url: "https:\/\/example.org\/article"/);
  assert.match(note, /content-sha256: "[a-f0-9]{64}"/);
  assert.doesNotMatch(note, /<script|bad\(\)/);
  assert.equal((await searchMarkdown(f.workspace, "searchable ingestion phrase"))[0].path, committed.notePath);
});

test("canonical URL and content hash duplicates are detected before write", async (t) => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  const fetcher = async () => ({ url: "https://example.org/a", contentType: "text/html", body: Buffer.from("<title>A</title><p>Same material</p>") });
  const first = await previewUrlCapture(f.workspace, "https://example.org/a", fetcher);
  await commitPreview(f.workspace, first.id, "", "First");
  const second = await previewUrlCapture(f.workspace, "https://example.org/a?again=1", fetcher);
  assert.equal(second.duplicate.notePath, "First.md");
  await assert.rejects(commitPreview(f.workspace, second.id, "", "Second"), (error) => error.code === "DUPLICATE_FOUND");
  assert.equal(await stat(path.join(f.workspace, "Second.md")).catch(() => null), null);
  await commitPreview(f.workspace, second.id, "", "Second", { allowDuplicate: true });
});

test("PDF/DOCX use preservation-only capability and never modify source bytes", async (t) => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  for (const extension of [".pdf", ".docx"]) {
    const source = path.join(f.sources, `Résumé 日本語${extension}`);
    const bytes = Buffer.concat([Buffer.from(`untrusted-${extension}-bytes-`), Buffer.from([0, 1])]);
    await writeFile(source, bytes);
    const preview = await previewLocalImport(f.workspace, source);
    assert.equal(preview.extractorStatus, "preserved-only");
    const committed = await commitPreview(f.workspace, preview.id, "Imports", `Imported ${extension.slice(1)}`);
    assert.deepEqual(await readFile(source), bytes);
    assert.deepEqual(await readFile(path.join(f.workspace, ...committed.attachment.split("/"))), bytes);
    assert.equal(committed.provenance.originalHash, sha256(bytes));
  }
});

test("malformed UTF-8 is partial and preserved; unsupported and oversized inputs fail without writes", async (t) => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  const malformed = path.join(f.sources, "bad.txt");
  await writeFile(malformed, Buffer.from([0x66, 0x6f, 0x80, 0x6f]));
  const partial = await previewLocalImport(f.workspace, malformed);
  assert.equal(partial.extractorStatus, "partial");
  assert.equal(partial.provenance.originalHash, sha256(await readFile(malformed)));
  const unsupported = path.join(f.sources, "macro.xlsm");
  await writeFile(unsupported, "x");
  await assert.rejects(previewLocalImport(f.workspace, unsupported), (error) => error.code === "UNSUPPORTED_IMPORT");
  const oversized = path.join(f.sources, "huge.txt");
  const handle = await import("node:fs/promises").then(({ open }) => open(oversized, "w"));
  await handle.truncate(MAX_LOCAL_BYTES + 1); await handle.close();
  await assert.rejects(previewLocalImport(f.workspace, oversized), (error) => error.code === "LOCAL_TOO_LARGE");
  assert.deepEqual((await readdir(f.workspace)).filter((name) => name !== ".lantern"), []);
});

test("cancel writes nothing and retry creates a fresh preview", async (t) => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  const source = path.join(f.sources, "cancel.md"); await writeFile(source, "# Cancel\n");
  const preview = await previewLocalImport(f.workspace, source);
  assert.equal(cancelPreview(f.workspace, preview.id).cancelled, true);
  await assert.rejects(commitPreview(f.workspace, preview.id, "", "Should not exist"), (error) => error.code === "PREVIEW_NOT_FOUND");
  const retry = await previewLocalImport(f.workspace, source);
  await commitPreview(f.workspace, retry.id, "", "Retry");
  assert.equal(await readFile(source, "utf8"), "# Cancel\n");
});

test("commit rollback removes note and newly preserved attachment on failure", async (t) => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  const source = path.join(f.sources, "rollback.html"); await writeFile(source, "<title>Rollback</title><p>content</p>");
  const preview = await previewLocalImport(f.workspace, source);
  await assert.rejects(commitPreview(f.workspace, preview.id, "Inbox", "Rollback", { failAfterNoteForTest: true }));
  assert.equal(await stat(path.join(f.workspace, "Inbox", "Rollback.md")).catch(() => null), null);
  const attachments = path.join(f.workspace, "Attachments", "Imports");
  assert.deepEqual(await readdir(attachments).catch(() => []), []);
  assert.equal(await readFile(source, "utf8"), "<title>Rollback</title><p>content</p>");
});
