# LingxiCode 签名认证 — Java 服务端设计手册

> **版本**: v1.0 · **配套**: deploy-handbook.md · **JDK**: OpenJDK 1.8+ · **更新**: 2026-09-04

---

## 一、整体架构

### 1.1 模块调用关系

```
┌─────────────────────────────────────────────────────────────────┐
│                      HTTP 请求进入                               │
│            POST /v1/chat/completions  (带 4 个签名 headers)      │
└──────────────┬──────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│  LingxiSignFilter  (Servlet Filter)                             │
│                                                                 │
│  doFilter()                                                     │
│    │                                                            │
│    ├─ 1. 只 /v1/* 路径拦截，其他路径直接 chain.doFilter() 放行   │
│    ├─ 2. 提取 headers 到 Map<String, String>                    │
│    └─ 3. 调用 verifier.verify(headers) ─────────────────────┐  │
│                                                              │  │
│  Filter 持有：                                               │  │
│    LingxiSignVerifier verifier  ← 读 ENABLE_PLUGIN_WHITELIST_CHECK 常量  │  │
└──────────────────────────────────────────────────────────────┘  │
                                                                  │
                                                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  LingxiSignVerifier  (核心校验器)                                │
│                                                                 │
│  verify(timestamp, nonce, pluginHash, signature)                │
│    │                                                            │
│    ├─ Step 1: 字段完整性 → MISSING_HEADER                       │
│    ├─ Step 2: 时间戳窗口 → INVALID_TIMESTAMP                    │
│    ├─ Step 3: Nonce 白名单 → LingxiNonceWhitelist.ALLOWED       │
│    ├─ Step 4: Plugin 白名单 → LingxiPluginWhitelist.ALLOWED     │
│    │          (由 ENABLE_PLUGIN_WHITELIST_CHECK 控制开关)         │
│    └─ Step 5: HMAC 重算对比                                      │
│          hmacSha256Hex(secret, ts+'.'+nonce+'.'+pluginHash)     │
│          ≠ signature.split('.')[1] → INVALID_SIGNATURE          │
│                                                                 │
│  持有：                                                         │
│    String secret            共享密钥（客户端插件也有一份）       │
│    Set<String> allowedNonces     ← LingxiNonceWhitelist.ALLOWED │
│    Set<String> allowedPlugins    ← LingxiPluginWhitelist.ALLOWED│
│    long toleranceMs         时间戳容差，默认 5 分钟              │
│                                                                 │
│  静态常量（开关）：                                              │
│    public static final boolean                                  │
│      ENABLE_PLUGIN_WHITELIST_CHECK = true;  ← 改这里开关        │
└─────────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│  LingxiNonceWhitelist  /  LingxiPluginWhitelist  (静态常量类)    │
│                                                                 │
│  public static final Set<String> ALLOWED = { ... };             │
│  只有常量，无方法。每次发新版本往 ALLOWED 里追加 SHA256 即可。    │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 文件依赖关系图

```
LingxiSignFilter.java
  │ 依赖
  ▼
LingxiSignVerifier.java  ←  核心，无外部依赖（纯 javax.crypto / java.security）
  │ 读取
  ├─ LingxiNonceWhitelist.java    (Set<String> ALLOWED)
  └─ LingxiPluginWhitelist.java   (Set<String> ALLOWED)
                                   (由 Verifier.ENABLE_PLUGIN_WHITELIST_CHECK 决定是否使用)

