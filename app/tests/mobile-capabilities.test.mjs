import assert from "node:assert/strict";
import { test } from "node:test";
import { getMobileCapabilities } from "../server/mobile-capabilities.mjs";

test("mobile capability contract is explicit and conservative", () => {
  const capabilities = getMobileCapabilities();
  assert.equal(capabilities.supported, false);
  assert.equal(capabilities.platforms.android.binary, false);
  assert.equal(capabilities.platforms.ipados.binary, false);
  assert.ok(capabilities.sharedGuarantees.includes("atomic-save"));
  capabilities.platforms.android.requiredQualification.push("test-only");
  assert.equal(getMobileCapabilities().platforms.android.requiredQualification.includes("test-only"), false);
});
