import assert from "node:assert/strict";
import { test } from "node:test";
import { proposeKanbanMove } from "../public/productivity.js";

test("Kanban supports safe custom statuses without auto-completing tasks", () => {
  const proposal = proposeKanbanMove("- [ ] Draft release\n", 1, "Draft release", "review_ready");
  assert.equal(proposal.column, "review_ready");
  assert.match(proposal.after, /\[ \].*\(review ready\)/);
  assert.throws(() => proposeKanbanMove("- [ ] Draft\n", 1, "Draft", "../unsafe"), /safe name/);
});
