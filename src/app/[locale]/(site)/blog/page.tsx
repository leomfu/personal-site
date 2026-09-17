import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BlogList, type PostCard } from "@/components/blog/BlogList";
import { ContentFooter, PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { getPosts } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { localePath } from "@/lib/nav";
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

/**
 * 博客 —— content/posts/ 的 markdown 文章列表（页内的类型筛选在 BlogList 里）。
 *
 * 2026-09-08 ~ 09-17 这一页曾经和「新闻」合并过（文章 / 世界新闻 / AI 更新三个筛选），
 * 2026-09-17 全站改版第一阶段新闻整块下线，这里只剩文章。
 */
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
      <PageHeader
        tag="WRITING"
        title={t("title")}
        lead={t.rich("lead", {
          count: posts.length,
          // 篇数用主文字色，跟画板一致
          em: (chunks) => <span className="text-accent-700">{chunks}</span>,
        })}
      />

      <Reveal index={0}>
        <BlogList posts={posts} />
      </Reveal>

      <Reveal index={1}>
        <ContentFooter
          note={t.rich("footerNote", {
            link: (chunks) => (
              <Link href={localePath(locale, "/contact")} className="link-underline">
                {chunks}
              </Link>
            ),
          })}
        />
      </Reveal>
    </>
  );
}
