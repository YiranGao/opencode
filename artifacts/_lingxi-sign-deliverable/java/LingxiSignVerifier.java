package com.lingxi.sign;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * LingxiCode 签名校验器（OpenJDK 1.8+，零外部依赖）
 *
 * <p>协议：客户端在每次模型请求时注入 4 个 HTTP header：
 * <pre>
 *   X-Timestamp    = 毫秒级 Unix 时间戳（如 1787556883366）
 *   X-Nonce        = opencode 二进制文件的 SHA256 hex
 *   X-Plugin-Hash  = lingxi-sign-auth 插件文件的 SHA256 hex
 *   X-Signature    = {@code "${timestamp}.${HMAC-SHA256(secret, signingString)}"}
 *                    signingString = {@code "${timestamp}.${X-Nonce}.${X-Plugin-Hash}"}
 * </pre>
 *
 * <p>服务端校验步骤：
 * <ol>
 *   <li>提取 4 个 header，缺失则拒绝</li>
 *   <li>校验 X-Timestamp 在允许窗口内（默认 ±5 分钟），防重放</li>
 *   <li>校验 X-Nonce 是否在官方发布的二进制 SHA256 白名单内</li>
 *   <li>用相同密钥重新计算 HMAC-SHA256，与 X-Signature 中的签名部分比对</li>
 * </ol>
 */
public final class LingxiSignVerifier {

    /** 校验失败原因 */
    public enum Reason {
        MISSING_HEADER("缺少签名 header（X-Timestamp / X-Nonce / X-Plugin-Hash / X-Signature 至少一个缺失）"),
        INVALID_TIMESTAMP("时间戳不在有效窗口内（防重放）"),
        INVALID_NONCE("X-Nonce 不在官方发布白名单内"),
        INVALID_PLUGIN("X-Plugin-Hash 不在官方发布插件白名单内"),
        INVALID_SIGNATURE("X-Signature 签名不匹配");

        private final String msg;
        Reason(String msg) { this.msg = msg; }
        public String getMsg() { return msg; }
    }

    /** 校验结果 */
    public static class Result {
        public final boolean ok;
        public final Reason reason;
        public Result(boolean ok, Reason reason) {
            this.ok = ok;
            this.reason = reason;
        }
        public static Result pass() { return new Result(true, null); }
        public static Result fail(Reason r) { return new Result(false, r); }
    }

    /** 默认时间戳容差（毫秒）：±5 分钟 */
    private static final long DEFAULT_TOLERANCE_MS = 5 * 60 * 1000L;

    /**
     * ═══════════════════════════════════════════════════════════════════════
     *  默认 HMAC 共享密钥 ⚠️⚠️⚠️
     *
     *   这个值必须和客户端插件（lingxi-sign-auth.js 里的 DEFAULT_SECRET）完全一致。
     *
     *   部署前**一定要改成你自己的随机字符串**，推荐：
     *     openssl rand -hex 32
     *   生成 64 字符 hex 密钥（32 字节），复制到下面这个常量，重新编译。
     *
     *   ⚠️ 本文件里写死密钥是为了后端开发开箱即用快速跑起来。
     *     生产环境建议改成从环境变量读取，例如：
     *     LingxiSignVerifier verifier = LingxiSignVerifier.createDefault();
     *     // 或：String secret = System.getenv("LINGXI_SIGN_SECRET");
     *         new LingxiSignVerifier(secret, ...);
     * ═══════════════════════════════════════════════════════════════════════
     */
    public static final String DEFAULT_SECRET = "lingxicode-signing-key-v1-please-replace-me";

    /**
     *  插件文件 SHA256 显式白名单校验开关
     *
     *   true  → 启用：X-Plugin-Hash 必须在 LingxiPluginWhitelist.ALLOWED 里
     *            （双白名单：Nonce + Plugin + HMAC 三重校验，推荐生产用）
     *
     *   false → 关闭：X-Plugin-Hash 不做显式检查
     *            （仅靠 HMAC 间接约束，插件文件哈希已在 signingString 里）
     *
     *   部署时根据需要改这个常量，重新编译上线即可。
     */
    public static final boolean ENABLE_PLUGIN_WHITELIST_CHECK = true;

    private final String secret;
    private final Set<String> allowedNonces;
    private final Set<String> allowedPlugins;  // null = 跳过插件显式校验
    private final long toleranceMs;

    /**
     * @param secret         与客户端插件一致的 HMAC 密钥
     * @param allowedNonces  官方发布的 opencode 二进制 SHA256 白名单
     * @param allowedPlugins 官方发布的插件文件 SHA256 白名单
     */
    public LingxiSignVerifier(String secret, Set<String> allowedNonces, Set<String> allowedPlugins) {
        this(secret, allowedNonces, allowedPlugins, DEFAULT_TOLERANCE_MS);
    }

    /** 兼容旧签名：不传插件白名单则跳过插件显式校验 */
    public LingxiSignVerifier(String secret, Set<String> allowedNonces) {
        this(secret, allowedNonces, null, DEFAULT_TOLERANCE_MS);
    }

