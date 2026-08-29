# Visual knowledge milestone — 2026-08-01

## Decision

Nimvara now provides a Markdown-native mind-map view. The current note remains the only
authoritative source: headings, nested lists, and wikilinks are projected into a deterministic
SVG visualization without creating a proprietary board file or silently rewriting Markdown.

## Implemented acceptance criteria

- A user can switch between Edit and Mind map from an open note.
- Headings and nested list items become hierarchical nodes.
- Wikilinks appear as distinct linked-note nodes; resolved links open the target note.
- Activating a normal node returns to the editor and selects its source line.
- Mouse and keyboard activation are supported, with an accessible SVG title and node labels.
- Fenced Markdown examples are ignored.
- Duplicate wikilink targets are de-duplicated.
- Unsaved editor text can be visualized without saving or changing workspace files.
- The output is deterministic and requires no network, account, plugin, or AI provider.

Automated validation: 29 JavaScript safety, compatibility, accessibility, ingestion, and
mind-map tests passed on this Windows host.

## Current evidence and prioritization

Current community discussions repeatedly ask for more intuitive mind mapping, native folder
notes, reliable mobile parity, structured/object-style views, task workflows, and less plugin
maintenance. This is directional public evidence, not a substitute for Nimvara user interviews:

- Obsidian's public roadmap tracks ongoing product improvements and feature requests:
  https://obsidian.md/roadmap/
- Recent community requests specifically describe intuitive mind mapping as a gap:
  https://www.reddit.com/r/ObsidianMD/comments/1rk0g4g/fluid_and_intuitive_mind_mapping_in_obsidian_like/
- Recent community requests identify native folder notes and stronger view behavior:
  https://www.reddit.com/r/ObsidianMD/comments/1pogn6w/whats_one_improvement_youd_like_to_see_in/
- Comparative market coverage highlights sync reliability, mobile/plugin parity, structured
  objects, outliners, databases, whiteboards, and collaboration as common switching drivers:
  https://www.cocube.com/blog/best-obsidian-alternatives

## Prioritized next additions

1. Daily notes plus an aggregate task view, using ordinary Markdown checkboxes.
2. Folder notes and map-of-content navigation without hidden metadata.
3. Note properties/frontmatter editing and database-like filtered views.
4. Visual map editing with previewed Markdown changes and checkpointed approval.
5. Canvas/whiteboard interoperability, starting with a documented open JSON format.
6. Calendar and recurring-note templates.
7. PDF annotation with portable sidecar Markdown.
8. Mobile capture and sync qualification after desktop data-integrity gates pass.

The next recommended implementation milestone is daily notes plus tasks: it improves everyday
capture and follow-through without weakening the file-first or data-safety foundation.
