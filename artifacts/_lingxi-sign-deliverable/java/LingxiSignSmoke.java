package com.lingxi.sign;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * LingxiSignVerifier 冒烟测试（纯 JDK，无需 JUnit）。
 *
 * <p>编译运行：
 * <pre>
 *   javac -d out java/*.java
 *   java -cp out com.lingxi.sign.LingxiSignSmoke
 * </pre>
 */
public class LingxiSignSmoke {

    private static final String SECRET  = "test-secret-key-12345";
    private static final String NONCE   = "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
    private static final String PLUGIN  = "cafebabecafebabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe";

    public static void main(String[] args) {
        Set<String> nonceWhitelist = new HashSet<String>(Arrays.asList(NONCE));
        Set<String> pluginWhitelist = new HashSet<String>(Arrays.asList(PLUGIN));

        // ── 不传 plugin 白名单的 verifier（兼容旧调用） ──
        LingxiSignVerifier vOld = new LingxiSignVerifier(SECRET, nonceWhitelist);
        // ── 启用 plugin 白名单的 verifier（推荐，双白名单校验） ──
        LingxiSignVerifier vNew = new LingxiSignVerifier(SECRET, nonceWhitelist, pluginWhitelist);

        int pass = 0, total = 0;

        // ── Case 1: 合法请求（旧 verifier，无 plugin 白名单） ──
        total++;
        String ts = Long.toString(System.currentTimeMillis());
        String signingString = ts + "." + NONCE + "." + PLUGIN;
        String hmac = LingxiSignVerifier.hmacSha256Hex(SECRET, signingString);
        String sig = ts + "." + hmac;
        LingxiSignVerifier.Result r = vOld.verify(ts, NONCE, PLUGIN, sig);
        boolean ok = r.ok;
        System.out.println("[CASE 1] 合法请求（旧 verifier，无 plugin 白名单）: " + (ok ? "PASS ✅" : "FAIL ❌"));
        if (ok) pass++;

        // ── Case 2: 合法请求（新 verifier，plugin 在白名单里） ──
        total++;
        r = vNew.verify(ts, NONCE, PLUGIN, sig);
        ok = r.ok;
        System.out.println("[CASE 2] 合法请求（新 verifier，plugin 在白名单）: " + (ok ? "PASS ✅" : "FAIL ❌"));
        if (ok) pass++;

        // ── Case 3: 非法 plugin hash → INVALID_PLUGIN ──
        total++;
        String badPlugin = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
        String sigWithBadPlugin = ts + "." + LingxiSignVerifier.hmacSha256Hex(SECRET, ts + "." + NONCE + "." + badPlugin);
        r = vNew.verify(ts, NONCE, badPlugin, sigWithBadPlugin);
        ok = !r.ok && r.reason == LingxiSignVerifier.Reason.INVALID_PLUGIN;
        System.out.println("[CASE 3] 非法 plugin hash → INVALID_PLUGIN: " + (ok ? "PASS ✅" : "FAIL ❌ — got " + r.reason));
        if (ok) pass++;

        // ── Case 4: 篡改签名 ──
        total++;
        r = vNew.verify(ts, NONCE, PLUGIN, ts + ".0000000000000000000000000000000000000000000000000000000000000000");
        ok = !r.ok && r.reason == LingxiSignVerifier.Reason.INVALID_SIGNATURE;
        System.out.println("[CASE 4] 篡改签名 → INVALID_SIGNATURE: " + (ok ? "PASS ✅" : "FAIL ❌ — got " + r.reason));
        if (ok) pass++;

        // ── Case 5: 非法 nonce ──
        total++;
        r = vNew.verify(ts, "0000000000000000000000000000000000000000000000000000000000000000", PLUGIN, sig);
        ok = !r.ok && r.reason == LingxiSignVerifier.Reason.INVALID_NONCE;
        System.out.println("[CASE 5] 非法 nonce → INVALID_NONCE: " + (ok ? "PASS ✅" : "FAIL ❌ — got " + r.reason));
        if (ok) pass++;

        // ── Case 6: 过期时间戳 ──
        total++;
        String oldTs = Long.toString(System.currentTimeMillis() - 10 * 60 * 1000L);
        String oldSig = oldTs + "." + LingxiSignVerifier.hmacSha256Hex(SECRET, oldTs + "." + NONCE + "." + PLUGIN);
        LingxiSignVerifier vTight = new LingxiSignVerifier(SECRET, nonceWhitelist, pluginWhitelist, 30_000L);
        r = vTight.verify(oldTs, NONCE, PLUGIN, oldSig);
        ok = !r.ok && r.reason == LingxiSignVerifier.Reason.INVALID_TIMESTAMP;
        System.out.println("[CASE 6] 过期时间戳 → INVALID_TIMESTAMP: " + (ok ? "PASS ✅" : "FAIL ❌ — got " + r.reason));
        if (ok) pass++;

        // ── Case 7: 缺少 header ──
        total++;
        r = vNew.verify(ts, NONCE, null, sig);
        ok = !r.ok && r.reason == LingxiSignVerifier.Reason.MISSING_HEADER;
        System.out.println("[CASE 7] 缺少 header → MISSING_HEADER: " + (ok ? "PASS ✅" : "FAIL ❌ — got " + r.reason));
        if (ok) pass++;

        // ── Case 8: 不传 plugin 白名单的 verifier 应该跳过 plugin 校验 ──
        total++;
        r = vOld.verify(ts, NONCE, badPlugin, sigWithBadPlugin);
        ok = r.ok;  // 旧 verifier 不校验 plugin，只要 HMAC 对就行
        System.out.println("[CASE 8] 不传 plugin 白名单 → 跳过 plugin 校验: " + (ok ? "PASS ✅" : "FAIL ❌"));
        if (ok) pass++;

        System.out.println();
        System.out.println("Result: " + pass + "/" + total + " passed");
        if (pass != total) {
            System.exit(1);
        }
    }
}
