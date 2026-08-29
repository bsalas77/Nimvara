# Cross-platform support and local-AI hardware test matrices

Status: designed; all cases not run

## Proposed support matrix

Minimum OS versions remain open decision O-002. Test on current supported releases and one proposed minimum before committing.

| Target | Architecture/package | Priority | Current evidence |
|---|---|---:|---|
| Windows | x64 installer | P0 | not run |
| Windows | ARM64 installer | P1 pending demand/O-006 | not run |
| macOS | Apple Silicon signed/notarized app/DMG | P0 | not run |
| macOS | Intel signed/notarized app/DMG | P0 pending support decision | not run |
| Linux | x64 AppImage | P0 | not run |
| Linux | x64 Debian package | P0 | not run |
| Linux | Flatpak/Snap | later pending O-007 | not run |

## Native cross-platform cases

Run each P0 case on native runners and at least one physical device per OS family.

| ID | Test | Expected result | Windows | macOS | Linux |
|---|---|---|---|---|---|
| XP-001 | Install/uninstall without developer tools | clean install; Markdown remains after uninstall | not run | not run | not run |
| XP-002 | Create/open workspace | only approved root is accessible | not run | not run | not run |
| XP-003 | Unicode, spaces, long paths, reserved/case variants | clear support or safe rejection | not run | not run | not run |
| XP-004 | Frontmatter, links, tables, callouts, code, unknown syntax | lossless preservation | not run | not run | not run |
| XP-005 | Attachments and non-Markdown files | no unintended mutation | not run | not run | not run |
| XP-006 | Open workspace then close | identical authoritative hashes | not run | not run | not run |
| XP-007 | Crash/power interruption during save | old or new valid bytes only | not run | not run | not run |
| XP-008 | Symlink/junction escaping workspace | blocked or explicitly governed | not run | not run | not run |
| XP-009 | Path traversal/case-normalization attacks | blocked | not run | not run | not run |
| XP-010 | External concurrent modification | compare/reload/save-copy; no silent overwrite | not run | not run | not run |
| XP-011 | Snapshot to local/removable/network/cloud-synced folder | verified or explicit failure | not run | not run | not run |
| XP-012 | Disk full, read-only, disconnect, antivirus/file lock | no false success or source damage | not run | not run | not run |
| XP-013 | Corrupt snapshot and restore interruption | detected; existing workspace preserved | not run | not run | not run |
| XP-014 | Keyboard/screen reader/high contrast/reduced motion | core workflows operable | not run | not run | not run |
| XP-015 | Update signature failure and rollback | rejected; prior version recoverable | not run | not run | not run |

## Local-AI hardware bands

These are sampling bands, not model eligibility claims. A measured recommendation requires named model, quantization, context, runtime build, power mode, and test corpus.

| Band | Representative configuration | Intended experience | Evidence |
|---|---|---|---|
| AI-0 | 8 GB RAM, CPU-only/integrated graphics | Core app; no model required; optional light AI only if tests pass | not run |
| AI-1 | 16 GB RAM, modern CPU/integrated GPU | Light AI; evaluate small quantized model | not run |
| AI-2 | 16–32 GB unified memory Apple Silicon | Light/standard via Metal | not run |
| AI-3 | 16–32 GB RAM plus 6–8 GB NVIDIA VRAM | Light/standard via CUDA | not run |
| AI-4 | 32 GB RAM plus AMD/Intel GPU | Evaluate Vulkan/HIP/SYCL by platform | not run |
| AI-5 | 32–64 GB RAM, 12+ GB VRAM/unified memory | Standard AI; larger-context evaluation | not run |
| AI-X | User-managed Ollama-compatible localhost service | External-local adapter | not run |

## Local-AI test cases

| ID | Measure/test | Record | Pass principle |
|---|---|---|---|
| AIH-001 | Hardware detection | OS/arch, RAM, GPU/backend, free disk; consent-safe | facts accurate; uncertainty visible |
| AIH-002 | Recommendation | model ID/version/license/hash, quantization, context, estimated memory | no overcommit; no silent download |
| AIH-003 | Download lifecycle | size, time, resume, cancel, hash failure, low disk | safe recovery; bad hash never activates |
| AIH-004 | Load and idle | load time, peak RAM/VRAM, idle resource use | editor remains usable |
| AIH-005 | Short generation | prompt tokens, output tokens, time-to-first-token, tokens/sec | result reported, not generalized |
| AIH-006 | Cited Q&A quality | fixed corpus, retrieval set, citation validity, unsupported-claim rate | invented IDs rejected |
| AIH-007 | Long/cancelled run | cancellation latency, cleanup, memory release | responsive cancellation |
| AIH-008 | Concurrent editor/index use | input latency, search latency, memory pressure | UI remains responsive |
| AIH-009 | Thermal/power behavior | sustained run, mode, throttling, battery impact | warning/recommendation evidence |
| AIH-010 | Backend failure | GPU init failure, fallback, crash, corrupt model | graceful fallback; no content loss |
| AIH-011 | Prompt-injection corpus | attempted write/network action | zero unapproved actions |
| AIH-012 | External-local endpoint | discovery/config, auth if any, offline behavior, mode label | clearly external-local |

## Result record

```text
Test ID / date / operator:
Device and OS build:
Package/runtime build:
Model ID, version, license, source, hash:
Quantization/context/backend/threads:
Power mode and other workload:
Corpus and prompt:
Measurements:
Pass/fail against stated criterion:
Logs/artifact:
Limitations:
```

Do not publish a “minimum requirement” or speed claim from a single device or unspecified model.

