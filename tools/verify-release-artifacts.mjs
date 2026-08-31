import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const manifest = JSON.parse(readFileSync(resolve(root, "implementation/RELEASE-ARTIFACT-MANIFEST-2026-08-31.json"), "utf8"));
const results = manifest.artifacts.map((expected) => {
  const absolute = resolve(root, expected.path);
  const bytes = readFileSync(absolute);
  const actual = { bytes: statSync(absolute).size, sha256: createHash("sha256").update(bytes).digest("hex") };
  return { path: expected.path, pass: actual.bytes === expected.bytes && actual.sha256 === expected.sha256, expected, actual };
});
const failed = results.filter((result) => !result.pass);
console.log(JSON.stringify({ schema: 1, verified: failed.length === 0, results }, null, 2));
if (failed.length) process.exitCode = 1;
