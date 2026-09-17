import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { getProjects } from "@/lib/content";
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
  return pageMetadata(locale, "projects", "/projects");
}

/**
 * 项目页 —— 改版定稿（docs/design/改版规格.md §6.4）：页头 + 单列堆叠的项目卡，卡间距 26.4px。
 * 数据是 content/projects/projects.json，顺序就是 json 里的顺序。
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

  return (
    <>
      <PageHeader tag={t("tag")} title={t("title")} lead={t("lead")} />

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
    </>
  );
}
