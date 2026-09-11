# LingxiCode 签名认证插件 — 部署与使用手册

> **版本**: v2.0 · **适配**: LingxiCode 1.18.18 · **JDK**: OpenJDK 1.8+ · **协议版本**: HMAC-SHA256 · **最后更新**: 2026-09-03

***

## 一、插件解决什么问题

opencode 是开源的，任何拿到代码的人都可以重新编译并分发。LingxiCode 签名认证插件让你的服务端**可以区分**请求到底来自**你官方发布的 LingxiCode 包**，还是来自第三方重新打包的 opencode。

### 核心机制

每次模型请求时，插件动态计算三个身份锚点 + HMAC 签名 → 注入 HTTP headers。服务端收到后反向校验，不通过就拒绝。

***

## 二、请求头协议（4 个 header）

每次模型请求自动追加：

| Header          | 格式                                                   | 说明                  |
| --------------- | ---------------------------------------------------- | ------------------- |
| `X-Timestamp`   | 毫秒级 Unix 时间戳字符串                                      | 防重放，每次请求不同          |
| `X-Nonce`       | opencode 二进制 SHA256 hex                              | **身份锚点 1**：你编出来的那个包 |
| `X-Plugin-Hash` | lingxi-sign-auth 插件 SHA256 hex                       | **身份锚点 2**：你发的那个插件  |
| `X-Signature`   | `${timestamp}.${HMAC-SHA256(secret, signingString)}` | **防篡改签名**           |

```
signingString = `${X-Timestamp}.${X-Nonce}.${X-Plugin-Hash}`
signatureHex  = lowercase-hex(HMAC-SHA256(共享密钥, signingString))
```

***

## 三、服务端校验流程（5 步）

```
收到请求
  │
  ├─ 1. 缺任何 header？          → MISSING_HEADER         → 403
  ├─ 2. 时间戳越界（默认±5min）？→ INVALID_TIMESTAMP      → 403（防重放）
  ├─ 3. X-Nonce 不在白名单？     → INVALID_NONCE          → 403（不是你发的包）
  ├─ 4. X-Plugin-Hash 不在白名单？→ INVALID_PLUGIN         → 403（不是你发的插件）
  ├─ 5. HMAC 重算对不上？        → INVALID_SIGNATURE      → 403（被篡改 / 密钥不对）
  └─ 全部通过 ✅
```

***

## 四、代码里的开关：是否启用插件白名单

### 默认启用（推荐生产用）

`LingxiSignVerifier.java` 第 74 行有一个**常量开关**：

```java
/**
 *  插件文件 SHA256 显式白名单校验开关
 *
 *   true  → 启用：X-Plugin-Hash 必须在 LingxiPluginWhitelist.ALLOWED 里
 *            （双白名单：Nonce + Plugin + HMAC 三重校验）
 *
 *   false → 关闭：X-Plugin-Hash 不做显式检查
 *            （仅靠 HMAC 间接约束，插件文件哈希已在 signingString 里）
 */
public static final boolean ENABLE_PLUGIN_WHITELIST_CHECK = true;  // ← 改这里
```

**改一行，重新编译上线即可。** Filter 和独立调用 Verifier 都会自动读这个常量，不需要改别的地方。

### 什么时候设 false

* **部署初期**：插件还在频繁迭代，每改一次就要同时发客户端和服务端的白名单——可以先关掉 plugin 显式校验，只靠 HMAC（密钥没泄露就够安全）

* **密钥确定不换了**：`pluginHash` 在 signingString 里，HMAC 本身就约束了它不能被改

### 设 true 的价值（推荐）

两层约束：

* **HMAC 间接约束**（始终生效）：`pluginHash` 已经在 signingString 里，被改掉 HMAC 重算对不上

* **显式白名单**（开关控制）：即使密钥泄露，攻击者也没法用**不在白名单里的插件文件**发请求

***

## 五、真实哈希表（本版发布，直接可用）

### 5.1 opencode 二进制 SHA256（X-Nonce 白名单）

填入 `LingxiNonceWhitelist.ALLOWED`：

| 变体                 | 二进制路径              | SHA256                                                             |
| ------------------ | ------------------ | ------------------------------------------------------------------ |
| kylin-x64          | `bin/opencode`     | `269303e562a3310d7b79397184da8bf99dd852cf7f65124c06f00c3dff6b200f` |
| kylin-x64-baseline | `bin/opencode`     | `0ed6aadc0bbbb4cf559760be5780708285b88049663b594f05eed87966056174` |
| kylin-arm64        | `bin/opencode`     | `af89962856429edcf5f47f0b3afa8c80d2b326f5eef9ff326cb59f3d3dc323c3` |
| win10-x64          | `bin/opencode.exe` | `641c57ef16c3de9a5ec7835fcfa726dc40cbcdf808fe8dd17ffca52c6ffe88db` |

