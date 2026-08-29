# Research findings

Research date: July 26, 2026

## Executive conclusion

The market does not need another feature-maximal note application. The strongest opening is a low-configuration, local-first desktop application with a trustworthy AI change-review workflow and reliable recovery.

The first release should validate five propositions:

1. “Open a folder and start” is more attractive than designing a knowledge system.
2. Users value source-cited AI more than generic writing chat.
3. A before/after approval flow creates enough trust to permit AI-assisted organization.
4. Versioned backup and tested restore are differentiators, not settings-page utilities.
5. A coherent core feature set can replace many plugins for most daily work.

## Competitive landscape

### Obsidian

Obsidian remains the benchmark for local Markdown ownership and extensibility. Since 2025 it has also been free for work. Its advantages are its installed base, mature editor, and large plugin ecosystem. The opportunity is not to beat its flexibility; it is to eliminate the configuration and maintenance cost that flexibility creates.

Community reports repeatedly identify:

- basic workflows requiring multiple plugins;
- plugin trust and software-supply-chain concerns;
- plugin settings behaving inconsistently across devices;
- conflicts when general cloud tools are used as synchronization mechanisms;
- search and startup problems in some large or plugin-heavy vaults;
- a graph view that many users do not consider part of their daily work.

These reports are qualitative signals, not representative prevalence estimates. They require interviews and usability tests before being converted into backlog priority.

### AFFiNE

AFFiNE positions itself as a local-first, self-hostable all-in-one workspace with documents, whiteboards, and a paid AI add-on. It demonstrates demand for ownership plus AI, but its breadth makes it a different product. Nimvara should remain document- and retrieval-centered.

### Anytype

Anytype provides local-first storage, end-to-end encryption, offline operation, and self-hosting. Its object model and networking architecture are more ambitious than Nimvara needs. Nimvara differentiates through plain-file interoperability and a simpler mental model.

### Logseq

Logseq demonstrates demand for privacy-first knowledge management, but its evolving database and synchronization work also illustrates the risk of combining a major data-model transition with collaboration and sync. Nimvara should keep Markdown authoritative and treat its database as a cache.

## User-needs synthesis

### Must be effortless

“Easy to install” is more than producing installers. It requires:

- signed/notarized packages where applicable;
- no runtime or developer-tool prerequisites;
- automatic updates with a visible rollback path;
- a sample workspace that teaches by doing;
- sensible defaults for workspace location, attachments, and backup;
- no mandatory account;
- useful operation before an AI model finishes downloading.

### Local AI needs honest hardware adaptation

Local inference varies widely across Apple Silicon, NVIDIA/AMD/Intel graphics, system memory, and CPU-only machines. A single bundled model would either exclude modest hardware or underuse capable hardware.

The setup should classify the machine into experience bands:

- **Core:** writing, search, and backup; no model required.
- **Light AI:** small model for tagging, short summaries, and query reformulation.
- **Standard AI:** a moderate quantized model for cited Q&A and drafting.
- **External AI:** connect a user-managed local server.
- **Hosted fallback, later:** explicit opt-in when local performance is inadequate.

The application should display model size, download size, approximate memory requirement, license, source, and whether any request leaves the device.

### Backup is not synchronization

Opening a live workspace inside a provider-managed folder may be convenient, but deletion and conflicting edits can propagate. Microsoft explicitly documents that deleting a OneDrive item removes it across devices, subject to recycle-bin recovery. Google Drive for desktop is unavailable on Linux, and provider desktop support is inconsistent.

MVP design:

- working files stay in a normal local folder;
- Nimvara creates immutable, versioned backup snapshots;
- a user selects a destination folder;
- that folder may be managed by OneDrive, Google Drive, Box, Dropbox, a network drive, or removable media;
- each snapshot includes a manifest and integrity hashes;
- Nimvara periodically performs a restore verification;
- retention is understandable: for example, 7 daily, 4 weekly, and 12 monthly snapshots.

