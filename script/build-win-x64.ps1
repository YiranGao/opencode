<#
.SYNOPSIS
    Lingxi Code 构建脚本

.DESCRIPTION
    全自动构建流程，依次执行：
    1. 环境检查（Bun、磁盘空间、依赖）
    2. 代码生成（模型快照）
    3. 解析器缓存下载（tree-sitter WASM + SCM）
    4. CLI 二进制编译（Bun.compile --single）
    5. 冒烟测试（验证生成的 exe）

.PARAMETER OutputDir
    输出目录（默认：项目根目录下的 dist-offline/）

.PARAMETER Channel
    发布通道：latest、dev、beta（默认：latest）

.PARAMETER SkipEmbedWebUI
    跳过将 Web UI 嵌入二进制（默认：嵌入 Web UI）

.PARAMETER ForceWebUIBuild
    强制重新构建 Web UI，即使 dist 目录已有产物（默认：有产物时自动跳过）

.PARAMETER SkipCacheParsers
    跳过解析器下载步骤

.PARAMETER SkipBuild
    跳过构建步骤（使用已有的二进制文件）

.PARAMETER SkipEmbedParsers
    跳过解析器嵌入（仅使用外部 parsers/ 目录）

.PARAMETER Clean
    清除所有构建产物后重新开始

.EXAMPLE
    .\script\build-win-x64.ps1
    .\script\build-win-x64.ps1 -Channel dev -Clean
#>

param(
    [string]$OutputDir = "",
    [string]$Channel = "latest",
    [switch]$SkipEmbedWebUI,
    [switch]$ForceWebUIBuild,
    [switch]$SkipCacheParsers,
    [switch]$SkipBuild,
    [switch]$SkipEmbedParsers,
    [switch]$Clean
)

# ============================================================
# 工具函数
# ============================================================

$script:StepNumber = 0
$script:TotalSteps = 5
$script:BuildStart = $null
$script:StepStart = $null
$script:BuildErrors = @()
$script:BuildWarnings = @()

function Write-Banner {
    param([string]$Text)
    Write-Host ""
    Write-Host ("=" * 60) -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host ("=" * 60) -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param([string]$Text)
    $script:StepNumber++
    $script:StepStart = Get-Date
    Write-Host ""
    Write-Host "[Step $script:StepNumber/$script:TotalSteps] $Text" -ForegroundColor Yellow
}

function Write-StepDone {
    $elapsed = (Get-Date) - $script:StepStart
    Write-Host "  完成，耗时 $($elapsed.TotalSeconds.ToString('F1'))s" -ForegroundColor DarkGray
}

function Write-Ok {
    param([string]$Text)
    Write-Host "  [OK] $Text" -ForegroundColor Green
}

function Write-Fail {
    param([string]$Text)
    Write-Host "  [FAIL] $Text" -ForegroundColor Red
    $script:BuildErrors += $Text
}

function Write-Warn {
    param([string]$Text)
    Write-Host "  [WARN] $Text" -ForegroundColor DarkYellow
    $script:BuildWarnings += $Text
}

function Write-Info {
    param([string]$Text)
    # 剥离 ANSI 转义序列（vite 等工具输出的彩色文字），避免 PowerShell 5.1 中出现乱码
    $clean = $Text -replace '\x1b\[[0-9;]*[a-zA-Z]', ''
    Write-Host "  $clean" -ForegroundColor DarkGray
}

function Write-FileEntry {
    param([string]$Path, [long]$Size)
    $label = if ($Size -gt 1MB) { "$([math]::Round($Size/1MB,1)) MB" } else { "$([math]::Round($Size/1KB,1)) KB" }
    Write-Host "  [+] $Path ($label)" -ForegroundColor Green
}