### 5.2 插件文件 SHA256（X-Plugin-Hash 白名单）

填入 `LingxiPluginWhitelist.ALLOWED`：

| 插件文件                        | 说明          | SHA256                                                             |
| --------------------------- | ----------- | ------------------------------------------------------------------ |
| `lingxi-sign-auth.js`       | **混淆版，生产用** | `d201918365a2625fdc955cbd31b40e54852f8fd19f622644590da3df57962880` |
| `lingxi-sign-auth.plain.js` | 明文版，调试用     | `145d35d5ef7ebd11c83919dab56f5952444a42afee6e5342e99ad5c58763d7aa` |

> **每次发新版本**：对新二进制算 SHA256 追加进 Nonce 白名单，对新插件文件算 SHA256 追加进 Plugin 白名单，旧条目可以保留（向后兼容已发出的包）也可以删掉（强制升级）。

***

## 六、快速开始：给存量包打补丁（5 步）

### 步骤 1：把插件丢进用户包

```
目标: <LingxiCode根目录>/config/plugins/lingxi-sign-auth.js
```

同时可以放明文版（调试用）：`config/plugins/lingxi-sign-auth.plain.js`

### 步骤 2：改 opencode.json

```jsonc
{
  "enabled_providers": ["enterprise-llm"],
  "model": "enterprise-llm/your-model-name",

  // ↓ 新增这段
  "plugin": [
    ["lingxi-sign-auth", { "secret": "your-real-secret-key-here" }]
  ]
}
```

**调试时**：把 `"lingxi-sign-auth"` 改成 `"lingxi-sign-auth.plain"`，就能在终端看到插件日志。

### 步骤 3：重新打包分发

```bash
tar -czf lingxicode-offline.tar.gz <root>/
# 或 Windows PowerShell
Compress-Archive -Path <root> -DestinationPath lingxicode-offline.zip
```

### 步骤 4：服务端部署 Java 校验代码

把 5 个 Java 文件放进 LLM 服务项目（见第七节）。

### 步骤 5：验证

```bash
# 在用户机器上启动 lingxicode
OPENCODE_PRINT_LOGS=1 OPENCODE_LOG_LEVEL=DEBUG ./lingxicode-harness.sh

# 触发一次模型请求，观察：
#   终端出现 "[lingxi-sign-auth]" 开头的日志 → 插件工作中
#   服务端日志 → 没有 "lingxi_sign_failed" 报错 → 校验通过
```

***

## 七、服务端 Java 部署

### 7.1 5 个文件清单（纯 JDK，零外部依赖）

| 文件                           | 作用                                                      |
| ---------------------------- | ------------------------------------------------------- |
| `LingxiSignVerifier.java`    | 核心 5 步校验（含开关 `ENABLE_PLUGIN_WHITELIST_CHECK`）           |
| `LingxiNonceWhitelist.java`  | 4 个真实二进制 SHA256 白名单                                     |
| `LingxiPluginWhitelist.java` | 2 个真实插件 SHA256 白名单                                      |
| `LingxiSignFilter.java`      | Servlet Filter（Spring Boot / Tomcat 集成用，需要 Servlet API） |
| `LingxiSignSmoke.java`       | 冒烟测试（8 cases）                                           |
| `LingxiE2E.java`             | Node 端联调测试（11 cases，真实 hash + 真实签名）                     |

### 7.2 Spring Boot 注册 Filter

```java
@Configuration
public class LingxiSignConfig {
    @Bean
    public FilterRegistrationBean<LingxiSignFilter> lingxiSignFilter() {
        FilterRegistrationBean<LingxiSignFilter> reg = new FilterRegistrationBean<>();
        String secret = System.getenv("LINGXI_SIGN_SECRET");
        reg.setFilter(new LingxiSignFilter(secret));
        reg.addUrlPatterns("/v1/*");
        reg.setName("lingxiSignFilter");
        reg.setOrder(1);
        return reg;
    }
}
```

### 7.3 直接调用 Verifier（不走 Filter）

