# 部署到 Cloudflare Pages 并保持自动更新

## 线性速查（照着从上往下做）

**① 建空仓库** → https://github.com/new
> 仓库名填 `cinema-elegy`；**不要**勾 Add README / .gitignore / license —— 要一个纯空仓库。

↓

**② 取仓库地址** → 建好后页面会显示 `https://github.com/<你的账号>/cinema-elegy.git`

↓

**③ 推送**（本地仓库已初始化好，无需再 add / commit）

```
cd /d D:\WorkBuddy\2026-09-22-21-41-22\cinema-elegy
git remote add origin https://github.com/<你的账号>/cinema-elegy.git
git push -u origin main
```

> 需要认证：GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens，权限勾 `Contents: Read and write`，生成的 token 当密码填。

↓

**④ 建 Pages 项目** → https://dash.cloudflare.com/ → Workers & Pages → Create → Pages → Connect to Git → 授权后选 `cinema-elegy`

> 三个配置项：Framework preset = `Next.js (Static HTML Export)`；Build command = `npm run build`；Build output directory = `out`。Node 版本留空（自动读 `.nvmrc` = 20）。

↓

**⑤ 首次构建**（约 2 分钟）→ 站点地址 `https://cinema-elegy.pages.dev`（确切域名以 Pages 项目页显示为准）

↓

**⑥（可选）配 TMDB 密钥** → https://github.com/<你的账号>/cinema-elegy/settings/secrets/actions → New repository secret → 名称 `TMDB_API_KEY`

> 不配也能跑，只是 TMDb 那一列空着。

↓

**⑦ 手动验证一次抓取** → https://github.com/<你的账号>/cinema-elegy/actions → 左侧「每日片单抓取」→ Run workflow

↓

**⑧ 完成** —— 此后每天 08:30 / 20:30 自动抓取 → 自动提交数据 → Cloudflare 自动重建，无需人工介入。

**地址速查**
建仓库 https://github.com/new ｜ Pages 控制台 https://dash.cloudflare.com/ ｜ 站点 https://cinema-elegy.pages.dev ｜ Actions 页 https://github.com/<你的账号>/cinema-elegy/actions ｜ 密钥页 https://github.com/<你的账号>/cinema-elegy/settings/secrets/actions ｜ Token 页 https://github.com/settings/tokens?type=beta

---

## 结论

可以自动更新，但**更新机制必须换个位置**：抓取由 GitHub Actions 承担，Cloudflare 只负责托管静态页面。
原因是三条硬性约束，不是配置问题：

| 环节 | 在 Cloudflare 上为什么不行 |
| --- | --- |
| 猫眼实时票房抓取 | 需要真实 Chromium 渲染 SPA + 页面内 canvas 取字形。Workers 无进程、无文件系统、无 canvas |
| 写 `data/*.json` | Workers 运行时是只读的，没有可写磁盘（要写只能用 KV / D1 / R2） |
| 「超过 12 小时自动补跑」 | 依赖 `spawn` 子进程（`src/lib/refresh.ts`），Workers 无法创建子进程 |

所以：**抓取留在 CI，页面走纯静态导出**。这条链路不需要 KV、不需要付费服务、不需要改数据层。

```
GitHub Actions（每天 08:30 / 20:30）
        │  抓 TMDb + 猫眼 + 豆瓣，合并
        ▼
data/daily_movies.json  ──commit──▶  GitHub 仓库
                                        │ push 触发
                                        ▼
                              Cloudflare Pages 构建
                              （CF_PAGES=1 → output: export）
                                        │
                                        ▼
                                   out/ 静态产物 → 边缘分发
```

数据新鲜度的保证：`next build` 时把 JSON 读进 HTML，所以**部署即数据**。没抓到新数据就不 commit，Pages 不重建，线上仍是上一次的完整数据——不会出现空页。

---

## 一、部署步骤

1. **建仓库**：把 `cinema-elegy/` 目录**作为仓库根**（不要把上级目录一起传，否则 Cloudflare 还要额外配 root directory）。
   ```bash
   cd cinema-elegy
   git init && git add -A
   git commit -m "init: cinema elegy"
   git remote add origin git@github.com:<你的账号>/<仓库名>.git
   git push -u origin main
   ```

