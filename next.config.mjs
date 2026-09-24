/**
 * 开发与生产构建使用不同的产物目录：
 * 两者共用 `.next` 时，一次 `npm run build` 会清掉 dev 正在引用的 CSS/JS，
 * 表现为页面样式全部丢失（layout.css 404）。
 */
const isDev = process.env.NODE_ENV === "development";

/**
 * Cloudflare Pages 构建时会自动注入 CF_PAGES=1（本地可用 `CF_PAGES=1 npm run build` 复现）。
 * 该模式下走纯静态导出：产物落到 out/，由 Cloudflare 边缘直接托管，不跑服务端运行时。
 * 数据更新不靠运行时抓取，而靠 GitHub Actions 抓取后 commit → 触发 Pages 重新构建。
 */
const isStaticExport = Boolean(process.env.CF_PAGES);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: isDev ? ".next-dev" : ".next",
  eslint: { ignoreDuringBuilds: true },
  ...(isStaticExport ? { output: "export" } : {}),
  images: {
    // 静态导出没有服务端图片优化器，必须关掉（站内位图仅用于版式，无需 next/image 优化管线）
    unoptimized: isStaticExport,
    // 远程图源白名单（海报库接入的资源库）
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "assets.fanart.tv" },
      { protocol: "https", hostname: "www.impawards.com" },
      { protocol: "https", hostname: "a.ltrbxd.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
