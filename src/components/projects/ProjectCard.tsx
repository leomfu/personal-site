import type { ReactNode } from "react";
import { localized } from "@/lib/format";
import type { Project } from "@/lib/types";

/**
 * 「我做的」那一栏的项目卡 —— 2026-09-17 改版重做（handoff §6.4）。
 *
 * 一张玻璃卡，内部左右两列 `1fr / 1.6fr`：
 *   左  64px 的手写序号（主色 / 橙色 400 档交替）+ 状态标签
 *   右  26px 手写标题、14.5px/1.85 描述、技术栈标签行 + 「源码 ↗」
 *
 * 序号这次是**实打实的一个数字**，不再是从前那种淡到看不见的底纹 ——
 * 手写体本身已经够轻，压成底纹就只剩一团糊。
 *
 * 没有公开链接的项目写一句「暂无公开链接」（11.5px，opacity .5），不给死链。
 */
export function ProjectCard({
  project,
  index,
  locale,
  repoLabel,
  noLinkLabel,
}: {
  project: Project;
  /** 从 0 开始，卡面上显示成 01 / 02 / 03；奇偶决定序号是蓝还是橙 */
  index: number;
  locale: string;
  repoLabel: string;
  noLinkLabel: string;
}) {
  const name = localized(locale, project.name, project.name_en);
  const desc = localized(locale, project.desc, project.desc_en);
  const no = String(index + 1).padStart(2, "0");

  /** 有线上地址就让标题可点，没有就是纯文字 —— 不给死链 */
  const title: ReactNode = project.link ? (
    <a
      href={project.link}
      target="_blank"
      rel="noreferrer noopener"
      className="transition-colors hover:text-accent-700"
    >
      {name} ↗
    </a>
  ) : (
    name
  );

  return (
    <article className="glass grid gap-6 p-8 transition-shadow duration-300 hover:shadow-lg sm:grid-cols-[1fr_1.6fr] sm:p-10">
      <div className="flex flex-col items-start gap-4">
        <span
          aria-hidden
          className={`font-hand text-[64px] leading-none ${
            index % 2 === 0 ? "text-accent-400" : "text-accent-2-400"
          }`}
        >
          {no}
        </span>
        {project.status && (
          <span className="glass-tag rounded-full px-[14px] py-[5px] text-[12px] text-accent-800">
            {localized(locale, project.status, project.status_en)}
          </span>
        )}
        {project.year && (
          <span className="text-[11.5px] tracking-[0.12em] text-faint tabular-nums">
            {project.year}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <h3 className="font-hand text-[26px] leading-[1.25] font-normal text-ink">{title}</h3>

        <p className="text-[14.5px] leading-[1.85] text-body">{desc}</p>

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
          {project.stack?.map((tech) => (
            <span
              key={tech}
              className="rounded-full bg-neutral-200 px-[12px] py-[4px] text-[11.5px] text-muted"
            >
              {tech}
            </span>
          ))}
          {project.repo && (
            <a
              href={project.repo}
              target="_blank"
              rel="noreferrer noopener"
              className="text-[12.5px] text-accent-700 underline decoration-accent-300 underline-offset-4 transition-colors hover:decoration-accent-700"
            >
              {repoLabel} ↗
            </a>
          )}
          {!project.link && !project.repo && (
            <span className="text-[11.5px] text-muted opacity-50">{noLinkLabel}</span>
          )}
        </div>
      </div>
    </article>
  );
}
