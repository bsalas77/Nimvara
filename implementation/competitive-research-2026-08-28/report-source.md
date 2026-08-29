# Nimvara competitive complaints research and product backlog

**Research date:** 2026-08-28  
**Status:** Evidence-backed desk research; not user research or a market-size study  
**Decision owner:** Barry/Kogu  
**Product:** Nimvara

## Executive conclusion

The market does not need another knowledge app that wins a feature checklist and loses the user's trust. Across Obsidian, Notion, Logseq, Joplin, Anytype, Capacities, Evernote, Craft, Tana, AFFiNE, Roam-like outliners, and adjacent local-first tools, the recurring failures are remarkably consistent:

1. users cannot always tell whether their work is safely saved, synchronized, recoverable, or exportable;
2. mobile capture and navigation feel like reduced desktop experiences;
3. large workspaces, plugins, databases, or long notes can make the product slow or fragile;
4. core workflows depend on extensions, paid tiers, cloud access, or proprietary representations;
5. customization creates setup debt and inconsistent behavior across devices;
6. AI is often cloud-dependent, credit-metered, privacy-ambiguous, or added before foundational reliability is settled;
7. migration out is technically possible but not demonstrably lossless or reversible.

Nimvara's defensible direction is therefore **inspectable trust**: ordinary Markdown remains authoritative; every risky change is previewed, checkpointed, attributable, and recoverable; local AI is a free option; backup is provider-neutral and restore-tested; and the same essential workflow works without plugins.

The present repository already demonstrates parts of this promise on Windows. It is not yet proven as a production daily driver. The highest-priority work is not broader ideation. It is completing and independently validating data safety, migration fidelity, large-vault performance, mobile capture/sync, accessibility, and signed cross-platform distribution.

## Scope and method

This study covers recurring, material complaints relevant to a personal knowledge-management daily driver. It is not a literal catalog of every isolated complaint posted online. The primary period is 2023-2026, with older reports retained when the underlying issue remains current.

Products examined directly: Obsidian, Notion, Logseq, Joplin, Anytype, Capacities, Evernote, Craft, Tana, and AFFiNE. Roam Research and similar graph outliners were considered as an adjacent category, but current primary evidence was too thin in this pass for product-specific conclusions.

Evidence hierarchy:

1. official documentation, changelogs, roadmaps, and first-party statements;
2. official issue trackers and product-hosted forums;
3. reputable independent reporting;
4. Reddit and other communities, labeled as anecdotal signals.

An issue report proves that a reported failure exists, not its incidence across all users. Community volume and votes are directional, not a representative survey. No user interviews or measured competitor benchmarks occurred.

## Cross-product complaint taxonomy

### C01 - Save, sync, and conflict state is opaque

Users report uncertainty about whether work has been uploaded, downloaded, merged, or overwritten. Joplin officially documents that mobile has no background sync and that initial sync can be lengthy; its forum describes conflicts created when another device is edited before synchronization finishes. Logseq's tracker includes reports of an older client state becoming authoritative and deleting newer server content. Obsidian community reports repeatedly describe duplicate/conflict files and third-party sync complexity. These are not equivalent implementations, but the user-level complaint is the same: **the app says too little before risk becomes loss**.

Nimvara implication: expose a human-readable safety state for each note and device: saved locally, pending sync, remotely changed, conflict detected, checkpoint available, and backup verified. Never silently choose a winner.

### C02 - Backup and export do not equal proven recovery

Notion supports workspace export, but its official help says an export cannot be instantly recreated by reuploading it and that large workspace exports may fail. Anytype distinguishes portable Markdown export from a lossless native archive; its current tooling warns that an all-or-nothing import can stop without rolling back objects already imported. Joplin states its sync files are not user-editable even though it uses an open synchronization format. The repeated complaint is not merely “I can export.” It is “Can I restore everything, somewhere else, without faith?”

Nimvara implication: treat restore verification, manifest checks, attachments, metadata, and a migration round-trip as first-class acceptance tests.

### C03 - Offline or local-first claims contain qualifications

