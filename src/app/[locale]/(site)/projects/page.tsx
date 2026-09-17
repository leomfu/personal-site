import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ListRow, ListRowGroup } from "@/components/ui/ListRow";
import { ContentFooter, PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { getProjects, getUsedRepos, localized } from "@/lib/content";
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
  return pageMetadata(locale, "projects", "/projects");
}

/**
 * 项目页 —— 视觉稿没有单独画这一页，沿用 BlogContact 画板列表页的骨架：
 * 左列窄标签 + 右列标题/一句话，条目之间细线分隔。
 *
 * 整页收在 1000px 居中版心里（比全站 1240px 窄）—— 站主说这一页「排版很不舒服」，
 * 根子是内容量配不上 1240：三个项目 + 十二条清单摊那么宽，一行只有一句话。
 * 三个筛选共用同一个左右边界，切换时页面不会跳。
 *
 * 顶部**两个筛选**（ui/SegmentedTabs）：
 *   我做的      content/projects/projects.json —— **两列编号大卡**（components/projects/ProjectCard）
 *   用到的开源  content/projects/repos.json    —— 别人的仓库，左列是它在这个站里干什么
 *
 * 原来中间还有一栏「小工具」（番茄钟 + 手记），2026-09-17 全站改版第一阶段随专注区一起下线。
 *
 * ⚠️ **两块必须分开。** 混在一张清单里会让人以为这些开源项目都是他写的。
 * 类型也是分开的（Project / UsedRepo），别为了省事合并。
 * 2026-09-08 起连**形状**也分开了：自己的项目是卡，用到的开源是清单 ——
 * 主角和配角排成一样大，等于没有主角。
 *
 * 两块内容都在服务端渲染好，作为 props 交给筛选组件；没选中的那块只是挂了 hidden，
 * 仍在 DOM 里 —— 页内查找和爬虫都拿得到。
 */
export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("projects");

  const projects = getProjects();
  const repos = getUsedRepos();

  const mineBlock = (
    <div className="mt-8">
      {/* 单列堆叠、卡间距 26.4px（handoff §6.4）。每张卡各自滑进来 */}
      <div className="flex flex-col gap-6">
        {projects.map((project, i) => (
          <Reveal key={project.slug} index={i}>
            <ProjectCard
              project={project}
              index={i}
              locale={locale}
              repoLabel={t("repo")}
              noLinkLabel={t("noLink")}
            />
          </Reveal>
        ))}
      </div>
    </div>
  );

  const usesBlock = (
    <div className="mt-8">
      <p className="mb-6 max-w-column text-[14px] leading-[1.9] text-muted">
        {t("usesNote", { n: repos.length })}
      </p>
      <ListRowGroup>
        {repos.map((item, i) => (
          <ListRow
            key={item.repo}
            last={i === repos.length - 1}
            left={localized(locale, item.role, item.role_en)}
            title={
              <span className="inline-flex flex-wrap items-baseline gap-2.5">
                <a
                  href={item.repo}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="link-underline font-mono text-[14.5px]"
                >
                  {item.name} ↗
                </a>
                {/* 站主自己找来的，和「构建依赖」区分开 */}
                {item.mine && (
                  <span className="tag-framed text-[10.5px] tracking-[0.1em] text-faint">
                    {t("foundByMe")}
                  </span>
                )}
              </span>
            }
            desc={localized(locale, item.desc, item.desc_en)}
          />
        ))}
      </ListRowGroup>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-page-narrow">
      <PageHeader tag="PROJECTS" title={t("title")} lead={t("mineNote")} />

      {/* 两个筛选就摆在原来那句导语的位置 */}
      <Reveal index={0}>
        <SegmentedTabs
          storageKey="projects-tab"
          tabs={[
            { key: "mine", label: t("tabMine"), content: mineBlock },
            { key: "uses", label: t("tabUses"), content: usesBlock },
          ]}
        />
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
    </div>
  );
}
