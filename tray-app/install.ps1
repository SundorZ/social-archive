# Social Archive Tray — Windows 시작프로그램 등록
# 실행: PowerShell에서 .\install.ps1

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$mainJs    = Join-Path $scriptDir "src\main.js"
$startup   = [Environment]::GetFolderPath('Startup')
$vbsPath   = Join-Path $startup "social-archive-tray.vbs"

# node.js 경로 확인
$nodePath = (Get-Command node -ErrorAction SilentlyContinue)?.Source
if (-not $nodePath) {
    Write-Host "❌ Node.js를 찾을 수 없습니다. https://nodejs.org 에서 설치 후 다시 실행하세요."
    exit 1
}

# npm install 실행
Write-Host "📦 패키지 설치 중..."
Push-Location $scriptDir
npm install --silent
Pop-Location

# 시작프로그램 VBS 래퍼 작성 (콘솔창 없이 실행)
$vbsContent = @"
Set ws = CreateObject("WScript.Shell")
ws.Run "$nodePath " & Chr(34) & "$mainJs" & Chr(34), 0, False
"@

$vbsContent | Out-File -FilePath $vbsPath -Encoding ASCII -Force
Write-Host "✅ 시작프로그램 등록 완료: $vbsPath"
Write-Host ""
Write-Host "지금 바로 실행하려면: node src\main.js"
Write-Host "다음 부팅부터 자동으로 시작됩니다."
