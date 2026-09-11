/**
 * lingxi-sign-auth-v2 — LingxiCode 签名认证插件（V2 Promise 格式）
 *
 * V2 插件没有 V1 那样的 per-request `chat.headers` 钩子。
 * 本插件通过 aisdk.language 钩子拦截 fetch 函数，
 * 在每次真实的 HTTP 请求发出前动态计算并注入签名 headers。
 *
 * ── 启用方式 ──
 *
 *   1. opencode.json 里注册（V2 插件格式）：
 *        "plugin": ["lingxi-sign-auth-v2"]
 *        // 或带自定义密钥：
 *        "plugin": [["lingxi-sign-auth-v2", { "secret": "your-secret" }]]
 *
 *   2. 或放 config/plugins/ 目录自动发现（文件名匹配 plugins/*.{ts,js}）
 *
 * ── 请求头协议 ──
 *
 *   X-Timestamp    = 毫秒级 Unix 时间戳（如 1787556883366）
 *   X-Nonce        = opencode 二进制文件的 SHA256 hex（身份标识）
 *   X-Plugin-Hash  = 本插件文件的 SHA256 hex
 *   X-Signature    = `${timestamp}.${HMAC-SHA256(secret, signingString)}`
 *
 *   signingString = `${X-Timestamp}.${X-Nonce}.${X-Plugin-Hash}`
 */

import { createHash, createHmac } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import { resolve, dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

// ─── 密钥 ──────────────────────────────────────────────────────────
// ⚠️  生产部署前请替换为你自己的随机密钥，并同步到服务端校验代码中。
const DEFAULT_SECRET = "lingxicode-signing-key-v1-please-replace-me"

// ─── 基础工具 ──────────────────────────────────────────────────────

/** 对 Buffer 或 string 计算 SHA256，返回十六进制小写 */
function sha256(input) {
  return createHash("sha256").update(input).digest("hex")
}

/** 读取文件并计算 SHA256，文件不存在则返回 null */
function fileSha256(filePath) {
  try {
    if (!existsSync(filePath)) return null
    return sha256(readFileSync(filePath))
  } catch {
    return null
  }
}

// ─── 路径定位 ──────────────────────────────────────────────────────

const PLUGIN_DIR = dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = resolve(PLUGIN_DIR, "..", "..")

function findBinaryPath() {
  const isWin = process.platform === "win32"
  const candidates = isWin
    ? ["opencode.exe", "opencode"]
    : ["opencode", "opencode.exe"]

  for (const name of candidates) {
    const p = join(ROOT_DIR, "bin", name)
    if (existsSync(p)) return p
  }

  if (process.env.OPENCODE_CONFIG_DIR) {
    for (const name of candidates) {
      const p = join(process.env.OPENCODE_CONFIG_DIR, "..", "bin", name)
      if (existsSync(p)) return resolve(p)
    }
  }

  return null
}

// ─── 进程级缓存：二进制哈希只算一次 ────────────────────────────────
let binHashCache = null

function getBinHash() {
  if (binHashCache === null) {
    const binPath = findBinaryPath()
    binHashCache = binPath ? fileSha256(binPath) : sha256(process.platform + ":" + process.arch)
  }
  return binHashCache
}

/** 生成每次请求要注入的 4 个 headers */
function makeAuthHeaders(selfPluginPath, secret) {
  const timestamp  = Date.now().toString()
  const nonce      = getBinHash()
  const pluginHash = fileSha256(selfPluginPath) || sha256("lingxi-sign-auth-v2-fallback")

  const signingString = `${timestamp}.${nonce}.${pluginHash}`
  const hmacHex = createHmac("sha256", secret).update(signingString).digest("hex")

  return {
    "X-Timestamp":   timestamp,
    "X-Nonce":       nonce,
    "X-Plugin-Hash": pluginHash,
    "X-Signature":   `${timestamp}.${hmacHex}`,
  }
}

/** 从 fetch 的 init.headers 里提取已有 headers 作为普通对象（小写 key） */
function headersFromInit(headers) {
  if (!headers) return {}
  if (headers instanceof Headers) {
    const out = {}
    headers.forEach((v, k) => { out[k.toLowerCase()] = v })
    return out
  }
  if (Array.isArray(headers)) {
    const out = {}
    for (const [k, v] of headers) out[String(k).toLowerCase()] = v
    return out
  }
  const out = {}
  for (const [k, v] of Object.entries(headers)) out[k.toLowerCase()] = v
  return out
}

// ─── V2 Promise 插件入口 ────────────────────────────────────────────
//
// V2 插件的 format 是：export default { id, setup }
// setup(ctx) 里注册各种 hooks。ctx.aisdk.language(callback)
// 会在每个 AISDK model 初始化时触发一次，给我们 event.options。
//
// 关键：event.options 里已经有 prepareOptions 包好的 fetch 包装器。
// 我们再包一层 fetch，在每次 HTTP 请求之前注入签名 headers。

export default {
  id: "lingxi-sign-auth-v2",

  async setup(ctx) {
    const selfPath = fileURLToPath(import.meta.url)
    const secret = (ctx.options && ctx.options.secret) || DEFAULT_SECRET

    // 每个模型初始化时触发，拿到 options（含 fetch 包装器）
    await ctx.aisdk.language((event) => {
      const originalFetch = event.options.fetch

      event.options.fetch = async (input, init) => {
        // 如果 X-Nonce 已经存在（比如 V1 插件先注入过），跳过避免冲突
        const existing = headersFromInit(init?.headers)
        if (existing["x-nonce"]) {
          return originalFetch(input, init)
        }

        const authHeaders = makeAuthHeaders(selfPath, secret)

        let mergedInit = { ...(init ?? {}) }
        const headers = { ...existing }
        Object.assign(headers, authHeaders)
        mergedInit.headers = headers

        return originalFetch(input, mergedInit)
      }
    })
  },
}