```java
Map<String, String> headers = new HashMap<>();
request.getHeaderNames().asIterator()
    .forEachRemaining(n -> headers.put(n, request.getHeader(n)));

LingxiSignVerifier verifier = new LingxiSignVerifier(
    secret,
    LingxiNonceWhitelist.ALLOWED,
    LingxiSignVerifier.ENABLE_PLUGIN_WHITELIST_CHECK ? LingxiPluginWhitelist.ALLOWED : null
);
LingxiSignVerifier.Result r = verifier.verify(headers);
if (!r.ok) throw new RuntimeException("签名校验失败: " + r.reason.getMsg());
```

### 7.4 编译 & 运行测试

```bash
cd artifacts/_lingxi-sign-deliverable

# 冒烟测试（8 cases）
javac -d out java/LingxiSignVerifier.java java/LingxiNonceWhitelist.java \
             java/LingxiPluginWhitelist.java java/LingxiSignSmoke.java
java -cp out com.lingxi.sign.LingxiSignSmoke
# → Result: 8/8 passed

# Node 端到端联调（11 cases，真实 hash）
javac -d out java/LingxiSignVerifier.java java/LingxiNonceWhitelist.java \
             java/LingxiPluginWhitelist.java java/LingxiE2E.java
java -cp out com.lingxi.sign.LingxiE2E
# → Result: 11/11 passed
```

### 7.5 Filter 编译

`LingxiSignFilter.java` 依赖 `javax.servlet`（Tomcat / Spring Boot 自带）。本地直接 `javac` 会报找不到 servlet，放进项目里用 `mvn compile` 或 `gradle build` 即可。

***

## 八、插件日志

### 8.1 什么时候会打日志

| 版本                              | 日志                                        | 适用场景   |
| ------------------------------- | ----------------------------------------- | ------ |
| 混淆版 `lingxi-sign-auth.js`       | **无**                                     | 生产用，静默 |
| 明文版 `lingxi-sign-auth.plain.js` | `console.error("[lingxi-sign-auth] ...")` | 调试用    |

### 8.2 开启日志

```bash
# Linux / Kylin / macOS（终端实时看）
OPENCODE_PRINT_LOGS=1 OPENCODE_LOG_LEVEL=DEBUG ./lingxicode-harness.sh

# Windows PowerShell
$env:OPENCODE_PRINT_LOGS="1"
$env:OPENCODE_LOG_LEVEL="DEBUG"
.\lingxicode-harness.bat

# 或者看日志文件
tail -f ~/.opencode/opencode.log | grep -i "lingxi"
```

### 8.3 日志示例

```
[lingxi-sign-auth] ▶ 插件启动
[lingxi-sign-auth]   platform=darwin arch=arm64
[lingxi-sign-auth]   binHash=269303e562a3310d7b79397184da8bf99dd852cf7f65124c06f00c3dff6b200f
[lingxi-sign-auth] ✓ chat.headers → 已注入签名
[lingxi-sign-auth]     signingString=1787556883366.269303e562...9f.d201918365a2...80
[lingxi-sign-auth]     signature=1787556883366.0d4fae33aae...6ff0
```

### 8.4 临时调试技巧

不想改 opencode.json 里的插件名？简单：

```bash
cd config/plugins
mv lingxi-sign-auth.js lingxi-sign-auth.js.bak    # 混淆版先收起来
# 现在明文版的文件名就是 lingxi-sign-auth.js 了
```

改回来同理：`mv lingxi-sign-auth.js lingxi-sign-auth.plain.js && mv lingxi-sign-auth.js.bak lingxi-sign-auth.js`

***

## 九、密钥管理

### 生成密钥

```bash
# 64 字符 hex（32 字节），推荐
openssl rand -hex 32
# 或者
pwgen 64 1
```

### 配置位置

| 位置                                                             | 安全性          | 推荐              |
| -------------------------------------------------------------- | ------------ | --------------- |
| opencode.json 配置里 `"secret": "xxx"`                            | 🟡 用户能看到     | 调试可以，生产不推荐      |
| 插件源码里的 `DEFAULT_SECRET`                                        | 🟡 插件是 JS 可读 | 同上，XOR 编码只是延缓逆向 |
| 环境变量 `opencode.json` 里写 `"secret": "{env:LINGXI_SIGN_SECRET}"` | 🟢           | **生产推荐**        |

### 密钥轮换

密钥泄露后：

1. 生成新密钥
2. 打包新插件（改 `DEFAULT_SECRET`）
3. 服务端临时同时接受新旧两个密钥（Verifier 里 `List<String>` 依次试）
4. 所有用户升级完后移除旧密钥

***

## 十、安全说明

