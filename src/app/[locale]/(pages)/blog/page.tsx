import { getTranslations, setRequestLocale } from "next-intl/server";
import { BlogList, type PostCard } from "@/components/blog/BlogList";
import { ScrollCraftRoot } from "@/components/engine/ScrollCraftRoot";
import { PageHead } from "@/components/shell/PageHead";
import { getPosts } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return pageMetadata(locale, "blog", "/blog");
}

/** 全部文章（「书架」的查看全部）。content/posts/ 的 markdown，页内可按类型筛 */
export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");
  const tp = await getTranslations("places");

  // 正文不进客户端包，只给列表需要的字段；标签和阅读时长在这里按语言取好
  const en = locale === "en";
  const posts: PostCard[] = getPosts().map(
    ({ slug, title, title_en, summary, summary_en, date, type, tags, tags_en, minutes, minutes_en }) => ({
      slug,
      title,
      title_en,
      summary,
      summary_en,
      date,
      type,
      tags: (en && tags_en) || tags,
      minutes: (en && minutes_en) || minutes,
    }),
  );

  return (
    <ScrollCraftRoot>
      <main id="main" className="pagemain">
        <PageHead place={tp("shelf.name")} title={t("title")} lead={t("lead", { count: posts.length })} />
        <BlogList posts={posts} />
      </main>
    </ScrollCraftRoot>
  );
}
