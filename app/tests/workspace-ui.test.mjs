import test from "node:test";
import assert from "node:assert/strict";
import { buildFileTree, extractTransclusion, normalizeSettings, parseMermaidFlowchart, renderMarkdownPreview, sanitizeDiagnostics } from "../public/workspace-ui.js";

test("file tree groups folders deterministically without changing paths", () => {
  const tree = buildFileTree(["Root.md", "Projects/B.md", "Projects/A.md", "Daily/2026.md"]);
  assert.deepEqual(tree.files, [{ name: "Root.md", path: "Root.md" }]);
  assert.deepEqual(tree.folders.get("Projects").files.map((file) => file.path), ["Projects/A.md", "Projects/B.md"]);
});

test("safe preview supports callouts and wikilinks while escaping active HTML", () => {
  const rendered = renderMarkdownPreview("# Note\n> [!warning] Check\n> Body\n\n[[Plan|Roadmap]]\n![[image.png]]\n<script>alert(1)</script>");
  assert.match(rendered, /callout-warning/);
  assert.match(rendered, /data-preview-link="Plan"/);
  assert.match(rendered, /embed-indicator/);
  assert.ok(!rendered.includes("<script>"));
  assert.match(rendered, /&lt;script&gt;/);
});

test("local settings reject traversal and clamp editor size", () => {
  assert.deepEqual(normalizeSettings({ dailyFolder: "../bad", folderNoteName: "bad/name", editorFontSize: 99 }), { dailyFolder: "Daily", folderNoteName: "_index", editorFontSize: 24, theme: "dark" });
});

test("diagnostics redaction excludes note contents and full local paths", () => {
  const result = sanitizeDiagnostics({ workspace: "C:\\Users\\Barry\\Private Vault", notePath: "Projects\\Secret.md", openTabs: ["Projects\\Secret.md", "Daily\\2026-08-29.md"], dirty: true });
  assert.equal(result.workspaceName, "Private Vault");
  assert.deepEqual(result.openTabs, ["Secret.md", "2026-08-29.md"]);
  assert.equal(result.noteName, "Secret.md");
  assert.equal(Object.hasOwn(result, "content"), false);
  assert.equal(Object.hasOwn(result, "workspace"), false);
});

test("diagnostics compatibility summary drops path-bearing fields", () => {
  const result = sanitizeDiagnostics({ lastCompatibilityReport: {
    markdownNotes: 4,
    missingAttachments: 2,
    missingAttachmentPaths: ["Private/Secret.md:4 -> hidden.png"],
    longestRelativePath: "Private/Secret.md",
    extensions: { ".md": 4, "/absolute/private": 1 }
  } });
  assert.deepEqual(result.compatibility, { markdownNotes: 4, missingAttachments: 2, extensions: { ".md": 4 } });
  assert.ok(!JSON.stringify(result).includes("Secret"));
  assert.ok(!JSON.stringify(result).includes("hidden.png"));
});

test("rich preview renders tables tasks footnotes and math without execution", () => {
  const rendered = renderMarkdownPreview("| A | B |\n| --- | --- |\n| 1 | 2 |\n\n- [ ] Task\n\n$E=mc^2$[^n]\n\n[^n]: Note");
  assert.match(rendered, /<table>/);
  assert.match(rendered, /data-preview-task-line="5"/);
  assert.match(rendered, /math-inline/);
  assert.match(rendered, /class="footnotes"/);
});

test("transclusion extracts headings and block identifiers read-only", () => {
  const source = "# A\nText\n## Section\nKeep\n### Child\nMore\n## Next\nStop\nBlock text ^proof";
  assert.equal(extractTransclusion(source, "Note#Section"), "## Section\nKeep\n### Child\nMore");
  assert.equal(extractTransclusion(source, "Note#^proof"), "Block text");
});

test("constrained Mermaid parser accepts basic local flowcharts only", () => {
  const graph = parseMermaidFlowchart("flowchart TD\nA[Start] --> B[Finish]");
  assert.equal(graph.nodes.length, 2);
  assert.equal(graph.edges.length, 1);
  assert.equal(parseMermaidFlowchart("sequenceDiagram\nA->>B: unsafe"), null);
});
