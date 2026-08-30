import test from "node:test";
import assert from "node:assert/strict";
import { filterRecords, organizeRecords, parseFrontmatter, parseScalar } from "../public/productivity.js";

test("frontmatter conservatively parses booleans and finite numbers", () => {
  const properties = parseFrontmatter("---\npriority: 10\narchived: false\nratio: 1.5\nwhen: 2026-08-30\n---");
  assert.equal(properties.priority, 10);
  assert.equal(properties.archived, false);
  assert.equal(properties.ratio, 1.5);
  assert.equal(properties.when, "2026-08-30");
  assert.equal(parseScalar("001"), "001");
});

test("typed property values filter and sort predictably", () => {
  const records = [
    { path: "low.md", properties: { priority: 2, archived: false } },
    { path: "high.md", properties: { priority: 10, archived: false } },
    { path: "old.md", properties: { priority: 1, archived: true } }
  ];
  assert.deepEqual(filterRecords(records, "priority:10").map((item) => item.path), ["high.md"]);
  assert.deepEqual(organizeRecords(records, "priority").map((item) => item.path), ["old.md", "low.md", "high.md"]);
});
