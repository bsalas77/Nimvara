import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const file = resolve(root, "dist", "nimvara.cdx.json");
const bom = JSON.parse(readFileSync(file, "utf8"));
const failures = [];
if (bom.bomFormat !== "CycloneDX") failures.push("bomFormat must be CycloneDX");
if (bom.specVersion !== "1.5") failures.push("specVersion must be 1.5");
if (!/^urn:uuid:[0-9a-f-]{36}$/i.test(bom.serialNumber || "")) failures.push("serialNumber must be a UUID URN");
if (bom.version !== 1) failures.push("version must be 1");
if (bom.metadata?.component?.name !== "Nimvara" || bom.metadata?.component?.version !== "0.7.1") failures.push("application identity is missing or unexpected");
if (!Array.isArray(bom.components) || bom.components.length === 0) failures.push("components must be non-empty");
const refs = new Set();
for (const component of bom.components || []) {
  if (!component.name || !component.version || !/^pkg:(cargo|npm)\//.test(component.purl || "")) failures.push("component has invalid package identity");
  if (refs.has(component["bom-ref"])) failures.push(`duplicate bom-ref: ${component["bom-ref"]}`);
  refs.add(component["bom-ref"]);
  for (const hash of component.hashes || []) {
    if (hash.alg !== "SHA-256" || !/^[0-9a-f]{64}$/i.test(hash.content || "")) failures.push(`invalid SHA-256 for ${component.name}`);
  }
}
const purls = (bom.components || []).map((component) => component.purl);
if (purls.some((purl, index) => index > 0 && purl.localeCompare(purls[index - 1]) < 0)) failures.push("components are not sorted by purl");
const result = { schema: 1, verified: failures.length === 0, file: "dist/nimvara.cdx.json", components: bom.components?.length || 0, failures };
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exitCode = 1;
