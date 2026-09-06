import { createHash, randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const cargoLock = readFileSync(resolve(root, "app", "src-tauri", "Cargo.lock"), "utf8");
const lock = JSON.parse(readFileSync(resolve(root, "app", "package-lock.json"), "utf8"));
const components = new Map();
for (const block of cargoLock.split("[[package]]").slice(1)) {
  const field = (name) => block.match(new RegExp(`^${name} = "([^"]+)"`, "m"))?.[1];
  const pkg = { name: field("name"), version: field("version"), checksum: field("checksum") };
  if (!pkg.name || !pkg.version) continue;
  components.set(`cargo:${pkg.name}@${pkg.version}`, {
    type: "library",
    "bom-ref": `pkg:cargo/${encodeURIComponent(pkg.name)}@${pkg.version}`,
    name: pkg.name,
    version: pkg.version,
    purl: `pkg:cargo/${encodeURIComponent(pkg.name)}@${pkg.version}`,
    hashes: pkg.checksum ? [{ alg: "SHA-256", content: pkg.checksum }] : undefined
  });
}
for (const [path, pkg] of Object.entries(lock.packages || {})) {
  if (!path || !pkg.version) continue;
  components.set(`npm:${pkg.name || path}@${pkg.version}`, {
    type: "library",
    "bom-ref": `pkg:npm/${encodeURIComponent(pkg.name || path)}@${pkg.version}`,
    name: pkg.name || path,
    version: pkg.version,
    purl: `pkg:npm/${encodeURIComponent(pkg.name || path)}@${pkg.version}`
  });
}
const bom = {
  bomFormat: "CycloneDX",
  specVersion: "1.5",
  serialNumber: `urn:uuid:${randomUUID()}`,
  version: 1,
  metadata: {
    timestamp: new Date().toISOString(),
    component: { type: "application", name: "Nimvara", version: "0.7.2" },
    tools: { components: [{ type: "application", name: "Nimvara zero-dependency SBOM generator", version: "1" }] }
  },
  components: [...components.values()].sort((a, b) => a.purl.localeCompare(b.purl))
};
const output = resolve(root, "dist", "nimvara.cdx.json");
writeFileSync(output, `${JSON.stringify(bom, null, 2)}\n`);
const digest = createHash("sha256").update(readFileSync(output)).digest("hex");
console.log(`${output}\nSHA256 ${digest}\nComponents ${bom.components.length}`);
