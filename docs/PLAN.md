# 个人网页 · 总体规划（PLAN.md）

> 本文件是整个项目的"唯一事实来源"。任何终端开始工作前必须先完整阅读本文件和根目录 CLAUDE.md。
> 参考网站：https://amankumar.ai （排版、导航、留白、极简风格的参照）

## 1. 项目定位

一个黑白极简风格的个人网站，包含：个人介绍、项目展示、博客/文章/想法、邮箱联系、社交平台跳转，以及一个沉浸式"放松区"（听音乐 + 听播客）。中英双语切换。

## 2. 已确认的需求决定

| 决定项 | 结论 |
|---|---|
| 视觉风格 | 黑白为主，极简，大量留白，参考 amankumar.ai 的排版 |
| 开场页 | 进入网站先看到 Hello 开场（个人 Logo + 黑白背景 + 动画），按回车或点击入口图标进入主站 |
| 内容管理 | Markdown 文件放在仓库 `content/` 目录，git 提交即发布 |
| 版本管理 | 使用 git + GitHub 远程仓库 |
| 语言 | 中英双语切换（默认中文），顶部有 EN/中 切换按钮 |
| 放松区 | 三层方案：氛围音自托管（CC0 免费素材，随场景自动淡入）；音乐用**网易云歌单外链播放器**嵌入；播客用小宇宙/YouTube 播放列表嵌入 |
| 扩展功能（已确认要做） | 视频作品区、书影音收藏页、工具页、文章评论（giscus；~~访客留言板~~ 2026-09-08 下线）、⌘K 搜索面板、访问统计（部署阶段接入 Umami/Vercel Analytics） |
| 视觉稿 | `docs/design/改版规格.md` + `tokens.css`（2026-09-17 改版定稿），**是唯一视觉依据**；效果图 `weiliang-redesign-reference.html` 用浏览器打开对照 |
| 布局（2026-09-08 改版） | **顶部暗色导航条**（64px，fixed，导航组绝对居中）+ **1240px 居中版心**的浅色内容区。~~原为左侧 264px 暗色侧边栏 + 700px 内容列~~。版心之内文章正文再收一层（`.prose-bw`，700px 阅读列） |
| Now | 不单独成页，作为首页"现在是"板块（内容仍由 content/now/ 驱动） |
| 部署 | 暂不决定。开发阶段保证纯静态可导出（`next build` 静态输出），Vercel / Cloudflare Pages / GitHub Pages 都能上 |
| 联系方式 | 展示邮箱 + 一键复制 + mailto 按钮；正式表单等部署平台定了以后再接（Formspree 或 Resend） |
| 社交平台 | X、GitHub、哔哩哔哩、YouTube、小红书、抖音 |

## 3. 技术栈（所有终端必须遵守，不得擅自更换）

- **框架**：Next.js 16（App Router）+ TypeScript
- **样式**：Tailwind CSS v4
- **动画**：Framer Motion（`motion` 包）
- **内容**：Markdown + gray-matter 解析 front-matter，`content/` 目录，构建时读取（不引数据库、不做后端）
- **双语**：`next-intl`（或等价的轻量字典方案），路由形如 `/zh/...` 和 `/en/...`，默认 `/zh`
- **音频**：原生 `<audio>` + 自定义 UI（放松区），音频文件放 `public/audio/`
- **无后端**：整站可静态导出（`output: 'export'` 兼容），任何功能不得依赖服务器运行时

## 4. 网站结构（页面地图）

