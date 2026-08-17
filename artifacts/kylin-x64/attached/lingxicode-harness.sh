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
export OMO_DISABLE_POSTHOG=1
export OPENCODE_SCAN_DIR_PLUGINS=1
export OPENCODE_USER_ID_ENABLED="${OPENCODE_USER_ID_ENABLED:-true}"
export OPENCODE_ENABLE_TELEMETRY="${OPENCODE_ENABLE_TELEMETRY:-true}"
export OPENCODE_TRACE_PROPAGATION_PROVIDERS="${OPENCODE_TRACE_PROPAGATION_PROVIDERS:-*}"
export OPENCODE_OTLP_ENDPOINT="${OPENCODE_OTLP_ENDPOINT:-http://localhost:4317}"
export OPENCODE_OTLP_PROTOCOL="${OPENCODE_OTLP_PROTOCOL:-http/protobuf}"
export OPENCODE_DIFF_DETAIL_ENABLED="${OPENCODE_DIFF_DETAIL_ENABLED:-true}"
export PATH=$SCRIPT_DIR/bin:$PATH

# export ENTERPRISE_API_KEY=sk-your-key-here

# ====== Deploy Financial Harness (首次自动) ======
if [ -f "$SCRIPT_DIR/scripts/deploy-plugins.sh" ]; then
    if [ ! -f ".opencode/plugin/financial-harness.ts" ]; then
        echo "[Financial Harness] First run - deploying plugin..."
        bash "$SCRIPT_DIR/scripts/deploy-plugins.sh"
    fi
fi
# ====== Inject plugin via OPENCODE_CONFIG_CONTENT ======
# 读取 opencode.json 并注入 plugin 字段
CONFIG_JSON=$(cat "$SCRIPT_DIR/config/opencode.json")
# 使用内置字符串处理注入 plugin 数组（避免依赖 jq）
# 在最后一个 } 前插入 "plugin":["file://..."]
CONFIG_JSON="${CONFIG_JSON%\}},\"plugin\":[\"$PLUGIN_URL\"]}"
export OPENCODE_CONFIG_CONTENT="$CONFIG_JSON"



exec $SCRIPT_DIR/bin/opencode "$@"
