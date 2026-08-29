# Knowledge-work app function matrix

This is a product-planning comparison, not a claim that every feature is equally deep. Competitor capabilities are based on current public product documentation; Nimvara status is based on the local implementation and tests.

| Capability | Nimvara | Obsidian | Notion | Logseq | Anytype |
|---|---|---|---|---|---|
| Plain Markdown files | Native, authoritative | Native | Export-oriented | Native graph | Object/database model |
| Offline/local-first | Native | Native | Partial/offline downloads | Native | Native, encrypted |
| Backlinks/wikilinks | Implemented; advanced edge cases remain | Mature | Page links/backlinks | Page and block refs | Graph/object links |
| Graph/mind map/canvas | Read-only map plus reviewable edits; canvas viewer | Graph and Canvas | Boards/databases, not Markdown canvas | Whiteboards | Graph/object views |
| Tables/databases | Frontmatter property table; Markdown tables | Plugin/core table workflows | Mature databases and many views | Queries/property tables | Collections/objects |
| Kanban | Task-derived board prototype | Usually plugin/third-party | Native board database | Workflow/queries | Board views |
| Tasks/projects | Markdown task dashboard and reviewable toggles | Tasks plus plugins | Mature dependencies/projects | Native tasks/queries | Object workflows |
| Capture/import | URL and local import with preview/provenance | Community-heavy | Web clipper/import integrations | Share/PDF workflows | Capture and object creation |
| Attachments/PDF | Safe preservation, inventory, PDF sidecars | Strong plugin ecosystem | Uploads/embeds | PDF highlights | Media/object storage |
| Sync/conflict safety | Provider-neutral reconciler; live two-device gate open | Official Sync, conflict history | Cloud collaboration/offline cache | Sync available; graph-centric | Encrypted AnySync |
| AI | Local/paid adapter, cited read-only answers, reviewed edits | Large plugin ecosystem and vendor features | Native AI/agents/integrations | Emerging ecosystem | Privacy/local-first positioning |
| Extensibility | Read-only MCP, HTTP API, adapter boundaries | Very mature plugins/themes | Integrations/API/agents | Plugins/commands | Open-source protocol/ecosystem |
| Themes/customization | Dark/light/high contrast, font sizing | Very mature themes/CSS | Themes and page/site customization | Themes/configuration | Themes/layouts |
| Mobile | Packaging plan; no validated app | iOS/Android | iOS/Android | Mobile work ongoing | iOS/Android |
| Collaboration/publishing | Not yet production | Publish/Sync are separate products | Core strength | Publishing and sharing | Local-first sharing |

## Competitive interpretation

Nimvara's strongest differentiator is the combination of ordinary Markdown ownership, lossless/conflict-aware writes, provider-neutral backups, safe ingestion provenance, and locally controlled AI. It is not yet competitive on ecosystem breadth, collaboration, mobile maturity, plugin/theme marketplace, database depth, or validated cross-device sync.

## Must-have competitive backlog

1. Migration that preserves links, attachments, frontmatter, canvases, plugins-as-configuration, and a reversible cutover.
2. Reliable tabs, quick switcher, backlinks, unlinked references, graph/canvas editing, and attachment drag/drop.
3. Kanban with explicit Markdown-backed status properties, drag-to-review changes, filters, swimlanes, and saved views.
4. Rich editor parity: tables, callouts, embeds, footnotes, math, Mermaid, block references, slash commands, and keyboard-first operation.
5. Native mobile capture/read/edit with offline queue and safe conflict resolution.
6. Production sync, crash recovery, accessibility, performance, signed updates, and independent security review.
7. A documented plugin/API/MCP contract with permissions, review, versioning, and compatibility tests.
8. Local AI model onboarding that is measurable, resource-aware, private by default, and useful without a subscription.

## Evidence limits

No competitor feature count is a quality score, and no user-preference claim is inferred from marketing pages. Nimvara still needs consented migration studies and measured task success before product-market decisions.

## Sources

- Obsidian overview: https://help.obsidian.md/Getting+started/Overview
- Notion product capabilities and plans: https://www.notion.com/en-US/product/notion
- Notion offline behavior: https://www.notion.com/en-gb/help/use-pages-offline
- Logseq documentation and feature index: https://docs.logseq.com/
- Anytype documentation repository and local-first model: https://github.com/anyproto/docs-new