```
/                → Hello 开场页（对照 design/Intro.dc.html）
  · 深空暗色背景：径向辉光 + 星点闪烁 + 颗粒噪点 + 暗角
  · Logo 居中（反色显示，浮动 + 光泽扫过动画），上下细分割线，NAME / SINCE 两侧标注，一句话定位（中英）
  · "向下滚动进入"按钮（角标框 + 上下浮动）或按 Enter，滚动/回车/点击均可进入
  · 进入后本次会话不再重复显示（sessionStorage）
/home            → 首页（对照 design/Main.dc.html）：衬线大字名字 + 自我介绍两段 +
                    "现在是"（Now 板块，content/now/ 驱动）+ "我在做的"（项目精选）+
                    "我写的"（最新文章列表）+ 页脚邮件一句话
/projects        → 项目：页内三个筛选 —— 我做的 / 小工具（番茄钟 + 手记，原 /focus 页）/ 用到的开源
/videos          → 视频作品区：嵌入展示自己在 B站/YouTube 的视频（content/videos.json）
/blog            → 博客（2026-09-08 合并）：页内三个筛选 —— 文章 / 世界新闻 / AI 更新。
                    ⚠️ 三块必须分开：自己写的和抓来的新闻混在一张清单里会张冠李戴
                    「文章」下面还有一层类型筛选（全部/随笔/长文/想法），
                    日期左列 + 标题 + 摘要 + 标签 + 阅读时长，年份变化插分隔行
/blog/[slug]     → 文章详情页（markdown 渲染，目录，阅读时间，giscus 评论）
/about           → 关于：个人介绍（content/about/*.md）+ 下半「我的爱好」同心轨道图 ——
                    圆心是 Logo，摄影/唱片/书影音三个节点在同一条轨道上慢慢公转，
                    各有一根辐条连回圆心；鼠标进去就停，点节点进各自的页
                    （components/about/HobbyOrbit + globals.css 末尾那段）
/tools           → 工具页（对照 design/Tools.dc.html）：日常工具卡片双列网格，
                    黑白图标 hover 亮各自品牌色 + 卡片上浮
/photos          → 摄影：专题（大图卡）+ 按年份的档案。开头是那张双色调海报（原在首页）
/photos/[slug]   → 单辑详情（灯箱看图）
/records         → 唱片：一台真能转的黑胶唱机 + 「按心情听」榜单
/library         → 书影音收藏
   ↑ 这三页**不进顶栏**，入口是关于页那张同心轨道图（见下）
/contact         → "说点什么"（对照 design/BlogContact.dc.html 下半）：衬线大字邮箱 +
                    "写邮件/复制地址"按钮（复制后显示"已复制 ✓"）+ "在别处"双列社交清单（@handle ↗）
```

**导航 = 顶部暗色横条**（2026-09-08 改版，站主给了参考图；design/Main.dc.html 那根左侧栏已作废）：
三段式：左 Logo 圆徽 + 名字，**中 七项平铺导航**（首页/项目/视频/博客/工具/关于/联系，当前项下面一道细线），
右 中/EN 切换 · 分隔线 · 社交图标（X/GitHub/哔哩哔哩/YouTube/小红书/抖音）· ⌘K。
⚠️ 导航组是 `absolute left-1/2 -translate-x-1/2`，**不是 flex 里的一项** —— 站主要求它在视窗正中，
用 flex 的话中英文名字长度不同、社交图标在 xl 才出现，三种情况下导航会落在三个不同的位置。
颜色仍是原来那套 shell-* 暗侧灰阶 —— 那块暗色只是从一竖条变成了一横条。
**断点**：`<lg` 汉堡 + 全屏抽屉；`lg` 导航平铺、社交先收起；`xl` 社交图标一起出来。
摄影/唱片/书影音这三页不进顶栏（入口在关于页的轨道图上），但 ⌘K 和 sitemap 里都有。
真正被合并掉的「新闻」「小工具」也能从 ⌘K 搜到，跳到所在页面的对应筛选（`/blog#world` 这种）。

**全站交互**：⌘K（移动端为搜索图标）呼出命令面板——搜文章、跳任意页面、切换语言/暗色模式。纯前端实现（构建时生成搜索索引）。

**评论（giscus）前提**：GitHub 仓库必须为 **public** 且开启 **Discussions**，评论数据存在仓库 Discussions 里。文章详情页底部挂评论组件。
~~/guestbook 独立留言串~~ —— 留言板 2026-09-08 按站主要求整个下线，文章底下的评论保留。

## 5. 设计规范（2026-09-17 改版定稿）

> ⚠️ **这一节 2026-09-17 整个重写过。** 原来那套「黑白设计系统」（暗侧 `#0A0A0A` +
> 亮侧浅灰渐变 + 细衬线大标题 + 全站只用黑白灰）连同它依据的五个 `.dc.html` 画板
> 和 `design-v2/` 一起**已经删除**。下面是现行规范。

**唯一视觉依据**：`docs/design/改版规格.md`（完整规格，分节对应每一页）+ `docs/design/tokens.css`（定稿 token）。
效果图是 `docs/design/weiliang-redesign-reference.html`（26 MB 单文件，不进 git，浏览器直接打开）。
**颜色、字号、圆角、阴影、动效时长都是定稿值，不要自行调整比例。**

token 全部落在 `src/app/globals.css` 的 `@theme static` 块里（`static` 不能去掉：
Tailwind 4 默认会把「没有工具类用到」的 token 摇掉，而这套系统里大量 token 是组件
直接 `var(--color-accent-700)` 引用的，摇掉之后静默失效）。

- **配色（亮侧）**：底色雾蓝 `--color-bg #edf1f7`；文字 `ink #171b22` / `body #40464f` /
  `muted #5b636f` / `faint #78818f`；线 `line #d8dde6`。
  主色蓝 `accent #4f79cf`（100→900 九档），第二主色橙 `accent-2 #d98341`（同样九档）。
  **正文级的蓝字必须用 `accent-700 #2a4a95`**，`accent` 本体在雾蓝底上只有 3:1 出头，
  只够图标和大标题；橙色同理用 `accent-2-700`。
