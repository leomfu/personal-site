# content/ —— 内容即文件

所有用户可见的内容都放这里，git 提交即发布。组件里不写死文案。
读取在构建时完成（gray-matter 解析 front-matter），不引数据库、不做后端。

## posts/ —— 随笔 / 长文 / 想法

一篇一个 `.md`，文件名即 slug。front-matter：

```yaml
---
title: 中文标题
date: 2026-08-24
type: blog          # blog | essay | thought  →  随笔 | 长文 | 想法
tags: [设计, 前端]
lang: zh            # 这篇原文的语言
summary: 一句话摘要
minutes: 6          # 可选：列表上的阅读时长，不写就按字数估
---
```

正文插图放 `public/images/posts/`，引用 `/images/posts/xxx.png`。
图片默认 washed（去饱和、抬亮，hover 恢复原色）；`![alt](/path "原色")` 的那张保持原色，
用于截图、摄影作品这类图本身就是内容的图。

## projects/ —— 项目

`projects.json`，数组顺序就是页面顺序。字段：
`slug, name, status, year, desc, stack[], link, repo, featured, summary, featuredStack[]`
（`featured: true` 的会出现在首页「在做的」，`summary` / `featuredStack` 是首页卡片上的短版）

## about/ —— 关于页正文

`about.zh.md`，纯正文，小标题用 `###`。

## home/ —— 首页 Hero 引导语

`intro.zh.md`，一段纯文本。

## photos/ —— 摄影

一辑一个 json，文件名即 slug：`{ title, year, order, photos: [{ file, width, height, caption }] }`，
图片放 `public/images/photos/`。步骤见 `docs/如何添加照片.md`。

## videos.json —— 视频作品

`[{ platform: "bilibili"|"youtube", id, title, date, desc, summary, cover }]`

## tools.json —— 工具页

`[{ name, desc, desc_en, url, icon, brandColor }]`
`icon` 对应 `src/components/icons/` 里的图标名；`brandColor` 是 hover 时亮起的品牌色。

## music/ —— 唱片页

见 `docs/如何加歌.md`。

## 双语

中英两份都在 `content/` 里：
- `home/intro.en.md`、`about/about.en.md`：英文路由优先读它们，没有就读 `.zh.md`；
- `posts/<slug>.en.md`：文章的英文译本（front-matter 写 `title` / `summary` / `tags`，可选 `minutes`），
  和原文共用 slug、日期、类型，不算单独一篇；没有译本时英文页显示原文并标注原文语言；
- json：`*_en` / `*En` 字段（projects、videos 用 `_en`，photos、music 用 `En`），没填就显示中文字段。

⚠️ 改中文内容时对应的英文文件/字段要一起改，否则英文站显示的是旧内容。
