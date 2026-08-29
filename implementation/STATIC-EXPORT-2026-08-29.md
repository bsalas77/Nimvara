# Safe static publishing slice

`POST /api/publishing/export` exports selected Markdown notes to a new or empty folder as static HTML. Source files are never changed. The output escapes all Markdown as text, includes a title, and excludes private `.lantern` metadata and unselected notes. Unsafe or existing non-empty destinations are rejected.

This is intentionally a conservative first publishing slice. Link rewriting, attachment selection, preview, and archive packaging remain before publishing can be treated as a polished sharing workflow.

Automated coverage verifies selection, HTML escaping, source immutability, and destination safety.