Notion's current offline mode requires desktop/mobile apps and individual page downloads; paid plans automatically download recent and favorited pages. Tana's first-party update says offline search is not supported for very large workspaces over 300,000 nodes, and shared workspaces are view-only offline. Capacities says integrations and AI still require internet. Anytype is local-first, but local-only and self-hosted configurations increase backup and operational responsibility. Users react poorly when “offline” means “some pages, some devices, some features.”

Nimvara implication: publish a precise offline capability matrix and make the authoritative workspace usable without an account, network, provider, or model.

### C04 - Mobile is a second-class workflow

Obsidian community and forum reports consistently describe slow startup, awkward desktop-derived navigation, plugin limitations, and weak quick capture on phones. Notion users similarly report slow, clunky database navigation on mobile. Joplin officially lacks mobile background sync. Anytype users report mobile export limitations. Craft added offline editing on Windows and Android only recently and labeled it beta in its 2026 announcement. A usable phone workflow is primarily capture, retrieve, review, and safe sync—not a squeezed desktop UI.

Nimvara implication: design a capture-first mobile surface with explicit queue/sync state, offline creation, attachment handling, fast search, and conflict-safe reconciliation.

### C05 - Performance degrades with scale or complexity

Official Notion guidance describes database property and row limits and recommends optimization for load time. Obsidian and Logseq issue/forum reports identify large-vault startup, indexing, renderer, and plugin-related slowdowns. Joplin reports long initial sync and heavy long-note editor lockups. AFFiNE has an open issue describing severe delay on a roughly 600 KB Markdown document. Performance complaints often appear only after users have already invested heavily, making them migration blockers and retention risks.

Nimvara implication: define public performance budgets and test representative vault shapes—many small notes, long notes, attachments, deep paths, heavy links, Unicode, and cold/warm launches—on minimum and recommended hardware.

### C06 - Plugin power becomes plugin debt

Obsidian users rely on plugins for folder notes, sorting, tasks, richer databases, navigation, and visual workflows. Reported costs include startup delay, unmaintained dependencies, weak documentation, security concerns, and different configurations by device. Logseq's renderer issue shows a case where disabling a large plugin set reduced a sustained CPU spike. Plugin ecosystems are valuable; making safety and ordinary navigation depend on them is not.

Nimvara implication: keep save, conflict review, search, backup, restore, capture, tasks, properties, links, and reviewed AI in the maintained core. If extensions are added, isolate permissions and resource use.

### C07 - Structured knowledge is powerful but cognitively expensive

Notion databases, Anytype objects, Capacities object types, and Tana supertags can create rich views. They also require users to decide structure, properties, and relationships before or during capture. The complaint surfaces as setup fatigue, schema maintenance, duplicated systems, and uncertainty about where information belongs.

Nimvara implication: use progressive structure. A plain note must remain useful; properties and views should emerge without converting the note into an opaque object.

### C08 - Search behavior is incomplete or surprising

Notion's official documentation says database search checks titles and property values, not page contents, and workspace search omits comments, discussions, and some mentions. Logseq's current tracker includes search/property failures. Search that silently excludes content damages trust more than a visibly scoped search.

Nimvara implication: show search scope, indexing state, exclusions, result provenance, and exact-match behavior. The index must be disposable and rebuildable from files.

### C09 - Pricing and plan changes create lock-in anxiety

Evernote's official plan comparison restricts the free tier to one synchronized device, while community megathreads show strong dissatisfaction with repeated price and packaging changes. Notion gates longer version history by plan. Tana bundles quotas and paid tiers around AI and meeting workflows. Users are less resistant to paying for real service costs than to discovering that access, recovery, export, or local use depends on a changing subscription.

Nimvara implication: keep local Markdown, local search, manual backup/restore, local AI adapters, and exit/export capability in the free core. Charge later for costly convenience services, support, managed sync, and team governance—not escape routes.

### C10 - AI creates privacy, cost, and control friction

Tana's plans explicitly meter AI credits. Capacities says AI requires internet. Notion Enterprise Search can use several model providers and connected apps, increasing capability but also the importance of scope transparency. Evernote users describe unwanted AI emphasis in pricing discussions. Local AI alone is not differentiation; users also need source traceability, cost visibility, bounded context, prompt-injection resistance, and reviewed edits.

