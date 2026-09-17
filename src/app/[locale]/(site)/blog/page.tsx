import { getTranslations, setRequestLocale } from "next-intl/server";
import { BlogList, type PostCard } from "@/components/blog/BlogList";
import { PageHeader } from "@/components/ui/PageHeader";
import { getPosts } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return pageMetadata(locale, "blog", "/blog");
}

/** 博客 —— content/posts/ 的 markdown 文章列表（改版规格 §6.5；页内筛选在 BlogList 里） */
export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");

  // 正文不进客户端包，只给列表需要的字段
  const posts: PostCard[] = getPosts().map(
    ({ slug, title, title_en, summary, summary_en, date, type, tags, minutes }) => ({
      slug,
      title,
      title_en,
      summary,
      summary_en,
      date,
      type,
      tags,
      minutes,
    }),
  );

  return (
    <>
      <PageHeader tag={t("tag")} title={t("title")} lead={t("lead", { count: posts.length })} />

      {/* 卡片在 BlogList 里各自滑入，这里不再整块包一层 Reveal */}
      <BlogList posts={posts} />
    </>
  );
}