function Test-Command {
    param([string]$Name)
    return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Get-SHA256 {
    param([string]$FilePath)
    $hash = Get-FileHash -Path $FilePath -Algorithm SHA256
    return $hash.Hash.ToLower()
}

function Write-Utf8File {
    param([string]$FilePath, [string]$Content)
    $dir = Split-Path $FilePath -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($FilePath, $Content, [System.Text.UTF8Encoding]::new($true))
}

function Write-AsciiFile {
    param([string]$FilePath, [string]$Content)
    $dir = Split-Path $FilePath -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($FilePath, $Content, [System.Text.ASCIIEncoding]::new())
}

# ============================================================
# 预检查与环境配置
# ============================================================

# 设置 PowerShell 使用 UTF-8 解码 native command 输出，避免 vite/bun 的 UTF-8 文本被错误解码为乱码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$ErrorActionPreference = "Stop"
$script:BuildStart = Get-Date

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
if (-not $OutputDir) {
    $OutputDir = Join-Path $ProjectRoot "dist-offline"
}
$OfflineCacheDir = Join-Path $ProjectRoot "offline-cache"
$ParsersCacheDir = Join-Path $OfflineCacheDir "parsers"
$BuildDir = Join-Path $ProjectRoot "packages\opencode"

Write-Banner "LingxiCode 构建与发布流程"

# --- Step 1: 环境检查 ---
Write-Step "环境检查"

# 1.1 检查 Bun
if (-not (Test-Command "bun")) {
    Write-Fail "Bun 未安装。请运行: irm bun.sh/install.ps1 | iex"
    Write-Host ""
    Write-Host "Exit code: 1" -ForegroundColor Red
    exit 1
}
$bunVersion = & bun --version
$expectedBun = "1.3.14"
Write-Ok "Bun: $bunVersion"
if ($bunVersion -ne $expectedBun) {
    Write-Warn "期望 Bun $expectedBun，当前 $bunVersion。构建结果可能与 CI 不同。"
}

# 1.2 检查磁盘空间（至少需要 2GB）
$drive = (Get-Item $ProjectRoot).Root.FullName
$freeSpace = (Get-PSDrive -Name $drive.Substring(0,1)).Free
$freeGB = [math]::Round($freeSpace / 1GB, 1)
if ($freeGB -lt 2) {
    Write-Fail "磁盘空间不足：剩余 ${freeGB} GB（需要 >= 2 GB）"
} else {
    Write-Ok "磁盘空间：${freeGB} GB（驱动器 $drive）"
}

# 1.3 检查/安装依赖
if (-not (Test-Path (Join-Path $ProjectRoot "node_modules"))) {
    Write-Info "正在安装项目依赖..."
    Push-Location $ProjectRoot
    try {
        bun install | ForEach-Object { Write-Info $_ }
        Pop-Location
    } catch {
        Pop-Location
        Write-Fail "bun install 失败: $_"
    }
} else {
    Write-Ok "依赖：已安装"
}

# 1.4 读取版本号
$PackageJson = Get-Content (Join-Path $BuildDir "package.json") -Encoding UTF8 | ConvertFrom-Json
$Version = $PackageJson.version

Write-Ok "版本: $Version（通道: $Channel）"

Write-Host ""
Write-Host "  配置信息:" -ForegroundColor White
Write-Host "    项目根目录:  $ProjectRoot"
Write-Host "    输出目录:    $OutputDir"
Write-Host "    解析器缓存:  $ParsersCacheDir"
Write-Host "    嵌入 Web UI: $(-not $SkipEmbedWebUI)"
Write-Host "    强制重建 UI: $ForceWebUIBuild"
Write-Host "    嵌入解析器:  $(-not $SkipEmbedParsers)"

if ($script:BuildErrors.Count -gt 0) {
    Write-Host ""
    Write-Host "环境检查失败，请修复上述错误后重试。" -ForegroundColor Red
    exit 1
}
Write-StepDone

# --- Step 2: 清理构建产物 ---
Write-Step "清理构建产物"

if ($Clean) {
    $cleanDirs = @(
        (Join-Path $BuildDir "dist")
        (Join-Path $ProjectRoot "packages\app\dist")
        $OutputDir
    )
    foreach ($d in $cleanDirs) {
        if (Test-Path $d) {
            Remove-Item $d -Recurse -Force
            Write-Info "已删除: $d"
        }
    }
    Write-Ok "清理完成"
} else {
    Write-Info "已跳过（使用 -Clean 可清除缓存）"
}
Write-StepDone

# --- Step 3: 代码生成 ---
Write-Step "代码生成（模型快照）"

Push-Location $ProjectRoot
$prevEA = $ErrorActionPreference
$ErrorActionPreference = "Continue"
bun run packages/opencode/script/generate.ts 2>&1 | ForEach-Object { Write-Info $_ }
$ErrorActionPreference = $prevEA
Pop-Location
if ($LASTEXITCODE -eq 0) {
    Write-Ok "模型快照已加载"
} else {
    Write-Warn "模型快照加载失败（可能需要网络访问 models.dev）"
}
Write-StepDone

# --- Step 4: 下载解析器缓存 ---
Write-Step "下载解析器缓存（tree-sitter）"

if ($SkipCacheParsers) {
    Write-Info "已跳过（-SkipCacheParsers）"
} else {
    try {
        Push-Location $ProjectRoot
        bun run script/offline-cache-parsers.ts 2>&1 | ForEach-Object { Write-Info $_ }
        Pop-Location
        if ($LASTEXITCODE -ne 0) {
            Write-Warn "部分解析器下载失败，将使用已缓存的文件"
        }
    } catch {
        Pop-Location
        Write-Warn "解析器下载出错（非致命）: $_"
    }
}

if (Test-Path $ParsersCacheDir) {
    $parserLangs = (Get-ChildItem $ParsersCacheDir -Directory).Count
    $parserFiles = (Get-ChildItem $ParsersCacheDir -Recurse -File).Count
    Write-Ok "解析器缓存: $parserLangs 种语言, $parserFiles 个文件"
} else {
    Write-Warn "无解析器缓存可用"
}
Write-StepDone

# --- Step 5: 构建 CLI 二进制 ---
Write-Step "构建 CLI 二进制（Bun.compile）"

$ExePath = Join-Path $BuildDir "dist\opencode-windows-x64\bin\opencode.exe"

if ($SkipBuild) {
    Write-Info "已跳过（-SkipBuild）"
    if (-not (Test-Path $ExePath)) {
        Write-Fail "opencode.exe 未找到: $ExePath"
    }
} else {
    # 如果 SkipEmbedParsers，临时移走 offline-cache 以避免嵌入
    $cacheMoved = $false
    if ($SkipEmbedParsers -and (Test-Path $OfflineCacheDir)) {
        $tempCache = Join-Path $ProjectRoot "_offline-cache-bak"
        Move-Item $OfflineCacheDir $tempCache
        $cacheMoved = $true
        Write-Info "已临时移走 offline-cache（SkipEmbedParsers）"
    }

    Push-Location $BuildDir
    $env:OPENCODE_CHANNEL = $Channel

    $buildArgs = @("run", "script/build.ts", "--single")
    if ($SkipEmbedWebUI) {
        $buildArgs += "--skip-embed-web-ui"
    }
    if ($ForceWebUIBuild) {
        $buildArgs += "--force-web-ui-build"
    }
    $buildArgs += "--skip-install"

    Write-Info "执行: bun $($buildArgs -join ' ')"

    # PowerShell 5.1 会将 native command 的 stderr 输出包装为 ErrorRecord，
    # 当 $ErrorActionPreference = "Stop" 时会触发终止错误。但 Bun/vite 的
    # stderr 通常是警告信息而非真正错误，所以临时放宽错误处理。
    $prevErrorAction = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    & bun @buildArgs 2>&1 | ForEach-Object { Write-Info $_ }
    $ErrorActionPreference = $prevErrorAction

    Pop-Location

    # 恢复 offline-cache
    if ($cacheMoved) {
        if (Test-Path (Join-Path $ProjectRoot "offline-cache")) {
            Remove-Item (Join-Path $ProjectRoot "offline-cache") -Recurse -Force
        }
        Move-Item (Join-Path $ProjectRoot "_offline-cache-bak") $OfflineCacheDir
        Write-Info "已恢复 offline-cache"
    }

    # 用退出码和文件存在性判断构建是否真正失败，而非依赖 PowerShell 的 stderr 误判
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "构建失败，退出码: $LASTEXITCODE"
    } elseif (-not (Test-Path $ExePath)) {
        Write-Fail "构建失败: opencode.exe 未生成"
    }
}

