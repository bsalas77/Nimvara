import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const manifest = JSON.parse(readFileSync(resolve(root, "implementation/RELEASE-ARTIFACT-MANIFEST-2026-08-31.json"), "utf8"));
const expectedPaths = new Set([
  "dist/Nimvara-Setup-0.7.0-dev.exe",
  "dist/Nimvara-0.7.0-dev.msix",
  "dist/Nimvara_0.7.0_amd64.deb",
  "dist/nimvara.cdx.json"
]);
const listedPaths = manifest.artifacts.map((item) => item.path);
const manifestProblems = [
  ...listedPaths.filter((item, index) => listedPaths.indexOf(item) !== index).map((item) => `duplicate manifest path: ${item}`),
  ...listedPaths.filter((item) => !expectedPaths.has(item)).map((item) => `unexpected manifest path: ${item}`),
  ...[...expectedPaths].filter((item) => !listedPaths.includes(item)).map((item) => `missing manifest path: ${item}`)
];
const results = manifest.artifacts.map((expected) => {
  const absolute = resolve(root, expected.path);
  const bytes = readFileSync(absolute);
  const actual = { bytes: statSync(absolute).size, sha256: createHash("sha256").update(bytes).digest("hex") };
  return { path: expected.path, pass: actual.bytes === expected.bytes && actual.sha256 === expected.sha256, expected, actual };
});
const failed = results.filter((result) => !result.pass);
console.log(JSON.stringify({ schema: 1, verified: failed.length === 0 && manifestProblems.length === 0, manifestProblems, results }, null, 2));
if (failed.length || manifestProblems.length) process.exitCode = 1;
