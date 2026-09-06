import { createHash, randomUUID } from "node:crypto";
import { lookup } from "node:dns/promises";
import { createWriteStream } from "node:fs";
import { access, mkdir, readFile, rename, rm, stat } from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import path from "node:path";
import { NimvaraError, atomicWriteForTest, saveMarkdown, sha256 } from "./lantern-core.mjs";

export const INGESTION_VERSION = "lantern-ingestion/0.1.0";
export const MAX_LOCAL_BYTES = 25 * 1024 * 1024;
export const MAX_WEB_BYTES = 5 * 1024 * 1024;
export const MAX_REDIRECTS = 3;
export const REQUEST_TIMEOUT_MS = 10_000;
const PREVIEW_TTL_MS = 30 * 60 * 1000;
const previews = new Map();
const SUPPORTED = new Set([".md", ".txt", ".html", ".htm", ".pdf", ".docx"]);

export const ingestionCapabilities = Object.freeze({
  version: INGESTION_VERSION,
  urlCapture: { available: true, mode: "single-public-page", maxBytes: MAX_WEB_BYTES, redirects: MAX_REDIRECTS, timeoutMs: REQUEST_TIMEOUT_MS },
  local: {
    ".md": { extraction: "lossless-text", preserveOriginal: false },
    ".txt": { extraction: "utf8-text", preserveOriginalWhenLossy: true },
    ".html": { extraction: "sanitized-readable-text", preserveOriginal: true },
    ".pdf": { extraction: "unavailable", preserveOriginal: true },
    ".docx": { extraction: "unavailable", preserveOriginal: true }
  },
  adapters: {
    authenticatedConnector: "interface-only",
    browserExtension: "interface-only",
    ai: "disabled"
  }
});

