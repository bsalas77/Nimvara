import { createHash } from "node:crypto";

export function contentHash(content) {
  return createHash("sha256").update(Buffer.from(String(content), "utf8")).digest("hex");
}

export function entry(path, content, modifiedAt = 0, device = "unknown", available = true) {
  return { path, content: content === null ? null : String(content), hash: content === null ? null : contentHash(content), modifiedAt, device, available };
}

function key(value) { return value?.path; }

function byPath(entries = []) { return new Map(entries.map((value) => [key(value), value])); }

/**
 * Reconcile two device states against their common base. Content conflicts are
 * never merged heuristically or resolved by clock: both versions are returned.
 */
export function reconcile(base = [], local = [], remote = [], options = {}) {
  const baseMap = byPath(base), localMap = byPath(local), remoteMap = byPath(remote);
  const paths = new Set([...baseMap.keys(), ...localMap.keys(), ...remoteMap.keys()]);
  const decisions = [];
  for (const path of [...paths].sort()) {
    const b = baseMap.get(path) ?? null;
    const l = localMap.get(path) ?? null;
    const r = remoteMap.get(path) ?? null;
    const lh = l?.available === false ? "placeholder" : l?.hash ?? null;
    const rh = r?.available === false ? "placeholder" : r?.hash ?? null;
    const bh = b?.hash ?? null;
    if (lh === rh && lh !== "placeholder") { decisions.push({ path, status: "unchanged", winner: l ?? r }); continue; }
    if (lh === "placeholder" || rh === "placeholder") { decisions.push({ path, status: "deferred-placeholder", winner: null, local: l, remote: r }); continue; }
    if (lh === bh && rh !== bh) { decisions.push({ path, status: "remote-only", winner: r }); continue; }
    if (rh === bh && lh !== bh) { decisions.push({ path, status: "local-only", winner: l }); continue; }
    if (lh === rh) { decisions.push({ path, status: "same-change", winner: l ?? r }); continue; }
    decisions.push({ path, status: "conflict", winner: null, local: l, remote: r, conflictPath: conflictPath(path, options.device ?? "remote") });
  }
  return { decisions, conflicts: decisions.filter((item) => item.status === "conflict"), deferred: decisions.filter((item) => item.status === "deferred-placeholder") };
}

export function conflictPath(relative, device = "remote") {
  const slash = String(relative).lastIndexOf("/");
  const directory = slash >= 0 ? `${relative.slice(0, slash)}/` : "";
  const filename = slash >= 0 ? relative.slice(slash + 1) : relative;
  const dot = filename.toLowerCase().endsWith(".md") ? filename.length - 3 : filename.length;
  return `${directory}${filename.slice(0, dot)} (Nimvara conflict - ${device}).${filename.slice(dot + 1) || "md"}`;
}

export function detectRenames(before = [], after = []) {
  const oldFiles = before.filter((item) => item?.hash).map((item) => [item.hash, item.path]);
  const oldByHash = new Map(oldFiles);
  return after.filter((item) => item?.hash && oldByHash.has(item.hash) && oldByHash.get(item.hash) !== item.path)
    .map((item) => ({ from: oldByHash.get(item.hash), to: item.path, hash: item.hash }));
}

/**
 * Simulate a snapshot transfer. Interrupted transfers are discarded and never
 * become visible as a remote state.
 */
export function transferSnapshot(files = [], { interruptAfter = null, fail = false } = {}) {
  const copied = [];
  for (const file of files) {
    if (interruptAfter !== null && copied.length >= interruptAfter) return { status: "interrupted", published: false, files: [] };
    if (fail && copied.length === Math.max(0, files.length - 1)) return { status: "failed", published: false, files: [] };
    copied.push({ ...file });
  }
  return { status: "complete", published: true, files: copied };
}

export function applyDecisions(base = [], reconciliation) {
  const output = new Map(byPath(base));
  for (const item of reconciliation.decisions) {
    if (item.status === "local-only" || item.status === "remote-only" || item.status === "same-change" || item.status === "unchanged") {
      if (item.winner?.content === null) output.delete(item.path); else if (item.winner) output.set(item.path, item.winner);
    }
  }
  return [...output.values()].sort((a, b) => a.path.localeCompare(b.path));
}
