<#
.SYNOPSIS
  Run the Solution Architecture Map in DEMO MODE for a chosen customer-size preset.

.DESCRIPTION
  Starts the Vite dev server (if not already running) and opens the browser at
  the preset URL. Presets are client-side (src/api/demo.ts) — they also work
  against a live platform: /apps/solution-architecture-map/?demo=<name>

.EXAMPLE
  ./demo.ps1 small        # single region (West Europe), no replications
  ./demo.ps1 medium       # East US master + West US replica in sync (blue theme)
  ./demo.ps1 large        # 25 independent markets on nearest Azure regions
  ./demo.ps1 extralarge   # full multi-region + China reference architecture
#>
param(
    [Parameter(Position = 0)]
    [string]$Preset = "extralarge",

    [int]$Port = 5173
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

# Known presets (must match PRESETS in src/api/demo.ts).
$knownPresets = @("small", "medium", "large", "extralarge")

$name = $Preset.ToLowerInvariant()
if ($knownPresets -notcontains $name) {
    Write-Host "Unknown preset '$Preset'." -ForegroundColor Red
    Write-Host "Available presets:" -ForegroundColor Yellow
    Write-Host "  small       single region (West Europe), no replications"
    Write-Host "  medium      East US master + West US replica in sync"
    Write-Host "  large       25 independent markets on nearest Azure regions"
    Write-Host "  extralarge  full multi-region + China reference architecture"
    exit 1
}

# Reuse a running dev server on the port, otherwise start one.
$listening = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if (-not $listening) {
    Write-Host "Starting Vite dev server on port $Port..." -ForegroundColor Cyan
    Start-Process -FilePath "cmd" -ArgumentList "/c", "npm run dev -- --port $Port --strictPort" -WindowStyle Minimized
    # Wait for the server to come up (max ~15s)
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Milliseconds 500
        if (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) { break }
    }
}
else {
    Write-Host "Reusing dev server already running on port $Port." -ForegroundColor DarkGray
}

$url = "http://localhost:$Port/?demo=$name"
Write-Host "Opening $url" -ForegroundColor Green
Start-Process $url
