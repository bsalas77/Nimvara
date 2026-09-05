import test from "node:test";
import assert from "node:assert/strict";
import { createPreferenceStore, readPreferenceJson, readStringList, readKanbanViews } from "../public/preferences.js";

test("malformed and wrong-shaped preferences cannot break startup", () => {
  for (const raw of ["{", "null", "42", '"string"', "{}"])
    assert.deepEqual(readStringList({ getItem: () => raw }, "tabs", 8), []);
  assert.deepEqual(readStringList({ getItem: () => '["日本語.md",null,{},"日本語.md","B.md"]' }, "tabs", 8), ["日本語.md", "B.md"]);
  assert.deepEqual(readKanbanViews({ getItem: () => '[null,{}, {"name":"Work","filter":"todo"}]' }), [{ name: "Work", filter: "todo" }]);
});

test("denied preference storage preserves in-session changes and warns once", () => {
  let warnings = 0;
  const store = createPreferenceStore(() => { throw new Error("Denied"); }, () => warnings++);
  assert.equal(store.getItem("tabs"), null);
  store.setItem("tabs", '["A.md"]');
  assert.deepEqual(readStringList(store, "tabs", 8), ["A.md"]);
  assert.equal(warnings, 1);
});

test("quota failure cannot resurrect stale saved preferences", () => {
  let blocked = true, saved = "old";
  const store = createPreferenceStore(() => ({ getItem: () => saved, setItem: (_key, value) => { if (blocked) throw new Error("Quota"); saved = value; } }));
  store.setItem("key", "new");
  assert.equal(store.getItem("key"), "new");
  blocked = false;
  store.setItem("key", "newer");
  assert.equal(saved, "newer");
  assert.equal(store.getItem("key"), "newer");
});

test("invalid settings use defaults without overwriting persisted data", () => {
  let writes = 0;
  const storage = { getItem: () => "null", setItem: () => writes++ };
  assert.deepEqual(readPreferenceJson(storage, "settings", {}, (v) => v && typeof v === "object" && !Array.isArray(v)), {});
  assert.equal(writes, 0);
});
