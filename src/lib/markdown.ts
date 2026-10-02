import { Marked, type Tokens } from "marked";
import { bundledLanguages, codeToHtml, type ThemeRegistrationRaw } from "shiki";

/**
 * markdown → HTML。渲染结果套在 .prose 里（样式见 src/styles/prose.css）。
 *
 * 两处定制：
 * 1. 内部链接（以 / 开头）自动补语言前缀和尾斜杠，外链自动 target=_blank；
 * 2. 代码块用 shiki 高亮，主题是下面这份手写的暗色灰阶主题（2026-10 改版：底色近黑，
 *    界面强调色只有琥珀一种，彩色代码块会破坏这一点，所以用深浅和粗细区分 token）。
 */

const MONO_THEME: ThemeRegistrationRaw = {
  name: "wl-dark",
  type: "dark",
  colors: {
    "editor.background": "#101318",
    "editor.foreground": "#D9D2C5",
  },
  settings: [
    { settings: { foreground: "#D9D2C5", background: "#101318" } },
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: "#8C867C", fontStyle: "italic" } },
    { scope: ["keyword", "storage", "storage.type", "keyword.control"], settings: { foreground: "#F2ECE1", fontStyle: "bold" } },
    { scope: ["string", "string.quoted", "constant.other.symbol"], settings: { foreground: "#B9B2A6" } },
    { scope: ["constant.numeric", "constant.language"], settings: { foreground: "#F2ECE1" } },
    { scope: ["entity.name.function", "support.function", "meta.function-call"], settings: { foreground: "#F2ECE1" } },
    {
      scope: ["entity.name.type", "entity.name.class", "support.type", "support.class"],
      settings: { foreground: "#E6DFD3", fontStyle: "bold" },
    },
    { scope: ["entity.name.tag"], settings: { foreground: "#F2ECE1", fontStyle: "bold" } },
    { scope: ["entity.other.attribute-name"], settings: { foreground: "#B9B2A6", fontStyle: "italic" } },
    { scope: ["punctuation", "meta.brace", "keyword.operator"], settings: { foreground: "#9A948A" } },
  ],
};

const KNOWN_LANGS = new Set(Object.keys(bundledLanguages));

function normalizeHref(href: string, locale: string) {
  // 站内绝对路径：补语言前缀 + 尾斜杠
  if (href.startsWith("/") && !href.startsWith("//")) {
    const clean = href.replace(/\/$/, "");
    return `/${locale}${clean}/`;
  }
  return href;
}

export async function renderMarkdown(source: string, locale: string) {
  const marked = new Marked({ async: true, gfm: true, breaks: false });

  marked.use({
    renderer: {
      // 标题挂 id，供文章详情页的目录跳转
      heading({ tokens, depth }) {
        const inner = this.parser.parseInline(tokens);
        const id = slugifyHeading(inner.replace(/<[^>]*>/g, ""));
        return `<h${depth} id="${id}">${inner}</h${depth}>`;
      },
      // 正文图片一律原色（2026-10 改版不再去色）。旧文章里 ![alt](/path "原色") 的写法照样认，
      // 那个 title 只是旧的标记，不当作悬停提示显示出来。
      image({ href, title, text }) {
        const marker = title?.trim() === "原色";
        const attrs = [
          `src="${href}"`,
          `alt="${text}"`,
          'loading="lazy"',
          'decoding="async"',
          !marker && title ? `title="${title}"` : "",
        ]
          .filter(Boolean)
          .join(" ");
        return `<img ${attrs} />`;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const external = /^https?:\/\//.test(href);
        const attrs = [
          `href="${normalizeHref(href, locale)}"`,
          title ? `title="${title}"` : "",
          external ? 'target="_blank" rel="noreferrer noopener"' : "",
        ]
          .filter(Boolean)
          .join(" ");
        return `<a ${attrs}>${text}</a>`;
      },
    },
    // 代码块交给 shiki（异步），所以整个 parse 走 async
    async walkTokens(token) {
      if (token.type !== "code") return;
      const lang = (token.lang || "").trim().split(/\s+/)[0];
      const highlighted = await codeToHtml(token.text, {
        lang: KNOWN_LANGS.has(lang) ? lang : "text",
        theme: MONO_THEME,
      });
      // 用 html token 替换掉，跳过 marked 自己的 <pre><code>
      const t = token as unknown as { type: string; text: string; block?: boolean };
      t.type = "html";
      t.text = highlighted;
      t.block = true;
    },
  });

  return (await marked.parse(source)) as string;
}

/** 标题 id：小写、空格转连字符，中文原样留着（浏览器锚点支持 UTF-8） */
export function slugifyHeading(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\s]+/g, "-")
    .replace(/[^\p{Letter}\p{Number}-]/gu, "");
}

export type Heading = { depth: number; text: string; id: string };

/** 抽出 h2/h3 给文章目录用（只走 lexer，不渲染，很便宜） */
export function extractHeadings(source: string): Heading[] {
  const tokens = new Marked({ gfm: true }).lexer(source) as Tokens.Generic[];
  return tokens
    .filter((token) => token.type === "heading" && (token.depth === 2 || token.depth === 3))
    .map((token) => {
      const text = String(token.text ?? "").replace(/[*_`]/g, "");
      return { depth: Number(token.depth), text, id: slugifyHeading(text) };
    });
}
