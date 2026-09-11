package com.lingxi.sign;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * Node → Java 端到端联调测试。
 * 用 Node 端生成的真实 hash + 真实 HMAC 签名，验证 Java Verifier 能否正确校验。
 */
public class LingxiE2E {

    static final String SECRET = "lingxicode-signing-key-v1-please-replace-me";
    static final long TOLERANCE = 30L * 24 * 60 * 60 * 1000L;

    public static void main(String[] args) {
        System.out.println("═══════════════════════════════════════════════════════════════");
        System.out.println("  Node → Java 端到端联调（真实 hash + 真实签名）");
        System.out.println("  ENABLE_PLUGIN_WHITELIST_CHECK = " + LingxiSignVerifier.ENABLE_PLUGIN_WHITELIST_CHECK);
        System.out.println("═══════════════════════════════════════════════════════════════");
        System.out.println();

        LingxiSignVerifier v = new LingxiSignVerifier(SECRET, LingxiNonceWhitelist.ALLOWED, LingxiPluginWhitelist.ALLOWED, TOLERANCE);

        // 8 组应该通过
        String[][] goodCases = {
          {"1787556883366","269303e562a3310d7b79397184da8bf99dd852cf7f65124c06f00c3dff6b200f","d201918365a2625fdc955cbd31b40e54852f8fd19f622644590da3df57962880","1787556883366.0d4fae33aae3a57e6e1bc6b20a4b27fe334b43b2e08828bb82a0f236aeb96ff0"},
          {"1787556883366","269303e562a3310d7b79397184da8bf99dd852cf7f65124c06f00c3dff6b200f","b6f636801dc13b7b7f0bd25af5dec507b890ce64d8819d3a8b2fe3269e542834","1787556883366.2bbc0593c5f60961b967c8674ff782d8bb4c8e1312a2a6ffc691d0a93cf2c09b"},
          {"1787556883366","0ed6aadc0bbbb4cf559760be5780708285b88049663b594f05eed87966056174","d201918365a2625fdc955cbd31b40e54852f8fd19f622644590da3df57962880","1787556883366.a2ceebc27ab52159c7c85259015631272843db7f325a578b4dc0f58a1a65ead9"},
          {"1787556883366","0ed6aadc0bbbb4cf559760be5780708285b88049663b594f05eed87966056174","b6f636801dc13b7b7f0bd25af5dec507b890ce64d8819d3a8b2fe3269e542834","1787556883366.83a78f409b5e297c2302ae879693463f9de2e5ffc6c06e031cb1d8bc9c9251a3"},
          {"1787556883366","af89962856429edcf5f47f0b3afa8c80d2b326f5eef9ff326cb59f3d3dc323c3","d201918365a2625fdc955cbd31b40e54852f8fd19f622644590da3df57962880","1787556883366.d8590cf2f0e53212219f9b2694fbb465df95bde38cee1fb487565b0b8ab8af65"},
          {"1787556883366","af89962856429edcf5f47f0b3afa8c80d2b326f5eef9ff326cb59f3d3dc323c3","b6f636801dc13b7b7f0bd25af5dec507b890ce64d8819d3a8b2fe3269e542834","1787556883366.62cd5eec85bd1cbbc44eec42a1074ebe52894f59722fe905f7915c675529ff3e"},
          {"1787556883366","641c57ef16c3de9a5ec7835fcfa726dc40cbcdf808fe8dd17ffca52c6ffe88db","d201918365a2625fdc955cbd31b40e54852f8fd19f622644590da3df57962880","1787556883366.bce4bc750678b11e35a87b2200c7e7bd45a88c915a8cd14c7f9feb9d50294c3c"},
          {"1787556883366","641c57ef16c3de9a5ec7835fcfa726dc40cbcdf808fe8dd17ffca52c6ffe88db","b6f636801dc13b7b7f0bd25af5dec507b890ce64d8819d3a8b2fe3269e542834","1787556883366.9ba2b11627b2507c00c4efbbfaf0a83971fe0b4614afa051375f2d72dd3c7279"},
        };

        // 3 组应该拒绝
        String[][] badCases = {
          {"非法 Nonce", "1787556883366","0000000000000000000000000000000000000000000000000000000000000000","d201918365a2625fdc955cbd31b40e54852f8fd19f622644590da3df57962880","1787556883366.f7fc0f81fa90acc98ebf9fa87b069faee0216fe2310541612efffb448d814499"},
          {"非法 Plugin","1787556883366","269303e562a3310d7b79397184da8bf99dd852cf7f65124c06f00c3dff6b200f","ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff","1787556883366.ec6d2f5d35779dbaf375ce5f87931a02513eeede1834b92b6b69dae7eda7c971"},
          {"篡改签名",   "1787556883366","269303e562a3310d7b79397184da8bf99dd852cf7f65124c06f00c3dff6b200f","d201918365a2625fdc955cbd31b40e54852f8fd19f622644590da3df57962880","1787556883366.0000000000000000000000000000000000000000000000000000000000000000"},
        };

        int pass = 0, total = 0;

        System.out.println("── 8 组应该通过（Node 真实签名 + 真实哈希）──");
        for (int i = 0; i < goodCases.length; i++) {
            total++;
            String[] c = goodCases[i];
            LingxiSignVerifier.Result r = v.verify(c[0], c[1], c[2], c[3]);
            if (r.ok) { pass++; System.out.println("  PASS ✅ good_" + (i+1)); }
            else     {         System.out.println("  FAIL ❌ good_" + (i+1) + " — " + r.reason.getMsg()); }
        }

        System.out.println();
        System.out.println("── 3 组应该被拒绝 ──");
        for (int i = 0; i < badCases.length; i++) {
            total++;
            String[] c = badCases[i];
            LingxiSignVerifier.Result r = v.verify(c[1], c[2], c[3], c[4]);
            if (!r.ok) { pass++; System.out.println("  PASS ✅ bad_" + (i+1) + " (" + c[0] + ") → " + r.reason); }
            else       {         System.out.println("  FAIL ❌ bad_" + (i+1) + " (" + c[0] + ") 居然通过了!"); }
        }

        System.out.println();
        System.out.println("Result: " + pass + "/" + total + " passed");
        if (pass != total) System.exit(1);
    }
}