Nimvara implication: local inference remains free and optional. External providers require explicit scope and transmission confirmation. Answers cite local sources; edits are typed proposals, diff-reviewed, checkpointed, cancelable, and auditable.

### C11 - Migration is lossy, laborious, or one-way

Notion says workspace exports cannot simply recreate a workspace. Logseq has current migration-related asset and large Markdown import issues. AFFiNE has export and self-hosted upgrade reports. Anytype distinguishes interchange export from lossless native restore. Users need evidence that their actual corpus—including attachments, links, frontmatter, edge-case paths, and unsupported syntax—survives both entry and exit.

Nimvara implication: ship an Obsidian migration rehearsal, compatibility report, unsupported-item ledger, zero-source-mutation check, and round-trip export tests before marketing replacement readiness.

### C12 - Accessibility and interaction consistency arrive late

Keyboard focus, screen-reader navigation, zoom, contrast, reduced motion, and touch targets are often treated as polish. Nimvara's existing automated semantics checks are useful but do not replace human Narrator/NVDA and real-device testing.

Nimvara implication: accessibility is an engineering gate and part of the core interaction contract, including mind maps, search, dialogs, conflicts, and AI review.

### C13 - Attachments, PDFs, handwriting, and clipping break the “notes” illusion

Obsidian community reports frequently mention attachment organization, PDFs, handwriting, and web capture as sources of plugin dependence or workflow fragmentation. Capacities applies media quotas and a 100 MB per-file limit on its Basic tier. Joplin users report large resources slowing sync. A knowledge system must preserve originals and clearly state extraction quality.

Nimvara implication: preserve source bytes, record provenance and hashes, quarantine untrusted material, and make lossy extraction explicit. Portable PDF annotation sidecars are preferable to hidden mutations.

### C14 - Customization conflicts with predictable support

Notion's flexible blocks/databases, Obsidian/Logseq plugins and CSS, and self-hosted local-first systems offer power but multiply permutations. Users then face inconsistent rendering, settings, keybindings, or behavior across devices.

Nimvara implication: provide opinionated defaults, transferable profiles, diagnostics, safe mode, and a capability report. Measure extension cost if an ecosystem is introduced.

## Product-specific complaint map

| Product | Recurring material complaints | Evidence confidence | Nimvara opportunity |
|---|---|---|---|
| Obsidian | Mobile startup/navigation; sync/conflict anxiety; basics delegated to plugins; plugin maintenance/security; attachments/PDF/handwriting friction; setup complexity | Medium: official forum plus repeated community signals | Dependable core, explicit safety state, capture-first mobile, compatibility without plugin dependence |
| Notion | Partial offline model; cloud dependence; mobile/database friction; slow large workspaces; incomplete search scope; export not directly restorable; version history gated by plan | High for documented limits; medium for experience complaints | Local authoritative files, complete offline core, honest search scope, verifiable restore |
| Logseq | Sync/data-stability reports; database migration risk; large graph/import failures; high CPU/plugin interactions; query/search inconsistency | Medium-high: first-party rationale and current tracker | Transactional derived state, non-mutating validation by default, migration rehearsal, recovery visibility |
| Joplin | No mobile background sync; slow initial/large sync; conflicts; editor inconsistency; advanced setup burden | High for documented sync limits; medium for reported failures | Background-safe capture queue, understandable merge/recovery, polished default editor |
| Anytype | Object-model learning curve; portable export differs from lossless archive; local-only/self-hosted operational burden; sync/media reports; mobile export gaps | High for architecture/export distinctions; medium for complaints | Plain-file authority with optional structure; one-click verified provider-neutral backup |
| Capacities | Object-first learning/maintenance; some features require internet; media quotas; potential concern about cloud/service dependence | High for official capability/limits; low-medium for complaint incidence | Progressive structure and a complete offline/free local core |
| Evernote | Pricing/plan churn; one-device free limit; lock-in and migration anxiety; unwanted AI emphasis; offline/sync/stability complaints | High for plan limits; medium for community experience | Stable free-core covenant; transparent optional services; standards-based files |
| Craft | Cross-platform parity arrived unevenly; Windows/Android offline mode recently beta; potential export/workflow differences across platforms | High for release status; low-medium for complaint incidence | Same capability contract on every supported platform before claiming parity |
| Tana | AI-credit dependence; structure/supertag learning curve; offline qualifications; very-large-workspace search limit; paid workflow automation | High for documented limits; medium for learning-curve complaints | Local AI without credits, plain-note fallback, large-corpus benchmarks |
| AFFiNE | Large-document performance; self-hosting complexity; sync warning/data-loss reports; export issues; desktop/self-hosted integration gaps | Medium: issue reports, not incidence data | Safer self-hosting boundary, visible sync failure, local journal before remote acknowledgement |

