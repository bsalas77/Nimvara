# Anonymized Obsidian compatibility report

Inventory date: 2026-07-26  
Source: user’s standard Obsidian vault, inspected strictly read-only  
Migration performed: no

No note bodies, excerpts, private paths, participant data, or secrets are reproduced here.

## Aggregate inventory

| Measure | Observed |
|---|---:|
| Markdown notes | 45 |
| Non-Markdown attachments | 5 |
| Total user files | 50 |
| User folders below vault root | 15 |
| Logical top-level areas | 10 |
| Markdown bytes | 30,022 |
| Attachment type | `.docx` only |
| Canvas files | 0 |
| Largest note sizes, bytes | 7,082; 1,700; 1,598; 1,469; 1,372; 1,342; 1,302; 988; 765; 692 |

## Markdown patterns

| Pattern | Count |
|---|---:|
| Headings | 275 |
| Wikilinks | 78 |
| Aliased wikilinks | 35 |
| Heading-fragment wikilinks | 0 |
| Standard Markdown links | 1 |
| Frontmatter notes | 0 |
| Inline tags | 0 |
| Embeds | 0 |
| Markdown images | 0 |
| Task items | 0 |
| Callouts | 0 |
| Code-fence markers | 0 |

The vault is small and heavily structured through folders, headings, and wikilinks rather than metadata, tags, canvases, or embeds.

## Configuration identifiers

Enabled core identifiers:

`file-explorer`, `global-search`, `switcher`, `graph`, `backlink`, `canvas`, `outgoing-link`, `tag-pane`, `page-preview`, `daily-notes`, `templates`, `note-composer`, `command-palette`, `editor-status`, `bookmarks`, `markdown-importer`, `outline`, `word-count`, `audio-recorder`, `file-recovery`, `sync`

No community-plugin list was present. No custom theme or enabled CSS snippet was configured.

Configuration identifiers show availability/enabled state, not proof that every feature is actively used.

## Path and link indicators

| Indicator | Observed |
|---|---:|
| Paths containing spaces | 49 |
| Non-ASCII paths | 0 |
| Relative paths over 120 characters | 0 |
| Maximum relative path length | 67 |
| Maximum filename length | 39 |
| Maximum depth | 4 |
| Duplicate note-basename groups | 3 |
| Approximate unresolved wikilink targets | 11 of 78 |

Broken-link measurement is approximate because Obsidian resolution can depend on basename ambiguity and attachment resolution. The inventory did not modify or open notes interactively to disambiguate.

## Inferred migration-critical workflows

These are evidence-backed inferences from aggregate patterns and enabled configuration, not user interviews:

1. Navigate a durable folder hierarchy and quickly switch/search notes.
2. Preserve and resolve path-qualified and aliased wikilinks.
3. Show backlinks and outgoing links, including ambiguity/broken-link status.
4. Preserve `.docx` attachments and allow safe open/link behavior.
5. Provide outline navigation for heading-heavy notes.
6. Provide templates and daily-note creation with configurable location/naming.
7. Preserve file recovery/version history.
8. Support bookmarks/favorites and command-driven navigation.
9. Provide word count and page preview.
10. Offer a safe migration path for Obsidian Sync users without confusing sync with backup.

Graph, canvas, audio recording, tag pane, and importer are enabled but have little or no content evidence in this vault; they should follow the workflows above unless the user confirms daily dependence.

## Prioritized compatibility requirements

### P0 — required before using the real vault daily

- byte-lossless open/save for current Markdown and `.docx` attachments;
- folder tree, quick switcher, full-text search, and heading outline;
- wikilink aliases, path-qualified resolution, backlinks/outgoing links, ambiguity handling;
- external-change detection suitable for OneDrive/Obsidian coexistence;
- checkpoints plus verified snapshot/restore;
- migration dry run against a copied vault with zero open-only mutations.

### P1 — required to replace common configured workflows

- templates and daily-note naming/location;
- bookmarks/favorites;
- attachment open/reveal and missing-attachment reporting;
- word count and hover/page preview;
- compatibility report for unresolved/ambiguous links;
- explicit coexistence and cutover instructions for Obsidian Sync.

### P2 — validate actual use before building

- graph, canvas, audio recording, tags interface, Markdown importer, and advanced composition.

## Derived tests

- `COMP-001`: opening a copied vault changes zero bytes.
- `COMP-002`: all 78 wikilink occurrences parse; aliases display correctly.
- `COMP-003`: duplicate basenames produce deterministic resolution or an ambiguity prompt.
- `COMP-004`: approximate unresolved targets appear in a report without rewriting notes.
- `COMP-005`: all five `.docx` attachments retain byte hashes through snapshot/restore.
- `COMP-006`: folders with spaces and depth four navigate and search correctly.
- `COMP-007`: heading outline derives all headings without changing source.
- `COMP-008`: OneDrive/external edits block stale saves and offer compare/reload/save-copy.
- `COMP-009`: templates and daily notes create ordinary Markdown at configured paths.
- `COMP-010`: Obsidian and Nimvara can perform a controlled read-only coexistence rehearsal on a copy.

