import { getTranslations, setRequestLocale } from "next-intl/server";
import { ScrollCraftRoot } from "@/components/engine/ScrollCraftRoot";
import { PageHead } from "@/components/shell/PageHead";
import { getProjects, localized } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { getProjectShot } from "@/lib/scene";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return pageMetadata(locale, "projects", "/projects");
}

/**
 * 全部项目（「屏幕」的查看全部）。content/projects/projects.json，顺序就是 json 里的顺序。
 * 每件展品：真实截图（有才放）+ 事实标签「名称 · 年份 · 用到的 · 状态」+ 完整说明 + 链接。
 */
export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("projects");
  const tp = await getTranslations("places");
  const projects = getProjects();

  return (
    <ScrollCraftRoot>
      <main id="main" className="pagemain">
        <PageHead place={tp("screen.name")} title={t("title")} lead={t("lead")} />
        <ol className="exhibits">
          {projects.map((project) => {
            const shot = getProjectShot(project.slug);
            const name = localized(locale, project.name, project.name_en);
            const status = project.status ? localized(locale, project.status, project.status_en) : "";
            const label = [name, project.year, (project.stack ?? []).join(" / "), status].filter(Boolean).join(" · ");
            return (
              <li key={project.slug} className={shot ? "exhibit-row has-shot" : "exhibit-row"} data-sc-in>
                {shot && (
                  <div className="exhibit-row__shot">
                    {/* eslint-disable-next-line @next/next/no-img-element -- 项目真实截图，原图原色 */}
                    <img src={shot.src} width={shot.width} height={shot.height} alt={t("shotAlt", { name })} loading="lazy" decoding="async" />
                  </div>
                )}
                <div className="exhibit-row__body">
                  <h2 className="exhibit-row__name">
                    {project.link ? (
                      <a href={project.link} target="_blank" rel="noreferrer noopener">
                        {name}
                      </a>
                    ) : (
                      name
                    )}
                  </h2>
                  <p className="placard__label mono">{label}</p>
                  <p className="exhibit-row__desc">{localized(locale, project.desc, project.desc_en)}</p>
                  {project.metrics && project.metrics.length > 0 && (
                    <p className="exhibit__metrics">
                      {project.metrics.map((metric) => (
                        <span key={metric.label} className="metric">
                          <b className="metric__value">{metric.value}</b>
                          <span className="metric__label">{localized(locale, metric.label, metric.label_en)}</span>
                        </span>
                      ))}
                    </p>
                  )}
                  <p className="exhibit__links">
                    {project.link && (
                      <a href={project.link} target="_blank" rel="noreferrer noopener" className="btn btn--primary">
                        {t("visit")}
                      </a>
                    )}
                    {project.repo && (
                      <a href={project.repo} target="_blank" rel="noreferrer noopener">
                        {t("repo")}
                      </a>
                    )}
                    {!project.link && !project.repo && <span className="exhibit__nolink">{t("noLink")}</span>}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </main>
    </ScrollCraftRoot>
  );
}
