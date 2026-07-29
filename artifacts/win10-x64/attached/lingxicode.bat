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
set OPENCODE_SCAN_DIR_PLUGINS=0
if not defined OPENCODE_USER_ID_ENABLED set "OPENCODE_USER_ID_ENABLED=true"
if not defined OPENCODE_USER_ID_ENDPOINT set "OPENCODE_USER_ID_ENDPOINT=http://localhost"
if not defined OPENCODE_ENABLE_TELEMETRY set "OPENCODE_ENABLE_TELEMETRY=true"
if not defined OPENCODE_OTLP_ENDPOINT set "OPENCODE_OTLP_ENDPOINT=http://localhost:4317"
if not defined OPENCODE_OTLP_PROTOCOL set "OPENCODE_OTLP_PROTOCOL=http/protobuf"
if not defined OPENCODE_OTLP_HEADERS set "OPENCODE_OTLP_HEADERS=Authorization=Basic xxx"

REM set ENTERPRISE_API_KEY=sk-your-key-here

"%~dp0bin/opencode.exe" %*
