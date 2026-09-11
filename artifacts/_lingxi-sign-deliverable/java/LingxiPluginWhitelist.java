package com.lingxi.sign;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

/**
 * LingxiCode 官方发布插件文件白名单（插件文件 SHA256）。
 *
 * <p>与 LingxiNonceWhitelist（opencode 二进制哈希）成对使用，
 * 用于显式校验请求中的 X-Plugin-Hash 是否来自官方发布的插件。
 *
 * <p>为什么需要显式白名单？
 * <ul>
 *   <li>X-Plugin-Hash 已经在 HMAC signingString 里了，但那是"间接约束"——
 *       HMAC 正确就说明 pluginHash 没被篡改过。</li>
 *   <li>显式白名单是"独立约束"——即使密钥泄露，攻击者也没法用
 *       不在白名单里的插件文件发请求（他得同时拿到你官方插件文件的精确副本）。</li>
 * </ul>
 *
 * <p>每当你更新了插件代码，对新插件文件算 SHA256 追加到 ALLOWED 集合即可。
 * 命令行计算方式：
 * <pre>
 *   shasum -a 256 config/plugins/lingxi-sign-auth.js       (macOS / Linux)
 *   certutil -hashfile config\plugins\lingxi-sign-auth.js SHA256  (Windows)
 * </pre>
 */
public final class LingxiPluginWhitelist {

    private LingxiPluginWhitelist() {}

    /**
     * 官方发布的 lingxi-sign-auth 插件文件 SHA256 白名单。
     * 生产版（混淆）和调试版（明文）各一个条目，后续更新追加即可。
     */
    public static final Set<String> ALLOWED = Collections.unmodifiableSet(new HashSet<String>(Arrays.asList(
        // ── LingxiCode 1.18.18 官方发布插件 SHA256 ──
        "d201918365a2625fdc955cbd31b40e54852f8fd19f622644590da3df57962880",  // 混淆版 lingxi-sign-auth.js      （生产用）
        "145d35d5ef7ebd11c83919dab56f5952444a42afee6e5342e99ad5c58763d7aa"   // 明文版 lingxi-sign-auth.plain.js（调试用）
        // ── 插件代码更新后，对新文件算 SHA256 追加到此集合即可 ──
    )));

    public static boolean contains(String pluginHash) {
        if (pluginHash == null) return false;
        return ALLOWED.contains(pluginHash.toLowerCase().trim());
    }
}
