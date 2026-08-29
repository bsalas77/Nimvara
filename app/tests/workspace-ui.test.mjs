import test from "node:test";
import assert from "node:assert/strict";
import { buildFileTree, extractTransclusion, normalizeSettings, parseMermaidFlowchart, renderMarkdownPreview } from "../public/workspace-ui.js";

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
