"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { CLAWD, HELMET_BOX, HELMET_PARTS, LOOKS, type Part, type Rect, type Variant } from "./art";
import { useCrabMind } from "./useCrabMind";
import "./crab.css";

/**
 * Claude 小螃蟹一家（BRIEF R6 / R7）：身体照 clawd.svg（Claude Code 里那只像素小螃蟹），
 * 每个区域一只，穿不同的衣服、做不同的招牌动作。像素图在 ./art.ts，动作在 ./crab.css。
 *
 *   进入视口      做一次招牌动作（desk 那只例外：等屏幕里的「Hello Claude」发出去，由 actKey 触发）
 *   之后          自主意识（useCrabMind.ts）：在自己的轨道里走动、东张西望、做专属小动作、
 *                鼠标靠近会走过来看、整页 30 秒没动静会坐下打瞌睡
 *   点 / 回车 / 轻点   招牌动作 + 冒一个气泡（lines 轮换，第三人称介绍站主，只写事实）
 *   减少动态效果   静态姿势；点一下只换姿势、出气泡（气泡只淡入淡出，不位移）
 *   离屏 / 页面隐藏 所有循环暂停（.is-off），计时器也停
 *
 * 只动 transform / opacity。动作只在这个形状上做：腿交替上下、整体位移、眼睛变短（眨眼）、
 * 一侧钳子上下（挥手）、道具的小动作。组件本身是 <button>，有 aria-label；
 * 这一页不带 globals.css 也能用（404），样式和颜色都在 crab.css 里自给自足。
 */

export type CrabSide = "up" | "up-left" | "up-right" | "left" | "right" | "auto";

function Rects({ rects }: { rects: Rect[] }) {
  return (
    <>
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.f} />
      ))}
    </>
  );
}

function PartG({ part }: { part: Part }) {
  return (
    <g
      className={`crab__part crab__${part.name}`}
      style={part.origin ? { transformOrigin: `${part.origin[0]}px ${part.origin[1]}px` } : undefined}
    >
      <Rects rects={part.rects} />
    </g>
  );
}

/** 只画图：给俯冲最后一帧那种「不能点、不会动」的地方用，也是 Crab 自己的画面 */
export function CrabArt({ variant }: { variant: Variant }) {
  const look = LOOKS[variant];
  const [x, y, w, h] = look.box;
  const on = (layer: Part["layer"], above?: boolean) =>
    look.parts
      .filter((p) => p.layer === layer && Boolean(p.above) === Boolean(above))
      .map((p) => <PartG key={p.name} part={p} />);
  const { body, clawL, clawR, eyeL, eyeR, legs, color, eye } = CLAWD;
  return (
    <svg className="crab__svg" viewBox={`${x} ${y} ${w} ${h}`} shapeRendering="crispEdges" aria-hidden focusable="false">
      <g className="crab__all">
        {on("back")}
        <g className="crab__legs crab__legs--a">
          <Rects rects={[legs[0], legs[2]].map((l) => ({ ...l, f: color }))} />
        </g>
        <g className="crab__legs crab__legs--b">
          <Rects rects={[legs[1], legs[3]].map((l) => ({ ...l, f: color }))} />
        </g>
        <rect className="crab__torso" x={body.x} y={body.y} width={body.w} height={body.h} fill={color} />
        <g className="crab__eyes">
          <rect className="crab__eye" x={eyeL.x} y={eyeL.y} width={eyeL.w} height={eyeL.h} fill={eye} />
          <rect className="crab__eye" x={eyeR.x} y={eyeR.y} width={eyeR.w} height={eyeR.h} fill={eye} />
        </g>
        <g className="crab__claw crab__claw--l">
          {on("clawL")}
          <rect x={clawL.x} y={clawL.y} width={clawL.w} height={clawL.h} fill={color} />
          {on("clawL", true)}
        </g>
        <g className="crab__claw crab__claw--r">
          {on("clawR")}
          <rect x={clawR.x} y={clawR.y} width={clawR.w} height={clawR.h} fill={color} />
          {on("clawR", true)}
        </g>
        {on("front")}
        {on("fx")}
      </g>
    </svg>
  );
}

/** 摘下来的头盔（落到书桌时用）：和 flyer 同一套坐标，画框是宇航员那一套 */
export function HelmetArt() {
  const [x, y, w, h] = HELMET_BOX;
  return (
    <svg className="crab__svg" viewBox={`${x} ${y} ${w} ${h}`} shapeRendering="crispEdges" aria-hidden focusable="false">
      {HELMET_PARTS.map((p) => (
        <PartG key={p.name} part={p} />
      ))}
    </svg>
  );
}

