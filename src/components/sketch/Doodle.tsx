import type { CSSProperties } from "react";

/**
 * 爱好涂鸦（BRIEF R2）：站主海报上的拳击手套、跑鞋、泳镜，再加相机、黑胶。
 * 彩铅线条，散在页边，不挡内容；只是装饰，读屏跳过。
 * 每一笔一条 path（pathLength=1），随所在幕的 --sc-p 一笔接一笔画出来（paper.css 的 .doodle）。
 * 小螃蟹不画成涂鸦：它是 Claude Code 里那只像素小螃蟹（components/crab），每个区域住一只（BRIEF R6 / R7）。
 */

export type DoodleKind = "glove" | "shoe" | "goggles" | "camera" | "vinyl";

/** 100 × 100 的画布里手画的线 */
const STROKES: Record<DoodleKind, string[]> = {
  glove: [
    "M32 88L30 66C16 64 10 50 20 41C24 38 28 40 30 43C24 28 34 11 54 10C76 9 89 26 85 46C83 58 75 66 67 68L69 89",
    "M30 43C35 47 37 55 33 62",
    "M31 75C43 78 56 79 68 77",
    "M32 88C44 91 57 92 69 89",
    "M50 36C58 40 68 40 77 35",
  ],
  shoe: [
    "M8 68C8 76 14 78 22 78L84 78C92 78 95 72 91 66",
    "M9 68L92 66",
    "M9 68C10 56 16 48 28 46L42 42C48 32 54 28 62 30C64 42 72 50 84 56C92 60 93 64 91 66",
    "M44 42L52 50M49 37L57 45M54 33L61 40",
    "M20 56C30 54 40 58 46 66",
  ],
  goggles: [
    "M14 50C15 37 41 35 46 49C44 63 16 64 14 50Z",
    "M86 50C85 37 59 35 54 49C56 63 84 64 86 50Z",
    "M20 50C21 42 38 41 41 50C39 58 22 59 20 50Z",
    "M80 50C79 42 62 41 59 50C61 58 78 59 80 50Z",
    "M46 48C48 44 52 44 54 48",
    "M14 46C8 44 4 40 2 34M14 55C7 56 3 54 1 49M86 46C92 44 96 40 98 34M86 55C93 56 97 54 99 49",
  ],
  camera: [
    "M14 36L86 36C90 36 92 38 92 42L92 76C92 80 90 82 86 82L14 82C10 82 8 80 8 76L8 42C8 38 10 36 14 36Z",
    "M34 36L40 26L60 26L66 36",
    "M67 59A17 17 0 1 1 33 59A17 17 0 1 1 67 59",
    "M58 59A8 8 0 1 1 42 59A8 8 0 1 1 58 59",
    "M74 30L84 30M15 45L24 45",
  ],
  vinyl: [
    "M90 50A40 40 0 1 1 10 50A40 40 0 1 1 90 50",
    "M80 50A30 30 0 1 1 20 50A30 30 0 1 1 80 50",
    "M62 50A12 12 0 1 1 38 50A12 12 0 1 1 62 50",
    "M52 50A2 2 0 1 1 48 50A2 2 0 1 1 52 50",
    "M28 30C34 22 44 18 54 18",
  ],
};

export function Doodle({
  kind,
  tone = "orange",
  from = 0,
  to = 0.4,
  rot = 0,
  auto = false,
  className,
  style,
}: {
  kind: DoodleKind;
  /** from / to 按实际布局自动算（components/sketch/DrawDriver） */
  auto?: boolean;
  tone?: "orange" | "blue";
  from?: number;
  to?: number;
  rot?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const strokes = STROKES[kind];
  return (
    <svg
      className={["doodle", `doodle--${tone}`, className ?? ""].filter(Boolean).join(" ")}
      viewBox="0 0 100 100"
      style={{ "--from": from, "--to": to, "--rot": `${rot}deg`, ...style } as CSSProperties}
      aria-hidden
      focusable="false"
      data-draw=""
      data-auto={auto ? "" : undefined}
    >
      {strokes.map((d, i) => (
        <path key={i} d={d} pathLength={1} style={{ "--i": i, "--n": strokes.length } as CSSProperties} />
      ))}
    </svg>
  );
}

export type MarkKind = "circle" | "wave" | "underline" | "star";

/** 盖在文字上的彩铅记号。circle / wave / underline 会被拉伸到目标的大小（preserveAspectRatio none） */
const MARKS: Record<MarkKind, { box: string; strokes: string[]; stretch: boolean }> = {
  circle: {
    box: "0 0 100 60",
    strokes: ["M14 12C34 2 80 2 94 18C104 32 90 52 56 56C24 59 2 50 4 32C5 20 20 10 40 7"],
    stretch: true,
  },
  wave: { box: "0 0 100 12", strokes: ["M2 7C10 2 16 11 24 6S38 2 46 7 60 11 68 6 82 2 90 7 96 9 98 6"], stretch: true },
  underline: { box: "0 0 100 12", strokes: ["M2 8C30 4 64 5 98 6", "M8 10C36 8 62 8 90 9"], stretch: true },
  star: { box: "0 0 40 40", strokes: ["M20 4L20 36", "M6 12L34 28", "M34 12L6 28"], stretch: false },
};

export function Mark({
  kind,
  tone = "orange",
  from = 0,
  to = 0.3,
  auto = false,
  className,
  style,
}: {
  kind: MarkKind;
  auto?: boolean;
  tone?: "orange" | "blue";
  from?: number;
  to?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const mark = MARKS[kind];
  return (
    <svg
      className={["mark", `mark--${kind}`, `mark--${tone}`, className ?? ""].filter(Boolean).join(" ")}
      viewBox={mark.box}
      preserveAspectRatio={mark.stretch ? "none" : undefined}
      style={{ "--from": from, "--to": to, ...style } as CSSProperties}
      aria-hidden
      focusable="false"
      data-draw=""
      data-auto={auto ? "" : undefined}
    >
      {mark.strokes.map((d, i) => (
        <path key={i} d={d} pathLength={1} style={{ "--i": i, "--n": mark.strokes.length } as CSSProperties} />
      ))}
    </svg>
  );
}
