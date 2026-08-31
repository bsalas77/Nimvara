param(
  [switch]$SkipRust,
  [switch]$SkipArtifacts,
  [switch]$SkipAudit
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Push-Location $root
try {
  Write-Host '[1/5] JavaScript safety and compatibility tests'
  Push-Location (Join-Path $root 'app')
  try { node tests/run-all.mjs; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
  finally { Pop-Location }

  if (-not $SkipRust) {
    Write-Host '[2/5] Rust formatting, tests, and clippy'
    cargo fmt --check --manifest-path (Join-Path $root 'app/src-tauri/Cargo.toml'); if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    cargo test --locked --manifest-path (Join-Path $root 'app/src-tauri/Cargo.toml'); if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    cargo clippy --locked --manifest-path (Join-Path $root 'app/src-tauri/Cargo.toml') --all-targets -- -D warnings; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  } else {
    Write-Host '[2/5] Rust gates skipped by request'
  }

  if (-not $SkipAudit) {
    Write-Host '[3/5] Rust dependency audit (cached advisories, no network fetch)'
    Push-Location (Join-Path $root 'app/src-tauri')
    try { cargo-audit audit --no-fetch --ignore RUSTSEC-2024-0429; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
    finally { Pop-Location }
  } else {
    Write-Host '[3/5] Rust dependency audit skipped by request'
  }

  if (-not $SkipArtifacts) {
    Write-Host '[4/5] Release artifact byte/hash verification'
    node tools/verify-release-artifacts.mjs; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    node tools/verify-sbom.mjs; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  } else {
    Write-Host '[4/5] Artifact verification skipped by request'
  }

  Write-Host '[5/5] Local release-readiness evidence report (expected to remain blocked by owner gates)'
  node tools/release-readiness.mjs
  if ($LASTEXITCODE -eq 2) {
    Write-Host 'Readiness report recorded expected owner/external gates; local gates above passed.'
    exit 0
  }
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
finally {
  Pop-Location
}
