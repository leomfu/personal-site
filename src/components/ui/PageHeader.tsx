import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

/**
 * 内页页头的统一模板（handoff §6.11）：
 *
 *   大写英文标签（ABOUT / PROJECTS / WRITING / …）12px，主色标签底
 *   ↓
 *   h1  clamp(40px, 5vw, 60px) 手写体
 *   ↓
 *   一句引导语 17px / 1.85，max-width 52ch，opacity .78
 *
 * `tag` 是英文单词，中英两版一样（它是版式记号不是文案），所以直接由调用方传字面值，
 * 不走字典。摄影页那一张用橙色（`tone="warm"`），其余都是蓝。
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
    <Reveal className="pt-6 pb-14">
      <span
        className={[
          "inline-block rounded-full px-[14px] py-[5px] text-[12px] tracking-(--tracking-label)",
          tone === "warm"
            ? "bg-accent-2-100 text-accent-2-700"
            : "bg-accent-100 text-accent-700",
        ].join(" ")}
      >
        {tag}
      </span>
      <h1 className="mt-4 font-hand text-[clamp(40px,5vw,60px)] leading-[1.1] font-normal text-ink">
        {title}
      </h1>
      {lead && (
        <p className="mt-4 max-w-[52ch] text-[17px] leading-[1.85] text-body opacity-[0.78]">
          {lead}
        </p>
      )}
    </Reveal>
  );
}

/**
 * 板块标题：手写大字 + 右边一行小注记（首页「在做的 · 2026 年 8 月」）。
 * 尺寸比 h1 略小一档，摄影页的分辑标题另有自己的 28px 那一档，不走这里。
 */
export function SectionTitle({
  title,
  note,
}: {
  title: ReactNode;
  note?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <h2 className="font-hand text-[clamp(34px,4.4vw,54px)] leading-[1.1] font-normal text-ink">
        {title}
      </h2>
      {note && <span className="text-[13px] text-faint">{note}</span>}
    </div>
  );
}

/**
 * 内容区收尾的一句话。
 * ⚠️ 版权行**不在这里** —— 2026-09-17 改版之后它在全站页脚（shell/SiteFooter）里，
 * 一页印两遍没有意义。这一条只留那句「想说点什么就……」。
 */
export function ContentFooter({ note }: { note: ReactNode }) {
  return (
    <div className="mt-14 border-t border-line pt-6 text-[13.5px] leading-[1.8] text-muted">
      {note}
    </div>
  );
}

/** 一句话说明用的小注记行：短横线 + 灰字（工具页底部那行） */
export function FootNote({ children }: { children: ReactNode }) {
  return (
    <div className="mt-14 flex items-center gap-2.5 border-t border-line pt-6 text-[12.5px] text-faint">
      <span className="h-px w-[22px] shrink-0 bg-line" />
      {children}
    </div>
  );
}
