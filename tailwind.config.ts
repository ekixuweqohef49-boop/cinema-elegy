import type { Config } from "tailwindcss";

/**
 * Cinema Elegy — 设计令牌源
 * 所有颜色/字号/节奏在此集中定义，组件内只允许引用语义化 token。
 */
const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1.25rem", lg: "2.5rem", "2xl": "4rem" },
      screens: { "2xl": "1600px" },
    },
    extend: {
      colors: {
        // 基底：纯黑 → 深灰的三级阶梯
        ink: {
          DEFAULT: "#0a0a0a", // 主背景
          900: "#0a0a0a",
          800: "#0e0e0e",
          700: "#121212", // surface
          600: "#171717", // surface-raised
          500: "#1f1f1f",
          400: "#2a2a2a",
        },
        bone: {
          DEFAULT: "#ffffff",
          muted: "#a1a1aa", // 冷灰辅色
          faint: "#6b6b73",
        },
        crimson: {
          DEFAULT: "#991b1b", // 复古红（关键高亮）
          bright: "#c1272d",
          deep: "#6d1414",
        },
        gilt: "#b9a06a", // 冷金（致敬 / 奖项标记）
        line: {
          DEFAULT: "rgba(255,255,255,0.08)",
          strong: "rgba(255,255,255,0.16)",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "sans-serif",
        ],
        // 杂志标题：衬线（含中文字重宋体系，保证中文不塌）
        display: [
          "Georgia",
          "'Times New Roman'",
          "Songti SC",
          "SimSun",
          "serif",
        ],
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.08em" }],
        //  Editorial 大标题（fluid）
        "display-xl": ["clamp(2.75rem, 7vw, 6.5rem)", { lineHeight: "0.92", letterSpacing: "-0.03em" }],
        "display-lg": ["clamp(2rem, 4.6vw, 3.75rem)", { lineHeight: "0.98", letterSpacing: "-0.02em" }],
        "display-md": ["clamp(1.5rem, 2.6vw, 2.25rem)", { lineHeight: "1.1", letterSpacing: "-0.01em" }],
      },
      letterSpacing: {
        editorial: "0.18em", // 全大写小标
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
      maxWidth: {
        editorial: "78ch",
      },
      borderRadius: {
        xs: "2px",
      },
      aspectRatio: {
        poster: "2 / 3",
        still: "16 / 9",
      },
      backgroundImage: {
        "grain-fade": "linear-gradient(to bottom, rgba(10,10,10,0) 0%, rgba(10,10,10,0.55) 60%, #0a0a0a 100%)",
        "poster-sheen": "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)",
      },
      transitionTimingFunction: {
        film: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.6s ease-out both",
        shimmer: "shimmer 1.6s infinite",
        "scan-line": "scan-line 6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
