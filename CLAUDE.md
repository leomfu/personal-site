# 个人网页项目 · 工作约定（CLAUDE.md）

> 站主自己维护内容看 `docs/如何更新内容.md`（写给非开发者的，含内容对照表和三种改法）。

**任何会话开工之前，必须先读：**
1. `docs/PLAN.md` —— 总体规划（需求、技术栈、页面结构、设计规范、阶段划分）
2. `docs/进度.md` —— 当前进度，明确自己该做哪个阶段
3. `docs/素材清单.md` —— 哪些素材已到位、哪些用占位

## 硬性规则

- **技术栈锁定**：Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Framer Motion + next-intl。不得更换框架或引入数据库/后端。整站必须兼容静态导出（部署平台未定，因此不用 middleware/proxy 等服务器运行时特性）。
- **只做当前阶段**：进度文件里标注了下一个待做阶段，只做它，不要提前做后面阶段的内容。
- **视觉稿是唯一视觉依据**：`docs/design/改版规格.md`（2026-09-17 全站改版的完整规格）+ `docs/design/tokens.css`（定稿 token）
  + `docs/design/文案定稿.md`（全站文案，**逐字照抄**，不改写不润色）。
  效果长什么样用浏览器打开 `docs/design/weiliang-redesign-reference.html`（26 MB 单文件，**不进 git**，
  原件在设计交付包 `design_handoff_weiliang_redesign/` 里，整个包也不进 git）。实现涉及的页面先翻规格里对应的那一节，**颜色、字号、圆角、阴影、动效时长都是定稿值，不要自行调整比例**。
  定稿预设：**无底纹网格**、**无顶部滚动进度条**、首页头像是**拍立得**、顶栏**左右分立**（底部渐变下法线）。
  ⚠️ 2026-09-17 之前那套「黑白设计系统」的五个画板（`docs/design/*.dc.html`）和 `design-v2/` 已经**整个删掉**，
  别再去找、也别按它们做事。老进度记录（docs/进度.md）里提到它们的地方是历史，不是现行规矩。
- **配色是「雾蓝底 + 蓝/橙双主色」**：token 在 `src/app/globals.css` 的 `@theme static` 块里，严格照 tokens.css。
  - **正文级的蓝字用 `--color-accent-700`，不要用 `--color-accent` 本体** —— 后者在 `#edf1f7` 上只有 3:1 出头，只够图标和大标题。橙色同理用 `--color-accent-2-700`。
  - **卡面是半透明玻璃**（`.glass` / `card-face`）。两颗漂移光斑必须从卡背后透出来 ——
    任何一处把卡改成实色白，那块就会像贴上去的。这三层（玻璃 / 光斑 / 错位滑入）是这次改版的全部体感来源。
  - **标题用手写体**（`--font-hand`）。Caveat 没有 CJK 字形，中文靠 Ma Shan Zheng 兜底，**字体栈顺序不能反**；手写标题字重恒为 400。
  - 三个字体（Caveat / Ma Shan Zheng / Figtree）都用 `next/font/google` 自托管，**不要引 CDN**。
  - **内容图片一律原色**——摄影作品、视频封面、唱片封面都算内容，它们本身就是作品。
    页面里的内容图统一走「washed」（去饱和 + 抬亮）让它沉进底色，鼠标移上去恢复原色；
    **放大态里的整帧照片不做任何处理**，那一刻看的就是作品本身。
- **动效克制，尊重 prefers-reduced-motion**：滑入的块直接就位，光斑、换页、脉冲全部停掉。
- **双语**：所有用户可见文案必须同时提供中文和英文（走 next-intl 字典），不允许硬编码单语文案。
  例外（2026-09-17 改版）：`content/` 里的英文内容本次不提供，`en` 路由暂时复用中文内容；`messages/` 的框架键仍保持中英齐全。
- **站点范围（2026-09-17 精简后）**：只有首页 / 项目 / 视频 / 博客 / 摄影 / 工具 / 关于 / 联系 + 音乐 `/records` 与迷你播放器。
  书影音、专注区、放松区、留言板、评论、新闻、⌘K 都已下线，不要再加回来；旧地址 404 是有意为之，不配重定向。
- **内容即文件**：文章/项目/介绍都在 `content/` 目录的 markdown 里，不写死在组件中。
- **素材占位**：Logo、音频、文章等素材未提供时用占位符，并在 docs/素材清单.md 里标注"待替换"。

## 完工流程（每个阶段结束时）

1. `npm run build` 确认构建通过，`npm run dev` 自查主要页面。
2. 更新 `docs/进度.md`：勾掉完成项，写清做了什么、遗留什么、下一阶段注意什么。
3. git commit（信息用中文，说明本阶段成果），如已配置远程则 push。

## 项目自带的 skill

- `.claude/skills/mono-color/` —— 单色/双色印刷版式设计系统（上游 MIT，见该目录 NOTICE.md）。
  首页那张海报就是按它做的。要再做同类的图，**先读它的 `design-system/*.json`**，
  SKILL.md 里写明目录是唯一事实来源、和散文冲突时以目录为准。
  ⚠️ 上游 `examples/` 里的示例图不在 MIT 范围内，没有拷进来，也不要拷。

## 常用命令

- `npm run dev` — 本地开发（http://localhost:3000）
- `npm run build` — 生产构建（每次完工必须跑）
- `npm run photos` — 摄影：扫 `photos-src/`（原图，不进仓库）压出缩略图/展示图，并写 `content/photos/*.json`（站主用法见 `docs/如何添加照片.md`）
- `npm run hero` — 首页那张双色调照片：扫 `hero-src/road.png`（原图，不进仓库）印成双色调输出 `public/images/hero/road.webp`（换照片就换源文件重跑，组件不用动）

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
