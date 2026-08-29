$ErrorActionPreference = 'Stop'
$project = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$app = Join-Path $project 'app'
$resources = Join-Path $app 'src-tauri\resources'
$resolvedResources = [System.IO.Path]::GetFullPath($resources)
$expectedRoot = [System.IO.Path]::GetFullPath((Join-Path $app 'src-tauri'))
if (-not $resolvedResources.StartsWith($expectedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw 'Refusing to prepare resources outside app\src-tauri.'
}
if (Test-Path -LiteralPath $resources) { Remove-Item -LiteralPath $resources -Recurse -Force }
foreach ($configuration in 'debug','release') {
  $builtResources = Join-Path $expectedRoot "target\$configuration\resources"
  $resolvedBuiltResources = [System.IO.Path]::GetFullPath($builtResources)
  if (-not $resolvedBuiltResources.StartsWith($expectedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'Refusing to clear generated resources outside app\src-tauri.'
  }
  if (Test-Path -LiteralPath $builtResources) { Remove-Item -LiteralPath $builtResources -Recurse -Force }
}
New-Item -ItemType Directory -Path (Join-Path $resources 'app') -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $project 'sample-workspace') -Destination (Join-Path $resources 'app') -Recurse
Get-ChildItem -LiteralPath $resources -Recurse -File | Measure-Object -Property Length -Sum
