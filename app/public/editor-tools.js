export function transformSelection(value, start, end, action) {
  const source = String(value); const from = Math.max(0, Math.min(source.length, Number(start) || 0)); const to = Math.max(from, Math.min(source.length, Number(end) || from)); const selected = source.slice(from, to);
  if (action === "bold") return { value: source.slice(0, from) + `**${selected || "text"}**` + source.slice(to), start: from + 2, end: from + (selected || "text").length + 2 };
  if (action === "italic") return { value: source.slice(0, from) + `*${selected || "text"}*` + source.slice(to), start: from + 1, end: from + (selected || "text").length + 1 };
  if (action === "code") return { value: source.slice(0, from) + `\`${selected || "code"}\`` + source.slice(to), start: from + 1, end: from + (selected || "code").length + 1 };
  if (action === "link") return { value: source.slice(0, from) + `[${selected || "text"}](url)` + source.slice(to), start: from + 1, end: from + (selected || "text").length + 1 };
  if (action === "heading") return { value: source.slice(0, from) + "# " + source.slice(from), start: from + 2, end: to + 2 };
  if (action === "list") return { value: source.slice(0, from) + "- " + source.slice(from), start: from + 2, end: to + 2 };
  return { value: source, start: from, end: to };
}
