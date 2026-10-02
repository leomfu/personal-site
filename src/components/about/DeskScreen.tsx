"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Crab } from "@/components/crab/Crab";
import type { Point, Quad } from "@/lib/sceneTypes";

/**
 * 第 1 幕书房图里那台显示器的屏幕（BRIEF R3）：一块真实的网页，贴在图上屏幕的位置。
 *
 * 它放在 ScenePlate 的 .plate__box 里，也就是和书房图同一个变换容器：视差、推镜、俯冲最后一帧的放大
 * 都会带着它一起动。屏幕在图上的四个角来自 lib/scene.ts 的 SCREEN（横版基本是矩形，竖版是透视四边形）。
 * 这里按 .plate__box 的实际尺寸，把一块固定设计尺寸的界面用 matrix3d（单应变换）贴到那四个角上。
 *
 * 屏幕内容是自己画的一个简化聊天界面（不照搬任何真实产品的界面、没有官方 logo），只是装饰画面：
 * 落地后输入框里逐字打出「Hello Claude」、发送，再出一句简短友好的回复。底边住着一只像素小螃蟹。
 * 减少动态效果时直接是对话完成的样子；`still` 时是空白的初始画面（俯冲最后一帧用，和落地后的第一帧一致）。
 */

/** 设计尺寸（px）。横版屏幕约 1.68:1，竖版是透视过的，内容按 1.3:1 排 */
const SIZE = { wide: { w: 640, h: 380 }, tall: { w: 560, h: 430 } } as const;
const TALL_QUERY = "(max-aspect-ratio: 4/5)";

/** 单位正方形 → 四边形的投影矩阵，再缩放到 w×h 的元素上，写成 CSS matrix3d */
function homography(q: [Point, Point, Point, Point], w: number, h: number) {
  const [p0, p1, p2, p3] = q;
  const dx1 = p1.x - p2.x;
  const dx2 = p3.x - p2.x;
  const dx3 = p0.x - p1.x + p2.x - p3.x;
  const dy1 = p1.y - p2.y;
  const dy2 = p3.y - p2.y;
  const dy3 = p0.y - p1.y + p2.y - p3.y;
  const den = dx1 * dy2 - dx2 * dy1 || 1e-9;
  const g = (dx3 * dy2 - dx2 * dy3) / den;
  const hh = (dx1 * dy3 - dx3 * dy1) / den;
  const a = p1.x - p0.x + g * p1.x;
  const b = p3.x - p0.x + hh * p3.x;
  const d = p1.y - p0.y + g * p1.y;
  const e = p3.y - p0.y + hh * p3.y;
  const m = [a / w, d / w, 0, g / w, b / h, e / h, 0, hh / h, 0, 0, 1, 0, p0.x, p0.y, 0, 1];
  return `matrix3d(${m.map((v) => +v.toFixed(8)).join(",")})`;
}

type Stage = "idle" | "typing" | "sent" | "thinking" | "replied";

export function DeskScreen({ quads, still = false }: { quads: { wide: Quad; tall: Quad }; still?: boolean }) {
  const t = useTranslations("desk");
  const tc = useTranslations("crab");
  const ref = useRef<HTMLDivElement | null>(null);
  const [tall, setTall] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [typed, setTyped] = useState(0);
  const hello = t("hello");

  /** 贴合：量 .plate__box 的尺寸，算 matrix3d。尺寸、横竖变了就重算 */
  useEffect(() => {
    const el = ref.current;
    const box = el?.parentElement;
    if (!el || !box) return;
    const media = window.matchMedia(TALL_QUERY);
    const fit = () => {
      const isTall = media.matches;
      setTall(isTall);
      const size = isTall ? SIZE.tall : SIZE.wide;
      const quad = isTall ? quads.tall : quads.wide;
      const bw = box.offsetWidth;
      const bh = box.offsetHeight;
      const px = quad.map((p) => ({ x: p.x * bw, y: p.y * bh })) as Quad;
      el.style.width = `${size.w}px`;
      el.style.height = `${size.h}px`;
      el.style.transform = homography(px, size.w, size.h);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    media.addEventListener("change", fit);
    return () => {
      ro.disconnect();
      media.removeEventListener("change", fit);
    };
  }, [quads]);

  /** 对话：屏幕第一次出现在视口里约 1.2 秒后开始，只演一遍 */
  useEffect(() => {
    if (still) return;
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers: number[] = [];
    const later = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    let started = false;
    const run = () => {
      started = true;
      // 减少动态效果：不演，直接是对话完成的样子
      if (reduce) {
        setTyped(hello.length);
        setStage("replied");
        return;
      }
      let at = 1200;
      later(at, () => setStage("typing"));
      for (let i = 1; i <= hello.length; i++) {
        at += 70 + (hello[i - 1] === " " ? 90 : 0);
        later(at, () => setTyped(i));
      }
      at += 420;
      later(at, () => setStage("sent"));
      at += 380;
      later(at, () => setStage("thinking"));
      at += 1100;
      later(at, () => setStage("replied"));
    };
    const io = new IntersectionObserver((entries) => {
      if (!started && entries.some((e) => e.isIntersecting)) {
        run();
        io.disconnect();
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [still, hello]);

  const sent = stage === "sent" || stage === "thinking" || stage === "replied";
  const draft = stage === "typing" ? hello.slice(0, typed) : "";

  return (
    <div ref={ref} className={`dscreen${tall ? " is-tall" : " is-wide"}`} style={{ "--typed": typed } as CSSProperties}>
      <div className="dscreen__ui" aria-hidden>
        <div className="dscreen__bar">
          <span className="dscreen__dot" />
          <span>{t("chatTitle")}</span>
        </div>
        <div className="dscreen__log">
          <p className={`dscreen__me${sent ? " is-on" : ""}`}>{hello}</p>
          <p className={`dscreen__ai${stage === "thinking" ? " is-thinking" : ""}${stage === "replied" ? " is-on" : ""}`}>
            <span className="dscreen__mark" />
            <span className="dscreen__dots">
              <i />
              <i />
              <i />
            </span>
            <span className="dscreen__reply">{t("reply")}</span>
          </p>
        </div>
        <div className="dscreen__input">
          <span className={`dscreen__text${draft ? "" : " is-empty"}`}>
            {draft || t("placeholder")}
            {stage === "typing" && <span className="dscreen__caret" />}
          </span>
          <span className={`dscreen__send${draft.length === hello.length ? " is-ready" : ""}`}>
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>
      <div className="dscreen__floor">
        <Crab mode="walk" say={tc("hi")} label={tc("deskLabel")} still={still} />
      </div>
    </div>
  );
}