LingxiSignSmoke.java  ── 依赖 ──▶  上面全部
LingxiE2E.java        ── 依赖 ──▶  上面全部
```

依赖方向是 **Filter → Verifier → Whitelists**，全部向下。没有循环依赖。

---

## 二、完整时序图

### 2.1 合法请求的时序

```
Client(opencode)              LingxiSignFilter          LingxiSignVerifier      Whitelists      Server(LLM)
     │                               │                         │                    │              │
     │  POST /v1/chat/completions    │                         │                    │              │
     │  Headers:                     │                         │                    │              │
     │   X-Timestamp: 1787556883366 │                         │                    │              │
     │   X-Nonce: 269303e5...9f      │                         │                    │              │
     │   X-Plugin-Hash: d2019183...80│                         │                    │              │
     │   X-Signature: 17875568...ff0 │                         │                    │              │
     │──────────────────────────────▶│                         │                    │              │
     │                               │                         │                    │              │
     │                               │  路径拦截                │                    │              │
     │                               │  uri.startsWith("/v1/")? │                    │              │
     │                               │  YES → 继续              │                    │              │
     │                               │─────────────────────────▶│                    │              │
     │                               │                         │                    │              │
     │                               │                         │── Step 1 字段完整  │              │
     │                               │                         │   4 个 header 都在  │              │
     │                               │                         │   ✓ 通过            │              │
     │                               │                         │                    │              │
     │                               │                         │── Step 2 时间戳     │              │
     │                               │                         │   |now - ts| ≤ 5min │              │
     │                               │                         │   ✓ 通过            │              │
     │                               │                         │                    │              │
     │                               │                         │── Step 3 Nonce 白名单 ─────────────▶│
     │                               │                         │   contains(nonce)?  │              │
     │                               │                         │   ✓ 在白名单里      │              │
     │                               │                         │◀─────────────────────│              │
     │                               │                         │                    │              │
     │                               │                         │── Step 4 Plugin 白名单 ─────────────▶│
     │                               │                         │   (开关=true 才查)  │              │
     │                               │                         │   contains(plugin)? │              │
     │                               │                         │   ✓ 在白名单里      │              │
     │                               │                         │◀─────────────────────│              │
     │                               │                         │                    │              │
     │                               │                         │── Step 5 HMAC 重算   │              │
     │                               │                         │   signStr = ts + "." + nonce + "." + pluginHash
     │                               │                         │   expected = HMAC-SHA256(secret, signStr)
     │                               │                         │   expected == sig?  │              │
     │                               │                         │   ✓ 通过            │              │
     │                               │                         │                    │              │
     │                               │  Result.pass()           │                    │              │
     │                               │◀─────────────────────────│                    │              │
     │                               │                         │                    │              │
     │                               │  chain.doFilter(req, resp)                    │              │
     │                               │────────────────────────────────────────────────────────────▶│
     │                               │                         │                    │              │
     │  200 OK + LLM response        │                         │                    │              │
     │◀──────────────────────────────│                         │                    │              │
```

### 2.2 被拒绝的请求（非法 Nonce 示例）

```
Client(opencode)              LingxiSignFilter          LingxiSignVerifier      Whitelists      Server(LLM)
     │                               │                         │                    │              │
     │  X-Nonce: 0000000...000       │                         │                    │              │
     │  (攻击者伪造，不在白名单)      │                         │                    │              │
     │──────────────────────────────▶│─────────────────────────▶│                    │              │
     │                               │                         │                    │              │
     │                               │                         │   Step 1 ✓          │              │
     │                               │                         │   Step 2 ✓          │              │
     │                               │                         │                    │              │
     │                               │                         │── Step 3 Nonce 白名单 ─────────────▶│
     │                               │                         │   contains("0000...")? │           │
     │                               │                         │   ✗ 不在白名单里     │              │
     │                               │                         │◀─────────────────────│              │
     │                               │                         │                    │              │
     │                               │  Result.fail(INVALID_NONCE)                  │              │
     │                               │◀─────────────────────────│                    │              │
     │                               │                         │                    │              │
     │                               │  status=403             │                    │              │
     │                               │  {"error":"lingxi_sign_failed",                 │              │
     │                               │   "reason":"X-Nonce 不在官方发布白名单内"}      │              │
     │                               │                         │                    │              │
     │  403 Forbidden                │                         │                    │              │
     │◀──────────────────────────────│                         │                    │              │