This approach supports many providers without holding OAuth tokens or implementing four cloud APIs. Direct provider connections can be evaluated later, especially for Linux.

### Security is a product feature

The threat model includes:

- malicious or malformed note content;
- prompt injection embedded in imported/web-clipped text;
- model or embedding downloads from untrusted sources;
- frontend compromise gaining filesystem access;
- AI modifying more files than intended;
- API keys appearing in logs or note content;
- untrusted extensions;
- update or dependency supply-chain compromise;
- backup disclosure and destructive restore mistakes.

Security requirements:

- least-privilege filesystem scope limited to user-approved workspace and backup paths;
- strict content-security policy and no remote scripts;
- Markdown HTML sanitization;
- read-only AI default and structured action permissions;
- human approval for writes, moves, deletes, external requests, and bulk actions;
- secrets in the operating system credential store;
- signed releases, reproducible dependency manifests, SBOM, and vulnerability scanning;
- model allowlist with license and cryptographic hash verification;
- local interaction history by default, with clear deletion controls;
- no arbitrary plugin code in the MVP.

## Cross-platform packaging

Tauri 2 supports Windows installers, macOS application/DMG distribution, and Linux formats including AppImage, Debian, RPM, Flatpak, and Snap. Platform signing remains necessary, and macOS direct distribution requires notarization.

Recommended first packages:

- Windows x64 installer, followed by Windows ARM64 after testing;
- macOS universal or separate Apple Silicon and Intel builds;
- Linux AppImage plus Debian package initially;
- Flatpak after filesystem permissions and local-model behavior are validated.

The release pipeline must test on native runners for all three operating-system families.

## Research limitations

This document synthesizes public product documentation and self-selected community discussions. It does not yet contain:

- representative survey data;
- observed installation tests across a hardware matrix;
- interviews with users who abandoned Obsidian;
- measured performance on large real-world vaults;
- willingness-to-pay evidence;
- accessibility testing.

Those gaps are addressed in the user-research plan and release gates.

## Sources

Primary and official:

- [Obsidian: free for work and local Markdown](https://obsidian.md/blog/free-for-work/)
- [AFFiNE pricing and local-first positioning](https://affine.pro/pricing?type=selfhost)
- [Anytype FAQ: local-first, encryption, and self-hosting](https://anytype.io/faq/)
- [Logseq repository and database-version cautions](https://github.com/logseq/logseq)
- [Tauri distribution documentation](https://v2.tauri.app/distribute/)
- [Tauri security model](https://v2.tauri.app/security/)
- [Tauri content security policy](https://v2.tauri.app/security/csp/)
- [llama.cpp platform and accelerator support](https://github.com/ggml-org/llama.cpp)
- [Google Drive desktop system requirements](https://support.google.com/drive/answer/2375082)
- [Microsoft OneDrive Files On-Demand and deletion behavior](https://support.microsoft.com/en-us/office/save-disk-space-with-onedrive-files-on-demand-for-windows-0e6860d3-d9f3-4971-b321-7092438fb38e)
- [Dropbox desktop system requirements](https://help.dropbox.com/installs/system-requirements)
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- [NIST secure development practices for generative AI](https://www.nist.gov/publications/secure-software-development-practices-generative-ai-and-dual-use-foundation-models-ssdf)
- [OWASP prompt-injection prevention](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html)

Qualitative community signals:

- [Obsidian community discussion: missing and clunky features](https://www.reddit.com/r/ObsidianMD/comments/1snrrrz/what_do_you_feel_obsidian_is_currently_lacking/)
- [Obsidian community discussion: recurring frustrations](https://www.reddit.com/r/ObsidianMD/comments/1jwchcg/whats_your_biggest_frustration_with_obsidian/)
- [Obsidian forum: plugin settings and sync behavior](https://forum.obsidian.md/t/obsidian-sync-doesnt-sync-plugins/65062)
