$ErrorActionPreference = 'Stop'
$project = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$tauri = Join-Path $project 'app\src-tauri'
$patched = Join-Path $tauri 'third_party\glib-0.18.5-patched\src\variant_iter.rs'
$provenance = Join-Path $tauri 'third_party\glib-0.18.5-patched\PROVENANCE.md'
$cargoAudit = Join-Path $env:USERPROFILE '.cargo\bin\cargo-audit.exe'

if (-not (Test-Path -LiteralPath $cargoAudit)) {
  throw 'cargo-audit is required.'
}
$source = Get-Content -LiteralPath $patched -Raw
if (-not $source.Contains('let mut p: *mut libc::c_char = std::ptr::null_mut();') -or
    -not $source.Contains('&mut p,')) {
  throw 'The reviewed RUSTSEC-2024-0429 backport is missing.'
}
if (-not (Test-Path -LiteralPath $provenance)) {
  throw 'Patched glib provenance is missing.'
}

$tree = & (Join-Path $env:USERPROFILE '.cargo\bin\cargo.exe') tree `
  --manifest-path (Join-Path $tauri 'Cargo.toml') --target all -i glib@0.18.5
if ($LASTEXITCODE -ne 0 -or
    -not ($tree -join "`n").Contains('third_party\glib-0.18.5-patched')) {
  throw 'Cargo is not resolving glib to the reviewed patched source.'
}

Push-Location $tauri
try {
  & $cargoAudit audit --ignore RUSTSEC-2024-0429
  if ($LASTEXITCODE -ne 0) { throw 'Rust dependency audit failed.' }
} finally {
  Pop-Location
}
