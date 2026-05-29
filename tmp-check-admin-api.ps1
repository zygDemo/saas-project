$ErrorActionPreference = 'Continue'
Write-Host '=== Port 3000 ==='
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object LocalAddress,LocalPort,State,OwningProcess | Format-Table -AutoSize
Write-Host '=== Swagger health ==='
try {
  Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:3000/saas/api/docs' -TimeoutSec 5 | Select-Object StatusCode,StatusDescription
} catch {
  Write-Host $_.Exception.Message
}
