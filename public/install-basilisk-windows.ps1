# Basilisk Windows installer
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$ReleaseUrl = 'https://github.com/austinmhorn/basilisk/releases/download/current-build/Basilisk-Windows.zip'
$InstallRoot = Join-Path $env:LOCALAPPDATA 'Programs'
$TargetDir = Join-Path $InstallRoot 'Basilisk'
$TargetExe = Join-Path $TargetDir 'BasiliskGame.exe'
$StartMenuDir = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs'
$ShortcutPath = Join-Path $StartMenuDir 'Basilisk.lnk'

function Write-Step([string]$Message) {
    Write-Host ""
    Write-Host "[Basilisk] $Message"
}

function Fail([string]$Message) {
    throw "[Basilisk] $Message"
}

if (-not $IsWindows -and $PSVersionTable.PSEdition -eq 'Core') {
    Fail 'This installer only supports Windows.'
}

Write-Host @"
Basilisk is currently distributed without a commercial Windows code-signing certificate.
This installer downloads the official current build, removes Windows download blocking
from the package/files, installs Basilisk for the current user, creates a Start Menu
shortcut, and launches the game.
"@

$TempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("basilisk-install-" + [Guid]::NewGuid().ToString('N'))
$ZipPath = Join-Path $TempRoot 'Basilisk-Windows.zip'
$ExtractDir = Join-Path $TempRoot 'extracted'
$IncomingDir = Join-Path $InstallRoot ("Basilisk.installing." + $PID)
$BackupDir = Join-Path $InstallRoot ("Basilisk.backup." + $PID)

try {
    New-Item -ItemType Directory -Path $TempRoot -Force | Out-Null
    New-Item -ItemType Directory -Path $ExtractDir -Force | Out-Null
    New-Item -ItemType Directory -Path $InstallRoot -Force | Out-Null

    Write-Step 'Downloading the current Windows build...'
    Invoke-WebRequest -Uri $ReleaseUrl -OutFile $ZipPath -UseBasicParsing

    if (-not (Test-Path -LiteralPath $ZipPath -PathType Leaf)) {
        Fail 'The Windows ZIP was not downloaded.'
    }
    if ((Get-Item -LiteralPath $ZipPath).Length -le 0) {
        Fail 'The downloaded Windows ZIP is empty.'
    }

    Write-Step 'Preparing the downloaded package...'
    Unblock-File -LiteralPath $ZipPath -ErrorAction SilentlyContinue

    Write-Step 'Extracting Basilisk...'
    Expand-Archive -LiteralPath $ZipPath -DestinationPath $ExtractDir -Force

    $StagedExe = Join-Path $ExtractDir 'BasiliskGame.exe'
    if (-not (Test-Path -LiteralPath $StagedExe -PathType Leaf)) {
        Fail 'BasiliskGame.exe was not found at the expected location in the downloaded ZIP.'
    }

    $RequiredPaths = @(
        'BasiliskGame.exe',
        'assets\fonts',
        'assets\ui',
        'assets\items',
        'assets\emblems',
        'assets\calling-cards'
    )

    foreach ($RelativePath in $RequiredPaths) {
        $Candidate = Join-Path $ExtractDir $RelativePath
        if (-not (Test-Path -LiteralPath $Candidate)) {
            Fail "The downloaded package is missing required path: $RelativePath"
        }
    }

    Write-Step 'Removing Windows download blocking from the staged files...'
    Get-ChildItem -LiteralPath $ExtractDir -Recurse -File | ForEach-Object {
        Unblock-File -LiteralPath $_.FullName -ErrorAction SilentlyContinue
    }

    if (Get-Process -Name 'BasiliskGame' -ErrorAction SilentlyContinue) {
        Fail 'Basilisk is currently running. Close the game and run the installer again.'
    }

    if (Test-Path -LiteralPath $IncomingDir) {
        Remove-Item -LiteralPath $IncomingDir -Recurse -Force
    }
    if (Test-Path -LiteralPath $BackupDir) {
        Remove-Item -LiteralPath $BackupDir -Recurse -Force
    }

    Write-Step "Installing Basilisk to $TargetDir ..."
    New-Item -ItemType Directory -Path $IncomingDir -Force | Out-Null
    Get-ChildItem -LiteralPath $ExtractDir -Force | ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination $IncomingDir -Recurse -Force
    }

    $IncomingExe = Join-Path $IncomingDir 'BasiliskGame.exe'
    if (-not (Test-Path -LiteralPath $IncomingExe -PathType Leaf)) {
        Fail 'The staged installation does not contain BasiliskGame.exe.'
    }

    if (Test-Path -LiteralPath $TargetDir) {
        Move-Item -LiteralPath $TargetDir -Destination $BackupDir
    }

    try {
        Move-Item -LiteralPath $IncomingDir -Destination $TargetDir
    }
    catch {
        if (Test-Path -LiteralPath $BackupDir) {
            Move-Item -LiteralPath $BackupDir -Destination $TargetDir
        }
        throw
    }

    if (Test-Path -LiteralPath $BackupDir) {
        Remove-Item -LiteralPath $BackupDir -Recurse -Force
    }

    Get-ChildItem -LiteralPath $TargetDir -Recurse -File | ForEach-Object {
        Unblock-File -LiteralPath $_.FullName -ErrorAction SilentlyContinue
    }

    if (-not (Test-Path -LiteralPath $TargetExe -PathType Leaf)) {
        Fail 'Installation completed without the expected BasiliskGame.exe.'
    }

    Write-Step 'Creating Start Menu shortcut...'
    New-Item -ItemType Directory -Path $StartMenuDir -Force | Out-Null
    $Shell = New-Object -ComObject WScript.Shell
    $Shortcut = $Shell.CreateShortcut($ShortcutPath)
    $Shortcut.TargetPath = $TargetExe
    $Shortcut.WorkingDirectory = $TargetDir
    $Shortcut.Description = 'Basilisk'
    $Shortcut.Save()

    Write-Step 'Launching Basilisk...'
    Start-Process -FilePath $TargetExe -WorkingDirectory $TargetDir

    Write-Host ""
    Write-Host "[Basilisk] Installed successfully: $TargetDir"
}
finally {
    if (Test-Path -LiteralPath $IncomingDir) {
        Remove-Item -LiteralPath $IncomingDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    if (Test-Path -LiteralPath $TempRoot) {
        Remove-Item -LiteralPath $TempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}
