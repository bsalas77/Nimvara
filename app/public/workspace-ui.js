export function buildFileTree(paths) {
  const root = { name: "", folders: new Map(), files: [] };
  for (const path of [...paths].sort((a, b) => a.localeCompare(b))) {
    const parts = path.replaceAll("\\", "/").split("/"), file = parts.pop(); let node = root;
    for (const part of parts) { if (!node.folders.has(part)) node.folders.set(part, { name: part, folders: new Map(), files: [] }); node = node.folders.get(part); }
    node.files.push({ name: file, path });
  }
  return root;
}

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const inline = (value) => escapeHtml(value)
  .replace(/`([^`]+)`/g, "<code>$1</code>")
  .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  .replace(/\*([^*]+)\*/g, "<em>$1</em>")
  .replace(/\$([^$\n]+)\$/g, '<span class="math-inline">$1</span>')
  .replace(/!\[\[([^\]]+)\]\]/g, '<button class="embed-indicator" data-preview-embed="$1">Load embed: $1</button>')
  .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '<span class="wikilink" data-preview-link="$1">$2</span>')
  .replace(/\[\[([^\]]+)\]\]/g, '<span class="wikilink" data-preview-link="$1">$1</span>');

export function renderMarkdownPreview(markdown) {
  const output = [], lines = String(markdown).split(/\r?\n/), footnotes = new Map(); let fenced = false, list = false, callout = null, math = false;
  const closeList = () => { if (list) { output.push("</ul>"); list = false; } };
  const closeCallout = () => { if (callout) { output.push("</div></aside>"); callout = null; } };
  for (let index = 0; index < lines.length; index++) {
    const raw = lines[index];
    const footnote = raw.match(/^\[\^([^\]]+)\]:\s*(.+)$/); if (footnote) { footnotes.set(footnote[1], footnote[2]); continue; }
    if (/^\s*\$\$\s*$/.test(raw)) { closeList(); closeCallout(); math = !math; output.push(math ? '<div class="math-block">' : "</div>"); continue; }
    if (math) { output.push(`${escapeHtml(raw)}<br>`); continue; }
    const fence = raw.match(/^\s*```\s*([A-Za-z0-9_-]*)/);
    if (fence) { closeList(); closeCallout(); fenced = !fenced; output.push(fenced ? (fence[1].toLowerCase() === "mermaid" ? '<pre class="mermaid-source"><code>' : "<pre><code>") : "</code></pre>"); continue; }
    if (fenced) { output.push(`${escapeHtml(raw)}\n`); continue; }
    const calloutStart = raw.match(/^>\s*\[!([A-Za-z0-9_-]+)\][+-]?\s*(.*)$/);
    if (calloutStart) { closeList(); closeCallout(); callout = calloutStart[1].toLowerCase(); output.push(`<aside class="callout callout-${escapeHtml(callout)}"><strong>${inline(calloutStart[2] || callout)}</strong><div>`); continue; }
    if (callout && /^>\s?/.test(raw)) { output.push(`<p>${inline(raw.replace(/^>\s?/, ""))}</p>`); continue; }
    closeCallout();
    const heading = raw.match(/^(#{1,6})\s+(.+)$/); if (heading) { closeList(); output.push(`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`); continue; }
    const tableDelimiter = lines[index + 1]?.match(/^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/);
    if (raw.includes("|") && tableDelimiter) { closeList(); const headers = splitTable(raw); output.push(`<table><thead><tr>${headers.map((cell) => `<th>${inline(cell)}</th>`).join("")}</tr></thead><tbody>`); index += 2; while (index < lines.length && lines[index].includes("|")) { const cells = splitTable(lines[index]); output.push(`<tr>${cells.map((cell) => `<td>${inline(cell)}</td>`).join("")}</tr>`); index++; } index--; output.push("</tbody></table>"); continue; }
    const item = raw.match(/^\s*[-*+]\s+(?:\[([ xX])\]\s+)?(.+)$/); if (item) { if (!list) { output.push("<ul>"); list = true; } const task = item[1] == null ? "" : `<button class="preview-task" data-preview-task-line="${index + 1}" data-preview-task-text="${escapeHtml(item[2])}">${item[1].toLowerCase() === "x" ? "☑" : "☐"}</button> `; output.push(`<li>${task}${inline(item[2])}</li>`); continue; }
    closeList(); if (raw.trim()) output.push(`<p>${inline(raw).replace(/\[\^([^\]]+)\]/g, '<sup class="footnote-ref">[$1]</sup>')}</p>`);
  }
  closeList(); closeCallout(); if (fenced) output.push("</code></pre>");
  if (math) output.push("</div>");
  if (footnotes.size) output.push(`<section class="footnotes"><h2>Footnotes</h2><ol>${[...footnotes].map(([id, text]) => `<li id="footnote-${escapeHtml(id)}">${inline(text)}</li>`).join("")}</ol></section>`);
  return output.join("");
}