```

### 2.3 五个拒绝场景的快速对照

```
场景                       Step     Reason 枚举            HTTP返回体 reason 字段
─────────────────────────────────────────────────────────────────────────────────────
任何 header 缺失             1      MISSING_HEADER         缺少签名 header（X-Timestamp / X-Nonce / ...）
时间戳超出 ±5 分钟           2      INVALID_TIMESTAMP       时间戳不在有效窗口内（防重放）
X-Nonce 不在白名单           3      INVALID_NONCE           X-Nonce 不在官方发布白名单内
X-Plugin-Hash 不在白名单     4      INVALID_PLUGIN          X-Plugin-Hash 不在官方发布插件白名单内
HMAC 重算对不上              5      INVALID_SIGNATURE       X-Signature 签名不匹配
```

---

## 三、Secret 的角色

### 3.1 一句话定义

**Secret 是客户端插件和服务端 Verifier 之间预先约定好的共享密钥，用于 HMAC 签名和验签。**

### 3.2 Secret 和 Plugin Hash 的关系与区别

这两个是**签名协议里完全不同的两个东西**，经常被混淆。一次性搞清楚：

| 维度 | Secret | Plugin Hash |
|------|--------|-------------|
| **是什么** | 共享密钥（一串随机字节/hex） | 插件文件的 SHA256 哈希（文件身份指纹） |
| **从哪来** | 人工生成，客户端和服务端手动同步 | 运行时对插件文件 `lingxi-sign-auth.js` 动态计算 |
| **传输** | ❌ **绝不随网络传输** | ✅ 作为 X-Plugin-Hash header 明文传输 |
| **谁能知道** | 只有你（你自己，发版的时候手动塞进插件和服务端） | 看到 HTTP 请求的任何人（网络截包就能拿到） |
| **作用** | HMAC 的 key——决定签名是不是"你生成的" | HMAC 的 message 组成部分 + 显式白名单校验的输入 |
| **泄露后果** | 攻击者可以**完整伪造签名**（包括合法的 pluginHash） | 攻击者知道你发过哪几个插件文件哈希，但没法伪造签名（因为还缺 secret） |
| **能否轮换** | 可以（客户端和服务端同时更新） | 不需要轮换（插件文件哈希跟着插件版本走） |

### 3.3 打个比方

想象你是一家公司发外卖优惠券：

- **Secret** = 你餐厅的**印章**——只有你有，盖在优惠券上别人就知道是你发的。印章不传给任何人。
- **Plugin Hash** = 优惠券上的**餐品名称 + 数量**——公开信息，印在优惠券上，任何人都能看。
- **Nonce** = 优惠券上的**餐厅名字和地址**——确认是你发的那家餐厅。
- **HMAC 签名** = 印章盖在优惠券上的**印记**——由印章（secret）和优惠券内容（timestamp + nonce + pluginHash）共同决定。
- **显式 Plugin 白名单** = 餐厅规定**只接受几种固定面额的优惠券**（比如只接受 ¥5 和 ¥10，不接受 ¥7 的）。

攻击者就算拿到一张有效优惠券（知道了 pluginHash 长什么样），但他没有印章（secret），就没法自己印一张新的。

### 3.4 Secret 泄露后的防御层次

| 情况 | 能否伪造请求 | 原因 |
|------|-------------|------|
| **密钥没泄露**，攻击方只知道协议 | ❌ 不能 | 不知道 secret 就没法算 HMAC |
| **密钥泄露**，但 `ENABLE_PLUGIN_WHITELIST_CHECK = true` | ⚠️ 部分能 | 攻击者得同时拿到你官方插件文件的**精确副本**才能过 plugin 白名单。自己写的插件文件哈希对不上 |
| **密钥泄露**，且 `ENABLE_PLUGIN_WHITELIST_CHECK = false` | ✅ 能 | HMAC 间接约束失效，攻击方用任何插件文件都能生成合法签名 |

**这就是为什么推荐打开 plugin 白名单**——密钥泄露后多一层门槛。

---

## 四、完整签名生成 + 校验流程

### 4.1 客户端（opencode 插件侧）

每一步都有对应的 Node.js 代码在插件里执行：

```
① 读取当前时间戳
   timestamp = Date.now().toString()   // "1787556883366"
                 │
                 ▼
② 读取 opencode 二进制文件，算 SHA256
   binPath = findBinaryPath()          // 跨平台定位 bin/opencode 或 bin/opencode.exe
   nonce   = sha256(readFileSync(binPath))  // "269303e562a3310d7b79397184da8bf99..."
                 │
                 ▼
③ 读取插件自身文件，算 SHA256
   selfPath  = fileURLToPath(import.meta.url)
   pluginHash = sha256(readFileSync(selfPath))  // "d201918365a2625fdc955cbd31b40e5485..."
                 │
                 ▼
④ 组装待签名字符串（关键！顺序不能错，. 分隔符不能改）
   signingString = timestamp + "." + nonce + "." + pluginHash
                 │
                 ▼
⑤ HMAC-SHA256 签名
   signatureHex = HMAC-SHA256(secret, signingString)
                 │
                 ▼
⑥ 拼进 header 格式
   signature = timestamp + "." + signatureHex
                 │
                 ▼
⑦ 注入 HTTP headers
   X-Timestamp   = timestamp
   X-Nonce       = nonce
   X-Plugin-Hash = pluginHash
   X-Signature   = signature
                 │
                 ▼
