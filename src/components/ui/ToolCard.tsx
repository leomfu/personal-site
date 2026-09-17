import type { CSSProperties } from "react";
import { ToolIcon } from "@/components/icons/ToolIcon";
import type { Tool } from "@/lib/types";

/**
 * 工具卡片 —— 改版定稿（docs/design/改版规格.md §6.8）。
 *
 * 一枚 999px 的玻璃胶囊卡：48px 圆形图标底（雾蓝底 + accent-800 的图标）、
 * 15.5px/600 名称、12.5px opacity .6 说明、右侧主色 ↗。hover 上浮 4px 并升到 shadow-md。
 *
 * ⚠️ **图标 hover 亮各自品牌色这条例外保留**（tools.json 的 brandColor）。
 */
export function ToolCard({ tool, desc }: { tool: Tool; desc: string }) {
  return (
    <a
      href={tool.url}
      target="_blank"
      rel="noreferrer noopener"
      style={{ "--brand": tool.brandColor || "var(--color-accent-700)" } as CSSProperties}
      className="glass group flex items-center gap-4 rounded-full p-4 transition-[transform,box-shadow] duration-[250ms] hover:-translate-y-1 hover:shadow-md"
    >
      <span className="flex size-[48px] shrink-0 items-center justify-center rounded-full bg-bg text-accent-800 transition-colors duration-300 group-hover:text-[var(--brand)]">
        <ToolIcon name={tool.icon} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[15.5px] font-semibold text-ink">{tool.name}</span>
        <span className="truncate text-[12.5px] text-ink opacity-60">{desc}</span>
      </span>
      <span className="shrink-0 pr-1 text-[15px] text-accent" aria-hidden>
        ↗
      </span>
    </a>
  );
}
