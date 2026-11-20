$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$env:SKIP_BROWSER_OPEN = 'true'
npm.cmd run dev:host