⑧ opencode 发 HTTP 请求给 LLM 服务
```

### 4.2 服务端（Java Verifier 侧）

收到请求后反向执行，每一步都是**验证**：

```
① 提取 4 个 header（都是明文传输，直接 getHeader()）
   timestamp  = request.getHeader("X-Timestamp")    // "1787556883366"
   nonce      = request.getHeader("X-Nonce")        // "269303e562a..."
   pluginHash = request.getHeader("X-Plugin-Hash")  // "d2019183..."
   signature  = request.getHeader("X-Signature")    // "1787556883366.0d4fae..."
                 │
                 ▼
② 字段完整性校验
   if (任何一个是 null) → 403 MISSING_HEADER
                 │
                 ▼
③ 时间戳窗口校验（防重放）
   long ts = Long.parseLong(timestamp)
   if (Math.abs(System.currentTimeMillis() - ts) > toleranceMs)
     → 403 INVALID_TIMESTAMP
   默认 toleranceMs = 5 * 60 * 1000  (±5 分钟)
                 │
                 ▼
④ Nonce 显式白名单校验
   if (!LingxiNonceWhitelist.ALLOWED.contains(nonce.toLowerCase()))
     → 403 INVALID_NONCE
                 │
                 ▼
⑤ Plugin 显式白名单校验（可开关）
   if (ENABLE_PLUGIN_WHITELIST_CHECK &&
       !LingxiPluginWhitelist.ALLOWED.contains(pluginHash.toLowerCase()))
     → 403 INVALID_PLUGIN
                 │
                 ▼
⑥ 解析 X-Signature
   String[] parts = signature.split("\\.", 2)
   if (parts.length != 2 || !parts[0].equals(timestamp))
     → 403 INVALID_SIGNATURE        // signature 前半段必须等于 timestamp
   String providedHmac = parts[1].toLowerCase()
                 │
                 ▼
⑦ 重新计算 HMAC-SHA256（和客户端完全相同的算法 + 相同的 secret）
   String signingString = timestamp.toLowerCase() + "."
                        + nonce.toLowerCase() + "."
                        + pluginHash.toLowerCase()
   String expectedHmac = hmacSha256Hex(secret, signingString)
                 │
                 ▼
⑧ 对比
   if (!expectedHmac.equals(providedHmac))
     → 403 INVALID_SIGNATURE
                 │
                 ▼
⑨ 全部通过 ✅ 放行给业务逻辑处理
```

### 4.3 HMAC-SHA256 算法细节

```
Java:                               Node/Bun:
────────────────────────────────    ─────────────────────────────────
Mac mac = Mac.getInstance("HmacSHA256");    createHmac("sha256", secret)
mac.init(                                   .update(signingString)
  new SecretKeySpec(                        .digest("hex")
    secret.getBytes(UTF_8),
    "HmacSHA256"
  )
);
byte[] bytes = mac.doFinal(
  signingString.getBytes(UTF_8)
);
// bytesToHex: 每字节 → 2 位小写 hex，无分隔符
// 例如 [0x0d, 0x4f, 0xae] → "0d4fae"
```

**两边必须保证三件事完全对齐**：

| 细节 | Java | Node |
|------|------|------|
| charset | UTF-8 编码字符串 | 同上 |
| 大小写 | 输出 hex 转小写 | `digest("hex")` 默认小写 |
| signingString 拼接顺序 | `${ts}.${nonce}.${pluginHash}` | 完全相同 |
| HMAC 算法名 | `"HmacSHA256"` | `"sha256"` |

### 4.4 一个具体的签名示例

```
secret        = "lingxicode-signing-key-v1-please-replace-me"
timestamp     = "1787556883366"
nonce         = "269303e562a3310d7b79397184da8bf99dd852cf7f65124c06f00c3dff6b200f"  (kylin-x64 二进制)
pluginHash    = "d201918365a2625fdc955cbd31b40e54852f8fd19f622644590da3df57962880"  (混淆版插件)

signingString = "1787556883366" + "."
              + "269303e562a3310d7b79397184da8bf99dd852cf7f65124c06f00c3dff6b200f" + "."
              + "d201918365a2625fdc955cbd31b40e54852f8fd19f622644590da3df57962880"

HMAC-SHA256(secret, signingString)
              = "0d4fae33aae3a57e6e1bc6b20a4b27fe334b43b2e08828bb82a0f236aeb96ff0"