2. **Cloudflare Pages**：Dashboard → Workers & Pages → Create → Pages → Connect to Git，选该仓库。构建配置：

   | 项 | 值 |
   | --- | --- |
   | Framework preset | `Next.js (Static HTML Export)` |
   | Build command | `npm run build` |
   | Build output directory | `out` |
   | Node version | 由 `.nvmrc` 决定（20） |

   `CF_PAGES=1` 是 Cloudflare 构建时自动注入的，`next.config.mjs` 检测到它就切到 `output: "export"`。**本地构建不受影响**（仍是普通 Next 构建）。

3. **加 TMDB 密钥（可选但推荐）**：仓库 Settings → Secrets and variables → Actions → New repository secret
   - `TMDB_API_KEY`（v3 key）或 `TMDB_ACCESS_TOKEN`（v4 token），二选一

   不配也能跑：脚本会走无 key 模式（`/trending` 对部分区域可用），失败则标记 `no-credentials` 并把 TMDb 字段留空，不影响猫眼/豆瓣数据。

4. **验证**：Actions 页面 → 「每日片单抓取」→ Run workflow 手动跑一次 → 看 Summary 里的抓取状态 → 回到 Pages 看是否自动触发了新部署。

---

## 二、定时任务

| Workflow | 时间（北京时间） | 作用 |
| --- | --- | --- |
| `.github/workflows/fetch-daily.yml` | 08:30 / 20:30 | 抓 TMDb + 猫眼 + 豆瓣，合并写入 `data/daily_movies.json` |
| `.github/workflows/fetch-posters.yml` | 每周一 08:30 | 抓 TMDB 图库 / IMP Awards / Letterboxd 海报直链 |

两个都支持 `workflow_dispatch` 手动触发。抓取脚本**零第三方依赖**（只用 Node 内置模块），CI 里不需要 `npm install`，跑一次约 2–4 分钟。

GitHub 的 cron 在高峰时段可能延迟几分钟到半小时，这是平台特性。两次抓取就是为此加的冗余。

---

## 三、云端与本地行为差异（重要）

| 行为 | 本地 `next dev` | Cloudflare 静态部署 |
| --- | --- | --- |
| 数据来源 | 每次请求读 `data/*.json` | 构建时读入，烤进 HTML |
| 更新时机 | 抓取脚本一写文件就生效 | commit 触发重新构建后生效 |
| 过期自动补跑 | 有（`ensureFresh`） | **无**（构建期与 `CF_PAGES` 环境下自动禁用） |
| 相对时间（「X 小时前」） | 服务端算 | 构建期不算死，改由浏览器水合后每分钟刷新（`FreshnessStamp`） |
| 下载站内 SVG 母版 | 可用 | 可用（`public/` 原样进 `out/`） |
| 远程海报下载 | 打开原图另存 | 同左（跨域直链，`download` 属性无效） |

`ensureFresh` 在 `NEXT_PHASE=phase-production-build` 与 `CF_PAGES` 下直接返回 `disabled`，所以 CI 构建不会在构建中途启动抓取子进程。

---

## 四、已知限制（如实列出）

1. **猫眼抓取在 CI 上未必成功。** GitHub Actions 出口是 Azure 数据中心 IP，猫眼的风控策略可能拒绝；解密的字形批次每天变，成功率本就不是 100%。脚本对这两种情况都会**留空今日票房、只保留明文累计票房**，不会输出猜测数字。若长期失败，可选方案：
   - 用 self-hosted runner 挂在你自己机器上（保留住宅 IP）
   - 或接受猫眼字段留空，只展示 TMDb + 豆瓣

2. **豆瓣可能返回 403。** 脚本按 3 秒间隔请求，被拦时标记 `blocked` 并停止重试，不硬闯。

3. **Pages 免费版**：每月 500 次构建。本方案一天 2 次 + 每周 1 次 ≈ 62 次/月，余量充足。

4. **GitHub 私有仓库**的 Actions 免费额度 2000 分钟/月，本方案约 300 分钟/月，够用；公开仓库不限。

5. **不能跑在本地方案里的自动补跑会失效**——如果你希望「抓取失败也能自动重试」，可以在 workflow 里加 `retry` 或多加一个 cron 时段。

---

## 五、本地复现云端构建

```bash
# 复现 Cloudflare 产物（生成 out/）
CF_PAGES=1 npm run build     # Git Bash / macOS / Linux
# Windows PowerShell: $env:CF_PAGES=1; npm run build

# 本地预览静态产物
npx serve out

# 只跑抓取与校验
npm run fetch:daily
npm run verify:daily          # 退出码 0 = 可提交，1 = 不提交

# 冒烟回归（需 dev server 在 3200）
npm run smoke
```
