package com.lingxi.sign;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * LingxiCode 签名校验 Servlet Filter（纯 Servlet API，OpenJDK 1.8+）。
 *
 * <p>可直接注册到任何 Servlet 容器（Spring Boot、Tomcat、Jetty 等），
 * 只拦截配置的 URL pattern（如 /v1/*），其余路径直接放行。
 *
 * <h3>Spring Boot 注册示例</h3>
 * <pre>
 * {@code @Configuration}
 * public class LingxiConfig {
 *     {@code @Bean}
 *     public FilterRegistrationBean{@code <LingxiSignFilter>} lingxiSignFilter() {
 *         FilterRegistrationBean{@code <LingxiSignFilter>} reg = new FilterRegistrationBean{@code <>}();
 *         reg.setFilter(new LingxiSignFilter("your-real-secret-key"));
 *         reg.addUrlPatterns("/v1/*");
 *         reg.setName("lingxiSignFilter");
 *         reg.setOrder(1);
 *         return reg;
 *     }
 * }
 * </pre>
 *
 * <h3>Tomcat web.xml 注册示例</h3>
 * <pre>
 * {@code
 * <filter>
 *     <filter-name>lingxiSignFilter</filter-name>
 *     <filter-class>com.lingxi.sign.LingxiSignFilter</filter-class>
 *     <init-param>
 *         <param-name>secret</param-name>
 *         <param-value>your-real-secret-key</param-value>
 *     </init-param>
 * </filter>
 * <filter-mapping>
 *     <filter-name>lingxiSignFilter</filter-name>
 *     <url-pattern>/v1/*</url-pattern>
 * </filter-mapping>
 * }
 * </pre>
 */
public class LingxiSignFilter implements Filter {

    private LingxiSignVerifier verifier;

    /**
     * 无参构造（直接用 Verifier.DEFAULT_SECRET 开箱即用）。
     *
     *   LingxiSignFilter filter = new LingxiSignFilter();
     *   FilterRegistrationBean<LingxiSignFilter> reg = new FilterRegistrationBean<>(filter);
     *
     * ⚠️ 部署前务必把 LingxiSignVerifier.DEFAULT_SECRET 改成你自己的密钥。
     */
    public LingxiSignFilter() {
        this(LingxiSignVerifier.DEFAULT_SECRET, 5 * 60 * 1000L);
    }

    /**
     * 构造函数（直接传入密钥）。
     * 是否启用插件白名单校验由 LingxiSignVerifier.ENABLE_PLUGIN_WHITELIST_CHECK 常量控制。
     */
    public LingxiSignFilter(String secret) {
        this(secret, 5 * 60 * 1000L);
    }

    /**
     * 构造函数（自定义时间戳容差，单位毫秒）。
     * 是否启用插件白名单校验由 LingxiSignVerifier.ENABLE_PLUGIN_WHITELIST_CHECK 常量控制。
     */
    public LingxiSignFilter(String secret, long toleranceMs) {
        this.verifier = buildVerifier(secret, toleranceMs);
    }

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        if (verifier == null) {
            // web.xml init-param 传了 secret → 用传入的；没传 → 用 DEFAULT_SECRET
            String secret = filterConfig.getInitParameter("secret");
            if (secret == null || secret.isEmpty()) {
                secret = LingxiSignVerifier.DEFAULT_SECRET;
            }
            verifier = buildVerifier(secret, 5 * 60 * 1000L);
        }
    }

    private static LingxiSignVerifier buildVerifier(String secret, long toleranceMs) {
        boolean enablePluginCheck = LingxiSignVerifier.ENABLE_PLUGIN_WHITELIST_CHECK;
        return new LingxiSignVerifier(
            secret,
            LingxiNonceWhitelist.ALLOWED,
            enablePluginCheck ? LingxiPluginWhitelist.ALLOWED : null,
            toleranceMs
        );
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest  req  = (HttpServletRequest)  request;
        HttpServletResponse resp = (HttpServletResponse) response;

        // 只拦截 LLM API 路径，其他路径直接放行
        String uri = req.getRequestURI();
        if (!interceptable(uri)) {
            chain.doFilter(req, resp);
            return;
        }

        // 提取 headers 到 Map
        Map<String, String> headers = new HashMap<String, String>();
        java.util.Enumeration<String> names = req.getHeaderNames();
        while (names.hasMoreElements()) {
            String n = names.nextElement();
            headers.put(n, req.getHeader(n));
        }

        LingxiSignVerifier.Result result = verifier.verify(headers);
        if (!result.ok) {
            resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
            resp.setContentType("application/json;charset=UTF-8");
            resp.getWriter().write(
                "{\"error\":\"lingxi_sign_failed\",\"reason\":\"" + result.reason.getMsg() + "\"}"
            );
            return;
        }

        // 校验通过，正常放行
        chain.doFilter(req, resp);
    }

    @Override
    public void destroy() {
        verifier = null;
    }

    /**
     * 判断 URI 是否属于需要拦截的 LLM API 路径。
     * 默认覆盖 OpenAI Compatible 协议的三个端点，可按需扩展。
     */
    private static boolean interceptable(String uri) {
        if (uri == null) return false;
        return uri.startsWith("/v1/chat/completions")
            || uri.startsWith("/v1/completions")
            || uri.startsWith("/v1/responses")
            || uri.startsWith("/v1/embeddings")
            || uri.startsWith("/v1/models");
    }
}