export function Crab({
  variant,
  label,
  lines = [],
  side = "up",
  size,
  roam = false,
  greet = true,
  actKey,
  playing = false,
  still = false,
  className,
  style,
}: {
  variant: Variant;
  /** 读屏文字（按钮的 aria-label） */
  label?: string;
  /** 气泡里轮换的几句话（1–3 句），第三人称、只写事实 */
  lines?: string[];
  /** 气泡冒在哪边：上方居中 / 上方往左展开 / 上方往右展开 / 左 / 右 */
  side?: CrabSide;
  /** 身体（112 那一截）画多宽，px。不给就用 CSS 的 --crab-size（各个位置自己在 CSS 里定，手机上可以更小） */
  size?: number;
  /** 待机时在父元素宽度里走几步（书桌前那只在窗口顶边上溜达） */
  roam?: boolean;
  /** 第一次进入视口时自己做一次招牌动作 */
  greet?: boolean;
  /** 外面要它做招牌动作时就把这个数加一（屏幕里的「Hello Claude」发出去那一刻） */
  actKey?: number;
  /** 迷你播放器正在放歌（只有戴耳机那只看它）：跟着点头 */
  playing?: boolean;
  /** 只画一只不动、不能点的（俯冲最后一帧用） */
  still?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const rootRef = useRef<HTMLElement | null>(null);
  const playingRef = useRef(playing);
  /** 气泡：n 每说一句加一（换一句就重新冒一次），on 是现在看不看得见（收起时字留着，好淡出） */
  const [say, setSay] = useState({ text: "", n: 0, on: false });
  const [pose, setPose] = useState(false);
  /** side="auto"：点的那一刻看自己在父元素的左半边还是右半边，气泡往空的那边冒 */
  const [autoSide, setAutoSide] = useState<"left" | "right">("left");
  const turnRef = useRef(0);

  const look = LOOKS[variant];
  const css = {
    "--crab-w": look.box[2],
    "--crab-h": look.box[3],
    ...(size ? { "--crab-size": `${size}px` } : {}),
    ...style,
  } as CSSProperties;
  const sideNow = side === "auto" ? autoSide : side;
  const cls = ["crab", `crab--${variant}`, `crab--say-${sideNow}`, still ? "crab--still" : "", className ?? ""]
    .filter(Boolean)
    .join(" ");

  const { actRef, reduceRef } = useCrabMind(rootRef, { variant, roam, still, greet, playingRef });

  // 外部触发（屏幕里的消息发出去了）：做一次招牌动作
  useEffect(() => {
    if (!actKey || still || reduceRef.current) return;
    actRef.current();
  }, [actKey, still, actRef, reduceRef]);

  // 正在放歌：戴耳机那只跟着点头（减少动态效果时不点）
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    playingRef.current = playing;
    root.classList.toggle("is-groove", playing && !reduceRef.current);
  }, [playing, reduceRef]);

  // 气泡：字越多停得越久
  const { n: sayN, on: sayOn, text: sayText } = say;
  useEffect(() => {
    if (!sayOn) return;
    const ms = Math.min(5200, Math.max(2400, 1500 + sayText.length * 70));
    const id = window.setTimeout(() => setSay((s) => ({ ...s, on: false })), ms);
    return () => window.clearTimeout(id);
  }, [sayN, sayOn, sayText]);

  if (still) {
    return (
      <span
        ref={(el) => {
          rootRef.current = el;
        }}
        className={cls}
        style={css}
        aria-hidden
      >
        <CrabArt variant={variant} />
      </span>
    );
  }

  const onClick = () => {
    const root = rootRef.current;
    const floor = root?.parentElement;
    if (side === "auto" && root && floor) {
      const r = root.getBoundingClientRect();
      const f = floor.getBoundingClientRect();
      setAutoSide(r.left + r.width / 2 > f.left + f.width / 2 ? "left" : "right");
    }
    if (reduceRef.current) setPose((p) => !p);
    else actRef.current();
    if (lines.length) {
      const text = lines[turnRef.current % lines.length];
      turnRef.current += 1;
      setSay((prev) => ({ text, n: prev.n + 1, on: true }));
    }
  };

  return (
    <>
      <button
        ref={(el) => {
          rootRef.current = el;
        }}
        type="button"
        className={`${cls}${pose ? " is-pose" : ""}`}
        style={css}
        aria-label={label}
        onClick={onClick}
      >
        <CrabArt variant={variant} />
        <span className="crab__zzz" aria-hidden>
          <i>z</i>
          <i>z</i>
          <i>Z</i>
        </span>
        {sayN > 0 && (
          <span key={sayN} className={`crab__say${sayOn ? " is-on" : ""}`} aria-hidden>
            {sayText}
          </span>
        )}
      </button>
      <span className="crab__sr" aria-live="polite">
        {sayText}
      </span>
    </>
  );
}
