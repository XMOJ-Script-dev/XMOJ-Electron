# Shared helper for launching Electron-based probes/tests.
#
# electron.exe prints to the console inconsistently when its stdout is piped
# through PowerShell, and a piped run can hang on the child GPU/renderer
# processes. Redirecting to files via Start-Process is reliable, so all Electron
# test entry points go through this script.
#
# NOTE: keep this file ASCII-only. Windows PowerShell 5.1 reads .ps1 as ANSI, so
# non-ASCII text here is decoded incorrectly and breaks parsing.
param(
  [Parameter(Mandatory = $true)][string]$Script,
  [int]$TimeoutSec = 300,
  [string[]]$ExtraArgs = @()
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }

$electron = Join-Path $root 'node_modules\electron\dist\electron.exe'
if (-not (Test-Path $electron)) { throw "Electron not found: $electron" }

$target = Join-Path $root $Script
if (-not (Test-Path $target)) { throw "Script not found: $target" }

$outFile = Join-Path $root 'tests\.electron-stdout.txt'
$errFile = Join-Path $root 'tests\.electron-stderr.txt'
Remove-Item $outFile, $errFile -Force -ErrorAction SilentlyContinue

# Some shells export ELECTRON_RUN_AS_NODE, which degrades Electron to plain Node.
Remove-Item Env:\ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue

$argList = @($target) + $ExtraArgs
$proc = Start-Process -FilePath $electron -ArgumentList $argList `
  -RedirectStandardOutput $outFile -RedirectStandardError $errFile `
  -NoNewWindow -PassThru

if (-not $proc.WaitForExit($TimeoutSec * 1000)) {
  Write-Host "TIMEOUT after ${TimeoutSec}s; killing Electron"
  Get-Process electron -ErrorAction SilentlyContinue | Stop-Process -Force
  $exit = 124
} else {
  $exit = $proc.ExitCode
}

# Chromium leaves child processes behind; clear them so the next run is clean.
Get-Process electron -ErrorAction SilentlyContinue | Stop-Process -Force

Get-Content $outFile -ErrorAction SilentlyContinue
$stderr = Get-Content $errFile -ErrorAction SilentlyContinue |
  Where-Object { $_ -notmatch 'disk_cache|gpu_disk_cache|Unable to|deprecated|ExperimentalWarning' }
if ($stderr) {
  Write-Host '--- stderr ---' -ForegroundColor DarkGray
  $stderr | Select-Object -First 20
}

Remove-Item $outFile, $errFile -Force -ErrorAction SilentlyContinue
exit $exit
