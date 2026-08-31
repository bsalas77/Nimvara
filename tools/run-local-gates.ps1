param(
  [switch]$SkipRust,
  [switch]$SkipArtifacts
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Push-Location $root
try {
  Write-Host '[1/4] JavaScript safety and compatibility tests'
  Push-Location (Join-Path $root 'app')
  try { node tests/run-all.mjs; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
  finally { Pop-Location }

  if (-not $SkipRust) {
    Write-Host '[2/4] Rust formatting, tests, and clippy'
    cargo fmt --check --manifest-path (Join-Path $root 'app/src-tauri/Cargo.toml'); if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    cargo test --locked --manifest-path (Join-Path $root 'app/src-tauri/Cargo.toml'); if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    cargo clippy --locked --manifest-path (Join-Path $root 'app/src-tauri/Cargo.toml') --all-targets -- -D warnings; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  } else {
    Write-Host '[2/4] Rust gates skipped by request'
  }

  if (-not $SkipArtifacts) {
    Write-Host '[3/4] Release artifact byte/hash verification'
    node tools/verify-release-artifacts.mjs; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  } else {
    Write-Host '[3/4] Artifact verification skipped by request'
  }

  Write-Host '[4/4] Local release-readiness evidence report (expected to remain blocked by owner gates)'
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
