$base = 'http://127.0.0.1:3000/saas/api'
$loginBody = @{ userName = 'Super'; password = '123456' } | ConvertTo-Json -Compress
$login = Invoke-RestMethod -Method Post -Uri ($base + '/auth/login') -Headers @{ 'X-Tenant-ID' = '1' } -ContentType 'application/json' -Body $loginBody
$token = $login.data.accessToken
if (-not $token) { $token = $login.data.token }
if (-not $token) { $token = $login.accessToken }
if (-not $token) { $token = $login.token }
Write-Host ('token_found ' + [bool]$token)
$authValue = $token
if ($authValue -and -not $authValue.StartsWith('Bearer ')) { $authValue = 'Bearer ' + $authValue }
$menus = Invoke-RestMethod -Method Get -Uri ($base + '/v3/system/menus') -Headers @{ Authorization = $authValue; 'X-Tenant-ID' = '1' }
$data = $menus
if ($menus.data) { $data = $menus.data }
foreach ($m in $data) {
  if (@('Dashboard', 'System', 'Business') -contains $m.name) {
    Write-Host ($m.name + ' => ' + $m.meta.title)
    foreach ($c in $m.children) {
      Write-Host ('  ' + $c.name + ' => ' + $c.meta.title)
    }
  }
}
