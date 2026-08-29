# Android product decision and build boundary

Android is worthwhile as a later companion for capture, reading, search, and quick notes. It should not delay desktop daily-driver quality or be described as full vault parity yet.

Android’s Storage Access Framework exposes document-tree URIs rather than durable unrestricted filesystem paths. Nimvara needs a mobile workspace adapter, persisted URI permissions, safe copy/export behavior, background lifecycle reconciliation, and device-specific tests before `cargo tauri android init` is appropriate.

Recommended first Android scope:

- open a user-selected document tree;
- browse/read/search Markdown;
- create and edit notes with the same recovery and conflict rules;
- share URLs/text into an ingestion preview;
- export a verified snapshot;
- no autonomous crawling, background sync, plugins, or local-model download in the first mobile release.

Android Studio, SDK/NDK, Java, and an emulator/device are not installed on the current Windows host, so no Android binary is claimed.
