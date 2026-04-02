# Sub2API Performance Test Runner
# Run: .\run-benchmarks.ps1

param(
    [string]$OutputDir = "..\performance\reports"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Sub2API Performance Test Runner" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Ensure output directory exists
$OutputPath = Join-Path $ProjectRoot $OutputDir
if (-not (Test-Path $OutputPath)) {
    New-Item -ItemType Directory -Path $OutputPath | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportFile = Join-Path $OutputPath "benchmark_$Timestamp.txt"

Write-Host "`n[1/3] Running Go Benchmarks..." -ForegroundColor Yellow
Set-Location (Join-Path $ProjectRoot "backend")

# Run all benchmarks
$benchResult = go test -bench=. -benchmem -count=5 -timeout 300s ./... 2>&1 | Select-String -Pattern "^(Benchmark|PASS|ok|---)"

$benchResult | Out-File -FilePath $ReportFile -Encoding UTF8
Write-Host "  Results saved to: $ReportFile" -ForegroundColor Green

Write-Host "`n[2/3] Running Handler Benchmarks..." -ForegroundColor Yellow
$handlerResult = go test -bench=Handler -benchmem -count=3 -timeout 120s ./internal/handler/... 2>&1 | Select-String -Pattern "^(Benchmark|PASS|ok|---)"
$handlerResult | Out-File -FilePath (Join-Path $OutputPath "handler_bench_$Timestamp.txt") -Encoding UTF8

Write-Host "`n[3/3] Running Service Benchmarks..." -ForegroundColor Yellow
$serviceResult = go test -bench=Service -benchmem -count=3 -timeout 120s ./internal/service/... 2>&1 | Select-String -Pattern "^(Benchmark|PASS|ok|---)"
$serviceResult | Out-File -FilePath (Join-Path $OutputPath "service_bench_$Timestamp.txt") -Encoding UTF8

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  Benchmark Results Summary" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Parse and display key results
Write-Host "`nKey Metrics:" -ForegroundColor White
$benchResult | ForEach-Object {
    if ($_ -match "Benchmark.*-(\d+)\s+(\d+)\s+ns/op") {
        Write-Host "  $_" -ForegroundColor Gray
    }
}

Write-Host "`nBenchmark tests complete!" -ForegroundColor Green
Write-Host "Reports saved to: $OutputPath" -ForegroundColor Cyan
