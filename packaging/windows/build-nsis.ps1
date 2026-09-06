$ErrorActionPreference = 'Stop'
$project = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$tauriRoot = Join-Path $project 'app\src-tauri'
$cargo = Join-Path $env:USERPROFILE '.cargo\bin\cargo.exe'
if (-not (Test-Path -LiteralPath $cargo)) { throw 'Rust/Cargo is required.' }
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'prepare-tauri.ps1')
if ($LASTEXITCODE -ne 0) { throw 'Resource preparation failed.' }
Push-Location $tauriRoot
try {
    & $cargo build --release --locked --offline -j 2
    if ($LASTEXITCODE -ne 0) { throw 'Native build failed.' }
    # Tauri verifies downloaded NSIS tools. No signing identity is implied.
    & $cargo tauri bundle --bundles nsis --ci --no-sign
    if ($LASTEXITCODE -ne 0) { throw 'NSIS packaging failed.' }
} finally { Pop-Location }
$candidate = Join-Path $tauriRoot 'target\release\bundle\nsis\Nimvara_0.7.0_x64-setup.exe'
$destination = Join-Path $project 'dist\Nimvara-Setup-0.7.0-dev-nsis.exe'
Copy-Item -LiteralPath $candidate -Destination $destination -Force
Get-Item -LiteralPath $destination | Select-Object FullName,Length,LastWriteTime
Get-FileHash -LiteralPath $destination -Algorithm SHA256