## Nimvara capability coverage as of this repository review

### Demonstrated in development artifacts

- ordinary Markdown is authoritative;
- native Windows application and development installer artifacts exist;
- atomic save and external-change refusal are covered by automated tests;
- local checkpoints and provider-neutral snapshot backup/restore exist;
- full-text search, ingestion preview/provenance, duplicate detection, and source preservation exist;
- mind-map projection, daily notes, Markdown tasks, folder indexes, frontmatter views, and PDF annotation sidecars exist;
- the AI adapter is optional, read-only by default, loopback-restricted for local providers, and externally gated;
- automated JavaScript and Rust safety suites have previously passed on this host.

These are repository records, not an independent certification. This research pass did not rerun the full application validation suite.

### Partly demonstrated or still gated

- true two-device synchronization, conflict merging, offline/reconnect races, and cloud placeholder behavior;
- real-device mobile applications and capture/sync qualification;
- large-vault performance budgets and long-duration soak testing;
- human keyboard/screen-reader/high-contrast/zoom testing;
- production PDF/DOCX extraction hardening;
- lossless full-vault Obsidian migration rehearsal and round trip;
- signed Windows installer, notarized macOS package, validated Linux package, and update rollout;
- production credential-vault integration and adversarial AI evaluation;
- external security review and independent recovery drills.

## Prioritized complaint-to-backlog conversion

Scoring uses **Impact (I)**, **frequency/evidence (E)**, **risk reduction (R)**, and **effort (F)** on 1-5 scales. Priority score = `(I + E + R) / F`. Scores guide ordering; safety gates can outrank arithmetic.

### P0 - Distribution and daily-driver blockers

#### NIM-001 - Workspace safety center

**Addresses:** C01, C02, C11  
**Score:** I5 / E5 / R5 / F2 = 7.5

Create a persistent, plain-language safety indicator showing local save, external modification, pending synchronization, conflict, checkpoint, last verified backup, and recovery actions.

Acceptance criteria:

- no edit can be reported as safe until durable local write succeeds;
- external changes prevent overwrite and offer compare, reload, save-copy, and cancel;
- every conflict preserves both versions and identifies timestamps/hashes;
- the user can reach the last checkpoint and last verified backup in two actions;
- status remains understandable without logs or developer tools.

#### NIM-002 - Two-device sync qualification harness

**Addresses:** C01, C03, C04  
**Score:** I5 / E5 / R5 / F4 = 3.75

Build a provider-neutral sync contract and test OneDrive first: simultaneous edits, offline/reconnect, rename/delete races, placeholders, clock skew, large attachments, case changes, and interrupted transfers.

Acceptance criteria:

- no silent last-writer-wins for Markdown;
- deterministic duplicate/conflict behavior is documented;
- a fault-injection matrix passes on Windows 10/11 and two physical devices;
- sync can be disabled without impairing local work;
- backup remains separate from sync.

#### NIM-003 - Obsidian migration rehearsal and round trip

**Addresses:** C02, C11, C13  
**Score:** I5 / E5 / R5 / F3 = 5.0

Run read-only inventory, copied-vault import, compatibility scan, unsupported-feature ledger, and export/restore round trip using representative vault fixtures and the authorized vault only when explicitly approved for a migration rehearsal.