| 关注点       | 现状                | 风险   | 缓解                         |
| --------- | ----------------- | ---- | -------------------------- |
| **密钥泄露**  | 插件是 JS，XOR 能被还原   | 🟡 中 | HMAC 间接约束 + Plugin 白名单显式约束 |
| **重放攻击**  | ±5 分钟窗口           | 🟢 低 | 可改小到 60 秒                  |
| **二进制替换** | Nonce 白名单         | 🟢 低 | 非白名单的一律拒绝                  |
| **插件替换**  | Plugin 白名单 + HMAC | 🟢 低 | 双重约束                       |
| **密钥硬编码** | opencode.json 可读  | 🟡 中 | 用 `{env:XXX}` 环境变量         |

**没有银弹**。这套方案把"随便编一个就能用"变成了"必须拿到你发的原始二进制 + 你发的插件 + 密钥"才能伪造请求。密钥是最后的防线，保护好密钥。

***

## 十一、FAQ

### Q: 已经发布出去的包怎么补这个功能？

A: 这正是这份手册的场景。步骤 1 把插件文件塞进用户的 `config/plugins/`，步骤 2 改 `opencode.json` 加 `"plugin"` 字段，用户下次启动 opencode 就生效了。

### Q: 插件文件放对位置了但 opencode.json 没改可以吗？

A: 不行。插件加载器只认 opencode.json 里 `plugin` 数组声明的插件。**必须改 opencode.json**。

### Q: 同时启用 V1 和 V2 可以吗？

A: 没必要，只启 V1。如果不小心都启了，V1 先注入，V2 检测到已有 X-Nonce 会跳过（V2 代码里有保护）。

### Q: 服务端怎么判断插件有没有启用？

A: 不用判断。插件没启用 → 请求里没有 4 个签名 header → 服务端返回 403 `MISSING_HEADER` → 这就是你要的效果。

### Q: 能不能只校验 X-Nonce，不校验 X-Plugin-Hash？

A: 可以，把 `ENABLE_PLUGIN_WHITELIST_CHECK` 改成 `false`。或者不，因为 pluginHash 已经在 signingString 里，HMAC 重算失败也能拦。

### Q: Kylin V10 和 Windows 10 二进制哈希不一样？

A: 正常的，两个平台二进制不同，哈希自然不同。两个都加进白名单就行。

### Q: 默认密钥 `lingxicode-signing-key-v1-please-replace-me` 要不要改？

A: **必须改**。发布前一定要换成随机密钥，并同步更新服务端。

### Q: 4 个 artifacts 变体的插件哈希都一样吗？

A: 是的，插件文件直接复制进每个变体的 `config/plugins/`，所以 SHA256 完全一致。

***

## 十二、命令速查

```bash
# 算二进制 SHA256（Linux / Kylin）
sha256sum bin/opencode

# 算二进制 SHA256（Windows）
certutil -hashfile bin\opencode.exe SHA256

# 算插件 SHA256
shasum -a 256 config/plugins/lingxi-sign-auth.js

# 端到端验证完整流程
cd artifacts/_lingxi-sign-deliverable
javac -d out java/LingxiSignVerifier.java java/LingxiNonceWhitelist.java \
             java/LingxiPluginWhitelist.java java/LingxiE2E.java
java -cp out com.lingxi.sign.LingxiE2E
# 应该看到 Result: 11/11 passed
```

***

## 附录：文件清单

### 客户端（随 LingxiCode 包分发）

| 文件                                         | 说明                                                      |
| ------------------------------------------ | ------------------------------------------------------- |
| `config/plugins/lingxi-sign-auth.js`       | **混淆版，生产用**（无日志）                                        |
| `config/plugins/lingxi-sign-auth.plain.js` | 明文版，调试用（带日志）                                            |
| `config/opencode.json`                     | 加 `"plugin": [["lingxi-sign-auth", {"secret": "xxx"}]]` |

### 服务端（Java / OpenJDK 1.8+）

| 文件                           | 说明                                            |
| ---------------------------- | --------------------------------------------- |
| `LingxiSignVerifier.java`    | 核心 5 步校验，含 `ENABLE_PLUGIN_WHITELIST_CHECK` 开关 |
| `LingxiNonceWhitelist.java`  | 4 个真实二进制 SHA256 ✅ 已填                          |
| `LingxiPluginWhitelist.java` | 2 个真实插件 SHA256 ✅ 已填                           |
| `LingxiSignFilter.java`      | Servlet Filter（Spring Boot / Tomcat 集成）       |
| `LingxiSignSmoke.java`       | 冒烟测试（8/8）                                     |
| `LingxiE2E.java`             | Node 端到端联调（11/11）                             |

