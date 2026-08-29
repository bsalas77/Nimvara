import test from "node:test";
import assert from "node:assert/strict";
import { createDailyNote, dailyNotePath, filterRecords, organizeRecords, parseFrontmatter, parseTasks, proposeKanbanMove, proposeMindMapChild, proposePropertyEdit, proposeTaskToggle } from "../public/productivity.js";

test("daily notes use stable local dates and ordinary Markdown", () => {
  const date = new Date(2026, 7, 1, 23, 59);
  assert.equal(dailyNotePath(date), "Daily/2026-08-01.md");
  const note = createDailyNote(date);
  assert.match(note, /date: 2026-08-01/);
  assert.match(note, /- \[ \]/);
});

test("task aggregation ignores fenced examples and preserves source locations", () => {
  const tasks = parseTasks("- [ ] Real\n```\n- [ ] Example\n```\n- [x] Done", "Plan.md");
  assert.deepEqual(tasks, [
    { path: "Plan.md", line: 1, completed: false, text: "Real" },
    { path: "Plan.md", line: 5, completed: true, text: "Done" },
  ]);
});

test("frontmatter views filter predictable scalar properties", () => {
  const first = { path: "A.md", properties: parseFrontmatter("---\ntype: project\nstatus: active\n---\n# A") };
  const second = { path: "B.md", properties: parseFrontmatter("---\ntype: person\nstatus: active\n---") };
  assert.deepEqual(first.properties, { type: "project", status: "active" });
  assert.deepEqual(filterRecords([first, second], "type:project active").map((item) => item.path), ["A.md"]);
});

test("property records sort and group deterministically without changing source data", () => {
  const records = [
    { path: "B.md", properties: { status: "done", priority: "2" } },
    { path: "A.md", properties: { status: "open", priority: "10" } },
    { path: "C.md", properties: { status: "done", priority: "1" } },
  ];
  assert.deepEqual(organizeRecords(records, "priority").map((record) => record.path), ["C.md", "B.md", "A.md"]);
  assert.deepEqual(organizeRecords(records, "path", "status").map((record) => record.path), ["B.md", "C.md", "A.md"]);
  assert.equal(records[0].properties.priority, "2");
});

test("visual map edits create a reviewable Markdown proposal", () => {
  const source = "# Plan\n\n## Existing";
  const proposal = proposeMindMapChild(source, { line: 1, level: 1 }, "New branch\n");
  assert.equal(source, "# Plan\n\n## Existing");
  assert.equal(proposal.addition, "## New branch");
  assert.equal(proposal.content, "# Plan\n## New branch\n\n## Existing");
});

test("task completion proposal requires the same source line and text", () => {
  const source = "# Work\n- [ ] Ship it";
  const proposal = proposeTaskToggle(source, 2, "Ship it");
  assert.equal(source, "# Work\n- [ ] Ship it");
  assert.equal(proposal.content, "# Work\n- [x] Ship it");
  assert.throws(() => proposeTaskToggle(source, 2, "Changed"), /source changed/);
});

test("Kanban moves create reviewable Markdown status proposals", () => {
  const source = "- [ ] Ship it\n- [ ] Already (In progress)";
  const doing = proposeKanbanMove(source, 1, "Ship it", "doing");
  assert.equal(doing.content, "- [ ] Ship it (In progress)\n- [ ] Already (In progress)");
  const backlog = proposeKanbanMove(doing.content, 1, "Ship it (In progress)", "backlog");
  assert.equal(backlog.content, source);
  const done = proposeKanbanMove(source, 1, "Ship it", "done");
  assert.equal(done.content, "- [x] Ship it\n- [ ] Already (In progress)");
  assert.throws(() => proposeKanbanMove(source, 1, "Changed", "done"), /source changed/);
});

test("property changes remain scalar reviewable Markdown proposals", () => {
  const proposal = proposePropertyEdit("# Note", "status", "active");
  assert.match(proposal.content, /^---\nstatus: active\n---/);
  assert.throws(() => proposePropertyEdit("# Note", "bad key", "x"), /Property names/);
  assert.throws(() => proposePropertyEdit("# Note", "status", "[unsafe]"), /plain scalar/);
});
