@echo off
REM ========================================
REM  LingxiCode Offline Launcher
REM ========================================

set OPENCODE_PARSERS_DIR=%~dp0parsers
set OPENCODE_DISABLE_AUTOUPDATE=true
set OPENCODE_DISABLE_MODELS_FETCH=true
set OPENCODE_DISABLE_LSP_DOWNLOAD=true
set OPENCODE_CONFIG_DIR=%~dp0config
set "PATH=%~dp0bin;%PATH%"
set OMO_DISABLE_POSTHOG=1
set OPENCODE_SCAN_DIR_PLUGINS=1
if not defined OPENCODE_USER_ID_ENABLED set "OPENCODE_USER_ID_ENABLED=true"
if not defined OPENCODE_ENABLE_TELEMETRY set "OPENCODE_ENABLE_TELEMETRY=true"
if not defined OPENCODE_TRACE_PROPAGATION_PROVIDERS set "OPENCODE_TRACE_PROPAGATION_PROVIDERS=*"
if not defined OPENCODE_OTLP_ENDPOINT set "OPENCODE_OTLP_ENDPOINT=http://localhost:4317"
if not defined OPENCODE_OTLP_PROTOCOL set "OPENCODE_OTLP_PROTOCOL=http/protobuf"
if not defined OPENCODE_DIFF_DETAIL_ENABLED set "OPENCODE_DIFF_DETAIL_ENABLED=true"

REM set ENTERPRISE_API_KEY=sk-your-key-here

REM ====== Deploy Financial Harness (首次自动) ======
if exist "%~dp0scripts\deploy-plugins.ps1" (
    if not exist ".opencode\plugin\financial-harness.ts" (
        echo [Financial Harness] First run - deploying plugin...
        powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\deploy-plugins.ps1"
    )
)

REM ====== Inject plugin via OPENCODE_CONFIG_CONTENT ======
powershell -NoProfile -Command ^
  "$t=Get-Content '%~dp0config\opencode.json' -Raw|ConvertFrom-Json;" ^
  "$t|Add-Member -NotePropertyName 'plugin' -NotePropertyValue @('%PLUGIN_URL%') -Force;" ^
  "$j=$t|ConvertTo-Json -Compress -Depth 10;" ^
  "[Environment]::SetEnvironmentVariable('OPENCODE_CONFIG_CONTENT',$j,'Process')"

"%~dp0bin/opencode.exe" %*
