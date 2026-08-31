# Representative vault performance evidence — 2026-08-31

This is a read-only measurement of the previously authorized Obsidian vault. The benchmark excludes `.obsidian`, `.lantern`, and `.git` metadata, reads Markdown into memory, parses structure, and performs an in-memory search. It does not create caches, journals, reports, or other files in the source vault.

## Aggregate result

```json
{"schema":1,"readOnly":true,"files":60,"markdownNotes":55,"totalBytes":117308,"largestNoteBytes":7082,"maxPathChars":67,"unicodePaths":0,"extensionCounts":{".md":55,".docx":5},"inventoryMs":3.79,"readMs":1.22,"parseMs":1.47,"warmSearchMs":0.05,"searchMatches":31,"wikilinks":103,"embeds":0,"headings":334,"tasks":7}
```

The result is representative-vault evidence, not a production service-level objective. It does not qualify startup behavior in a clean installed build, two-device sync, assistive-technology workflows, or larger vaults. The source vault remained read-only and unmodified.

Reproduce from the repository root:

```text
node tools/benchmark-representative-vault.mjs "C:\Users\Kogu\OneDrive\Documents\Obsidian Vault"
```