Acceptance criteria:

- source vault hash manifest is unchanged;
- notes, attachments, frontmatter, wikilinks, aliases, headings, embeds, canvases, Unicode, and long paths receive pass/warn/fail results;
- unsupported constructs are never silently dropped;
- output remains usable in another Markdown editor;
- rollback steps are tested.

#### NIM-004 - Large-vault performance and resource budgets

**Addresses:** C05, C08, C14  
**Score:** I5 / E5 / R4 / F3 = 4.67

Publish minimum/recommended hardware budgets and measure cold start, warm start, editor latency, incremental indexing, search, memory, CPU, and battery-sensitive behavior.

Acceptance criteria:

- fixtures cover 1k/10k/50k notes, a 1 MB note, 10 GB attachments, deep/Unicode paths, and dense links;
- UI remains responsive during indexing and backup;
- indexing can pause automatically during gaming or on battery and can be stopped manually;
- performance regressions fail CI against versioned budgets;
- derived indexes rebuild without changing files.

#### NIM-005 - Capture-first mobile product

**Addresses:** C03, C04, C13  
**Score:** I5 / E5 / R4 / F5 = 2.8

Deliver Android first as the most practical mobile validation target, then iPhone/iPad, focused on quick capture, retrieval, attachments, offline queueing, and safe sync.

Acceptance criteria:

- new text, URL, photo, audio, and share-sheet capture works offline;
- queued items expose pending/sent/conflict state;
- no background failure loses a capture;
- launch-to-text-entry and search budgets are measured on low/mid/high devices;
- tablet layout is intentionally designed, not a stretched phone screen.

#### NIM-006 - Signed, update-safe release pipeline

**Addresses:** C09, C14  
**Score:** I5 / E4 / R5 / F3 = 4.67

Complete signed Windows distribution, macOS Developer ID signing/notarization, Linux package verification, SBOM/provenance, staged updates, rollback, and uninstall data retention.

Acceptance criteria:

- clean-machine install/upgrade/uninstall tests preserve workspaces, backups, settings, and models;
- signatures and hashes verify in CI and on target hosts;
- update failure rolls back to the previous executable;
- no background service is installed without explicit opt-in;
- release claims match actually tested platforms.

#### NIM-007 - Human accessibility release gate

**Addresses:** C12  
**Score:** I5 / E3 / R5 / F3 = 4.33

Run keyboard-only, Narrator/NVDA, 200-400% zoom, Windows High Contrast, reduced-motion, and cognitive clarity sessions across critical workflows.

Acceptance criteria:

- open/create/edit/save/search/backup/restore/conflict/ingest/AI-review require no pointer;
- focus order and announcements are predictable;
- mind maps have an equivalent list/tree representation;
- all blockers are resolved or explicitly declared before public release.

### P1 - Retention and competitive differentiation

#### NIM-008 - Progressive structure without schema lock-in

Keep frontmatter optional; add saved filtered views, lightweight properties, aliases, and collections that compile to documented Markdown/YAML conventions. Plain notes remain fully functional.

#### NIM-009 - Transparent indexed search

Add incremental indexing, title/path/content weighting, phrase/fuzzy modes, attachment text where safely extracted, scope filters, index health, rebuild controls, and visible exclusions.

#### NIM-010 - Core navigation completeness

Complete quick switcher, tabs, command palette, recent/favorite notes, folder-note conventions, backlinks, block references, rename-safe links, and attachment drag/drop without plugins.

#### NIM-011 - Verified backup lifecycle

Add scheduled local snapshots, retention/pinning, exclusions, encrypted destination adapters, restore browsing, failure notification, periodic recovery drills, and provider-neutral manifests.

#### NIM-012 - Safe local AI assistant

Add measured local retrieval, exact chunk citations, OS credential vaults for optional paid providers, streaming/cancel/cost limits, signed model manifests, hardware-aware model selection, and prompt-injection/data-exfiltration tests.

Acceptance criteria for AI edits:

