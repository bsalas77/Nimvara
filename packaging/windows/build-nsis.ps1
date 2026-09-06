$ErrorActionPreference = 'Stop'
$project = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$tauriRoot = Join-Path $project 'app\src-tauri'
$versionMatch = Select-String -LiteralPath (Join-Path $tauriRoot 'Cargo.toml') -Pattern '^version\s*=\s*"([0-9]+\.[0-9]+\.[0-9]+)"' | Select-Object -First 1
if (-not $versionMatch) { throw 'Tauri package version is missing or invalid.' }
$version = $versionMatch.Matches[0].Groups[1].Value
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
$candidate = Join-Path $tauriRoot "target\release\bundle\nsis\Nimvara_$($version)_x64-setup.exe"
$destination = Join-Path $project "dist\Nimvara-Setup-$($version)-dev-nsis.exe"
Copy-Item -LiteralPath $candidate -Destination $destination -Force
Get-Item -LiteralPath $destination | Select-Object FullName,Length,LastWriteTime
Get-FileHash -LiteralPath $destination -Algorithm SHA256
