import test from "node:test";
import assert from "node:assert/strict";
import { toolCategory } from "../public/workspace-shell.js";
test("workspace tools remain reachable in predictable groups", () => {
  for (const title of ["Outline", "Links", "Attachments", "History"]) assert.equal(toolCategory(title), "note");
  assert.equal(toolCategory("Private AI"), "ai");
  assert.equal(toolCategory("Attachment repair"), "note");
  assert.equal(toolCategory("Capture and import"), "capture");
  assert.equal(toolCategory("PDF annotations"), "capture");
  assert.equal(toolCategory("Kanban board"), "organize");
  assert.equal(toolCategory("Properties and views"), "organize");
  assert.equal(toolCategory("Snapshot backup"), "workspace");
  assert.equal(toolCategory("Workspace settings"), "workspace");
  assert.equal(toolCategory("New future feature"), "note");
});