最终 X-Signature = "1787556883366.0d4fae33aae3a57e6e1bc6b20a4b27fe334b43b2e08828bb82a0f236aeb96ff0"
```

这个签名就是 `LingxiE2E.java` 里 good_1 用的那组。任何用相同 secret 的验证端（Java / Node / Python / Go）都能算出相同的 HMAC。

### 4.5 加解密？没有解密。

整个协议**只有签名和验签，没有任何加密/解密**。所有 4 个 header 都是明文传输的。

为什么可以明文？因为：

| header | 为什么明文没关系 |
|--------|----------------|
| `X-Timestamp` | 公开信息 |
| `X-Nonce` | 二进制哈希，攻击者知道了也没用——他没法伪造合法签名 |
| `X-Plugin-Hash` | 公开信息，攻击者知道了也没法自己改 |
| `X-Signature` | 明文但没法"反向"——HMAC 是单向散列，知道输入和输出也算不出 secret |

密钥（secret）**不出现在网络上任何地方**，只在客户端插件和服务端代码里。这就是整个协议安全的基石。

---

## 五、代码结构详解

### 5.1 LingxiSignVerifier（核心）

```java
// ─── 静态常量：开关 ────────────────────────────────────────────
public static final boolean ENABLE_PLUGIN_WHITELIST_CHECK = true;
// ↑ 改这一个，Filter 和独立调用都自动读

// ─── 实例字段 ────────────────────────────────────────────────
private final String secret;               // 共享密钥，用于 HMAC
private final Set<String> allowedNonces;   // LingxiNonceWhitelist.ALLOWED
private final Set<String> allowedPlugins;  // LingxiPluginWhitelist.ALLOWED（null=跳过）
private final long toleranceMs;            // 时间戳容差

// ─── 3 种构造函数 ────────────────────────────────────────────
Verifier(secret, nonces)                        // 兼容旧调用：跳过 plugin 显式校验
Verifier(secret, nonces, plugins)               // 推荐：nonce + plugin 双白名单
Verifier(secret, nonces, plugins, toleranceMs) // 全参数

// ─── 2 种 verify 入口 ────────────────────────────────────────
verify(Map<String,String> headers)              // 通用 Map，适配任何框架
verify(timestamp, nonce, pluginHash, signature)  // 原始 4 个值

// ─── 5 步校验（在内部实现，两个 verify 入口都走这里） ───────
//   1. null 检查
//   2. 时间戳
//   3. nonce 白名单
//   4. plugin 白名单（if ENABLE_PLUGIN_WHITELIST_CHECK）
//   5. HMAC 重算对比

// ─── 3 个静态工具方法 ────────────────────────────────────────
static hmacSha256Hex(key, data)    // HMAC-SHA256 → 小写 hex
static sha256Hex(data)             // SHA-256 → 小写 hex
private static bytesToHex(bytes)   // byte[] → 小写 hex string
```

### 5.2 LingxiSignFilter（Servlet 集成）

```java
// ─── 持有一个 Verifier ────────────────────────────────────────
private LingxiSignVerifier verifier;

// ─── 3 个构造函数（全部自动读 ENABLE_PLUGIN_WHITELIST_CHECK） ──
Filter(secret)                  // 默认 5 分钟窗口
Filter(secret, toleranceMs)     // 自定义窗口
Filter()                        // 供 web.xml init-param 初始化

// ─── Filter lifecycle ─────────────────────────────────────────
init(FilterConfig)              // 从 init-param 读 secret，构造 Verifier
doFilter(request, response, chain) {
  // 1. uri.startsWith("/v1/...") 拦截，其他放行
  // 2. 提取 headers → Map
  // 3. verifier.verify(headers)
  // 4. Result.ok    → chain.doFilter()
  //    Result.fail  → 403 + {"error":"lingxi_sign_failed","reason":"..."}
}
destroy()                       // verifier = null

// ─── 辅助 ────────────────────────────────────────────────────
private static buildVerifier(secret)  // 读 ENABLE_PLUGIN_WHITELIST_CHECK → 自动注入 null 或 ALLOWED
```

### 5.3 LingxiNonceWhitelist / LingxiPluginWhitelist

纯常量类，没有方法：

```java
public final class LingxiNonceWhitelist {
    public static final Set<String> ALLOWED = Collections.unmodifiableSet(
        new HashSet<>(Arrays.asList(
            "269303e562a3310d...",  // kylin-x64        bin/opencode
            "0ed6aadc0bbbb4cf...",  // kylin-x64-baseline bin/opencode
            "af89962856429edc...",  // kylin-arm64      bin/opencode
            "641c57ef16c3de9a..."   // win10-x64        bin/opencode.exe
        ))
    );
}

