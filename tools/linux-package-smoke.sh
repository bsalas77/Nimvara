#!/bin/sh
# Run only in a disposable Debian-based container, with /workspace read-only.
set -eu
test -f /.dockerenv || { echo 'This test requires a disposable Docker container.' >&2; exit 2; }
package=/workspace/dist/Nimvara_0.7.0_amd64.deb
test -r "$package"
fixture=$(mktemp -d)
trap 'rm -rf -- "$fixture"' EXIT
mkdir -p "$fixture/workspace" "$fixture/backups"
printf 'Unicode notes: 保全 café\n' > "$fixture/workspace/Note.md"
cp "$fixture/workspace/Note.md" "$fixture/backups/Note.md"
before=$(sha256sum "$fixture/workspace/Note.md" "$fixture/backups/Note.md")
dpkg -i "$package"
dpkg -i "$package"
ldd /usr/bin/nimvara > "$fixture/libraries"
if grep -q 'not found' "$fixture/libraries"; then cat "$fixture/libraries"; exit 1; fi
test -f /usr/share/applications/Nimvara.desktop
dpkg -r nimvara
test ! -e /usr/bin/nimvara
after=$(sha256sum "$fixture/workspace/Note.md" "$fixture/backups/Note.md")
test "$before" = "$after"
echo 'PASS: install, same-version reinstall, dependency resolution, removal, external note/backup retention.'
echo 'NOT TESTED: graphical launch, older-version upgrade, X11, Wayland, real desktop integration.'