function hashText(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function decodeEntities(value) {
  const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (_, entity) => {
    if (entity[0] === "#") {
      const radix = entity[1].toLowerCase() === "x" ? 16 : 10;
      const raw = entity.replace(/^#x?/i, "");
      const point = Number.parseInt(raw, radix);
      return Number.isFinite(point) && point <= 0x10ffff ? String.fromCodePoint(point) : "";
    }
    return named[entity.toLowerCase()] ?? "";
  });
}

function cleanText(value) {
  return decodeEntities(value)
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const SUPPRESSED_HTML_TAGS = new Set(["script", "style", "noscript", "iframe", "object", "embed", "svg", "math", "form", "input", "button", "textarea", "select", "template"]);
const BLOCK_HTML_TAGS = new Set(["p", "div", "section", "article", "main", "header", "footer", "nav", "aside", "blockquote", "pre"]);

function htmlTagName(token) {
  let offset = 0;
  while (/\s/.test(token[offset] ?? "")) offset += 1;
  const closing = token[offset] === "/";
  if (closing) offset += 1;
  while (/\s/.test(token[offset] ?? "")) offset += 1;
  const start = offset;
  while (/[A-Za-z0-9:-]/.test(token[offset] ?? "")) offset += 1;
  return { closing, name: token.slice(start, offset).toLowerCase() };
}

function htmlToSafeMarkdown(html) {
  let output = "";
  let offset = 0;
  let suppressed = null;
  while (offset < html.length) {
    if (html.startsWith("<!--", offset)) {
      const end = html.indexOf("-->", offset + 4);
      offset = end === -1 ? html.length : end + 3;
      continue;
    }
    if (html[offset] !== "<") {
      if (!suppressed) output += html[offset];
      offset += 1;
      continue;
    }
    const end = html.indexOf(">", offset + 1);
    if (end === -1) {
      if (!suppressed) output += html.slice(offset);
      break;
    }
    const { closing, name } = htmlTagName(html.slice(offset + 1, end));
    offset = end + 1;
    if (!name) continue;
    if (suppressed) {
      if (closing && name === suppressed) suppressed = null;
      continue;
    }
    if (SUPPRESSED_HTML_TAGS.has(name)) {
      if (!closing) suppressed = name;
      continue;
    }
    if (name === "br") { output += "\n"; continue; }
    if (name === "li" && !closing) { output += "\n- "; continue; }
    if (/^h[1-6]$/.test(name)) {
      output += closing ? "\n" : `\n${"#".repeat(Number(name[1]))} `;
      continue;
    }
    if (BLOCK_HTML_TAGS.has(name)) output += "\n";
  }
  return output;
}

function escapeHtmlDelimiters(value) {
  return value.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function sanitizeHtmlToMarkdown(html, baseUrl = null) {
  if (typeof html !== "string") throw new NimvaraError("INVALID_HTML", "HTML input must be text.");
  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const canonicalMatch = html.match(/<link\b[^>]*rel\s*=\s*["']?canonical["']?[^>]*>/i)?.[0];
  const href = canonicalMatch?.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  let canonicalUrl = href ? (href[1] ?? href[2] ?? href[3]) : null;
  try { if (canonicalUrl && baseUrl) canonicalUrl = new URL(canonicalUrl, baseUrl).href; } catch { canonicalUrl = null; }

  const body = htmlToSafeMarkdown(html);
  const title = escapeHtmlDelimiters(cleanText(htmlToSafeMarkdown(titleMatch?.[1] ?? ""))) || "Captured page";
  return { title, markdown: escapeHtmlDelimiters(cleanText(body)), canonicalUrl };
}

function ipv4Blocked(address) {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) return true;
  const [a, b] = octets;
  return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
    (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19)) || a >= 224;
}

export function isBlockedAddress(address) {
  if (!net.isIP(address)) return true;
  if (net.isIPv4(address)) return ipv4Blocked(address);
  const lower = address.toLowerCase().split("%")[0];
  if (lower === "::" || lower === "::1" || lower.startsWith("fc") || lower.startsWith("fd") || /^fe[89ab]/.test(lower)) return true;
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return mapped ? ipv4Blocked(mapped[1]) : false;
}

export function validatePublicUrl(input) {
  let url;
  try { url = new URL(input); } catch { throw new NimvaraError("INVALID_URL", "Enter a valid public HTTP or HTTPS URL."); }
  if (!["http:", "https:"].includes(url.protocol)) throw new NimvaraError("BLOCKED_SCHEME", "Only public HTTP and HTTPS URLs are supported.");
  if (url.username || url.password) throw new NimvaraError("URL_CREDENTIALS", "URLs containing credentials are blocked.");
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new NimvaraError("BLOCKED_HOST", "Local and private hostnames are blocked.");
  }
  if (net.isIP(host) && isBlockedAddress(host)) throw new NimvaraError("BLOCKED_ADDRESS", "Private, loopback, link-local, and special-use addresses are blocked.");
  url.hash = "";
  return url;
}

async function vettedLookup(hostname, options, callback) {
  try {
    const records = await lookup(hostname, { all: true, verbatim: true });
    if (!records.length || records.some((record) => isBlockedAddress(record.address))) {
      return callback(new NimvaraError("BLOCKED_DNS", "DNS resolved to a blocked or mixed-trust address."));
    }
    if (typeof options === "object" && options.all) return callback(null, records);
    const family = typeof options === "object" ? options.family : 0;
    const selected = records.find((record) => !family || record.family === family) ?? records[0];
    callback(null, selected.address, selected.family);
  } catch (error) { callback(error); }
}

function boundedRequest(url, maxBytes) {
  return new Promise((resolve, reject) => {
    const transport = url.protocol === "https:" ? https : http;
    const request = transport.request(url, {
      method: "GET",
      headers: { "user-agent": "NimvaraCapture/0.1 (+single-page; user-initiated)", accept: "text/html,text/plain;q=0.9,*/*;q=0.1" },
      lookup: vettedLookup
    }, (response) => {
      const chunks = [];
      let bytes = 0;
      response.on("data", (chunk) => {
        bytes += chunk.length;
        if (bytes > maxBytes) {
          request.destroy(new NimvaraError("WEB_TOO_LARGE", `Response exceeded ${maxBytes} bytes.`));
          return;
        }
        chunks.push(chunk);
      });
      response.on("end", () => resolve({ status: response.statusCode ?? 0, headers: response.headers, body: Buffer.concat(chunks) }));
    });
    request.setTimeout(REQUEST_TIMEOUT_MS, () => request.destroy(new NimvaraError("WEB_TIMEOUT", "Capture timed out.")));
    request.on("error", reject);
    request.end();
  });
}

function robotsDisallows(text, pathname) {
  let applies = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const [name, ...rest] = line.split(":");
    const value = rest.join(":").trim();
    if (name.toLowerCase() === "user-agent") applies = value === "*";
    if (applies && name.toLowerCase() === "disallow" && value && pathname.startsWith(value)) return true;
  }
  return false;
}

export async function fetchPublicPage(input, redirectCount = 0, checkRobots = true) {
  const url = validatePublicUrl(input);
  if (checkRobots) {
    const robotsUrl = new URL("/robots.txt", url);
    const robots = await boundedRequest(robotsUrl, 256 * 1024).catch(() => null);
    if (robots?.status === 200 && robotsDisallows(robots.body.toString("utf8"), url.pathname)) {
      throw new NimvaraError("ROBOTS_DISALLOWED", "The site robots policy disallows this path.");
    }
  }
  const response = await boundedRequest(url, MAX_WEB_BYTES);
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    if (redirectCount >= MAX_REDIRECTS) throw new NimvaraError("TOO_MANY_REDIRECTS", "Capture exceeded the redirect limit.");
    const location = response.headers.location;
    if (!location) throw new NimvaraError("BAD_REDIRECT", "Redirect did not provide a destination.");
    return fetchPublicPage(new URL(location, url).href, redirectCount + 1, true);
  }
  if (response.status === 401 || response.status === 403) throw new NimvaraError("ACCESS_CONTROLLED", "Nimvara does not bypass authentication or access controls.");
  if (response.status === 402 || response.status === 407 || response.status === 429) throw new NimvaraError("CAPTURE_REFUSED", `Site refused capture with HTTP ${response.status}.`);
  if (response.status < 200 || response.status >= 300) throw new NimvaraError("WEB_STATUS", `Capture failed with HTTP ${response.status}.`);
  const type = String(response.headers["content-type"] ?? "").toLowerCase();
  if (!type.includes("text/html") && !type.includes("text/plain")) throw new NimvaraError("UNSUPPORTED_WEB_TYPE", `Unsupported web content type: ${type || "unknown"}.`);
  return { url: url.href, contentType: type, body: response.body };
}

