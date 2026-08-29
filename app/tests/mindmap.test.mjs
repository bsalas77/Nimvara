import test from "node:test";
import assert from "node:assert/strict";
import { layoutMindMap, parseMindMap } from "../public/mindmap.js";

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
