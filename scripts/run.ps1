# Compatible with the Windows PowerShell 5.1 included in Windows 10/11.
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
Set-StrictMode -Version Latest

$projectDir = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectDir
$toolsDir = Join-Path $projectDir '.tools'
$bootstrapDir = $null
$runExit = 1

try {
  $architecture = $env:PROCESSOR_ARCHITEW6432
  if (-not $architecture) { $architecture = $env:PROCESSOR_ARCHITECTURE }
  switch ($architecture) {
    'AMD64' { $arch = 'x64' }
    'ARM64' { $arch = 'arm64' }
    default { throw 'Supported CPU architectures are x64 and ARM64.' }
  }

  $nodeMajor = (Get-Content -LiteralPath (Join-Path $projectDir '.nvmrc') -Raw).Trim()
  if ($nodeMajor -notmatch '^\d+$') { throw '.nvmrc must contain a Node.js major version.' }
  $nodeDir = Join-Path $toolsDir "node-$nodeMajor-win-$arch"
  $nodeBin = Join-Path $nodeDir 'node.exe'

  if (-not (Test-Path -LiteralPath $nodeBin)) {
    if (Test-Path -LiteralPath $nodeDir) {
      throw "Incomplete Node installation. Remove $nodeDir and run again."
    }
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    $bootstrapDir = Join-Path $toolsDir ('node-install.' + [Guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $bootstrapDir -Force | Out-Null
    Write-Host "`nDownloading portable Node.js $nodeMajor ($arch)..."
    $checksums = Join-Path $bootstrapDir 'SHASUMS256.txt'
    Invoke-WebRequest -UseBasicParsing -Uri "https://nodejs.org/dist/latest-v$nodeMajor.x/SHASUMS256.txt" -OutFile $checksums -TimeoutSec 120
    $pattern = '^([a-fA-F0-9]{64})\s+(node-(v' + $nodeMajor + '\.\d+\.\d+)-win-' + $arch + '\.zip)$'
    $entry = Get-Content -LiteralPath $checksums | Where-Object { $_ -match $pattern } | Select-Object -First 1
    if (-not $entry -or $entry -notmatch $pattern) { throw 'No matching Node archive found in the official checksums.' }
    $checksum = $Matches[1]
    $archive = $Matches[2]
    $nodeVersion = $Matches[3]
    $archivePath = Join-Path $bootstrapDir $archive
    Invoke-WebRequest -UseBasicParsing -Uri "https://nodejs.org/dist/$nodeVersion/$archive" -OutFile $archivePath -TimeoutSec 300
    $sha256 = [Security.Cryptography.SHA256]::Create()
    $archiveStream = [IO.File]::OpenRead($archivePath)
    try {
      $actualChecksum = [BitConverter]::ToString($sha256.ComputeHash($archiveStream)).Replace('-', '')
    } finally {
      $archiveStream.Dispose()
      $sha256.Dispose()
    }
    if ($actualChecksum -ne $checksum) {
      throw 'Node download failed its SHA-256 check.'
    }
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [IO.Compression.ZipFile]::ExtractToDirectory($archivePath, $bootstrapDir)
    $extractedDir = Join-Path $bootstrapDir ([IO.Path]::GetFileNameWithoutExtension($archive))
    $downloadedVersion = & (Join-Path $extractedDir 'node.exe') --version
    if ($LASTEXITCODE -ne 0 -or $downloadedVersion -ne $nodeVersion) { throw 'Downloaded Node could not run.' }
    Move-Item -LiteralPath $extractedDir -Destination $nodeDir
  }

  $version = & $nodeBin --version
  if ($LASTEXITCODE -ne 0 -or $version -notmatch ('^v' + $nodeMajor + '\.')) {
    throw "Cached Node version $version does not match .nvmrc."
  }
  Write-Host "`nUsing Node.js $version from $nodeDir"
  $env:PATH = "$nodeDir;$env:PATH"
  & $nodeBin (Join-Path $PSScriptRoot 'run.mjs')
  $runExit = $LASTEXITCODE
} catch {
  [Console]::Error.WriteLine("Fleet Project: $($_.Exception.Message)")
} finally {
  if ($bootstrapDir -and (Test-Path -LiteralPath $bootstrapDir)) {
    # Never recursively remove a path outside this launcher's tools directory.
    $toolsPrefix = [IO.Path]::GetFullPath($toolsDir) + [IO.Path]::DirectorySeparatorChar
    if (-not [IO.Path]::GetFullPath($bootstrapDir).StartsWith($toolsPrefix, [StringComparison]::OrdinalIgnoreCase)) {
      throw 'Refusing to clean a bootstrap directory outside .tools.'
    }
    Remove-Item -LiteralPath $bootstrapDir -Recurse -Force
  }
}
exit $runExit