    public LingxiSignVerifier(String secret, Set<String> allowedNonces, Set<String> allowedPlugins, long toleranceMs) {
        if (secret == null || secret.isEmpty()) {
            throw new IllegalArgumentException("secret 不能为空");
        }
        if (allowedNonces == null || allowedNonces.isEmpty()) {
            throw new IllegalArgumentException("allowedNonces 不能为空");
        }
        this.secret = secret;
        this.allowedNonces = allowedNonces;
        this.allowedPlugins = allowedPlugins;  // 可以为 null，表示跳过插件显式校验
        this.toleranceMs = toleranceMs;
    }

    /**
     * 开箱即用：用所有默认值构造一个 Verifier。
     *
     *   secret     = DEFAULT_SECRET （部署前一定要改成你的密钥！）
     *   nonces     = LingxiNonceWhitelist.ALLOWED
     *   plugins    = ENABLE_PLUGIN_WHITELIST_CHECK ? ALLOWED : null
     *   tolerance  = 5 分钟
     *
     * 最简单的用法：
     *   LingxiSignVerifier v = LingxiSignVerifier.createDefault();
     *   LingxiSignVerifier.Result r = v.verify(headersMap);
     */
    public static LingxiSignVerifier createDefault() {
        boolean enablePlugin = ENABLE_PLUGIN_WHITELIST_CHECK;
        return new LingxiSignVerifier(
            DEFAULT_SECRET,
            LingxiNonceWhitelist.ALLOWED,
            enablePlugin ? LingxiPluginWhitelist.ALLOWED : null,
            DEFAULT_TOLERANCE_MS
        );
    }

    /**
     * 从通用 header Map 校验。适配任何 Web 框架（Servlet、Spring WebFlux、Netty 等）。
     * <p>使用示例：
     * <pre>
     *   Map<String, String> headers = new HashMap<>();
     *   request.getHeaderNames().asIterator().forEachRemaining(n -> headers.put(n, request.getHeader(n)));
     *   LingxiSignVerifier.Result r = verifier.verify(headers);
     * </pre>
     */
    public Result verify(java.util.Map<String, String> headers) {
        if (headers == null) return Result.fail(Reason.MISSING_HEADER);
        return verify(
            headers.get("X-Timestamp"),
            headers.get("X-Nonce"),
            headers.get("X-Plugin-Hash"),
            headers.get("X-Signature")
        );
    }

    /**
     * 完整校验流程。
     */
    public Result verify(String timestamp, String nonce, String pluginHash, String signature) {
        // 1. 字段完整性
        if (timestamp == null || nonce == null || pluginHash == null || signature == null) {
            return Result.fail(Reason.MISSING_HEADER);
        }

        // 2. 时间戳窗口（防重放）
        long ts;
        try {
            ts = Long.parseLong(timestamp.trim());
        } catch (NumberFormatException e) {
            return Result.fail(Reason.INVALID_TIMESTAMP);
        }
        long now = System.currentTimeMillis();
        if (Math.abs(now - ts) > toleranceMs) {
            return Result.fail(Reason.INVALID_TIMESTAMP);
        }

        // 3. Nonce 白名单（opencode 二进制 SHA256）
        String nonceLower = nonce.toLowerCase().trim();
        if (!allowedNonces.contains(nonceLower)) {
            return Result.fail(Reason.INVALID_NONCE);
        }

        // 4. Plugin 白名单（插件文件 SHA256，跳过则 allowedPlugins 为 null）
        String pluginLower = pluginHash.toLowerCase().trim();
        if (allowedPlugins != null && !allowedPlugins.contains(pluginLower)) {
            return Result.fail(Reason.INVALID_PLUGIN);
        }

        // 5. 签名校验
        String[] parts = signature.split("\\.", 2);
        if (parts.length != 2 || !parts[0].equals(timestamp.trim())) {
            return Result.fail(Reason.INVALID_SIGNATURE);
        }
        String providedHmac = parts[1].toLowerCase().trim();

        String signingString = timestamp.trim() + "." + nonceLower + "." + pluginHash.toLowerCase().trim();
        String expectedHmac = hmacSha256Hex(secret, signingString);

        if (!expectedHmac.equals(providedHmac)) {
            return Result.fail(Reason.INVALID_SIGNATURE);
        }

        return Result.pass();
    }

    // ─── HMAC-SHA256 工具 ──────────────────────────────────────────

    /** HMAC-SHA256，返回小写 hex */
    static String hmacSha256Hex(String key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] bytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(bytes);
        } catch (Exception e) {
            throw new RuntimeException("HmacSHA256 不可用", e);
        }
    }

    /** SHA-256，返回小写 hex */
    static String sha256Hex(String data) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] bytes = md.digest(data.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(bytes);
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 不可用", e);
        }
    }

    private static String bytesToHex(byte[] bytes) {
        char[] hex = "0123456789abcdef".toCharArray();
        char[] out = new char[bytes.length * 2];
        for (int i = 0; i < bytes.length; i++) {
            int v = bytes[i] & 0xff;
            out[i * 2]     = hex[v >>> 4];
            out[i * 2 + 1] = hex[v & 0x0f];
        }
        return new String(out);
    }
}
