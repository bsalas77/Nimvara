$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$project = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$icons = Join-Path $project 'app\src-tauri\icons'
New-Item -ItemType Directory -Path $icons -Force | Out-Null
$size = 256
$bitmap = [System.Drawing.Bitmap]::new($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
try {
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.Clear([System.Drawing.Color]::FromArgb(16, 23, 22))
  $gold = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 202, 112))
  $green = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(40, 66, 59))
  try {
    $graphics.FillEllipse($gold, 57, 57, 142, 142)
    $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
    try {
      $path.AddBezier(128, 57, 85, 89, 85, 167, 128, 199)
      $path.AddBezier(128, 199, 105, 170, 95, 151, 95, 128)
      $path.AddBezier(95, 128, 95, 105, 105, 86, 128, 57)
      $graphics.FillPath($green, $path)
    } finally { $path.Dispose() }
  } finally { $gold.Dispose(); $green.Dispose() }
  $png = Join-Path $icons 'icon.png'
  $bitmap.Save($png, [System.Drawing.Imaging.ImageFormat]::Png)
  $handle = $bitmap.GetHicon()
  $icon = [System.Drawing.Icon]::FromHandle($handle)
  try {
    $stream = [System.IO.File]::Create((Join-Path $icons 'icon.ico'))
    try { $icon.Save($stream) } finally { $stream.Dispose() }
  } finally { $icon.Dispose() }
} finally {
  $graphics.Dispose()
  $bitmap.Dispose()
}
Get-Item (Join-Path $icons 'icon.png'),(Join-Path $icons 'icon.ico') | Select-Object FullName,Length
