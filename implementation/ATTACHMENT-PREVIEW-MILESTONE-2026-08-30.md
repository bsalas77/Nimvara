# Attachment preview milestone — 2026-08-30

The packaged desktop path now exposes the same bounded, read-only inline attachment preview capability as the local service. Supported types are PDF, PNG/JPEG/GIF/WEBP/SVG images, and MP3/WAV/OGG audio. Previews are capped at 16 MiB, reject symlinks and workspace escapes, and return only typed MIME data plus base64 bytes. Unsupported types fail closed and the source file is never modified.

Validation: the native test suite passes **22/22** (one benchmark ignored), including typed preview, size/safety policy, and source-byte immutability. The JavaScript suite remains **66/66**. Native byte upload/drop and a guided missing-attachment repair workflow remain open; no automatic link rewriting is performed.