- off by default and usable fully locally without a subscription;
- no workspace write tool is available to unreviewed model output;
- every proposed write is typed, scoped, diffed, checkpointed, and separately approved;
- citations open exact local source locations;
- ingested text cannot expand tool permissions or provider scope.

#### NIM-013 - Safe extension architecture

Do not launch a broad plugin ecosystem yet. First define signed packages, explicit permissions, filesystem/network denial by default, resource budgets, safe mode, crash isolation, compatibility contracts, and a maintenance/abandonment policy.

#### NIM-014 - Attachment and document workbench

Add production PDF/DOCX extraction with sandboxing and resource limits, portable annotations, OCR as an explicit optional operation, attachment organization, missing/orphan reports, and extraction-quality labels.

#### NIM-015 - Calm first-run and guided migration

Offer “Open my Markdown folder,” “Try a sample workspace,” and “Plan an Obsidian migration.” Explain data location, backups, sync distinction, local AI, and how to leave Nimvara in plain language.

### P2 - Valuable expansions after trust gates

- **NIM-016:** editable visual canvas that proposes reviewable Markdown changes and imports/exports a documented open JSON format;
- **NIM-017:** calendar, recurring tasks, reminders, and agenda views backed by portable Markdown properties;
- **NIM-018:** web clipper/browser extension using the existing safe ingestion boundary and provenance records;
- **NIM-019:** handwriting/ink capture with original preservation and portable image/PDF sidecars;
- **NIM-020:** local semantic search and relationship suggestions with no automatic file mutation;
- **NIM-021:** optional encrypted managed sync as a paid service, after the provider-neutral contract passes;
- **NIM-022:** collaboration only after permissions, audit, conflict, offline, and export semantics are proven;
- **NIM-023:** themes/layout profiles that do not alter content and can be reset or transferred;
- **NIM-024:** public extension SDK only after core APIs, permissions, diagnostics, and resource isolation stabilize.

## Product principles converted into release policy

1. **No silent loss.** A visible interruption is preferable to an invisible overwrite.
2. **The filesystem is the contract.** Databases and indexes are derived and rebuildable.
3. **Offline means the core works.** Marketing must list exceptions, not hide them.
4. **Backup is proven by restore.** A completed archive is not a verified recovery.
5. **Mobile is capture-first.** Optimize the job users do on a phone.
6. **Core before plugins.** Essential safety and daily use are maintained by Nimvara.
7. **Structure is progressive.** Notes remain useful before a schema exists.
8. **Search declares scope.** Missing content is visible, explainable, and recoverable.
9. **Local AI is free and optional.** Paid AI is an adapter, not a lock-in mechanism.
10. **AI proposes; people authorize.** Every consequential AI edit is reviewable and reversible.
11. **Exit is a feature.** Import and export fidelity are continuously tested.
12. **Claims follow evidence.** Development tests are not production certification.

## Recommended next engineering milestone

Start with **NIM-001 Workspace Safety Center**, paired with the initial harness work for **NIM-002 Two-device sync qualification**. This creates the user-visible trust model that later sync, mobile, backup, and AI features can share. In parallel only where it does not dilute the gate, build versioned large-vault fixtures for NIM-004.

The milestone is implementation-ready when:

- the safety state machine and transition table are documented;
- UI copy exists for every state and recovery path;
- fault-injection fixtures reproduce external edits, interrupted saves, pending sync, and conflicts;
- telemetry remains local and opt-in, with no note content collected;
- the acceptance tests above are automated where possible and assigned human gates where automation is insufficient.

## Evidence gaps and research follow-ups

- No representative interviews have established complaint frequency or willingness to switch/pay.
- No competitor was benchmarked locally under the same vault and hardware conditions.
- Current primary evidence for Roam Research, Heptabase, RemNote, and several smaller tools was insufficient for confident product-specific conclusions.
- Capacities and Craft complaint incidence needs stronger independent evidence; official limitations are documented, but user severity is not.
- Mobile conclusions need moderated task tests, especially capture time, interrupted sync, and accessibility.
- Pricing hypotheses need landing-page tests, support-cost estimates, tax/legal review, and interviews.
- AI differentiation needs measured citation correctness, prompt-injection resistance, local hardware coverage, and latency/quality testing.

