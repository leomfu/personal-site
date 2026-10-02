import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArticleToc } from "@/components/blog/ArticleToc";
import { ScrollCraftRoot } from "@/components/engine/ScrollCraftRoot";
import { getPosts } from "@/lib/content";
import { localized, longDate } from "@/lib/format";
import { extractHeadings, renderMarkdown } from "@/lib/markdown";
import { pageMetadata } from "@/lib/metadata";
import { localePath } from "@/lib/nav";
import { routing } from "@/i18n/routing";

type Params = { locale: string; slug: string };

/** 两种语言 × 所有文章，构建时全量生成 */
export function generateStaticParams() {
  return routing.locales.flatMap((locale) => getPosts().map((post) => ({ locale, slug: post.slug })));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  const post = getPosts().find((p) => p.slug === slug);
  if (!post) return {};

  const base = await pageMetadata(locale, "blog", `/blog/${slug}`);
  const title = localized(locale, post.title, post.title_en);
  const description = localized(locale, post.summary, post.summary_en);
  return {
    ...base,
    title,
    description,
    openGraph: { ...base.openGraph, type: "article", title, description },
    twitter: { ...base.twitter, title, description },
  };
}

/**
 * 文章详情：一列好读的正文（收在 68ch 左右）+ 宽屏右侧目录 + 上一篇 / 下一篇。
 * 英文路由有译本（content/posts/<slug>.en.md）就读译本，没有就读原文并标一行原文语言。
 */
export default async function PostPage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const posts = getPosts();
  const index = posts.findIndex((p) => p.slug === slug);
  if (index === -1) notFound();

  const post = posts[index];
  const newer = posts[index - 1];
  const older = posts[index + 1];

  const t = await getTranslations("blog");
  const tType = await getTranslations("blog.types");

  const translated = locale === "en" && post.body_en !== undefined;
  const body = translated ? (post.body_en as string) : post.body;
  const minutes = (translated && post.minutes_en) || post.minutes;
  const html = await renderMarkdown(body, locale);
  const headings = extractHeadings(body);
  const showToc = headings.length >= 3;
  const langMismatch = post.lang !== locale && !translated;

  return (
    <ScrollCraftRoot>
      <main id="main" className="pagemain article">
        <header className="article__head" data-sc-in>
          <p className="article__meta mono">
            <span>{longDate(post.date, locale)}</span>
            <span>{tType(post.type)}</span>
            <span>{t("minutes", { minutes })}</span>
          </p>
          <h1 className="article__title">{localized(locale, post.title, post.title_en)}</h1>
          {langMismatch && (
            <p className="article__note">
              {t("originalLang", {
                lang: post.lang === "zh" ? t("langZh") : t("langEn"),
                target: locale === "zh" ? t("langZh") : t("langEn"),
              })}
            </p>
          )}
        </header>

        <div className={showToc ? "article__layout has-toc" : "article__layout"}>
          <div className="article__sheet scrap" style={{ "--tilt": "0deg" } as CSSProperties}>
            <span className="tape tape--blue" aria-hidden />
            <div className="scrap__paper deckle article__paper">
              <article className="prose" dangerouslySetInnerHTML={{ __html: html }} />
            </div>
          </div>
          {showToc && (
            <aside className="article__toc">
              <ArticleToc headings={headings} />
            </aside>
          )}
        </div>

        <nav className="article__pager" aria-label={t("pager")}>
          {newer ? (
            <Link href={localePath(locale, `/blog/${newer.slug}`)} className="pager pager--prev">
              <span className="pager__label mono">{t("next")}</span>
              <span className="pager__title">{localized(locale, newer.title, newer.title_en)}</span>
            </Link>
          ) : (
            <span />
          )}
          {older && (
            <Link href={localePath(locale, `/blog/${older.slug}`)} className="pager pager--next">
              <span className="pager__label mono">{t("prev")}</span>
              <span className="pager__title">{localized(locale, older.title, older.title_en)}</span>
            </Link>
          )}
        </nav>
        <Link href={localePath(locale, "/blog")} className="textlink article__back">
          {t("backToList")}
        </Link>
      </main>
    </ScrollCraftRoot>
  );
}
