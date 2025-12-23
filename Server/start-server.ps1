# Start the server and show output
Write-Host "Starting Scrmbld Server..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

cd $PSScriptRoot
node server.js