public final class LingxiPluginWhitelist {
    public static final Set<String> ALLOWED = Collections.unmodifiableSet(
        new HashSet<>(Arrays.asList(
            "d201918365a2625fd...",  // lingxi-sign-auth.js（混淆版）
            "145d35d5ef7ebd11..."    // lingxi-sign-auth.plain.js（明文版）
        ))
    );
}
```

### 5.4 LingxiSignSmoke / LingxiE2E（测试）

```
LingxiSignSmoke.java   — 8 cases
  Case 1  合法请求（旧 verifier，无 plugin 白名单）  → PASS
  Case 2  合法请求（新 verifier，plugin 在白名单）    → PASS
  Case 3  非法 plugin hash → INVALID_PLUGIN           → REJECT
  Case 4  篡改签名 → INVALID_SIGNATURE                → REJECT
  Case 5  非法 nonce → INVALID_NONCE                  → REJECT
  Case 6  过期时间戳 → INVALID_TIMESTAMP              → REJECT
  Case 7  缺少 header → MISSING_HEADER                → REJECT
  Case 8  不传 plugin 白名单 → 跳过 plugin 校验       → PASS（兼容）

LingxiE2E.java   — 11 cases（真实 hash + 真实签名，Node 端生成）
  good_1~8  4 nonces × 2 plugins = 8 组合法请求      → PASS 全通过
  bad_1     非法 Nonce                                → INVALID_NONCE
  bad_2     非法 Plugin                               → INVALID_PLUGIN
  bad_3     篡改签名                                  → INVALID_SIGNATURE
```

### 5.5 快速调用模式

```java
// Spring Boot 最常见的用法
@Bean
public FilterRegistrationBean<LingxiSignFilter> lingxiSignFilter() {
    String secret = System.getenv("LINGXI_SIGN_SECRET");
    FilterRegistrationBean<LingxiSignFilter> reg = new FilterRegistrationBean<>();
    reg.setFilter(new LingxiSignFilter(secret));
    reg.addUrlPatterns("/v1/*");
    reg.setName("lingxiSignFilter");
    reg.setOrder(1);
    return reg;
}

// 不走 Filter，直接调用 Verifier（非 Servlet 框架）
LingxiSignVerifier verifier = new LingxiSignVerifier(
    secret,
    LingxiNonceWhitelist.ALLOWED,
    LingxiSignVerifier.ENABLE_PLUGIN_WHITELIST_CHECK 
        ? LingxiPluginWhitelist.ALLOWED 
        : null
);
LingxiSignVerifier.Result r = verifier.verify(headersMap);
if (!r.ok) {
    throw new RuntimeException("签名校验失败: " + r.reason.getMsg());
}
```

---

## 六、安全边界

### 6.1 这套方案防住了什么

| 攻击场景 | 结果 |
|---------|------|
| 随便编一个 opencode 就能请求 | ❌ 非白名单 Nonce → INVALID_NONCE |
| 替换成自己写的插件 | ❌ 非白名单 Plugin → INVALID_PLUGIN（且 HMAC 也对不上） |
| 改一下 timestamp 重放 | ❌ 时间戳越界 → INVALID_TIMESTAMP（±5 分钟窗口） |
| 改一下 X-Signature 的某一位 | ❌ HMAC 重算对不上 → INVALID_SIGNATURE |
| 网络截包然后重放 | ❌ 超过时间窗口 → INVALID_TIMESTAMP |
| 拿到合法请求后复制粘贴改一个字节 | ❌ HMAC 对不上 → INVALID_SIGNATURE |

### 6.2 这套方案没防住什么

| 攻击场景 | 现状 | 缓解 |
|---------|------|------|
| 攻击方同时拿到 secret + 官方插件副本 | ✅ 理论上能伪造 | 保护好 secret；plugin 白名单减少攻击面 |
| 攻击方**完全复刻**你的二进制 | ✅ 理论上能请求 | 服务端改成收费 API + 配额限制 |
| 合法用户账号被盗 → 恶意转发 | ✅ 防不住 | 正常的业务鉴权（账号/Key）负责 |
| HTTPS 被中间人解密（理论上） | ✅ 防不住 | HTTPS 负责传输安全 |

### 6.3 安全的核心公式

```
防伪造请求  =  opencode 二进制在白名单
           +  插件文件在白名单
           +  时间戳在窗口内
           +  HMAC-SHA256(secret, 三者拼接) 对得上
           +  攻击者拿不到 secret
```

任何一条不满足就拒绝。**secret 是最后的防线**，也是唯一的秘密。保护好它。
