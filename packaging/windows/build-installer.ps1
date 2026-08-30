$ErrorActionPreference = 'Stop'
$project = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$build = Join-Path $project 'dist\windows-installer'
$stage = Join-Path $build 'payload'
$appStage = Join-Path $stage 'app'
$runtimeStage = Join-Path $stage 'runtime'
$output = Join-Path $project 'dist\Nimvara-Setup-0.7.0-dev.exe'
$rootInstaller = Join-Path $project 'Nimvara-Setup.exe'
$csc = 'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (-not (Test-Path -LiteralPath $csc)) { throw 'The built-in .NET Framework C# compiler is unavailable.' }

if (Test-Path -LiteralPath $build) { Remove-Item -LiteralPath $build -Recurse -Force }
New-Item -ItemType Directory -Path $stage -Force | Out-Null

& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'prepare-tauri.ps1')
if ($LASTEXITCODE -ne 0) { throw 'Tauri resource preparation failed.' }
$cargo = Join-Path $env:USERPROFILE '.cargo\bin\cargo.exe'
if (-not (Test-Path -LiteralPath $cargo)) { throw 'Cargo is unavailable. Install Rustup with the stable MSVC toolchain.' }
& $cargo build --release --offline --manifest-path (Join-Path $project 'app\src-tauri\Cargo.toml')
if ($LASTEXITCODE -ne 0) { throw 'Native Tauri build failed.' }
$tauriRelease = Join-Path $project 'app\src-tauri\target\release'
Copy-Item -LiteralPath (Join-Path $tauriRelease 'nimvara.exe') -Destination (Join-Path $stage 'Nimvara.exe')
Copy-Item -LiteralPath (Join-Path $project 'app\src-tauri\resources') -Destination (Join-Path $stage 'resources') -Recurse
& $csc /nologo /target:winexe /platform:x64 /optimize+ /out:"$stage\NimvaraUninstall.exe" /reference:System.Windows.Forms.dll "$PSScriptRoot\NimvaraUninstall.cs"
if ($LASTEXITCODE -ne 0) { throw 'Nimvara uninstaller compilation failed.' }

$zip = Join-Path $build 'nimvara-payload.zip'
Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $zip -CompressionLevel Optimal

Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'NimvaraSetup.cs') -Destination (Join-Path $build 'NimvaraSetup.cs')
Push-Location $build
try {
  & $csc /nologo /target:winexe /platform:x64 /optimize+ /out:"..\Nimvara-Setup-0.7.0-dev.exe" /reference:System.Windows.Forms.dll /reference:System.IO.Compression.dll /reference:System.IO.Compression.FileSystem.dll /reference:Microsoft.CSharp.dll /resource:nimvara-payload.zip,nimvara.payload.zip NimvaraSetup.cs
} finally {
  Pop-Location
}
if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $output)) { throw 'Nimvara installer compilation failed.' }
try {
  Copy-Item -LiteralPath $output -Destination $rootInstaller -Force -ErrorAction Stop
} catch {
  # The dist artifact is the canonical output. A stale convenience copy may be
  # open by Explorer/antivirus or the installed app; do not fail the build for it.
  Write-Warning "Could not refresh root-level convenience copy: $($_.Exception.Message)"
}
Get-Item -LiteralPath $output,$rootInstaller | Select-Object FullName,Length,LastWriteTime
