import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

/**
 * 内页页头的统一模板（改版规格 §6.11）：
 *
 *   大写英文标签（ABOUT / PROJECTS / WRITING / …）12px，主色标签底（摄影页用橙色）
 *   ↓
 *   h1  clamp(40px, 5vw, 60px) 手写体
 *   ↓
 *   一句引导语 17px / 1.85，max-width 52ch，opacity .78
 *
 * 上下 padding：上 26.4px，下 56px。三样文字都走 messages 字典。
 */
export function PageHeader({
  tag,
  title,
  lead,
  tone = "cool",
}: {
  tag: string;
  title: ReactNode;
  lead?: ReactNode;
  tone?: "cool" | "warm";
}) {
  return (
    <Reveal className="pt-6 pb-[56px]">
      <span
        className={`inline-block rounded-full px-[14px] py-[5px] text-[12px] ${
          tone === "warm" ? "glass-tag-2" : "glass-tag"
        }`}
      >
        {tag}
      </span>
      <h1 className="mt-4 font-hand text-[clamp(40px,5vw,60px)] leading-[1.1] font-normal text-ink">
        {title}
      </h1>
      {lead && (
        <p className="mt-3 max-w-[52ch] text-[17px] leading-[1.85] text-ink opacity-[0.78]">
          {lead}
        </p>
      )}
    </Reveal>
  );
}

/**
 * 板块标题：手写 h2 + 右边一行小注记（首页「在做的 · 2026 年 8 月」）。
 * h2 是 clamp(34px, 4.4vw, 54px) / 1.1；摄影分辑标题另有自己的 28px 那一档，不走这里。
 */
export function SectionTitle({
  title,
  note,
}: {
  title: ReactNode;
  note?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <h2 className="font-hand text-[clamp(34px,4.4vw,54px)] leading-[1.1] font-normal text-ink">
        {title}
      </h2>
      {note && <span className="text-[13px] text-ink opacity-50">{note}</span>}
    </div>
  );
}