- **配色（暗侧）**：`shell-*` 和 `desk-*` 两组**保留同名**，值重调成同一蓝 family 的
  深色/浅色 —— 暗侧和亮侧因此是一套色，而不是两套。页脚底色是 `neutral-900 #272b31`。
- **彩色的例外只有两处**：工具页图标 hover 亮各自品牌色（`--color-brand-claude`），
  联系页/页脚那枚 B 站图标底（`--color-brand-bilibili`）。
- **内容图片一律原色**（摄影、视频封面、唱片封面都是作品）。页面里统一走「washed」
  （`saturate(.78) brightness(1.05)`）让它沉进底色，hover 恢复原色；
  **放大态的整帧照片不做任何处理**。
- **字体**：标题 `--font-hand` = Caveat（拉丁）→ Ma Shan Zheng（中文兜底），**栈序不能反**，
  字重恒为 400；正文 `--font-sans` = Figtree + Noto Sans SC；markdown 正文和引言继续用
  `--font-serif`（思源宋体）。五个字体全部 `next/font/google` 自托管，**不引 CDN**。
- **间距**：设计稿是 Organic 1.10× 密度（4.4 / 8.8 / 13.2 / 17.6 / 26.4 / 35.2px）。
  实现方式是把 Tailwind 的基数调成 `--spacing: 0.275rem`（4.4px），算出来的六档和设计稿
  一字不差，其余档位等比缩放 —— 不逐个覆盖 `--spacing-1…8`，那样会变成一把尺子两种刻度。
- **圆角**：`sm 8` / `md 18` / `lg 28`；卡片实际 `calc(var(--radius-lg) * 1.15)` ≈ 32px；
  按钮、标签、输入框、胶囊行一律 999px；页脚顶部 56px。
- **版心**：`--spacing-page 1180px`（改版从 1240 收窄），`--spacing-page-narrow 1080px`
  （首页 / 关于 / 项目 / 联系），行宽三档 860 / 700 / 420 不变。

### 三层体感（改版的全部来源，缺一层就不成立）

1. **玻璃卡面** `.glass` / `card-face`：`surface 42%` + `blur(20px) saturate(1.4)` +
   `ink 14%` 描边 + `--shadow-glass`。**半透明是故意的** —— 底纹和光斑要从卡背后透出来，
   任何一处改成实色白，那块就像贴上去的。
2. **背景两层**（挂在 `components/shell/SiteShell`）：`.bg-texture` 是 `position:fixed` 的
   30px 细网格（`accent 13%`，径向遮罩让顶部清晰、底部淡出）；两颗 680px 光斑
   `.bg-blob-a`（右上，蓝，26s）和 `.bg-blob-b`（左中，橙，32s）。内容层 `relative z-1`。
3. **翻阅动效「错位滑入」** `components/ui/Reveal`：滚进视口时左右交替滑入
   （强度 `--wl-k: 1.6`，`opacity .6s ease, transform .86s cubic-bezier(.16,.86,.22,1)`），
   错峰延迟 `(index % 4) * 110ms`，IntersectionObserver `rootMargin "0px 0px -16% 0px"` /
   `threshold .04`，**外加一个 1600ms 的兜底定时器**（图没加载完时观察器可能一直不响）。
   卡片网格是**一张张分别进**，所以每张卡各自包一个 `<Reveal index={i}>`。
   换页时整块 main 播一次 `.page-enter`；顶部还有一条 3px 的滚动进度条。

### 其它

- **顶栏是唯一不玻璃化的容器**：完全透明，无边框无阴影无 backdrop-filter。
  也正因为完全透明，它**不 fixed**，跟着页面滚走。
- **焦点环全站统一**：`:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px }`。
- **hover 位移两档**：卡片 `translateY(-6px)`，行式元素 `translateX(6–8px)`；过渡 .25–.35s。
- **`prefers-reduced-motion: reduce` 下全部关闭**：滑入的块直接就位，光斑 / 换页 / 脉冲 / 进度条全停。
- **暗色模式**：不做全局明暗切换。「暗侧」只指本来就是深色的那几块（页脚、照片放大态）。
- **响应式**：网格一律 `repeat(auto-fit, minmax(...))`；手机上触摸目标不小于 44px。

## 6. 放松区（Lounge）详细方案 —— 三层混合

进入 `/lounge` 后是一个**沉浸模式**，分三层：氛围场景 / 音乐 / 播客。