function splitTable(line) { return line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim()); }

export function extractTransclusion(markdown, reference) {
  const [, fragment = ""] = String(reference).split("#", 2); if (!fragment) return String(markdown);
  const lines = String(markdown).split(/\r?\n/);
  if (fragment.startsWith("^")) { const marker = fragment.slice(1); return lines.find((line) => line.trimEnd().endsWith(`^${marker}`))?.replace(new RegExp(`\\s*\\^${marker}\\s*$`), "") || ""; }
  const start = lines.findIndex((line) => line.replace(/^#+\s+/, "").trim().toLowerCase() === fragment.trim().toLowerCase()); if (start < 0) return "";
  const level = lines[start].match(/^#+/)?.[0].length || 6; let end = lines.length;
  for (let index = start + 1; index < lines.length; index++) { const heading = lines[index].match(/^(#+)\s+/); if (heading && heading[1].length <= level) { end = index; break; } }
  return lines.slice(start, end).join("\n");
}

export function parseMermaidFlowchart(source) {
  const lines = String(source).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!/^(?:flowchart|graph)\s+(?:TD|TB|LR|RL)$/i.test(lines.shift() || "")) return null;
  const nodes = new Map(), edges = [];
  const add = (id, label = id) => { if (!nodes.has(id)) nodes.set(id, { id, label }); };
  for (const line of lines) {
    const edge = line.match(/^([A-Za-z0-9_-]+)(?:\[([^\]]+)\]|\(([^)]+)\))?\s*--?>\s*([A-Za-z0-9_-]+)(?:\[([^\]]+)\]|\(([^)]+)\))?$/);
    const standalone = line.match(/^([A-Za-z0-9_-]+)(?:\[([^\]]+)\]|\(([^)]+)\))$/);
    if (edge) { add(edge[1], edge[2] || edge[3] || edge[1]); add(edge[4], edge[5] || edge[6] || edge[4]); edges.push({ from: edge[1], to: edge[4] }); }
    else if (standalone) add(standalone[1], standalone[2] || standalone[3] || standalone[1]);
    else return null;
    if (nodes.size > 200 || edges.length > 400) return null;
  }
  return { nodes: [...nodes.values()].map((node, index) => ({ ...node, x: 30 + (index % 4) * 190, y: 30 + Math.floor(index / 4) * 90 })), edges, width: 800, height: Math.max(180, 120 + Math.ceil(nodes.size / 4) * 90) };
}

export function normalizeSettings(input = {}) {
  const safePath = (value, fallback) => { const normalized = String(value || fallback).trim().replaceAll("\\", "/").replace(/^\/+|\/+$/g, ""); return normalized && !normalized.includes("..") ? normalized : fallback; };
  const theme = ["dark", "light", "high-contrast"].includes(String(input.theme)) ? String(input.theme) : "dark";
  return { dailyFolder: safePath(input.dailyFolder, "Daily"), folderNoteName: /^[A-Za-z0-9 _-]+$/.test(String(input.folderNoteName || "_index")) ? String(input.folderNoteName || "_index") : "_index", editorFontSize: Math.max(12, Math.min(24, Number(input.editorFontSize) || 16)), theme };
}

export function sanitizeDiagnostics(input = {}) {
  const value = input && typeof input === "object" ? input : {};
  const redactPath = (candidate) => String(candidate ?? "").replaceAll("\\", "/").split("/").at(-1) || null;
  const sourceCompatibility = value.lastCompatibilityReport && typeof value.lastCompatibilityReport === "object" ? value.lastCompatibilityReport : null;
  const compatibility = sourceCompatibility ? Object.fromEntries(Object.entries(sourceCompatibility)
    .filter(([key, item]) => key !== "missingAttachmentPaths" && key !== "longestRelativePath" && (typeof item === "number" || (key === "extensions" && item && typeof item === "object")))
    .map(([key, item]) => [key, key === "extensions" ? Object.fromEntries(Object.entries(item).filter(([extension, count]) => /^[.a-z0-9_-]{0,16}$/i.test(extension) && Number.isSafeInteger(count) && count >= 0).slice(0, 64)) : Number.isFinite(item) ? Math.max(0, Math.min(1_000_000_000, item)) : 0])) : null;
  return {
    schema: 1,
    generatedAt: value.generatedAt ?? new Date().toISOString(),
    app: value.app ?? "Nimvara",
    workspaceName: redactPath(value.workspace),
    userAgent: value.userAgent ?? "",
    openTabs: Array.isArray(value.openTabs) ? value.openTabs.map(redactPath).filter(Boolean) : [],
    noteName: redactPath(value.notePath),
    dirty: Boolean(value.dirty),
    compatibility
  };
}
