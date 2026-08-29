# Cross-platform distribution and usage

## Linux desktop

Prepared targets: Debian package and AppImage. Build on a supported Linux host with Rust, Tauri CLI, GTK/WebKit development packages, and the distribution packaging tools:

```sh
./packaging/linux/build-linux.sh
```

Usage matches Windows: install the package, launch Nimvara from the application menu, then open a normal Markdown folder. The build is not license-fee-gated, but repository software licensing remains a separate unresolved decision.

Security status: Tauri 2's Linux webview still uses unmaintained GTK3 Rust bindings.
The concrete `RUSTSEC-2024-0429` unsoundness in `glib 0.18.5` is repaired using the exact
reviewed upstream two-line backport, with vendored-source provenance and a guarded audit
script. Linux public release still requires installed Wayland/X11 qualification and a
tracked migration to Tauri's maintained GTK4 stack when available.

## macOS desktop

The hosted qualification workflow targets `macos-14`, runs the JavaScript and native Rust gates, and uploads an unsigned `.dmg` artifact. Running it requires pushing the repository to GitHub and manually dispatching `Cross-platform release candidates`; this Windows host cannot execute macOS binaries locally.

Prepared targets: `.app` and `.dmg`, minimum macOS 12:

```sh
./packaging/macos/build-macos.sh
```

Build and test on a Mac with Xcode. Users drag Nimvara into Applications, launch it, and select a Markdown folder. Direct public distribution requires Developer ID signing and notarization; ad-hoc signing still causes Gatekeeper trust friction.

## iPad

iPad should reuse Nimvara’s Rust safety rules and responsive interface, but needs a native Files/document-picker adapter. Arbitrary desktop paths do not satisfy the iPad sandbox. See `packaging/apple-mobile/README.md`.

Recommended iPad scope is a focused companion: Files/iCloud workspace selection, reading/search, safe editing and recovery, share-sheet ingestion, and snapshot export. Local AI should follow only after memory, storage, thermal, and model-license testing on supported devices.

## Android recommendation

Build Android after desktop release quality and the shared mobile workspace adapter. The market value is real—capture and quick-note workflows are naturally mobile—but premature Android work would duplicate filesystem, lifecycle, accessibility, and distribution risk before desktop trust is proven.

The recommended order is:

1. Windows daily-driver release;
2. Linux and macOS desktop validation;
3. shared iPad/Android document-provider abstraction;
4. iPad companion;
5. Android companion;
6. mobile local AI only after measured hardware tests.

## Distribution cost clarification

- Linux packages can be distributed directly without a platform signing membership fee, though package signing and repository trust are still recommended.
- Microsoft currently documents Microsoft Store MSIX re-signing as a no-certificate-cost route. `packaging/windows/build-msix.ps1` creates the package; Store submission must supply the Partner Center identity and publisher values. Direct-download EXE/MSIX trust still requires an eligible signing service/certificate.
- Free Apple accounts are suitable for limited development testing. Normal public macOS notarization and iPad App Store/TestFlight distribution require Apple Developer Program membership.

These platform costs are independent of the source-code license, which remains intentionally unresolved.

## Artifacts and host validation

- Windows setup: built, installed, and tested.
- Windows development MSIX: `dist\Nimvara-0.7.0-dev.msix`, built successfully with placeholder development identity; unsigned and not for installation.
- Linux configuration: schema/build merge validated by Tauri CLI on Windows. Docker Desktop was installed but its Linux engine did not start, so no Linux binary or package test is claimed.
- macOS configuration: schema/build merge validated by Tauri CLI on Windows. No `.app` or `.dmg` is claimed without a Mac/Xcode host.
- iPad/Android: architecture and implementation boundaries documented; no mobile binaries claimed.
