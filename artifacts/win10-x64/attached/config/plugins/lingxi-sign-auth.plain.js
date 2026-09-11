/**
 * lingxi-sign-auth.plain.js — LingxiCode 签名认证插件（明文版，方便调试）
 *
 * 这是同名插件的 **明文未混淆版本**。生产部署用 lingxi-sign-auth.js（混淆版），
 * 开发联调时用本文件以便在 opencode 日志里清晰看到签名过程。
 *
 * ═══════════════════════════════════════════════════════════════════
 *  如何开启插件日志
 * ═══════════════════════════════════════════════════════════════════
 *
 *  方式 A：启动 opencode 时带上环境变量（推荐，临时调试）
 *    OPENCODE_PRINT_LOGS=1 OPENCODE_LOG_LEVEL=DEBUG ./lingxicode-harness.sh
 *    ↑ 这样所有 console.error / console.log 都会直接打到终端 stderr
 *
 *  方式 B：直接看日志文件
 *    日志文件位置：~/.opencode/opencode.log（由 Global.Path.log 决定）
 *    tail -f ~/.opencode/opencode.log | grep -i "lingxi"
 *
 *  方式 C：Windows 下（PowerShell）
 *    $env:OPENCODE_PRINT_LOGS="1"; $env:OPENCODE_LOG_LEVEL="DEBUG"; .\lingxicode-harness.bat
 *
 * ═══════════════════════════════════════════════════════════════════
 *  协议说明
 * ═══════════════════════════════════════════════════════════════════
 *
 *  每次模型请求时注入 4 个 HTTP header：
 *
 *    X-Timestamp    = 毫秒级 Unix 时间戳
 *    X-Nonce        = opencode 二进制文件的 SHA256 hex（身份标识）
 *    X-Plugin-Hash  = 本插件文件自身的 SHA256 hex
 *    X-Signature    = "${timestamp}.${HMAC-SHA256(secret, signingString)}"
 *
 *  signingString = "${X-Timestamp}.${X-Nonce}.${X-Plugin-Hash}"
 *
 *  服务端校验：HMAC 重算 + Nonce 白名单 + 时间戳窗口（防重放）
 */

