package com.lingxi.sign;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

/**
 * LingxiCode 官方发布白名单（opencode 二进制文件 SHA256）。
 *
 * <p>每当你们发布新版本，对 bin/opencode（或 bin/opencode.exe）本身计算 SHA256，
 * 追加到 ALLOWED 集合即可。打包脚本里的 release/SHA256SUMS 记录的是 tar.gz 的哈希，
 * 不要混为一谈。
 *
 * <p>命令行计算方式：
 * <pre>
 *   Linux / Kylin:  sha256sum bin/opencode
 *   Windows:        certutil -hashfile bin\opencode.exe SHA256
 * </pre>
 */
public final class LingxiNonceWhitelist {

    private LingxiNonceWhitelist() {}

    /**
     * 官方发布的 opencode 二进制 SHA256 白名单。
     *
     * 示例占位（请替换为你们真实发布的哈希值）：
     * <pre>
     *   kylin-x64:      sha256sum artifacts/kylin-x64/attached/bin/opencode
     *   kylin-arm64:    sha256sum artifacts/kylin-arm64/attached/bin/opencode
     *   kylin-x64-base: sha256sum artifacts/kylin-x64-baseline/attached/bin/opencode
     *   win10-x64:      certutil -hashfile artifacts\win10-x64\attached\bin\opencode.exe SHA256
     * </pre>
     */
    public static final Set<String> ALLOWED = Collections.unmodifiableSet(new HashSet<String>(Arrays.asList(
        // ── LingxiCode 1.18.18 官方发布真实二进制 SHA256 ──
        // 来源: tar.gz/zip 解压后对 bin/opencode（或 bin/opencode.exe）本身计算
        "269303e562a3310d7b79397184da8bf99dd852cf7f65124c06f00c3dff6b200f",  // kylin-x64         bin/opencode
        "0ed6aadc0bbbb4cf559760be5780708285b88049663b594f05eed87966056174",  // kylin-x64-baseline bin/opencode
        "af89962856429edcf5f47f0b3afa8c80d2b326f5eef9ff326cb59f3d3dc323c3",  // kylin-arm64       bin/opencode
        "641c57ef16c3de9a5ec7835fcfa726dc40cbcdf808fe8dd17ffca52c6ffe88db",  // win10-x64         bin/opencode.exe
        "5ea16552791e8c450e1ef4f74b3e1ba33da027f8af02919379ecb6d84b22eec3",  // macos-arm64       bin/opencode（M 芯片）
        "1250132b8013aa58f577adea62a1d5a4e69a57f2cac680122292418d62873eb5"   // macos-x64         bin/opencode（Intel）
        // ── 新版本发布时，对新二进制算 SHA256 追加到此集合即可，旧版本哈希可保留（向后兼容）或删除（强制升级）
    )));

    /**
     * 判断某个 nonce 是否在白名单中。
     */
    public static boolean contains(String nonce) {
        if (nonce == null) return false;
        return ALLOWED.contains(nonce.toLowerCase().trim());
    }
}
