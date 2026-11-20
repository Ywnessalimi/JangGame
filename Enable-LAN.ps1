$ErrorActionPreference = 'Stop'
$ruleName = 'OpenFront LAN TCP 9000'
if (-not (Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Action Allow -Protocol TCP -LocalPort 9000 -RemoteAddress LocalSubnet -Profile Private -Program (Get-Command node.exe).Source | Out-Null
}
Write-Host 'OpenFront TCP 9000 is allowed from the local subnet on Private networks.'
