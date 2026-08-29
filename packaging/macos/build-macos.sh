#!/usr/bin/env sh
set -eu

project="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
tauri_root="$project/app/src-tauri"
resources="$tauri_root/resources"

case "$(uname -s)" in
  Darwin) ;;
  *) echo "macOS and Xcode are required to build and validate Nimvara for Mac." >&2; exit 2 ;;
esac

command -v xcodebuild >/dev/null 2>&1 || { echo "Install Xcode command-line tools." >&2; exit 2; }
command -v cargo-tauri >/dev/null 2>&1 || { echo "Install Tauri CLI: cargo install tauri-cli --locked" >&2; exit 2; }

rm -rf -- "$resources"
mkdir -p -- "$resources/app"
cp -R -- "$project/sample-workspace" "$resources/app/"

cargo test --locked --manifest-path "$tauri_root/Cargo.toml"
cargo tauri build --config "$tauri_root/tauri.macos.conf.json" --bundles app,dmg
