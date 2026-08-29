#!/usr/bin/env sh
set -eu

project="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
tauri_root="$project/app/src-tauri"
resources="$tauri_root/resources"

case "$(uname -s)" in
  Linux) ;;
  *) echo "This package must be built and validated on Linux." >&2; exit 2 ;;
esac

command -v cargo >/dev/null 2>&1 || { echo "Rust/Cargo is required." >&2; exit 2; }
command -v cargo-tauri >/dev/null 2>&1 || { echo "Install Tauri CLI: cargo install tauri-cli --locked" >&2; exit 2; }
bundle="${1:-deb}"
case "$bundle" in
  deb|appimage) ;;
  *) echo "Bundle must be 'deb' or 'appimage'." >&2; exit 2 ;;
esac

rm -rf -- "$resources"
mkdir -p -- "$resources/app"
cp -R -- "$project/sample-workspace" "$resources/app/"

cargo fmt --check --manifest-path "$tauri_root/Cargo.toml"
cargo test --locked --manifest-path "$tauri_root/Cargo.toml"
cargo clippy --locked --manifest-path "$tauri_root/Cargo.toml" --all-targets -- -D warnings
cargo tauri build --config "$tauri_root/tauri.linux.conf.json" --bundles "$bundle"
