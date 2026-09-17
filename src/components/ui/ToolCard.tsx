import type { CSSProperties } from "react";
import { ToolIcon } from "@/components/icons/ToolIcon";
import type { Tool } from "@/lib/types";

/**
 * 工具卡片 —— 2026-09-17 改版重做（handoff §6.8）。
 *
 * 一枚 999px 的胶囊卡：48px 圆形图标底（雾蓝底 + accent-800 的图标）、
 * 15.5px/600 名称、12.5px opacity .6 说明、右侧主色 ↗。
 * hover 上浮 4px 并升到 shadow-md。
 *
 * ⚠️ **图标 hover 亮各自品牌色这条例外保留**：这是全站少数几处彩色之一，
 * 改版前后都成立（现在页面本来就有蓝橙两色，但品牌色仍然只在这里出现）。
 */
export function ToolCard({
  tool,
  desc,
}: {
  tool: Tool;
  desc: string;
}) {
  return (
    <a
      href={tool.url}
      target="_blank"
      rel="noreferrer noopener"
      style={{ "--brand": tool.brandColor || "var(--color-accent-700)" } as CSSProperties}
      className="glass group flex items-center gap-4 rounded-full py-2.5 pr-6 pl-2.5 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-md"
    >
      <span className="flex size-[48px] shrink-0 items-center justify-center rounded-full bg-bg text-accent-800 transition-colors duration-300 group-hover:text-[var(--brand)]">
        <ToolIcon name={tool.icon} />
      </span>
      <span className="flex min-w-0 grow flex-col gap-0.5">
        <span className="truncate text-[15.5px] font-semibold text-ink">{tool.name}</span>
        <span className="truncate text-[12.5px] text-muted opacity-60">{desc}</span>
      </span>
      <span className="shrink-0 text-[15px] text-accent" aria-hidden>
        ↗
      </span>
    </a>
  );
}
