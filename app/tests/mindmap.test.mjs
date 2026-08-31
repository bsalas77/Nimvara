import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { layoutMindMap, parseMindMap, proposeCanvasEdge, proposeCanvasNodeMove } from "../public/mindmap.js";

test("mind map derives branches from Markdown without changing source", () => {
  const markdown = "# Plan\n## Research\n- Interview\n  - Synthesize\n## Build\n";
  const before = markdown;
  const map = parseMindMap(markdown, "Roadmap.md");
  assert.equal(markdown, before);
  assert.equal(map.label, "Roadmap");
  assert.deepEqual(map.children[0].children.map((node) => node.label), ["Research", "Build"]);
  assert.equal(map.children[0].children[0].children[0].children[0].label, "Synthesize");
});

test("mind map ignores fenced examples and exposes unique wikilinks", () => {
  const map = parseMindMap("# Home\n[[Projects/Plan|Plan]]\n[[Projects/Plan]]\n```\n# Fake\n[[Secret]]\n```", "Home.md");
  assert.equal(map.children.filter((node) => node.target).length, 1);
  assert.equal(map.children.find((node) => node.target).target, "Projects/Plan");
  assert.ok(!JSON.stringify(map).includes("Secret"));
});

test("mind map layout is deterministic and keeps every node reachable", () => {
  const tree = parseMindMap("# One\n## Two\n## Three", "Map.md");
  const first = layoutMindMap(tree), second = layoutMindMap(tree);
  assert.deepEqual(first, second);
  assert.equal(first.edges.length, first.nodes.length - 1);
  assert.ok(first.width >= 720 && first.height >= 360);
});

test("canvas edge proposals validate nodes and remain review-only", () => {
  const source = JSON.stringify({ nodes: [{ id: "a" }, { id: "b" }], edges: [] });
  const proposal = proposeCanvasEdge(source, "a", "b");
  assert.match(proposal.content, /nimvara-edge-a-b/);
  assert.throws(() => proposeCanvasEdge(source, "a", "a"), /cannot connect/);
  assert.throws(() => proposeCanvasEdge(JSON.stringify({ nodes: [{ id: "a" }], edges: [] }), "a", "b"), /Both Canvas nodes/);
});

test("Canvas UI exposes review-first checkpoint restore", () => {
  const source = readFileSync(path.join(import.meta.dirname, "..", "public", "canvas-ui.js"), "utf8");
  assert.match(source, /Canvas history/);
  assert.match(source, /Restore this Canvas checkpoint/);
  assert.match(source, /expectedHash: canvas\.hash/);
});

test("canvas moves produce reviewable JSON proposals without mutating source", () => {
  const source = JSON.stringify({ nodes: [{ id: "a", x: 1, y: 2 }], edges: [] });
  const proposal = proposeCanvasNodeMove(source, "a", 120, 240);
  assert.deepEqual(JSON.parse(source).nodes[0], { id: "a", x: 1, y: 2 });
  assert.deepEqual(proposal.before, { x: 1, y: 2 });
  assert.deepEqual(proposal.after, { x: 120, y: 240 });
  assert.throws(() => proposeCanvasNodeMove(source, "missing", 0, 0), /not found/);
  assert.throws(() => proposeCanvasNodeMove(source, "a", 1e9, 0), /out of bounds/);
});
