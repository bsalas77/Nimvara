import test from "node:test";
import assert from "node:assert/strict";
import { transformSelection } from "../public/editor-tools.js";
test("editor transformations preserve surrounding Markdown and selection", () => {
  const source = "Before text after";
  const result = transformSelection(source, 7, 11, "bold");
  assert.equal(result.value, "Before **text** after");
  assert.equal(result.value.slice(result.start, result.end), "text");
  assert.equal(transformSelection(source, 0, 0, "heading").value, "# Before text after");
  assert.equal(transformSelection(source, 0, 6, "list").value, "- Before text after");
  assert.equal(transformSelection(source, 7, 11, "strike").value, "Before ~~text~~ after");
  assert.equal(transformSelection(source, 0, 0, "task").value, "- [ ] Before text after");
  assert.equal(transformSelection(source, 0, 0, "quote").value, "> Before text after");
  const table = transformSelection(source, 7, 11, "table");
  assert.equal(table.value, "Before | Column 1 | Column 2 |\n| --- | --- |\n| Value | Value |\n after");
  assert.equal(table.value.slice(table.start, table.end), "Column 1");
});