1. **进入动画与沉浸布局**（对照 design/Lounge.dc.html）：整页淡入暗色，左侧边栏收窄为 64px 图标条（仅 Logo + 图标导航，底部竖排"ESC 退出沉浸"提示；鼠标移到左侧或按 ESC 展开恢复）。顶部居中一行弱提示"导航已收起"。画面中心为同心呼吸圆环 + 衬线场景名（如"雨夜 / RAINY NIGHT"），圆环随氛围音音量呼吸。底部依次是：氛围/音乐/播客三个标签 → 场景切换 chips → 暂停按钮 + 音量滑杆 + "循环 · 交叉淡入"标注。
2. **氛围场景**（自托管音频）：3–4 个可切换场景（如：雨夜、海浪、篝火、深空），每个场景 = 全屏黑白/低饱和动态背景（CSS 渐变/噪点/生成式 canvas 实现，不依赖大图）+ 对应循环氛围音（CC0 免费素材，`public/audio/ambient/`）。切换场景时音频交叉淡入淡出，与背景动画同步——这是自托管的意义，iframe 做不到。氛围音支持音量单独调节、呼吸圆环动画随之律动。
3. **音乐**（网易云嵌入）：嵌入用户的网易云歌单外链播放器 iframe（`music.163.com/outchain/player`）。iframe 样式不可定制（网易云红色播放器），设计上把它收进一张黑白卡片/相框式容器中，控制尺寸并弱化违和感。⚠️ 有版权限制的歌曲（客户端里灰色的）外链播放器放不出来，用户建歌单时需自行测试外链效果。可放多个歌单（如"专注"“夜晚”两个歌单切换）。
4. **播客**（第三方嵌入）：单独"播客"分区，嵌入小宇宙节目/单集或 YouTube 播放列表 iframe（具体链接由用户提供）。
5. **细节**：场景选择和音量用 localStorage 记住；氛围音懒加载；移动端适配（iOS 需用户手势后才能播放音频，进入页面给一个"开始"轻点交互）。

## 7. 内容目录约定

```
content/
  posts/          → 博客/文章/想法（.md，front-matter: title, title_en, date, type, tags, lang, summary）
  projects/       → 项目（.md 或 projects.json：name, desc, desc_en, link, repo, cover）
  about/          → about.zh.md / about.en.md
  now/            → now.zh.md / now.en.md（首页"现在是"板块的内容，含 updated 日期）
  library/        → 书影音条目（.md 或 library.json：type: book|movie|album, title, creator, rating, note, date）
  videos.json     → 视频作品清单（platform: bilibili|youtube, id/BV号, title, date, desc）
  tools.json      → 工具页条目（name, desc, url, icon, brandColor —— hover 时亮的品牌色）
site.config.ts    → 站点信息：姓名、邮箱、社交链接、网易云歌单 id、小宇宙/YouTube 播客链接、giscus 配置、导航文案
public/
  logo/           → 用户提供的 Logo（黑底白字与白底黑字两版）
  audio/ambient/  → 氛围音（CC0 素材）
  images/         → 文章配图、项目截图
```

## 8. 阶段划分（每个阶段 = 一个新终端会话）

| 阶段 | 内容 | 产出 |
|---|---|---|
| 阶段 0 ✅ 已完成 | 视觉稿。⚠️ 原来那五个黑白画板 2026-09-17 已删，现行稿是 docs/design/改版规格.md | 唯一视觉依据 |
| 阶段 1 | 脚手架：Next.js 项目初始化、Tailwind、设计系统 tokens（按视觉稿提取）、双语框架、git init + GitHub 仓库、Hello 开场页（还原 Intro 画板） | 可运行的项目 + 开场页 |
| 阶段 2 | 主站骨架：左侧边栏导航、首页（含"现在是"板块）、About、Projects、视频作品区、工具页、Contact | 主要静态页面完成 |
| 阶段 3 | 内容管线：markdown 读取/渲染、博客列表与详情页、标签分类、书影音页、RSS、⌘K 搜索面板、giscus 评论 + 留言板 | 博客系统与互动功能完成 |
| 阶段 4 | 放松区：沉浸模式、氛围场景（自托管氛围音）、网易云歌单嵌入、播客嵌入 | 放松区完成 |
| 阶段 5 | 收尾：SEO/OG 图、性能、移动端打磨、暗色模式、访问统计接入、选定平台并部署 | 上线 |

**规则**：每个终端只做自己阶段的事；开工前读 CLAUDE.md + 本文件 + docs/进度.md；完工后更新 docs/进度.md 并 git commit。阶段之间串行进行（避免代码冲突），不要并行开两个终端改同一个项目。

## 9. 用户需要准备的素材

见 docs/素材清单.md。素材没到位不阻塞开发——先用占位内容，素材到了再替换。
