import type { CSSProperties } from "react";

/**
 * 一条彩铅批注：手写的一句话 + 一支手画的箭头（BRIEF R2「彩铅批注层」）。
 * 内容只写事实、用站主的口吻；文案走 next-intl，由调用的页面传进来。
 *
 * 画的节奏由所在幕的 --sc-p 决定：from → to 之间先把字从左往右「写」出来，再画箭头的杆、最后一笔箭头。
 * `timed` 用在首页（首页不滚动）：打开约 1 秒后按时间画。减少动态效果时直接是画好的样子。
 * 位置交给调用处的 className（CSS 里写），这里只管字和箭头怎么排。
 */

export type ArrowDir = "right" | "left" | "down-right" | "down-left" | "up-right" | "up-left" | "down" | "none";

/** 只画朝右的几种，朝左的在 CSS 里水平翻转（paper.css 的 .note--left 等） */
const ARROWS: Record<Exclude<ArrowDir, "none">, { box: string; shaft: string; head: string }> = {
  right: { box: "0 0 100 60", shaft: "M4 40C26 22 58 18 93 30", head: "M81 20L94 30L80 38" },
  left: { box: "0 0 100 60", shaft: "M4 40C26 22 58 18 93 30", head: "M81 20L94 30L80 38" },
  "down-right": { box: "0 0 100 60", shaft: "M8 4C12 32 40 50 88 51", head: "M77 42L89 51L77 58" },
  "down-left": { box: "0 0 100 60", shaft: "M8 4C12 32 40 50 88 51", head: "M77 42L89 51L77 58" },
  "up-right": { box: "0 0 100 60", shaft: "M6 56C34 54 70 40 90 8", head: "M77 11L90 7L91 21" },
  "up-left": { box: "0 0 100 60", shaft: "M6 56C34 54 70 40 90 8", head: "M77 11L90 7L91 21" },
  down: { box: "0 0 40 60", shaft: "M20 3C12 20 28 36 20 54", head: "M11 45L20 56L29 45" },
};

export function Note({
  text,
  arrow = "none",
  tone = "orange",
  from = 0,
  to = 0.3,
  rot,
  timed = false,
  hidden = false,
  auto = false,
  className,
  style,
}: {
  text: string;
  arrow?: ArrowDir;
  tone?: "orange" | "blue";
  /** 所在幕的进度：从这里开始画 */
  from?: number;
  /** 画完 */
  to?: number;
  /** 整条批注的倾斜（度），手写的东西不会正好水平 */
  rot?: number;
  /** 按时间画（首页），不看滚动 */
  timed?: boolean;
  /** 读屏跳过（和旁边的内容重复时） */
  hidden?: boolean;
  /** from / to 按实际布局自动算（components/sketch/DrawDriver），用在 flow 幕和横向轨道里 */
  auto?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const shape = arrow === "none" ? null : ARROWS[arrow];
  const vars = {
    "--from": from,
    "--to": to,
    ...(rot === undefined ? {} : { "--rot": `${rot}deg` }),
    ...style,
  } as CSSProperties;

  return (
    <span
      className={["note", `note--${arrow}`, `note--${tone}`, timed ? "note--timed" : "", className ?? ""].filter(Boolean).join(" ")}
      style={vars}
      data-draw=""
      data-auto={auto ? "" : undefined}
      aria-hidden={hidden || undefined}
    >
      <span className="note__text">{text}</span>
      {shape && (
        <svg className="note__arrow" viewBox={shape.box} aria-hidden focusable="false">
          <path d={shape.shaft} pathLength={1} style={{ "--i": 0, "--n": 2 } as CSSProperties} />
          <path
            className="note__ghost"
            d={shape.shaft}
            pathLength={1}
            transform="translate(1.4 1.2)"
            style={{ "--i": 0, "--n": 2 } as CSSProperties}
          />
          <path d={shape.head} pathLength={1} style={{ "--i": 1, "--n": 2 } as CSSProperties} />
        </svg>
      )}
    </span>
  );
}
