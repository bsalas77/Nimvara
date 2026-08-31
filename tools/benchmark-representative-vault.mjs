#!/usr/bin/env node
import { performance } from "node:perf_hooks";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { parseMarkdownStructure } from "../app/server/lantern-core.mjs";

// Read-only representative-vault benchmark. It never creates metadata, caches,
// reports, or output files inside the vault and emits aggregate metrics only.
const root = path.resolve(process.argv[2] || "");
if (!root) throw new Error("Usage: node tools/benchmark-representative-vault.mjs <vault>");

async function walk(directory, relative = "") {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === ".obsidian" || entry.name === ".lantern" || entry.name === ".git") continue;
    const childRelative = relative ? `${relative}/${entry.name}` : entry.name;
    const child = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walk(child, childRelative));
    else if (entry.isFile()) output.push({ absolute: child, relative: childRelative });
  }
  return output;
}

const startInventory = performance.now();
const files = await walk(root);
const inventoryMs = performance.now() - startInventory;
const markdown = files.filter((file) => file.relative.toLowerCase().endsWith(".md"));
const extensionCounts = {};
let totalBytes = 0;
let largestNoteBytes = 0;
let maxPathChars = 0;
let unicodePaths = 0;
for (const file of files) {
  const info = await stat(file.absolute);
  totalBytes += info.size;
  maxPathChars = Math.max(maxPathChars, file.relative.length);
  if ([...file.relative].some((char) => char.codePointAt(0) > 127)) unicodePaths += 1;
  const extension = path.extname(file.relative).toLowerCase() || "(none)";
  extensionCounts[extension] = (extensionCounts[extension] || 0) + 1;
  if (file.relative.toLowerCase().endsWith(".md")) largestNoteBytes = Math.max(largestNoteBytes, info.size);
}

const startRead = performance.now();
const notes = await Promise.all(markdown.map(async (file) => ({ relative: file.relative, content: await readFile(file.absolute, "utf8") })));
const readMs = performance.now() - startRead;
const startParse = performance.now();
let wikilinks = 0, embeds = 0, headings = 0, tasks = 0;
for (const note of notes) {
  const structure = parseMarkdownStructure(note.content);
  headings += structure.headings.length;
  wikilinks += structure.wikilinks.length;
  embeds += structure.wikilinks.filter((link) => link.embed).length;
  tasks += (note.content.match(/^\s*[-*+]\s+\[[ xX]\]\s+/gm) || []).length;
}
const parseMs = performance.now() - startParse;
const query = "the";
const startSearch = performance.now();
const matches = notes.reduce((count, note) => count + (note.content.toLocaleLowerCase().includes(query) ? 1 : 0), 0);
const searchMs = performance.now() - startSearch;
console.log(JSON.stringify({
  schema: 1,
  readOnly: true,
  files: files.length,
  markdownNotes: markdown.length,
  totalBytes,
  largestNoteBytes,
  maxPathChars,
  unicodePaths,
  extensionCounts,
  inventoryMs: Math.round(inventoryMs * 100) / 100,
  readMs: Math.round(readMs * 100) / 100,
  parseMs: Math.round(parseMs * 100) / 100,
  warmSearchMs: Math.round(searchMs * 100) / 100,
  searchMatches: matches,
  wikilinks,
  embeds,
  headings,
  tasks
}));
