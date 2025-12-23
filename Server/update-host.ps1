# PowerShell script to update Supabase host in .env file
param(
    [Parameter(Mandatory=$true)]
    [string]$Host
)

$envFile = ".env"

if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    exit 1
}

$content = Get-Content $envFile
$updated = $content | ForEach-Object {
    if ($_ -match "^DB_HOST=") {
        "DB_HOST=$Host"
    } else {
        $_
    }
}

$updated | Set-Content $envFile
Write-Host "✅ Updated DB_HOST to: $Host" -ForegroundColor Green
Write-Host ""
Write-Host "Testing connection..." -ForegroundColor Yellow
node test-connection.js

