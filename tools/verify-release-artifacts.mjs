import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const requestedManifest = process.argv[2] ?? "RELEASE-ARTIFACT-MANIFEST-CURRENT.json";
if (!/^[A-Za-z0-9._-]+\.json$/.test(requestedManifest)) {
  throw new Error("Manifest name must be a plain JSON filename.");
}
const manifest = JSON.parse(readFileSync(resolve(root, "implementation", requestedManifest), "utf8"));
const listedPaths = manifest.artifacts.map((item) => item.path);
const manifestProblems = [
  ...(Array.isArray(manifest.artifacts) && manifest.artifacts.length > 0 ? [] : ["manifest has no artifacts"]),
  ...listedPaths.filter((item, index) => listedPaths.indexOf(item) !== index).map((item) => `duplicate manifest path: ${item}`),
  ...manifest.artifacts.filter((item) => !/^dist\/[A-Za-z0-9._/-]+$/.test(item.path)).map((item) => `unsafe artifact path: ${item.path}`),
  ...manifest.artifacts.filter((item) => !Number.isSafeInteger(item.bytes) || item.bytes < 0).map((item) => `invalid byte count: ${item.path}`),
  ...manifest.artifacts.filter((item) => !/^[a-f0-9]{64}$/.test(item.sha256)).map((item) => `invalid SHA-256: ${item.path}`)
];
const results = manifest.artifacts.map((expected) => {
  const absolute = resolve(root, expected.path);
  const bytes = readFileSync(absolute);
  const actual = { bytes: statSync(absolute).size, sha256: createHash("sha256").update(bytes).digest("hex") };
  return { path: expected.path, pass: actual.bytes === expected.bytes && actual.sha256 === expected.sha256, expected, actual };
});
const failed = results.filter((result) => !result.pass);
console.log(JSON.stringify({ schema: 1, manifest: requestedManifest, verified: failed.length === 0 && manifestProblems.length === 0, manifestProblems, results }, null, 2));
if (failed.length || manifestProblems.length) process.exitCode = 1;
