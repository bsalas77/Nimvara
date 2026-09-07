import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  buildLinkIndex,
  attachmentDiagnostics,
  listWorkspaceFiles,
  parseMarkdownStructure,
  saveConflictCopy,
  workspaceState
} from "../server/lantern-core.mjs";

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "lantern-compat-"));
  await mkdir(path.join(root, "Projects"));
  await mkdir(path.join(root, "Archive"));
  return root;
}

test("Markdown structure captures headings, aliases, embeds, and ignores fenced examples", () => {
  const parsed = parseMarkdownStructure("# Title\n## Work\n[[Projects/Plan#Next|Roadmap]]\n![[image.png]]\n```\n[[Not a link]]\n```\n");
  assert.deepEqual(parsed.headings, [
    { level: 1, text: "Title", line: 1 },
    { level: 2, text: "Work", line: 2 }
  ]);
  assert.deepEqual(parsed.wikilinks.map(({ target, heading, alias, embed }) => ({ target, heading, alias, embed })), [
    { target: "Projects/Plan", heading: "Next", alias: "Roadmap", embed: false },
    { target: "image.png", heading: null, alias: null, embed: true }
  ]);
});

test("URL-encoded wikilink targets resolve without changing source bytes", async () => {
  const root = await fixture();
  await writeFile(path.join(root, "Projects", "My Note.md"), "# Note\n", "utf8");
  await writeFile(path.join(root, "Index.md"), "[[Projects/My%20Note]]\n", "utf8");
  const index = await buildLinkIndex(root);
  assert.equal(index.outgoing["Index.md"][0].status, "resolved");
  assert.equal(index.outgoing["Index.md"][0].path, "Projects/My Note.md");
  await rm(root, { recursive: true, force: true });
});

test("same-note heading and block references resolve without inventing a file", async (t) => {
  const root = await fixture(); t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, "Plan.md"), "# Plan\n[[#Plan]]\n[[#^proof]]\nEvidence ^proof\n", "utf8");
  const index = await buildLinkIndex(root);
  assert.deepEqual(index.outgoing["Plan.md"].map(({ status, path, heading }) => ({ status, path, heading })), [
    { status: "resolved", path: "Plan.md", heading: "Plan" },
    { status: "resolved", path: "Plan.md", heading: "^proof" }
  ]);
});

test("link index resolves exact, relative, and unique basename links with backlinks", async (t) => {
  const root = await fixture(); t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, "Home.md"), "[[Projects/Plan]]\n[[Unique]]");
  await writeFile(path.join(root, "Projects", "Plan.md"), "# Plan\n[[Sibling]]");
  await writeFile(path.join(root, "Projects", "Sibling.md"), "# Sibling");
  await writeFile(path.join(root, "Archive", "Unique.md"), "# Unique");
  const index = await buildLinkIndex(root);
  assert.deepEqual(index.outgoing["Home.md"].map((link) => link.path), ["Projects/Plan.md", "Archive/Unique.md"]);
  assert.equal(index.outgoing["Projects/Plan.md"][0].path, "Projects/Sibling.md");
  assert.equal(index.backlinks["Projects/Plan.md"][0].source, "Home.md");
  assert.equal(index.diagnostics.length, 0);
});

test("duplicate basenames are ambiguous and missing links remain diagnostic", async (t) => {
  const root = await fixture(); t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, "Home.md"), "[[Plan]]\n[[Absent]]");
  await writeFile(path.join(root, "Projects", "Plan.md"), "# Current");
  await writeFile(path.join(root, "Archive", "Plan.md"), "# Old");
  const index = await buildLinkIndex(root);
  assert.deepEqual(index.diagnostics.map(({ target, status }) => ({ target, status })), [
    { target: "Plan", status: "ambiguous" },
    { target: "Absent", status: "missing" }
  ]);
});

test("workspace inventory includes attachments without treating them as notes", async (t) => {
  const root = await fixture(); t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, "Note.md"), "# Note");
  await writeFile(path.join(root, "image.png"), Buffer.from([0, 1, 2, 3]));
  const files = await listWorkspaceFiles(root);
  assert.deepEqual(files.map(({ path: relative, kind }) => ({ path: relative, kind })), [
    { path: "image.png", kind: "attachment" },
    { path: "Note.md", kind: "markdown" }
  ]);
});

test("attachment diagnostics finds missing embeds and safe candidate matches without writing", async (t) => {
  const root = await fixture(); t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, "Home.md"), "![[Screenshots/My%20Image.png]]\n![](missing.png)\n");
  await mkdir(path.join(root, "Screenshots"));
  await writeFile(path.join(root, "Screenshots", "My Image.png"), Buffer.from([1, 2, 3]));
  await writeFile(path.join(root, "Archive", "missing.png"), Buffer.from([4]));
  const before = await readFile(path.join(root, "Home.md"));
  const report = await attachmentDiagnostics(root);
  assert.equal(report.attachmentCount, 2);
  assert.equal(report.diagnostics.length, 1);
  assert.deepEqual(report.diagnostics[0].candidates, ["Archive/missing.png"]);
  assert.deepEqual(await readFile(path.join(root, "Home.md")), before);
});

test("external edits change workspace state and conflict copy preserves both versions", async (t) => {
  const root = await fixture(); t.after(() => rm(root, { recursive: true, force: true }));
  const note = path.join(root, "Draft.md");
  await writeFile(note, "disk v1");
  const before = await workspaceState(root, "Draft.md");
  await writeFile(note, "disk v2");
  const after = await workspaceState(root, "Draft.md");
  assert.notEqual(after.note.hash, before.note.hash);
  const copy = await saveConflictCopy(root, "Draft.md", "editor draft");
  assert.equal(await readFile(note, "utf8"), "disk v2");
  assert.equal(await readFile(path.join(root, ...copy.path.split("/")), "utf8"), "editor draft");
  assert.match(copy.path, /^Draft \(Nimvara conflict .+\)\.md$/);
});
