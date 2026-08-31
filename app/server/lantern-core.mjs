import { createHash, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { constants } from "node:fs";
import {
  access,
  copyFile,
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import path from "node:path";

const META = ".lantern";
const HISTORY = path.join(META, "history");
const SNAPSHOT_FOLDER = "lantern-snapshots";

export class NimvaraError extends Error {
  constructor(code, message, status = 400, details = undefined) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function sha256(data) {
  return createHash("sha256").update(data).digest("hex");
}

export function normalizeBackupSchedule(input = {}) {
  const enabled = Boolean(input.enabled);
  const intervalMinutes = Math.min(10080, Math.max(15, Number(input.intervalMinutes) || 60));
  const destination = typeof input.destination === "string" ? input.destination.trim() : "";
  if (enabled && !destination) throw new NimvaraError("INVALID_BACKUP_SCHEDULE", "An external backup destination is required when scheduling is enabled.");
  return { enabled, intervalMinutes, destination, nextRunAt: enabled ? new Date(Date.now() + intervalMinutes * 60_000).toISOString() : null };
}

export function safeRelative(input) {
  if (typeof input !== "string" || !input.trim()) {
    throw new NimvaraError("INVALID_PATH", "A relative Markdown path is required.");
  }
  const normalized = input.replaceAll("\\", "/").replace(/^\/+/, "");
  const parts = normalized.split("/");
  if (parts.some((part) => !part || part === "." || part === "..")) {
    throw new NimvaraError("PATH_ESCAPE", "The path must stay inside the workspace.");
  }
  if (parts[0].toLowerCase() === META) {
    throw new NimvaraError("RESERVED_PATH", "Nimvara metadata is not editable as a note.");
  }
  if (!normalized.toLowerCase().endsWith(".md")) {
    throw new NimvaraError("NOT_MARKDOWN", "This vertical slice edits Markdown files only.");
  }
  return normalized;
}

export async function canonicalRoot(root, create = false) {
  const absolute = path.resolve(root);
  if (create) await mkdir(absolute, { recursive: true });
  const info = await lstat(absolute).catch(() => null);
  if (info?.isSymbolicLink()) throw new NimvaraError("SYMLINK_WORKSPACE", "A workspace root cannot be a symbolic link or junction.");
  if (!info?.isDirectory()) throw new NimvaraError("NOT_DIRECTORY", "Workspace folder does not exist.");
  await access(absolute, constants.R_OK | constants.W_OK);
  return realpath(absolute);
}

async function rejectLinkedComponents(root, candidate) {
  const rootReal = await realpath(root);
  const relative = path.relative(rootReal, candidate);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) throw new NimvaraError("PATH_ESCAPE", "Path escaped the workspace.");
  let current = rootReal;
  for (const component of relative.split(path.sep)) {
    current = path.join(current, component);
    const info = await lstat(current).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
    if (!info) break;
    if (info.isSymbolicLink()) throw new NimvaraError("SYMLINK_PATH", "Nimvara will not follow a symbolic link or junction inside a workspace.");
  }
  return rootReal;
}

export async function resolveInside(root, relative) {
  const safe = safeRelative(relative);
  // Resolve against the canonical workspace path. macOS temporary directories
  // are commonly exposed through a symlink (for example /var -> /private/var),
  // so comparing a lexical path to realpath(root) incorrectly reports every
  // valid file as escaping the workspace.
  const canonical = await realpath(root);
  const candidate = path.resolve(canonical, ...safe.split("/"));
  const prefix = canonical.endsWith(path.sep) ? canonical : `${canonical}${path.sep}`;
  if (!candidate.startsWith(prefix)) throw new NimvaraError("PATH_ESCAPE", "Path escaped the workspace.");
  await rejectLinkedComponents(canonical, candidate);
  return { absolute: candidate, relative: safe };
}

async function walk(root, directory = root, includeMetadata = false) {
  const entries = await readdir(directory, { withFileTypes: true });
  const output = [];
  for (const entry of entries) {
    if (!includeMetadata && entry.name === META) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) output.push(...await walk(root, absolute, includeMetadata));
    else output.push({ absolute, relative: path.relative(root, absolute).replaceAll("\\", "/") });
  }
  return output;
}

export async function listMarkdown(root) {
  const files = await walk(root);
  return files.filter((file) => file.relative.toLowerCase().endsWith(".md")).map((file) => file.relative).sort();
}

export async function listWorkspaceFiles(root) {
  const files = await walk(root);
  const output = [];
  for (const file of files) {
    const info = await stat(file.absolute);
    output.push({
      path: file.relative,
      kind: file.relative.toLowerCase().endsWith(".md") ? "markdown" : "attachment",
      extension: path.extname(file.relative).toLowerCase(),
      bytes: info.size,
      modifiedAt: info.mtime.toISOString()
    });
  }
  return output.sort((a, b) => a.path.localeCompare(b.path));
}

export async function migrateWorkspace(sourcePath, destinationPath) {
  const source = path.resolve(String(sourcePath));
  const destination = path.resolve(String(destinationPath));
  if (source === destination || destination.startsWith(`${source}${path.sep}`)) throw new NimvaraError("MIGRATION_DESTINATION", "Migration destination must be outside the source vault.");
  const sourceInfo = await lstat(source).catch(() => null);
  if (!sourceInfo?.isDirectory() || sourceInfo.isSymbolicLink()) throw new NimvaraError("MIGRATION_SOURCE", "Migration source must be an existing, non-symlink folder.");
  await access(source, constants.R_OK);
  const existingDestination = await lstat(destination).catch(() => null);
  if (existingDestination) throw new NimvaraError("MIGRATION_DESTINATION", "Migration destination must not already exist; choose a new empty path.");
  await mkdir(destination, { recursive: false });
  const entries = await walk(source);
  const manifest = [];
  const progressPath = path.join(destination, ".nimvara-migration-progress.json");
  const cancelPath = path.join(destination, ".nimvara-migration-cancel");
  const writeProgress = async (phase, completed) => {
    await writeFile(progressPath, JSON.stringify({ schema: 1, phase, completed, total: entries.length, updatedAt: new Date().toISOString() }, null, 2), { flag: "w" });
  };
  try {
    await writeProgress("copying", 0);
    for (const entry of entries) {
      const relative = entry.relative.replaceAll("\\", "/");
      if (relative === META || relative.startsWith(`${META}/`)) continue;
      const target = path.join(destination, ...relative.split("/"));
      await mkdir(path.dirname(target), { recursive: true });
      const bytes = await readFile(entry.absolute);
      await writeFile(target, bytes, { flag: "wx" });
      const hash = sha256(bytes);
      const verified = sha256(await readFile(target));
      if (hash !== verified) throw new NimvaraError("MIGRATION_VERIFY", `Copied file failed verification: ${relative}`);
      manifest.push({ path: relative, bytes: bytes.length, sha256: hash });
      await writeProgress("copying", manifest.length);
      if (await access(cancelPath).then(() => true).catch(() => false)) {
        throw new NimvaraError("MIGRATION_CANCELLED", "Migration cancelled by the user.");
      }
    }
    const report = { schema: 1, source, destination, createdAt: new Date().toISOString(), files: manifest };
    await writeFile(path.join(destination, ".nimvara-migration.json"), JSON.stringify(report, null, 2), { flag: "wx" });
    await writeProgress("complete", manifest.length);
    await rm(progressPath, { force: true });
    return report;
  } catch (error) {
    await rm(destination, { recursive: true, force: true });
    throw error;
  }
}

export async function readMigrationProgress(destinationPath) {
  const destination = path.resolve(String(destinationPath));
  const progressPath = path.join(destination, ".nimvara-migration-progress.json");
  try {
    const value = JSON.parse(await readFile(progressPath, "utf8"));
    if (!value || value.schema !== 1 || !["copying", "complete"].includes(value.phase)) return null;
    return {
      schema: 1,
      phase: value.phase,
      completed: Number.isSafeInteger(value.completed) ? value.completed : 0,
      total: Number.isSafeInteger(value.total) ? value.total : 0,
      updatedAt: String(value.updatedAt || "")
    };
  } catch (error) {
    if (error?.code === "ENOENT" || error instanceof SyntaxError) return null;
    throw new NimvaraError("MIGRATION_PROGRESS", "Migration progress could not be read safely.");
  }
}

export async function cancelMigration(destinationPath) {
  const destination = path.resolve(String(destinationPath));
  await writeFile(path.join(destination, ".nimvara-migration-cancel"), "cancel\n", { flag: "w" });
  return { requested: true };
}

export async function readMarkdown(root, relative) {
  const target = await resolveInside(root, relative);
  const data = await readFile(target.absolute);
  return {
    path: target.relative,
    content: data.toString("utf8"),
    hash: sha256(data),
    modifiedAt: (await stat(target.absolute)).mtime.toISOString()
  };
}

async function durableWrite(filePath, data, beforeRename = null) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.lantern-tmp-${process.pid}-${randomUUID()}`;
  const handle = await open(temporary, "wx");
  try {
    await handle.writeFile(data);
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    if (beforeRename) await beforeRename(temporary);
    await rename(temporary, filePath);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}

export async function atomicWriteForTest(filePath, data, beforeRename) {
  return durableWrite(filePath, data, beforeRename);
}

async function checkpoint(root, relative, data, reason) {
  if (data === null) return null;
  const canonical = await canonicalRoot(root);
  const id = `${new Date().toISOString().replaceAll(":", "-")}-${randomUUID().slice(0, 8)}`;
  const directory = path.join(canonical, HISTORY, id);
  await rejectLinkedComponents(canonical, directory);
  const contentPath = path.join(directory, ...relative.split("/"));
  await mkdir(path.dirname(contentPath), { recursive: true });
  await writeFile(contentPath, data);
  const record = { id, path: relative, hash: sha256(data), reason, createdAt: new Date().toISOString() };
  await writeFile(path.join(directory, "checkpoint.json"), `${JSON.stringify(record, null, 2)}\n`, "utf8");
  return record;
}

export async function saveMarkdown(root, relative, content, expectedHash) {
  const target = await resolveInside(root, relative);
  const current = await readFile(target.absolute).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  const currentHash = current === null ? null : sha256(current);
  if (expectedHash !== currentHash) {
    throw new NimvaraError("EXTERNAL_CHANGE", "The file changed outside Nimvara.", 409, {
      expectedHash,
      currentHash
    });
  }
  const next = Buffer.from(content, "utf8");
  if (current && current.equals(next)) return { path: target.relative, hash: currentHash, unchanged: true };
  const record = await checkpoint(root, target.relative, current, "before-save");
  await durableWrite(target.absolute, next);
  const verification = await readFile(target.absolute);
  if (!verification.equals(next)) throw new NimvaraError("VERIFY_FAILED", "Saved bytes did not verify.", 500);
  return { path: target.relative, hash: sha256(verification), checkpoint: record, unchanged: false };
}

export async function listHistory(root, relative) {
  const safe = safeRelative(relative);
  const historyRoot = path.join(root, HISTORY);
  const ids = await readdir(historyRoot).catch((error) => error.code === "ENOENT" ? [] : Promise.reject(error));
  const records = [];
  for (const id of ids) {
    const record = JSON.parse(await readFile(path.join(historyRoot, id, "checkpoint.json"), "utf8"));
    if (record.path === safe) records.push(record);
  }
  return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function restoreHistory(root, checkpointId, expectedHash) {
  if (!/^[A-Za-z0-9_.-]+$/.test(checkpointId)) throw new NimvaraError("INVALID_CHECKPOINT", "Invalid checkpoint.");
  const directory = path.join(root, HISTORY, checkpointId);
  const record = JSON.parse(await readFile(path.join(directory, "checkpoint.json"), "utf8"));
  const saved = await readFile(path.join(directory, ...safeRelative(record.path).split("/")));
  return saveMarkdown(root, record.path, saved.toString("utf8"), expectedHash);
}

export async function searchMarkdown(root, query) {
  const needle = String(query ?? "").trim().toLocaleLowerCase();
  if (!needle) return [];
  const results = [];
  for (const relative of await listMarkdown(root)) {
    const data = await readFile(path.join(root, ...relative.split("/")), "utf8");
    const index = data.toLocaleLowerCase().indexOf(needle);
    if (index >= 0 || relative.toLocaleLowerCase().includes(needle)) {
      const start = Math.max(0, index - 60);
      results.push({ path: relative, snippet: data.slice(start, Math.max(start, index) + needle.length + 100).replace(/\s+/g, " ").trim() });
    }
    if (results.length >= 100) break;
  }
  return results;
}

export async function planRename(root, from, to) {
  const source = safeRelative(from);
  const target = safeRelative(to);
  if (source === target) throw new NimvaraError("RENAME_SAME", "The note already has that name.");
  if (!(await stat(path.join((await canonicalRoot(root)), ...source.split("/"))).catch(() => null))?.isFile()) throw new NimvaraError("NOTE_NOT_FOUND", "The source note was not found.", 404);
  if (await stat(path.join((await canonicalRoot(root)), ...target.split("/"))).catch(() => null)) throw new NimvaraError("RENAME_EXISTS", "The destination note already exists.", 409);
  const oldTarget = source.replace(/\.md$/i, "");
  const newTarget = target.replace(/\.md$/i, "");
  const changes = [];
  for (const relative of await listMarkdown(root)) {
    const absolute = path.join(await canonicalRoot(root), ...relative.split("/"));
    const content = await readFile(absolute, "utf8");
    const updated = content
      .replaceAll(`[[${oldTarget}]]`, `[[${newTarget}]]`)
      .replaceAll(`[[${oldTarget}|`, `[[${newTarget}|`)
      .replaceAll(`![[${oldTarget}]]`, `![[${newTarget}]]`)
      .replaceAll(`![[${oldTarget}|`, `![[${newTarget}|`);
    if (updated !== content) changes.push({ path: relative, before: content, after: updated });
  }
  return { source, target, changes, affectedFiles: changes.map((change) => change.path), writeRequired: true, reviewRequired: true };
}

export async function applyRename(root, from, to) {
  const plan = await planRename(root, from, to);
  const canonical = await canonicalRoot(root);
  const sourcePath = path.join(canonical, ...plan.source.split("/"));
  const targetPath = path.join(canonical, ...plan.target.split("/"));
  const originals = new Map();
  for (const change of plan.changes) originals.set(change.path, Buffer.from(change.before, "utf8"));
  try {
    for (const [relative, bytes] of originals) await checkpoint(canonical, relative, bytes, "before-rename");
    await mkdir(path.dirname(targetPath), { recursive: true });
    await rename(sourcePath, targetPath);
    for (const change of plan.changes) {
      const destination = change.path === plan.source ? plan.target : change.path;
      await durableWrite(path.join(canonical, ...destination.split("/")), Buffer.from(change.after, "utf8"));
    }
    return { ...plan, applied: true };
  } catch (error) {
    await rename(targetPath, sourcePath).catch(() => {});
    for (const [relative, bytes] of originals) await durableWrite(path.join(canonical, ...relative.split("/")), bytes).catch(() => {});
    throw error;
  }
}

export function parseMarkdownStructure(content) {
  const headings = [];
  const wikilinks = [];
  const attachmentReferences = [];
  const lines = String(content).split(/\r?\n/);
  let fence = null;
  for (let index = 0; index < lines.length; index++) {
    const fenceMatch = lines[index].match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      if (!fence) fence = fenceMatch[1][0];
      else if (fence === fenceMatch[1][0]) fence = null;
      continue;
    }
    if (fence) continue;
    const heading = lines[index].match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) headings.push({ level: heading[1].length, text: heading[2], line: index + 1 });
    for (const match of lines[index].matchAll(/(!)?\[\[([^\]]+)\]\]/g)) {
      const raw = match[2];
      const [destination, alias] = raw.split("|", 2);
      const [target, headingTarget] = destination.split("#", 2);
      wikilinks.push({
        raw,
        target: target.trim(),
        heading: headingTarget?.trim() || null,
        alias: alias?.trim() || null,
        embed: Boolean(match[1]),
        line: index + 1
      });
      if (match[1] && target.trim() && !target.trim().toLowerCase().endsWith(".md")) attachmentReferences.push({ target: target.trim(), line: index + 1, embed: true, syntax: "wikilink" });
    }
    for (const match of lines[index].matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1].trim().split(/\s+/)[0];
      if (target && !/^(?:[a-z][a-z0-9+.-]*:|#|data:)/i.test(target)) attachmentReferences.push({ target, line: index + 1, embed: true, syntax: "markdown" });
    }
  }
  return { headings, wikilinks, attachmentReferences };
}

function normalizeLinkTarget(value) {
  let decoded = value;
  try { decoded = decodeURIComponent(value); } catch { /* retain malformed user input for diagnostics */ }
  return decoded.replaceAll("\\", "/").replace(/^\/+/, "").replace(/\.md$/i, "");
}

export async function buildLinkIndex(root) {
  const notes = await listMarkdown(root);
  const canonical = new Map();
  const basenames = new Map();
  for (const note of notes) {
    const key = normalizeLinkTarget(note).toLocaleLowerCase();
    canonical.set(key, note);
    const base = path.posix.basename(key);
    if (!basenames.has(base)) basenames.set(base, []);
    basenames.get(base).push(note);
  }
  const structures = new Map();
  for (const note of notes) structures.set(note, parseMarkdownStructure(await readFile(path.join(root, ...note.split("/")), "utf8")));
  const resolve = (source, target) => {
    if (!target) return { status: "empty", candidates: [] };
    const normalized = normalizeLinkTarget(target);
    const sourceDirectory = path.posix.dirname(source);
    const relativeCandidate = normalizeLinkTarget(path.posix.join(sourceDirectory, normalized)).toLocaleLowerCase();
    const exactCandidate = normalized.toLocaleLowerCase();
    if (canonical.has(exactCandidate)) return { status: "resolved", path: canonical.get(exactCandidate), candidates: [canonical.get(exactCandidate)] };
    if (canonical.has(relativeCandidate)) return { status: "resolved", path: canonical.get(relativeCandidate), candidates: [canonical.get(relativeCandidate)] };
    const matches = basenames.get(path.posix.basename(exactCandidate)) ?? [];
    if (matches.length === 1) return { status: "resolved", path: matches[0], candidates: matches };
    if (matches.length > 1) return { status: "ambiguous", candidates: matches };
    return { status: "missing", candidates: [] };
  };
  const outgoing = {};
  const backlinks = Object.fromEntries(notes.map((note) => [note, []]));
  for (const note of notes) {
    outgoing[note] = structures.get(note).wikilinks.map((link) => {
      const resolution = resolve(note, link.target);
      if (resolution.status === "resolved") backlinks[resolution.path].push({ source: note, line: link.line, alias: link.alias, heading: link.heading });
      return { ...link, ...resolution };
    });
  }
  const diagnostics = [];
  for (const note of notes) for (const link of outgoing[note]) if (link.status !== "resolved") diagnostics.push({ source: note, line: link.line, target: link.target, status: link.status, candidates: link.candidates });
  return { notes, outgoing, backlinks, outlines: Object.fromEntries(notes.map((note) => [note, structures.get(note).headings])), diagnostics };
}

export async function attachmentDiagnostics(root) {
  const files = await listWorkspaceFiles(root);
  const attachments = files.filter((file) => file.kind === "attachment").map((file) => file.path);
  const byName = new Map();
  for (const file of attachments) {
    const key = path.posix.basename(file).toLocaleLowerCase();
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key).push(file);
  }
  const diagnostics = [];
  for (const note of await listMarkdown(root)) {
    const structure = parseMarkdownStructure(await readFile(path.join(root, ...note.split("/")), "utf8"));
    for (const reference of structure.attachmentReferences) {
      let decoded = reference.target;
      try { decoded = decodeURIComponent(decoded); } catch { /* preserve malformed reference for review */ }
      decoded = decoded.split("#", 1)[0].replaceAll("\\", "/");
      const candidate = path.posix.normalize(path.posix.join(path.posix.dirname(note), decoded));
      const safeCandidate = candidate.startsWith("../") || candidate === ".." ? null : candidate.replace(/^\.\//, "");
      if (safeCandidate && attachments.some((file) => file.toLocaleLowerCase() === safeCandidate.toLocaleLowerCase())) continue;
      const basename = path.posix.basename(decoded).toLocaleLowerCase();
      const stem = basename.replace(/\.[^.]+$/, "");
      const candidates = attachments
        .map((file) => {
          const candidateName = path.posix.basename(file).toLocaleLowerCase();
          const candidateStem = candidateName.replace(/\.[^.]+$/, "");
          const score = candidateName === basename ? 100 : candidateStem === stem ? 80 : candidateStem.includes(stem) || stem.includes(candidateStem) ? 40 : 0;
          return { path: file, score };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
        .slice(0, 10);
      diagnostics.push({ source: note, line: reference.line, target: reference.target, syntax: reference.syntax, status: "missing", candidates: candidates.map((item) => item.path), rankedCandidates: candidates });
    }
  }
  return { diagnostics, attachmentCount: attachments.length };
}

export async function planAttachmentRepair(root, source, line, target, candidate) {
  const note = safeRelative(source);
  const candidatePath = String(candidate || "").replaceAll("\\", "/").replace(/^\.\//, "");
  if (!candidatePath || candidatePath.startsWith("/") || /^[A-Za-z]:/.test(candidatePath) || candidatePath.split("/").some((part) => !part || part === "..")) throw new NimvaraError("ATTACHMENT_REPAIR", "Replacement path is unsafe.");
  const candidates = await listWorkspaceFiles(root);
  if (!candidates.some((item) => item.kind === "attachment" && item.path.toLocaleLowerCase() === candidatePath.toLocaleLowerCase())) throw new NimvaraError("ATTACHMENT_REPAIR", "Replacement must be an existing workspace attachment.");
  const current = await readFile(path.join(root, ...note.split("/")), "utf8");
  const lines = current.split(/\r?\n/);
  const index = Number(line) - 1;
  if (!Number.isInteger(index) || index < 0 || index >= lines.length || !lines[index].includes(String(target))) throw new NimvaraError("ATTACHMENT_REPAIR", "The attachment reference changed; refresh diagnostics.");
  const relativeCandidate = path.posix.relative(path.posix.dirname(note), candidatePath) || path.posix.basename(candidatePath);
  const normalized = relativeCandidate.startsWith(".") ? relativeCandidate : `./${relativeCandidate}`;
  const beforeLine = lines[index];
  const updatedLine = beforeLine.replace(String(target), normalized);
  lines[index] = updatedLine;
  return { source: note, line: Number(line), before: beforeLine, after: updatedLine, content: lines.join("\n"), candidate: candidatePath, expectedHash: sha256(Buffer.from(current, "utf8")) };
}

export async function applyAttachmentRepair(root, proposal) {
  if (!proposal || typeof proposal !== "object") throw new NimvaraError("ATTACHMENT_REPAIR", "A repair proposal is required.");
  const planned = await planAttachmentRepair(root, proposal.source, proposal.line, proposal.target || proposal.before, proposal.candidate);
  if (proposal.expectedHash && proposal.expectedHash !== planned.expectedHash) throw new NimvaraError("EXTERNAL_CHANGE", "The note changed since diagnostics; refresh the repair proposal.");
  if (proposal.content !== planned.content) throw new NimvaraError("ATTACHMENT_REPAIR", "The repair proposal content no longer matches the source.");
  return saveMarkdown(root, planned.source, planned.content, planned.expectedHash);
}

export async function noteContext(root, relative) {
  const safe = safeRelative(relative);
  const index = await buildLinkIndex(root);
  if (!index.notes.includes(safe)) throw new NimvaraError("NOTE_NOT_FOUND", "Note is not part of this workspace.", 404);
  return { outline: index.outlines[safe], outgoing: index.outgoing[safe], backlinks: index.backlinks[safe], diagnosticCount: index.diagnostics.length };
}

export async function workspaceState(root, relative = null) {
  const files = await listWorkspaceFiles(root);
  let note = null;
  if (relative) {
    try {
      const current = await readMarkdown(root, relative);
      note = { path: current.path, hash: current.hash, modifiedAt: current.modifiedAt };
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      note = { path: safeRelative(relative), missing: true };
    }
  }
  const signature = sha256(Buffer.from(files.map((file) => `${file.path}\0${file.bytes}\0${file.modifiedAt}`).join("\n")));
  return { signature, files, note };
}

/**
 * Return a privacy-safe support report.  It intentionally contains aggregate
 * workspace facts only: no note names, paths, contents, hashes, or metadata
 * from individual files are returned.
 */
export async function diagnosticsReport(root, appVersion = "development") {
  const files = await listWorkspaceFiles(root);
  const byExtension = {};
  let markdownCount = 0;
  let attachmentCount = 0;
  let totalBytes = 0;
  let largestFileBytes = 0;
  let maxPathDepth = 0;
  for (const file of files) {
    totalBytes += file.bytes;
    largestFileBytes = Math.max(largestFileBytes, file.bytes);
    maxPathDepth = Math.max(maxPathDepth, file.path.split("/").length);
    byExtension[file.extension || "(none)"] = (byExtension[file.extension || "(none)"] || 0) + 1;
    if (file.kind === "markdown") markdownCount += 1;
    else attachmentCount += 1;
  }
  return {
    schema: 1,
    generatedAt: new Date().toISOString(),
    appVersion: String(appVersion).slice(0, 32),
    runtime: { platform: process.platform, arch: process.arch, nodeMajor: Number(process.versions.node.split(".")[0]) },
    workspace: {
      fileCount: files.length,
      markdownCount,
      attachmentCount,
      totalBytes,
      largestFileBytes,
      maxPathDepth,
      byExtension
    }
  };
}

// Human-readable trust state for the UI, based only on facts verified locally.
export async function safetyState(root, relative = null) {
  const state = await workspaceState(root, relative);
  const history = relative ? await listHistory(root, relative) : [];
  const note = state.note;
  return {
    workspace: { status: "open", path: root },
    localSave: note?.missing ? "missing" : relative ? "verified" : "ready",
    externalChange: "not-checked",
    sync: "not-configured",
    backup: "not-verified",
    checkpoint: history.length ? "available" : "none",
    checkpointCount: history.length,
    watchMode: "unknown",
    signature: state.signature,
    note: note ?? null,
    recovery: { reload: Boolean(note && !note.missing), restoreCheckpoint: history.length > 0, saveCopy: Boolean(note && !note.missing) }
  };
}

export async function saveConflictCopy(root, relative, content) {
  const safe = safeRelative(relative);
  const parsed = path.posix.parse(safe);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  for (let attempt = 0; attempt < 100; attempt++) {
    const suffix = attempt ? `-${attempt}` : "";
    const copy = path.posix.join(parsed.dir, `${parsed.name} (Nimvara conflict ${stamp})${suffix}.md`);
    const absolute = path.join(root, ...copy.split("/"));
    if (!await stat(absolute).catch(() => null)) {
      const result = await saveMarkdown(root, copy, content, null);
      return { ...result, path: copy };
    }
  }
  throw new NimvaraError("COPY_COLLISION", "Could not create a unique conflict copy.", 409);
}

export async function revealWorkspaceFile(root, relative) {
  const normalized = String(relative ?? "").replaceAll("\\", "/").replace(/^\/+/, "");
  if (!normalized || normalized.split("/").some((part) => !part || part === "." || part === "..") || normalized.toLowerCase().startsWith(`${META}/`)) {
    throw new NimvaraError("INVALID_ATTACHMENT", "Attachment path must stay inside the workspace.");
  }
  const absolute = path.resolve(root, ...normalized.split("/"));
  const prefix = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
  if (!absolute.startsWith(prefix) || !(await stat(absolute).catch(() => null))?.isFile()) throw new NimvaraError("ATTACHMENT_NOT_FOUND", "Attachment was not found.", 404);
  let command;
  let args;
  if (process.platform === "win32") { command = "explorer.exe"; args = ["/select,", absolute]; }
  else if (process.platform === "darwin") { command = "open"; args = ["-R", absolute]; }
  else { command = "xdg-open"; args = [path.dirname(absolute)]; }
  const child = spawn(command, args, { detached: true, stdio: "ignore", windowsHide: true });
  child.unref();
  return { revealed: normalized };
}

export async function readAttachmentPreview(root, relative) {
  const normalized = String(relative ?? "").replaceAll("\\", "/").replace(/^\/+/, "");
  if (!normalized || normalized.split("/").some((part) => !part || part === "." || part === "..") || normalized.toLowerCase().startsWith(`${META}/`)) throw new NimvaraError("INVALID_ATTACHMENT", "Attachment path must stay inside the workspace.");
  const absolute = path.resolve(root, ...normalized.split("/"));
  const prefix = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
  if (!absolute.startsWith(prefix)) throw new NimvaraError("PATH_ESCAPE", "Attachment path escaped the workspace.");
  const info = await stat(absolute).catch(() => null);
  if (!info?.isFile()) throw new NimvaraError("ATTACHMENT_NOT_FOUND", "Attachment was not found.", 404);
  if (info.size > 2 * 1024 * 1024) throw new NimvaraError("PREVIEW_TOO_LARGE", "Attachment preview is limited to 2 MiB.", 413);
  const mime = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".ogg": "audio/ogg", ".pdf": "application/pdf" }[path.extname(normalized).toLowerCase()];
  if (!mime) throw new NimvaraError("PREVIEW_UNSUPPORTED", "Inline preview is limited to common images, audio, and PDF files.");
  return { path: normalized, mime, bytes: info.size, data: (await readFile(absolute)).toString("base64") };
}

function isInside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export async function createSnapshot(root, destination) {
  const sourceRoot = await canonicalRoot(root);
  const destRoot = await canonicalRoot(destination, true);
  if (isInside(sourceRoot, destRoot) || isInside(destRoot, sourceRoot)) {
    throw new NimvaraError("UNSAFE_DESTINATION", "Backup destination must be separate from the workspace.");
  }
  const snapshotRoot = path.join(destRoot, SNAPSHOT_FOLDER);
  await mkdir(snapshotRoot, { recursive: true });
  const id = `${new Date().toISOString().replaceAll(":", "-")}-${randomUUID().slice(0, 8)}`;
  const temporary = path.join(snapshotRoot, `.incomplete-${id}`);
  const finalPath = path.join(snapshotRoot, id);
  const filesRoot = path.join(temporary, "files");
  await mkdir(filesRoot, { recursive: true });
  const manifest = { schema: 1, id, createdAt: new Date().toISOString(), source: sourceRoot, files: [] };
  try {
    for (const file of await walk(sourceRoot)) {
      if (file.relative.startsWith(`${META}/`)) continue;
      const data = await readFile(file.absolute);
      const output = path.join(filesRoot, ...file.relative.split("/"));
      await mkdir(path.dirname(output), { recursive: true });
      await writeFile(output, data);
      manifest.files.push({ path: file.relative, bytes: data.length, sha256: sha256(data) });
    }
    await writeFile(path.join(temporary, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    await verifySnapshot(temporary);
    await rename(temporary, finalPath);
    return { ...manifest, path: finalPath };
  } catch (error) {
    await rm(temporary, { recursive: true, force: true });
    throw error;
  }
}

export async function verifySnapshot(snapshotPath) {
  const absolute = path.resolve(snapshotPath);
  const manifest = JSON.parse(await readFile(path.join(absolute, "manifest.json"), "utf8"));
  for (const entry of manifest.files) {
    const data = await readFile(path.join(absolute, "files", ...entry.path.split("/")));
    if (data.length !== entry.bytes || sha256(data) !== entry.sha256) {
      throw new NimvaraError("SNAPSHOT_CORRUPT", `Snapshot verification failed for ${entry.path}.`, 409);
    }
  }
  return { ...manifest, path: absolute, verified: true };
}

export async function listSnapshots(destination) {
  const root = path.join(path.resolve(destination), SNAPSHOT_FOLDER);
  const ids = await readdir(root).catch((error) => error.code === "ENOENT" ? [] : Promise.reject(error));
  const output = [];
  for (const id of ids.filter((value) => !value.startsWith(".incomplete-"))) {
    try { output.push(await verifySnapshot(path.join(root, id))); } catch { output.push({ id, path: path.join(root, id), verified: false }); }
  }
  return output.sort((a, b) => String(b.createdAt ?? b.id).localeCompare(String(a.createdAt ?? a.id)));
}

export async function planSnapshotPrune(destination, keep = 5) {
  const count = Number.isInteger(keep) ? Math.max(1, Math.min(100, keep)) : 5;
  const snapshots = (await listSnapshots(destination)).filter((snapshot) => snapshot.verified);
  return { keep: count, retain: snapshots.slice(0, count).map((snapshot) => snapshot.id), remove: snapshots.slice(count).map((snapshot) => snapshot.id) };
}

export async function pruneSnapshots(destination, keep = 5, confirm = false) {
  if (confirm !== true) throw new NimvaraError("CONFIRM_REQUIRED", "Snapshot pruning requires explicit confirmation.", 400);
  const plan = await planSnapshotPrune(destination, keep);
  const root = path.join(path.resolve(destination), SNAPSHOT_FOLDER);
  for (const id of plan.remove) await rm(path.join(root, id), { recursive: true, force: false });
  return plan;
}

export async function restoreSnapshot(snapshotPath, destination) {
  const snapshot = await verifySnapshot(snapshotPath);
  const target = path.resolve(destination);
  const existing = await readdir(target).catch((error) => error.code === "ENOENT" ? [] : Promise.reject(error));
  if (existing.length) throw new NimvaraError("RESTORE_NOT_EMPTY", "Restore destination must be a new or empty folder.");
  await mkdir(target, { recursive: true });
  for (const entry of snapshot.files) {
    const source = path.join(snapshot.path, "files", ...entry.path.split("/"));
    const output = path.join(target, ...entry.path.split("/"));
    await mkdir(path.dirname(output), { recursive: true });
    await copyFile(source, output);
  }
  for (const entry of snapshot.files) {
    const data = await readFile(path.join(target, ...entry.path.split("/")));
    if (sha256(data) !== entry.sha256) throw new NimvaraError("RESTORE_VERIFY_FAILED", `Restore failed for ${entry.path}.`, 500);
  }
  return { destination: target, files: snapshot.files.length, verified: true };
}

function htmlEscape(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

export async function exportStatic(root, destination, selectedPaths = []) {
  const source = await canonicalRoot(root);
  const target = path.resolve(destination);
  if (isInside(source, target) || isInside(target, source)) throw new NimvaraError("UNSAFE_DESTINATION", "Export destination must be separate from the workspace.");
  const existing = await lstat(target).catch(() => null);
  if (existing) {
    if (!existing.isDirectory() || (await readdir(target)).length) throw new NimvaraError("EXPORT_DESTINATION", "Export destination must be a new or empty folder.");
  } else await mkdir(target, { recursive: false });
  const requested = new Set((Array.isArray(selectedPaths) ? selectedPaths : []).map((item) => safeRelative(item)));
  const files = (await walk(source)).filter((file) => file.relative.toLowerCase().endsWith(".md") && (!requested.size || requested.has(file.relative)));
  try {
    for (const file of files) {
      const relative = file.relative.replace(/\.md$/i, ".html");
      const output = path.join(target, ...relative.split("/"));
      await mkdir(path.dirname(output), { recursive: true });
      const markdown = await readFile(file.absolute, "utf8");
      const title = markdown.match(/^#\s+(.+)$/m)?.[1] ?? path.basename(file.relative, ".md");
      const html = `<!doctype html><meta charset="utf-8"><title>${htmlEscape(title)}</title><main><h1>${htmlEscape(title)}</h1><pre>${htmlEscape(markdown)}</pre></main>\n`;
      await writeFile(output, html, { flag: "wx" });
    }
    return { destination: target, files: files.map((file) => file.relative), format: "safe-static-html-v1" };
  } catch (error) {
    await rm(target, { recursive: true, force: true });
    throw error;
  }
}
