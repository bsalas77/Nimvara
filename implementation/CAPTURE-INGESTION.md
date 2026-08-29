# Capture and ingestion milestone

Status: runnable Windows-host development slice  
Version: `lantern-ingestion/0.1.0`

## Runnable capabilities

| Source | Preview extraction | Original preservation |
|---|---|---|
| Public HTTP/HTTPS page | Sanitized readable Markdown | URL and fetched-content hash recorded; response body not stored as attachment |
| Markdown | UTF-8 text | Not duplicated when decoding is lossless |
| TXT | UTF-8 text | Preserved when invalid UTF-8 makes extraction partial |
| HTML | Sanitized readable Markdown | Always preserved because conversion is lossy |
| PDF | Unavailable in this build | Original preserved and linked |
| DOCX | Unavailable in this build | Original preserved and linked |

All imports require preview, destination folder, and note name before commit. Preview is ephemeral and writes nothing. Cancel discards the preview. Retry produces a fresh source read and hashes.

## Provenance

Each committed note contains a visible provenance table and a machine-readable `lantern-provenance:v1` comment with:

- source kind and URL/path;
- canonical URL when supplied by sanitized HTML;
- capture timestamp;
- extracted-content SHA-256;
- original-byte SHA-256;
- extractor identity/version/status;
- preserved-original attachment path when applicable.

The duplicate index under `.lantern/ingestion-index.json` is rebuildable metadata. Duplicates are detected by canonical URL or extracted-content hash and require explicit override.

## Network and untrusted-content controls

- User-initiated single-page capture only; no crawling.
- HTTP/HTTPS only; credentials in URLs are rejected.
- Localhost, `.local`, `.internal`, private, loopback, link-local, carrier NAT, benchmark, multicast, and special-use IP space are blocked.
- DNS is checked at connection time; mixed public/private DNS answers are rejected.
- Redirects are manual, limited to three, and revalidated.
- Responses are limited to 5 MiB and 10 seconds.
- API requests are limited to 1 MiB.
- `401`, `403`, authentication proxies, rate limits, and unsupported media types are not bypassed.
- A conservative `User-agent: *` robots `Disallow` is honored when a readable `robots.txt` is returned.
- Scripts, styles, forms, iframes, objects, embeds, SVG, MathML, event handlers, and JavaScript/data URLs are discarded.
- Imported content is plain untrusted data; it cannot invoke file, network, connector, or future AI actions.

The robots parser is intentionally minimal and not a general crawler-policy engine. Production should use a reviewed standards-compliant parser.

## Commit and rollback

When preservation is required, the source is reread and its preview hash verified before and after attachment creation. Originals use hash-prefixed names under `Attachments/Imports/`. The new Markdown note is written through the existing atomic-save path. A failure after either write removes newly created note/attachment artifacts. Existing source files are never modified.

## Future adapter boundaries

Authenticated connectors and browser extensions must implement user-initiated preview operations, bounded content, explicit authorization/revocation, provenance, cancellation, and no credential material in notes. They cannot bypass the same preview/commit boundary.

## Production extractor plan

### PDF

Bundle a pinned, signed, license-reviewed PDFium or Poppler text-extraction component per platform. Run it out-of-process without network access, against a temporary read-only copy, with wall-clock, memory, page-count, decompression, and output limits. Preserve the original in every case. Record page-level partial failures. OCR remains a separate explicit capability.

### DOCX

Use a memory-bounded Rust ZIP/XML reader with entry-count, total-uncompressed-size, compression-ratio, nesting, relationship, and timeout limits. Extract text and basic headings/lists without executing macros, external relationships, embedded objects, or fields. Reject macro-enabled formats from extraction and preserve every original.

No production extractor is claimed until a malicious-document corpus and license review pass on Windows, macOS, and Linux.

