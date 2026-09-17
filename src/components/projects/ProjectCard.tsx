import type { ReactNode } from "react";
import { localized } from "@/lib/format";
import type { Project } from "@/lib/types";

/**
 * 项目卡 —— 改版定稿（docs/design/改版规格.md §6.4）。
 *
 * 一张玻璃卡，内部两列 `1fr / 1.6fr`（窄屏叠成一列）：
 *   左  64px 手写序号（主色 / 橙色 400 档交替）+ 状态标签「进行中 · 2026」
 *   右  26px 手写标题、14.5px/1.85 描述、技术栈标签行 + 「源码 ↗」
 *
 * 有线上地址（link）的：标题可点，且在技术栈行前面单独放一个主按钮「访问网站 ↗」（新标签页），
 * 状态标签固定用主色玻璃标签，让「在线可访问」一眼能看出来。
 * 主按钮底色用 accent-600（hover 700）而不是 accent 本体 —— 15px 白字压在 accent 上只有 3.7:1，600 档约 5:1。
 * 没有 link 也没有 repo 的写「暂无公开链接」（11.5px，opacity .5），不给死链。
 */
export function ProjectCard({
  project,
  index,
  locale,
  repoLabel,
  noLinkLabel,
  visitLabel,
}: {
  project: Project;
  /** 从 0 开始，卡面上显示成 01 / 02 / 03；奇偶决定蓝还是橙 */
  index: number;
  locale: string;
  repoLabel: string;
  noLinkLabel: string;
  visitLabel: string;
}) {
  const warm = index % 2 === 1;
  // 有线上地址的卡，状态标签一律走主色，不参与蓝橙交替
  const tagClass = warm && !project.link ? "glass-tag-2" : "glass-tag";
  const name = localized(locale, project.name, project.name_en);
  const status = project.status ? localized(locale, project.status, project.status_en) : "";
  const statusLine = [status, project.year].filter(Boolean).join(" · ");

  const title: ReactNode = project.link ? (
    <a
      href={project.link}
      target="_blank"
      rel="noreferrer noopener"
      className="transition-colors hover:text-accent-700"
    >
      {name}
    </a>
  ) : (
    name
  );

  return (
    <article className="glass grid items-center gap-6 p-6 transition-shadow duration-300 hover:shadow-lg sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
      <div className="flex flex-col items-start gap-2">
        <span
          aria-hidden
          className={`font-hand text-[64px] leading-none ${warm ? "text-accent-2-400" : "text-accent-400"}`}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        {statusLine && (
          <span
            className={`rounded-full px-[14px] py-[5px] text-[12px] ${tagClass}`}
          >
            {statusLine}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <h2 className="font-hand text-[26px] leading-[1.25] font-normal text-ink">{title}</h2>

        <p className="text-[14.5px] leading-[1.85] text-ink opacity-[0.78]">
          {localized(locale, project.desc, project.desc_en)}
        </p>

        {project.link && (
          <a
            href={project.link}
            target="_blank"
            rel="noreferrer noopener"
            className="btn-primary-glow mt-2 inline-flex min-h-11 w-fit items-center rounded-full bg-accent-600 px-[26px] py-3 text-[15px] text-bg transition-colors hover:bg-accent-700"
          >
            {visitLabel}
          </a>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {project.stack?.map((tech) => (
            <span key={tech} className="glass-tag-neutral rounded-full px-[14px] py-[5px] text-[12px]">
              {tech}
            </span>
          ))}
          {project.repo ? (
            <a
              href={project.repo}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex min-h-11 items-center px-1 text-[12.5px] text-accent-700 transition-colors hover:text-accent-600"
            >
              {repoLabel}
            </a>
          ) : (
            !project.link && <span className="text-[11.5px] text-ink opacity-50">{noLinkLabel}</span>
          )}
        </div>
      </div>
    </article>
  );
}
