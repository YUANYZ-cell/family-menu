[CmdletBinding()]
param(
    [switch]$Install,
    [switch]$Check
)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$packagePath = Join-Path $projectRoot 'package.json'
$shortcutPath = Join-Path $projectRoot '家常一桌.lnk'
$iconPath = Join-Path $projectRoot 'public\icons\app-icon.ico'
$manifestPath = Join-Path $projectRoot 'public\manifest.webmanifest'
$serverUri = 'http://127.0.0.1:4173/'
$powershellPath = (Get-Command powershell.exe -ErrorAction Stop).Source
$scriptPath = $PSCommandPath

$browserCandidates = @(
    'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
    'C:\Program Files\Google\Chrome\Application\chrome.exe',
    (Join-Path $env:LOCALAPPDATA 'Google\Chrome\Application\chrome.exe')
)
$browserPath = $browserCandidates | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1

if (-not (Test-Path -LiteralPath $packagePath -PathType Leaf)) {
    throw "Application package file is missing: $packagePath"
}
if (-not (Test-Path -LiteralPath $iconPath -PathType Leaf)) {
    throw "Application icon is missing: $iconPath"
}
if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
    throw "Web app manifest is missing: $manifestPath"
}
if (-not $browserPath) {
    throw 'Microsoft Edge or Google Chrome is required to start 家常一桌.'
}

$npmPath = (Get-Command npm.cmd -ErrorAction Stop).Source
$expectedArguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`""

function Test-MenuServer {
    try {
        $response = Invoke-WebRequest -Uri $serverUri -UseBasicParsing -TimeoutSec 2
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

if ($Install) {
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = $powershellPath
    $shortcut.Arguments = $expectedArguments
    $shortcut.WorkingDirectory = $projectRoot
    $shortcut.IconLocation = "$iconPath,0"
    $shortcut.Description = '启动 家常一桌'
    $shortcut.WindowStyle = 7
    $shortcut.Save()
}

if ($Check) {
    if (-not (Test-Path -LiteralPath $shortcutPath -PathType Leaf)) {
        throw "Windows shortcut is missing: $shortcutPath"
    }

    $shell = New-Object -ComObject WScript.Shell
    $actual = $shell.CreateShortcut($shortcutPath)
    $actualIconPath = ($actual.IconLocation -split ',')[0]
    $checks = [ordered]@{
        ScriptExists = Test-Path -LiteralPath $scriptPath -PathType Leaf
        PackageExists = Test-Path -LiteralPath $packagePath -PathType Leaf
        BrowserExists = Test-Path -LiteralPath $browserPath -PathType Leaf
        TargetMatches = $actual.TargetPath -eq $powershellPath
        ArgumentsMatch = $actual.Arguments -eq $expectedArguments
        WorkingDirectoryMatches = $actual.WorkingDirectory -eq $projectRoot
        IconExists = Test-Path -LiteralPath $iconPath -PathType Leaf
        ManifestExists = Test-Path -LiteralPath $manifestPath -PathType Leaf
        IconMatches = $actualIconPath -eq $iconPath
    }
    $failed = @($checks.GetEnumerator() | Where-Object { -not $_.Value })
    if ($failed.Count) {
        throw "Launcher verification failed: $($failed.Name -join ', ')"
    }

    [pscustomobject]@{
        Launcher = $shortcutPath
        Browser = $browserPath
        Icon = $actual.IconLocation
        Target = $actual.TargetPath
        Arguments = $actual.Arguments
        Verified = $true
    }
    return
}

if ($Install) {
    return
}

if (-not (Test-MenuServer)) {
    Start-Process -FilePath $npmPath -ArgumentList 'run dev -- --port 4173' -WorkingDirectory $projectRoot -WindowStyle Hidden
    $ready = $false
    foreach ($attempt in 1..80) {
        Start-Sleep -Milliseconds 250
        if (Test-MenuServer) {
            $ready = $true
            break
        }
    }
    if (-not $ready) {
        throw '家常一桌没有在 20 秒内启动。请确认 Node.js 已安装，并在项目目录执行 npm install。'
    }
}

Start-Process -FilePath $browserPath -ArgumentList "--app=$serverUri"