if (Test-Path $ExePath) {
    $exeSize = (Get-Item $ExePath).Length
    Write-FileEntry "opencode.exe" $exeSize

    # 冒烟测试
    Write-Info "正在运行冒烟测试..."
    $prevEA = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $versionOutput = & $ExePath --version 2>&1
    $ErrorActionPreference = $prevEA
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "冒烟测试通过: $($versionOutput | Select-Object -First 1)"
    } else {
        Write-Warn "冒烟测试失败（退出码: $LASTEXITCODE）"
    }
}
Write-StepDone

if ($script:BuildErrors.Count -gt 0) {
    Write-Host ""
    Write-Host "构建出错，无法继续打包。" -ForegroundColor Red
    exit 1
}

Write-StepDone

# ============================================================
# 构建摘要
# ============================================================

$buildDuration = (Get-Date) - $script:BuildStart

Write-Banner "构建完成"

if ($script:BuildErrors.Count -gt 0) {
    Write-Host "错误 ($($script:BuildErrors.Count)):" -ForegroundColor Red
    foreach ($e in $script:BuildErrors) { Write-Host "  - $e" -ForegroundColor Red }
    Write-Host ""
}

if ($script:BuildWarnings.Count -gt 0) {
    Write-Host "警告 ($($script:BuildWarnings.Count)):" -ForegroundColor DarkYellow
    foreach ($w in $script:BuildWarnings) { Write-Host "  - $w" -ForegroundColor DarkYellow }
    Write-Host ""
}

Write-Host "  版本:       v$Version ($Channel)" -ForegroundColor White
Write-Host "  耗时:       $($buildDuration.TotalSeconds.ToString('F1'))s" -ForegroundColor White
Write-Host "  输出:       $ExePath" -ForegroundColor White
Write-Host ""

if ($script:BuildErrors.Count -gt 0) {
    exit 1
}
exit 0
