# Nimvara competitive research claim-source ledger

**Date:** 2026-08-28  
**Purpose:** Trace consequential product claims to evidence and preserve uncertainty.

| Claim ID | Material claim | Source class | Supporting source(s) | Confidence / limitation | Backlog link |
|---|---|---|---|---|---|
| CL-001 | Notion exports cannot be directly re-imported to recreate a workspace; large exports may fail | Official | https://www.notion.com/help/back-up-your-data | High for documented behavior; no local reproduction | NIM-003, NIM-011 |
| CL-002 | Notion offline access requires apps and individually downloaded pages; automatic recent/favorite downloads are paid-plan behavior | Official | https://www.notion.com/en-gb/help/use-pages-offline | High as of research date | NIM-005, release policy 3 |
| CL-003 | Notion database search excludes page body content and workspace search excludes comments/discussions and some mentions | Official | https://www.notion.com/en-gb/help/search | High as of research date | NIM-009 |
| CL-004 | Notion page version-history retention varies by plan | Official | https://www.notion.com/help/duplicate-delete-and-restore-content | High as of research date | NIM-011, free-core policy |
| CL-005 | Joplin mobile has no background sync and initial large imports can take a long time | Official | https://joplinapp.org/help/faq/ | High | NIM-002, NIM-005 |
| CL-006 | Joplin users report conflicts and UI interruption when sync lags or runs during editing | Product forum / anecdotal | https://discourse.joplinapp.org/t/android-not-syncing-in-background-causing-conflicts/49951 ; https://discourse.joplinapp.org/t/cannot-stop-synchronisation/50012 | Medium; reports do not establish incidence | NIM-001, NIM-002 |
| CL-007 | Logseq's database direction was motivated partly by data loss with multi-client file sync and poor large-graph performance | First-party forum | https://discuss.logseq.com/t/why-the-database-version-and-how-its-going/26744 | High for team rationale, not a benchmark | NIM-002, NIM-004 |
| CL-008 | Current Logseq reports include silent mutating validation, sync overwrite, migration asset omissions, and large import/worker failures | Official issue tracker | https://github.com/logseq/logseq/issues/12975 ; https://github.com/logseq/logseq/issues/12775 ; https://github.com/logseq/logseq/issues/12912 ; https://github.com/logseq/logseq/issues | Medium; existence proven, incidence unknown | NIM-001, NIM-003, NIM-004 |
| CL-009 | Anytype is local-first and E2E encrypted, while portable Markdown export and lossless native backup are different artifacts | Official / project docs | https://anytype.io/terms_of_use_apr_2024/ ; https://docs.anytype-toolbox.org/guides/backup-restore/ | High for architecture/tool behavior | NIM-011 |
| CL-010 | Anytype sync/media reports include missing assets and cross-device/self-hosted failures | Product forum | https://community.anytype.io/tag/sync/16 | Medium; topic listing is a current issue signal | NIM-002, NIM-003 |
| CL-011 | Capacities works offline for content/media, while integrations and AI require internet; Basic has media quotas and a 100 MB per-file limit | Official | https://capacities.io/faq ; https://docs.capacities.io/misc/media-upload | High as of research date | NIM-005, NIM-012, NIM-014 |
| CL-012 | Craft's Windows/Android offline editing was announced as beta in 2026 | First-party release | https://www-staff.craft.do/blog/craft-update-3-3-9 | High for release status | NIM-005, NIM-006 |
| CL-013 | Evernote free sync is limited to one device | Official | https://evernote.com/compare-plans ; https://help.evernote.com/hc/en-us/articles/32039082181139-Understanding-Evernote-Free-Plan-Limits-1-Device-Explained | High as of research date | Pricing/free-core policy |
| CL-014 | Evernote users express strong dissatisfaction with pricing churn and unwanted AI emphasis | Community / independent reporting | https://www.reddit.com/r/Evernote/comments/1oww8h5/megathread_new_pricing_repackaging_discussion/ ; https://www.androidcentral.com/apps-software/evernote-is-getting-even-more-expensive-so-im-ditching-it-and-moving-to-notesnook | Medium; self-selected reports | Pricing/free-core policy, NIM-012 |
| CL-015 | Tana offline mode has qualifications for shared-workspace editing and search over 300k nodes | First-party update | https://outliner.tana.inc/blog/tana-current-monthly-update-october-2025 | High as published | NIM-004, NIM-005 |
| CL-016 | Tana uses plan-based AI credits and supports Markdown/JSON export | Official pricing | https://outliner.tana.inc/pricing | High as of research date | NIM-012, pricing policy |
| CL-017 | AFFiNE has reports of unannounced sync failure/data loss, large-document delay, export issues, and self-hosted desktop integration gaps | Official issue tracker | https://github.com/toeverything/AFFiNE/issues/14846 ; https://github.com/toeverything/AFFiNE/issues/12675 ; https://github.com/toeverything/AFFiNE/issues/11164 ; https://github.com/toeverything/AFFiNE/issues/14865 | Medium; existence proven, incidence unknown | NIM-001, NIM-004, NIM-006 |
| CL-018 | Obsidian users repeatedly report mobile, sync, plugin, and attachment friction | Product forum / community | https://forum.obsidian.md/t/performance-issues-on-iphone-14-pro-with-large-vault-40-000-notes-using-obsidian-sync/98759 ; https://www.reddit.com/r/ObsidianMD/comments/1koioiw/what_frustrates_you_the_most_when_you_use_obsidian/ ; https://www.reddit.com/r/ObsidianMD/comments/1ktrv7n | Medium-low for prevalence; strong directional recurrence | NIM-002, NIM-005, NIM-010, NIM-013, NIM-014 |
| CL-019 | Nimvara repository records atomic save/conflict refusal, snapshots, ingestion, search, mind maps, productivity features, and a guarded AI adapter | Internal repository evidence | `implementation/PRIORITIZED-GAPS.md`; `implementation/PRODUCTIVITY-MILESTONE-2026-08-01.md`; `implementation/VISUAL-KNOWLEDGE-MILESTONE-2026-08-01.md`; `implementation/AI-PROVIDER-FOUNDATION.md` | Medium-high for recorded development validation; not independently rerun in this research pass | Coverage assessment |

## Evidence interpretation rules

- “Official” means the vendor or project's own current documentation; it can still be incomplete or promotional.
- An issue report establishes a specific reported failure, not product-wide prevalence.
- Community sources are used to identify recurring experience patterns, never market size.
- Pricing and product behavior can change; refresh this ledger before publication or release decisions.
- No claims in this report are based on invented interviews, survey percentages, or unperformed benchmarks.

