export function localDateKey(date = new Date()) {
  const year = date.getFullYear(), month = String(date.getMonth() + 1).padStart(2, "0"), day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dailyNotePath(date = new Date(), folder = "Daily") { return `${folder}/${localDateKey(date)}.md`; }

export function createDailyNote(date = new Date(), template = "") {
  const key = localDateKey(date);
  return template ? template.replaceAll("{{date}}", key).replaceAll("{{title}}", key) : `---\ndate: ${key}\ntype: daily\n---\n\n# ${key}\n\n## Notes\n\n## Tasks\n\n- [ ] `;
}

export function parseTasks(content, path) {
  const tasks = [], lines = String(content).split(/\r?\n/); let fenced = false;
  lines.forEach((line, index) => {
    if (/^\s*(```|~~~)/.test(line)) { fenced = !fenced; return; }
    if (fenced) return;
    const match = line.match(/^\s*[-*+]\s+\[([ xX])\]\s+(.+?)\s*$/);
    if (match) tasks.push({ path, line: index + 1, completed: match[1].toLowerCase() === "x", text: match[2] });
  });
  return tasks;
}

export function parseFrontmatter(content) {
  const lines = String(content).split(/\r?\n/); if (lines[0]?.trim() !== "---") return {};
  const result = {};
  for (let index = 1; index < lines.length; index++) {
    if (lines[index].trim() === "---") break;
    const match = lines[index].match(/^([A-Za-z0-9_-]+):\s*(.*?)\s*$/);
    if (match) result[match[1]] = parseScalar(match[2].replace(/^['"]|['"]$/g, ""));
  }
  return result;
}

export function parseScalar(value) {
  const text = String(value).trim();
  if (text.startsWith("[") && text.endsWith("]")) {
    const inner = text.slice(1, -1).trim();
    if (!inner) return [];
    const items = inner.split(",").map((item) => item.trim().replace(/^['"]|['"]$/g, ""));
    if (items.length <= 50 && items.every((item) => item.length <= 200 && !/[{}[\]]/.test(item))) return items.map((item) => parseScalar(item));
  }
  if (/^(true|false)$/i.test(text)) return text.toLowerCase() === "true";
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(text)) {
    const number = Number(text);
    if (Number.isFinite(number)) return number;
  }
  return text;
}

export function filterRecords(records, query) {
  const terms = String(query).trim().toLowerCase().split(/\s+/).filter(Boolean);
  return records.filter((record) => terms.every((term) => {
    const [key, value] = term.includes(":") ? term.split(/:(.*)/s, 2) : [null, term];
    if (key) return String(record.properties[key] ?? "").toLowerCase().includes(value);
    return `${record.path} ${Object.values(record.properties).join(" ")}`.toLowerCase().includes(value);
  }));
}

export function organizeRecords(records, sortKey = "path", groupKey = "") {
  const output = [...records].sort((a, b) => String(a.properties?.[sortKey] ?? a[sortKey] ?? "").localeCompare(String(b.properties?.[sortKey] ?? b[sortKey] ?? ""), undefined, { numeric: true, sensitivity: "base" }));
  if (!groupKey) return output;
  return output.sort((a, b) => String(a.properties?.[groupKey] ?? "").localeCompare(String(b.properties?.[groupKey] ?? ""), undefined, { sensitivity: "base" }));
}

export function proposeMindMapChild(content, node, label) {
  const clean = String(label).replace(/[\r\n]+/g, " ").trim();
  if (!clean) throw new Error("Branch text is required.");
  const lines = String(content).split(/\r?\n/), index = Math.max(0, Math.min(lines.length, node.line));
  const addition = node.level >= 1 && node.level < 6 ? `${"#".repeat(node.level + 1)} ${clean}` : `${"  ".repeat(Math.max(0, node.level - 7) + 1)}- ${clean}`;
  lines.splice(index, 0, addition);
  return { content: lines.join("\n"), addition, afterLine: node.line };
}

export function proposeTaskToggle(content, line, expectedText) {
  const lines = String(content).split(/\r?\n/), index = Number(line) - 1;
  if (index < 0 || index >= lines.length) throw new Error("Task source line no longer exists.");
  const match = lines[index].match(/^(\s*[-*+]\s+)\[([ xX])\](\s+)(.+?)\s*$/);
  if (!match || match[4] !== expectedText) throw new Error("Task source changed; refresh the dashboard.");
  const completed = match[2].toLowerCase() === "x";
  lines[index] = `${match[1]}[${completed ? " " : "x"}]${match[3]}${match[4]}`;
  return { content: lines.join("\n"), completed: !completed, before: lines[index].replace(`[${completed ? " " : "x"}]`, `[${completed ? "x" : " "}]`), after: lines[index] };
}

export function proposeKanbanMove(content, line, expectedText, targetColumn) {
  const column = String(targetColumn);
  if (!/^[a-z][a-z0-9_-]{1,31}$/.test(column)) throw new Error("Kanban column must be a safe name (2–32 lowercase characters).");
  const lines = String(content).split(/\r?\n/), index = Number(line) - 1;
  if (index < 0 || index >= lines.length) throw new Error("Task source line no longer exists.");
  const match = lines[index].match(/^(\s*[-*+]\s+)\[([ xX])\](\s+)(.+?)\s*$/);
  if (!match || match[4] !== expectedText) throw new Error("Task source changed; refresh the board.");
  const original = lines[index];
  let text = match[4].replace(/\s+\((?:in progress|doing)\)\s*$/i, "").trim();
  const completed = column === "done";
  if (column === "doing") text = `${text} (In progress)`;
  else if (column !== "done" && column !== "backlog") text = `${text} (${column.replaceAll("_", " ")})`;
  lines[index] = `${match[1]}[${completed ? "x" : " "}]${match[3]}${text}`;
  return { content: lines.join("\n"), before: original, after: lines[index], column };
}

export function proposePropertyEdit(content, key, value) {
  const safeKey = String(key).trim(), safeValue = String(value).replace(/[\r\n]+/g, " ").trim();
  if (!/^[A-Za-z0-9_-]+$/.test(safeKey)) throw new Error("Property names may contain letters, numbers, underscore, and hyphen.");
  const listValue = safeValue.startsWith("[") && safeValue.endsWith("]") && safeValue.length <= 800 && safeValue.slice(1, -1).split(",").every((item) => /^[A-Za-z0-9 _.-]*$/.test(item.trim()));
  if (/^[\[\]{},&*!|>@`]/.test(safeValue) && !listValue) throw new Error("Use a plain scalar or bounded list property value.");
  const lines = String(content).split(/\r?\n/);
  if (lines[0] !== "---") lines.unshift("---", `${safeKey}: ${safeValue}`, "---", "");
  else {
    const end = lines.indexOf("---", 1); if (end < 0) throw new Error("Frontmatter closing delimiter is missing.");
    const existing = lines.slice(1, end).findIndex((line) => line.startsWith(`${safeKey}:`));
    if (existing >= 0) lines[existing + 1] = `${safeKey}: ${safeValue}`; else lines.splice(end, 0, `${safeKey}: ${safeValue}`);
  }
  return { content: lines.join("\n"), key: safeKey, value: safeValue };
}
