param(
  [string]$IdentityName = 'Nimvara.Development',
  [string]$Publisher = 'CN=Nimvara Development',
  [string]$Version = '0.7.0.0'
)

$ErrorActionPreference = 'Stop'
$project = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$stage = Join-Path $project 'dist\windows-msix'
$output = Join-Path $project 'dist\Nimvara-0.7.0-dev.msix'
$makeAppx = 'C:\Program Files (x86)\Windows Kits\10\bin\10.0.26100.0\x64\makeappx.exe'
if (-not (Test-Path -LiteralPath $makeAppx)) { throw 'Windows SDK MakeAppx is required.' }

if (Test-Path -LiteralPath $stage) { Remove-Item -LiteralPath $stage -Recurse -Force }
New-Item -ItemType Directory -Path (Join-Path $stage 'Assets') -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $project 'app\src-tauri\target\release\nimvara.exe') -Destination (Join-Path $stage 'Nimvara.exe')
Copy-Item -LiteralPath (Join-Path $project 'app\src-tauri\resources') -Destination (Join-Path $stage 'resources') -Recurse

Add-Type -AssemblyName System.Drawing
$sourceIcon = [System.Drawing.Image]::FromFile((Join-Path $project 'app\src-tauri\icons\icon.png'))
try {
  foreach ($asset in @(
    @{ Name = 'StoreLogo.png'; Size = 50 },
    @{ Name = 'Square44x44Logo.png'; Size = 44 },
    @{ Name = 'Square150x150Logo.png'; Size = 150 }
  )) {
    $bitmap = New-Object System.Drawing.Bitmap $asset.Size,$asset.Size
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      try {
        $graphics.Clear([System.Drawing.Color]::FromArgb(22,29,37))
        $graphics.DrawImage($sourceIcon, 0, 0, $asset.Size, $asset.Size)
      } finally { $graphics.Dispose() }
      $bitmap.Save((Join-Path $stage "Assets\$($asset.Name)"), [System.Drawing.Imaging.ImageFormat]::Png)
    } finally { $bitmap.Dispose() }
  }
} finally { $sourceIcon.Dispose() }

$manifest = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'AppxManifest.template.xml') -Raw
$manifest = $manifest.Replace('{{IDENTITY}}', $IdentityName).Replace('{{PUBLISHER}}', $Publisher).Replace('{{VERSION}}', $Version)
[System.IO.File]::WriteAllText((Join-Path $stage 'AppxManifest.xml'), $manifest, [System.Text.UTF8Encoding]::new($false))
if (Test-Path -LiteralPath $output) { Remove-Item -LiteralPath $output -Force }
& $makeAppx pack /d $stage /p $output /o
if ($LASTEXITCODE -ne 0) { throw 'MakeAppx failed.' }
Get-Item -LiteralPath $output | Select-Object FullName,Length,LastWriteTime
