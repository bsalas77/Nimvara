import assert from "node:assert/strict";
import { test } from "node:test";
import { listExtensions, registerExtension, setExtensionEnabled } from "../server/extension-registry.mjs";

test("extension registry requires validation and keeps new extensions disabled", () => {
  const id = `test.reader.${Date.now()}`;
  const record = registerExtension({ id, name: "Test Reader", version: "1.0.0", permissions: ["notes:read"] });
  assert.equal(record.enabled, false);
  assert.equal(listExtensions().some((item) => item.id === id), true);
  assert.equal(setExtensionEnabled(id, true).enabled, true);
  assert.equal(setExtensionEnabled(id, false).enabled, false);
  assert.throws(() => registerExtension({ id: "bad", name: "Bad", version: "1.0.0", permissions: ["notes:write"] }), /Unsupported extension permissions/);
});

