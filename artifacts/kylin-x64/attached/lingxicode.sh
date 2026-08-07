#!/bin/bash
# ========================================
# LingxiCode Offline Launcher (Linux)
# ========================================

SCRIPT_DIR=$(cd $(dirname $0) && pwd)
export OPENCODE_CONFIG_DIR=$SCRIPT_DIR/config
export OPENCODE_PARSERS_DIR=$SCRIPT_DIR/parsers
export OPENCODE_DISABLE_AUTOUPDATE=true
export OPENCODE_DISABLE_MODELS_FETCH=true
export OPENCODE_DISABLE_LSP_DOWNLOAD=true
export NPM_CONFIG_FETCH_RETRIES=0
export OMO_DISABLE_POSTHOG=1
export OPENCODE_SCAN_DIR_PLUGINS=0
# Preseed dependency metadata so offline startup does not invoke npm for the default config directory.
DEFAULT_CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"
mkdir -p "$DEFAULT_CONFIG_DIR/node_modules"
cp "$SCRIPT_DIR/config/package.json" "$SCRIPT_DIR/config/package-lock.json" "$DEFAULT_CONFIG_DIR/"
export OPENCODE_USER_ID_ENABLED="${OPENCODE_USER_ID_ENABLED:-true}"
export OPENCODE_USER_ID_ENDPOINT="${OPENCODE_USER_ID_ENDPOINT:-http://localhost}"
export OPENCODE_USER_ID_X-Blackbox-Auth="${OPENCODE_USER_ID_X-Blackbox-Auth:-}"
export OPENCODE_ENABLE_TELEMETRY="${OPENCODE_ENABLE_TELEMETRY:-true}"
export OPENCODE_OTLP_ENDPOINT="${OPENCODE_OTLP_ENDPOINT:-http://localhost:4317}"
export OPENCODE_OTLP_PROTOCOL="${OPENCODE_OTLP_PROTOCOL:-http/protobuf}"
export OPENCODE_OTLP_HEADERS="${OPENCODE_OTLP_HEADERS:-Authorization=Basic xxx}"
export OPENCODE_DIFF_DETAIL_ENABLED="${OPENCODE_DIFF_DETAIL_ENABLED:-true}"
export OPENCODE_DIFF_DETAIL_URL="${OPENCODE_DIFF_DETAIL_URL:-}"
export OPENCODE_DIFF_DETAIL_TOKEN="${OPENCODE_DIFF_DETAIL_TOKEN:-}"
export OPENCODE_DIFF_DETAIL_LOG_SOURCE="${OPENCODE_DIFF_DETAIL_LOG_SOURCE:-7}"
export PATH=$SCRIPT_DIR/bin:$PATH

# export ENTERPRISE_API_KEY=sk-your-key-here

exec $SCRIPT_DIR/bin/opencode "$@"