## Selected sources

Primary and official sources are listed first; community sources are qualitative signals.

### Official documentation and first-party sources

- Notion, “Back up your data”: https://www.notion.com/help/back-up-your-data
- Notion, “Search for pages & content”: https://www.notion.com/en-gb/help/search
- Notion, “Use Notion pages offline”: https://www.notion.com/en-gb/help/use-pages-offline
- Notion, “Delete & restore content”: https://www.notion.com/help/duplicate-delete-and-restore-content
- Notion, “Optimize database performance”: https://www.notion.com/en-gb/help/optimize-database-load-times-and-performance
- Joplin FAQ: https://joplinapp.org/help/faq/
- Joplin 3.6 release notes: https://joplinapp.org/news/20260505-release-3-6/
- Joplin Android changelog: https://joplinapp.org/help/about/changelog/android/
- Anytype terms/local-first description: https://anytype.io/terms_of_use_apr_2024/
- Anytype sync topics: https://community.anytype.io/tag/sync/16
- Anytype sync SDK overview and limitations: https://sync.any.org/
- Capacities FAQ: https://capacities.io/faq
- Capacities media limits: https://docs.capacities.io/misc/media-upload
- Craft offline documentation: https://support.craft.do/en/introduction/offline
- Craft 3.3.9 offline release: https://www-staff.craft.do/blog/craft-update-3-3-9
- Evernote plan comparison: https://evernote.com/compare-plans
- Evernote free device-limit explanation: https://help.evernote.com/hc/en-us/articles/32039082181139-Understanding-Evernote-Free-Plan-Limits-1-Device-Explained
- Tana offline update: https://outliner.tana.inc/blog/tana-current-monthly-update-october-2025
- Tana pricing/export: https://outliner.tana.inc/pricing
- Logseq database rationale/status: https://discuss.logseq.com/t/why-the-database-version-and-how-its-going/26744
- Logseq current issue tracker: https://github.com/logseq/logseq/issues

### Representative issue evidence

- Logseq silent validation deletion report: https://github.com/logseq/logseq/issues/12975
- Logseq sync overwrite report: https://github.com/logseq/logseq/issues/12775
- Logseq migrated asset omission: https://github.com/logseq/logseq/issues/12912
- Logseq high CPU/large graph report: https://github.com/logseq/logseq/issues/12263
- Joplin mobile background-sync/conflict discussion: https://discourse.joplinapp.org/t/android-not-syncing-in-background-causing-conflicts/49951
- Joplin forced sync/long-note performance discussion: https://discourse.joplinapp.org/t/cannot-stop-synchronisation/50012
- AFFiNE sync-failure/data-loss report: https://github.com/toeverything/AFFiNE/issues/14846
- AFFiNE large-document performance report: https://github.com/toeverything/AFFiNE/issues/12675
- AFFiNE self-hosted desktop integration report: https://github.com/toeverything/AFFiNE/issues/14865

### Representative community signals

- Obsidian recurring frustrations: https://www.reddit.com/r/ObsidianMD/comments/1koioiw/what_frustrates_you_the_most_when_you_use_obsidian/
- Obsidian mobile usability: https://www.reddit.com/r/ObsidianMD/comments/1o74hpk/anyone_else_feels_obsidian_mobile_is_really/
- Obsidian plugin maintenance concerns: https://www.reddit.com/r/ObsidianMD/comments/1ktrv7n
- Obsidian large-vault iPhone report: https://forum.obsidian.md/t/performance-issues-on-iphone-14-pro-with-large-vault-40-000-notes-using-obsidian-sync/98759
- Notion 2026 mobile discussion: https://www.reddit.com/r/Notion/comments/1rm22u6/why_is_notions_mobile_app_still_so_bad_in_2026/
- Notion performance discussion: https://www.reddit.com/r/Notion/comments/1ofxaiz
- Evernote pricing megathread: https://www.reddit.com/r/Evernote/comments/1oww8h5/megathread_new_pricing_repackaging_discussion/