function safeName(value, fallback = "Imported source") {
  const cleaned = String(value ?? "").replace(/[<>:"/\\|?*\x00-\x1f]/g, " ").replace(/\s+/g, " ").trim().replace(/[. ]+$/, "");
  return (cleaned || fallback).slice(0, 120);
}

function yamlString(value) {
  return JSON.stringify(String(value));
}

function provenanceBlock(provenance) {
  const entries = [
    ["source-kind", provenance.sourceKind],
    ["source", provenance.source],
    ["canonical-url", provenance.canonicalUrl ?? ""],
    ["captured-at", provenance.capturedAt],
    ["content-sha256", provenance.contentHash],
    ["original-sha256", provenance.originalHash ?? ""],
    ["extractor", provenance.extractor],
    ["extractor-status", provenance.extractorStatus],
    ["original-attachment", provenance.originalAttachment ?? ""]
  ];
  return `\n\n## Source provenance\n\n<!-- lantern-provenance:v1\n${entries.map(([key, value]) => `${key}: ${yamlString(value)}`).join("\n")}\n-->\n\n| Field | Value |\n|---|---|\n${entries.map(([key, value]) => `| ${key} | ${String(value || "—").replaceAll("|", "\\|")} |`).join("\n")}\n`;
}

async function duplicateRecords(root) {
  const file = path.join(root, ".lantern", "ingestion-index.json");
  try {
    const parsed = JSON.parse(await readFile(file, "utf8"));
    return Array.isArray(parsed.records) ? parsed.records : [];
  } catch (error) {
    if (error.code === "ENOENT" || error instanceof SyntaxError) return [];
    throw error;
  }
}

function findDuplicate(records, canonicalUrl, contentHash) {
  return records.find((record) => (canonicalUrl && record.canonicalUrl === canonicalUrl) || record.contentHash === contentHash) ?? null;
}

function rememberPreview(data) {
  const id = randomUUID();
  previews.set(id, { ...data, id, expiresAt: Date.now() + PREVIEW_TTL_MS });
  return publicPreview(previews.get(id));
}

function publicPreview(preview) {
  return {
    id: preview.id,
    title: preview.title,
    content: preview.content,
    suggestedName: `${safeName(preview.title)}.md`,
    extractorStatus: preview.provenance.extractorStatus,
    provenance: preview.provenance,
    duplicate: preview.duplicate,
    warnings: preview.warnings,
    capability: preview.capability,
    expiresAt: new Date(preview.expiresAt).toISOString()
  };
}

export async function previewLocalImport(root, sourcePath) {
  const absolute = path.resolve(sourcePath);
  const info = await stat(absolute).catch(() => null);
  if (!info?.isFile()) throw new NimvaraError("SOURCE_NOT_FILE", "Select a readable local file.");
  if (info.size > MAX_LOCAL_BYTES) throw new NimvaraError("LOCAL_TOO_LARGE", `Local imports are limited to ${MAX_LOCAL_BYTES} bytes.`);
  const extension = path.extname(absolute).toLowerCase();
  if (!SUPPORTED.has(extension)) throw new NimvaraError("UNSUPPORTED_IMPORT", "Supported imports are Markdown, TXT, HTML, PDF, and DOCX.");
  const original = await readFile(absolute);
  const originalHash = sha256(original);
  let title = safeName(path.basename(absolute, extension));
  let content = "";
  let extractorStatus = "complete";
  let preserveOriginal = false;
  const warnings = [];
  if (extension === ".md" || extension === ".txt") {
    content = original.toString("utf8");
    if (content.includes("\uFFFD")) {
      extractorStatus = "partial";
      preserveOriginal = true;
      warnings.push("Input was not clean UTF-8; the original will be preserved.");
    }
  } else if (extension === ".html" || extension === ".htm") {
    const extracted = sanitizeHtmlToMarkdown(original.toString("utf8"));
    title = extracted.title === "Captured page" ? title : extracted.title;
    content = extracted.markdown;
    extractorStatus = "lossy";
    preserveOriginal = true;
    warnings.push("HTML was sanitized to readable text; layout and interactive content are not preserved in Markdown.");
  } else {
    extractorStatus = "preserved-only";
    preserveOriginal = true;
    content = `> [!warning]\n> Text extraction for ${extension.toUpperCase()} is not available in this build. The original file is preserved as an attachment.`;
    warnings.push("Text extraction is unavailable; the note records provenance and links to the preserved original.");
  }
  const contentHash = hashText(content);
  const records = await duplicateRecords(root);
  const provenance = { sourceKind: "local-file", source: absolute, canonicalUrl: null, capturedAt: new Date().toISOString(), contentHash, originalHash, extractor: `${INGESTION_VERSION}:${extension.slice(1)}`, extractorStatus, originalAttachment: null };
  return rememberPreview({ root, sourcePath: absolute, originalHash, preserveOriginal, title, content, provenance, duplicate: findDuplicate(records, null, contentHash), warnings, capability: ingestionCapabilities.local[extension] });
}

export async function previewUrlCapture(root, input, pageFetcher = fetchPublicPage) {
  const fetched = await pageFetcher(input);
  const decoded = fetched.body.toString("utf8");
  const extracted = fetched.contentType.includes("text/html") ? sanitizeHtmlToMarkdown(decoded, fetched.url) : { title: new URL(fetched.url).hostname, markdown: cleanText(decoded), canonicalUrl: null };
  if (!extracted.markdown) throw new NimvaraError("EMPTY_EXTRACTION", "No readable text was extracted.");
  const canonicalUrl = validatePublicUrl(extracted.canonicalUrl ?? fetched.url).href;
  const contentHash = hashText(extracted.markdown);
  const records = await duplicateRecords(root);
  const provenance = { sourceKind: "public-url", source: fetched.url, canonicalUrl, capturedAt: new Date().toISOString(), contentHash, originalHash: sha256(fetched.body), extractor: `${INGESTION_VERSION}:html-readable`, extractorStatus: "lossy", originalAttachment: null };
  return rememberPreview({ root, sourcePath: null, originalHash: provenance.originalHash, preserveOriginal: false, title: extracted.title, content: extracted.markdown, provenance, duplicate: findDuplicate(records, canonicalUrl, contentHash), warnings: ["Web capture extracts sanitized readable text; scripts, forms, styles, and active content are discarded."], capability: ingestionCapabilities.urlCapture });
}

function getPreview(id, root) {
  const preview = previews.get(id);
  if (!preview || preview.root !== root) throw new NimvaraError("PREVIEW_NOT_FOUND", "Preview expired or was cancelled.", 404);
  if (preview.expiresAt < Date.now()) { previews.delete(id); throw new NimvaraError("PREVIEW_EXPIRED", "Preview expired; retry extraction.", 410); }
  return preview;
}

export function cancelPreview(root, id) {
  getPreview(id, root);
  previews.delete(id);
  return { cancelled: true };
}

export async function commitPreview(root, id, destinationFolder, noteName, options = {}) {
  const preview = getPreview(id, root);
  if (preview.duplicate && !options.allowDuplicate) {
    throw new NimvaraError("DUPLICATE_FOUND", `This source matches ${preview.duplicate.notePath}. Confirm duplicate import to continue.`, 409, preview.duplicate);
  }
  const folder = String(destinationFolder ?? "").replaceAll("\\", "/").replace(/^\/+|\/+$/g, "");
  if (folder.split("/").some((part) => part === ".." || part === ".")) throw new NimvaraError("PATH_ESCAPE", "Destination must stay inside the workspace.");
  const filename = `${safeName(String(noteName ?? "").replace(/\.md$/i, ""), preview.title)}.md`;
  const relative = folder ? `${folder}/${filename}` : filename;
  const targetPath = path.join(root, ...relative.split("/"));
  if (await stat(targetPath).catch(() => null)) throw new NimvaraError("TARGET_EXISTS", "A note already exists at the selected destination.", 409);

  let attachmentRelative = null;
  let attachmentAbsolute = null;
  let attachmentCreated = false;
  let noteWritten = false;
  try {
    if (preview.preserveOriginal) {
      const extension = path.extname(preview.sourcePath).toLowerCase();
      attachmentRelative = `Attachments/Imports/${preview.originalHash.slice(0, 12)}-${safeName(path.basename(preview.sourcePath, extension))}${extension}`;
      attachmentAbsolute = path.join(root, ...attachmentRelative.split("/"));
      const sourceBefore = await readFile(preview.sourcePath);
      if (sha256(sourceBefore) !== preview.originalHash) throw new NimvaraError("SOURCE_CHANGED", "Source changed after preview; retry the import.", 409);
      if (!await stat(attachmentAbsolute).catch(() => null)) {
        await atomicWriteForTest(attachmentAbsolute, sourceBefore);
        attachmentCreated = true;
      }
      const sourceAfter = await readFile(preview.sourcePath);
      if (sha256(sourceAfter) !== preview.originalHash) throw new NimvaraError("SOURCE_CHANGED", "Source changed during import; retry.", 409);
      preview.provenance.originalAttachment = attachmentRelative;
    }
    const heading = preview.content.match(/^\s*#\s+/) ? "" : `# ${safeName(preview.title)}\n\n`;
    const attachmentLink = attachmentRelative ? path.posix.relative(path.posix.dirname(relative), attachmentRelative).replaceAll(" ", "%20") : null;
    const attachmentLine = attachmentLink ? `\n\n[Open preserved original](${attachmentLink})` : "";
    const markdown = `${heading}${preview.content.trim()}${attachmentLine}${provenanceBlock(preview.provenance)}`;
    await saveMarkdown(root, relative, markdown, null);
    noteWritten = true;
    if (options.failAfterNoteForTest) throw new Error("simulated commit failure");
    const records = await duplicateRecords(root);
    const record = { notePath: relative, canonicalUrl: preview.provenance.canonicalUrl, contentHash: preview.provenance.contentHash, originalHash: preview.provenance.originalHash, capturedAt: preview.provenance.capturedAt };
    const indexPath = path.join(root, ".lantern", "ingestion-index.json");
    await mkdir(path.dirname(indexPath), { recursive: true });
    await atomicWriteForTest(indexPath, Buffer.from(`${JSON.stringify({ schema: 1, records: [...records, record] }, null, 2)}\n`));
    previews.delete(id);
    return { notePath: relative, attachment: attachmentRelative, provenance: preview.provenance, duplicateOverride: Boolean(options.allowDuplicate) };
  } catch (error) {
    if (noteWritten) await rm(targetPath, { force: true });
    if (attachmentCreated && attachmentAbsolute) await rm(attachmentAbsolute, { force: true });
    throw error;
  }
}

export const futureIngestionAdapterContract = Object.freeze({
  authenticatedConnector: ["capabilities()", "authorize()", "preview(resourceId, signal)", "openOriginal(resourceId)", "revoke()"],
  browserExtension: ["handshake()", "previewCurrentPage(payload)", "submitSelection(payload)", "cancel(id)"],
  invariants: ["user-initiated", "preview-before-write", "bounded-content", "provenance-required", "untrusted-output", "no-credential-in-notes"]
});