import { createHash, createHmac } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import { resolve, dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

// ═══════════════════════════════════════════════════════════════════
//  密钥（发布前必须替换为自己的值，通过 opencode.json 也可覆盖）
// ═══════════════════════════════════════════════════════════════════
const DEFAULT_SECRET = "lingxicode-signing-key-v1-please-replace-me"

// ═══════════════════════════════════════════════════════════════════
//  日志开关：设为 false 可静默。默认根据 DEBUG 环境变量自动判断。
// ═══════════════════════════════════════════════════════════════════
const DEBUG = process.env.OPENCODE_LOG_LEVEL?.toUpperCase() === "DEBUG"

function log(...args) {
  if (DEBUG) console.error("[lingxi-sign-auth]", ...args)
}

// ═══════════════════════════════════════════════════════════════════
//  基础工具
// ═══════════════════════════════════════════════════════════════════

/** 计算 SHA256 hex（小写） */
function sha256(input) {
  return createHash("sha256").update(input).digest("hex")
}

/** 读取文件并计算 SHA256，文件不存在或读不到返回 null */
function fileSha256(filePath) {
  try {
    if (!existsSync(filePath)) {
      log("  fileSha256: 文件不存在 →", filePath)
      return null
    }
    return sha256(readFileSync(filePath))
  } catch (err) {
    log("  fileSha256: 读取失败 →", filePath, err?.message)
    return null
  }
}

// ═══════════════════════════════════════════════════════════════════
//  跨平台二进制定位
//
//  打包后目录结构：
//    <root>/bin/opencode            (Linux / Kylin)
//    <root>/bin/opencode.exe        (Windows)
//    <root>/config/plugins/lingxi-sign-auth.plain.js   ← 本文件
//    <root>/lingxicode.sh
//
//  从本文件位置反推 → config/plugins/lingxi-sign-auth.plain.js
//  resolve('..','..') → <root> → bin/opencode 或 bin/opencode.exe
// ═══════════════════════════════════════════════════════════════════

const PLUGIN_DIR = dirname(fileURLToPath(import.meta.url))
const ROOT_DIR   = resolve(PLUGIN_DIR, "..", "..")

function findBinaryPath() {
  const isWin = process.platform === "win32"
  // Windows 优先找 .exe，Linux 优先找无后缀
  const candidates = isWin
    ? ["opencode.exe", "opencode"]
    : ["opencode", "opencode.exe"]

  for (const name of candidates) {
    const p = join(ROOT_DIR, "bin", name)
    if (existsSync(p)) {
      log("  findBinaryPath: 命中 →", p)
      return p
    }
  }

  // 兜底：lingxicode.sh 设置了 OPENCODE_CONFIG_DIR
  if (process.env.OPENCODE_CONFIG_DIR) {
    for (const name of candidates) {
      const p = join(process.env.OPENCODE_CONFIG_DIR, "..", "bin", name)
      if (existsSync(p)) {
        log("  findBinaryPath: 环境变量兜底命中 →", resolve(p))
        return resolve(p)
      }
    }
  }

  log("  findBinaryPath: ⚠️  未找到二进制，将用 platform+arch 占位")
  return null
}

// 进程级缓存：同一进程内二进制不会变，启动时算一次
let binHashCache = null

// ═══════════════════════════════════════════════════════════════════
//  V1 插件入口
//
//  V1 插件格式：
//    export default { id: string, server(input, options): Promise<return> }
//  返回对象里注册各种钩子，本插件只需要 "chat.headers" 钩子。
//
//  chat.headers 钩子签名：
//    async (hookInput, output) => output.headers = {...追加的 headers}
//  opencode 每次请求模型都会触发一次这个钩子。
// ═══════════════════════════════════════════════════════════════════

export default {
  id: "lingxi-sign-auth.plain",

  async server(input, options = {}) {
    const secret = (options && options.secret) || DEFAULT_SECRET

    log("▶ 插件启动")
    log("  platform   =", process.platform)
    log("  arch       =", process.arch)
    log("  pluginDir  =", PLUGIN_DIR)
    log("  rootDir    =", ROOT_DIR)
    log("  secret     =", secret)

    // 启动时算一次二进制哈希（后面走缓存）
    const binPath = findBinaryPath()
    binHashCache = binPath ? fileSha256(binPath) : sha256(process.platform + ":" + process.arch)
    log("  binHash    =", binHashCache)

    return {
      /**
       * 每次模型请求触发。往 output.headers 里追加 4 个签名 header。
       * opencode 的 header 合并顺序：内置 → model.request.headers → 插件 chat.headers
       */
      async "chat.headers"(_hookInput, output) {
        const timestamp = Date.now().toString()

        // 1. opencode 二进制 SHA256（缓存命中，不会重复读磁盘）
        const nonce = binHashCache

        // 2. 插件自身 SHA256
        const selfUrl = fileURLToPath(import.meta.url)
        const pluginHash = fileSha256(selfUrl) || sha256("lingxi-sign-auth-fallback")

        // 3. 组装签名
        const signingString = `${timestamp}.${nonce}.${pluginHash}`
        const sigHex = createHmac("sha256", secret).update(signingString).digest("hex")
        const signature = `${timestamp}.${sigHex}`

        // 4. 写入 headers
        output.headers["X-Timestamp"]   = timestamp
        output.headers["X-Nonce"]       = nonce
        output.headers["X-Plugin-Hash"] = pluginHash
        output.headers["X-Signature"]   = signature

        log("✓ chat.headers → 已注入签名")
        log("    signingString =", signingString)
        log("    signature     =", signature)
      },

      async dispose() {
        log("◀ 插件卸载")
        binHashCache = null
      },
    }
  },
}
