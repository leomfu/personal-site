"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Crab } from "@/components/crab/Crab";
import type { Point, Quad } from "@/lib/sceneTypes";

/**
 * 第 1 幕书房图里那台 MacBook 的屏幕（BRIEF R6 第 2 条、R7）：一块真实的网页，贴在图上屏幕的位置。
 *
 * 它放在 ScenePlate 的 .plate__box 里，也就是和书房图同一个变换容器：视差、推镜都会带着它一起动。.plate__box 就是整张图按 cover 缩放后的大小（被视口裁掉的部分也算在里面），
 * 所以屏幕四个角（lib/scene.ts 的 SCREEN，相对图片宽高的比例）直接乘 box 的宽高就是像素位置，裁切自动算进去了。
 * 这里按那四个角，把一块固定设计尺寸的界面用 matrix3d（单应变换）贴上去。2026-10-06 的新书房图横竖两张都差不多正对镜头，
 * 屏幕是下沿略宽的轻微梯形。四个角往外多放一点点（BLEED），边上不会漏出底图那块黑屏。
 *
 * 屏幕内容是一个简化的 Claude 应用窗口（自己画的示意，不是截图，没有官方 logo 矢量，也不冒充真实对话）：
 * 暖色浅底、标题栏、右边用户气泡「Hello Claude」、左边一句简短友好的回复（橙色星芒代表 Claude）、底部输入框。
 * 2026-10-05 开场下线后，页面一打开就是对话已经完成的样子（「Hello Claude」和回复都在），桌宠蹲在窗口顶边上。
 * 手机上屏幕只有两百像素上下宽：不要标题栏的字，只留气泡、输入框和小螃蟹，字号按屏幕放大。
 */

/** 设计尺寸（px）：和屏幕在图上的长宽比一致（2026-10-06 新图：横版 516×327 ≈ 1.58，竖版 590×314 ≈ 1.88） */
const SIZE = { wide: { w: 640, h: 406 }, tall: { w: 640, h: 340 } } as const;
/** 四个角从中心往外放大的比例（约 1 个图片像素，免得缩放取整后露出黑边；银框有 4–5px，盖不到） */
const BLEED = { wide: 0.004, tall: 0.004 } as const;
const TALL_QUERY = "(max-aspect-ratio: 4/5)";

/** 单位正方形 → 四边形的投影矩阵，再缩放到 w×h 的元素上，写成 CSS matrix3d（transform-origin 0 0） */
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

/** 四个角从中心往外推一点 */
function grow(q: Quad, k: number): Quad {
  const cx = (q[0].x + q[1].x + q[2].x + q[3].x) / 4;
  const cy = (q[0].y + q[1].y + q[2].y + q[3].y) / 4;
  return q.map((p) => ({ x: cx + (p.x - cx) * (1 + k), y: cy + (p.y - cy) * (1 + k) })) as Quad;
}

/** 橙色星芒：自己画的十道光（长短交替），代表 Claude。不是官方 logo 的矢量 */
function Spark() {
  const rays = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 ? 7.2 : 10;
    return `M${(12 + Math.cos(a) * 2.6).toFixed(2)} ${(12 + Math.sin(a) * 2.6).toFixed(2)}L${(12 + Math.cos(a) * r).toFixed(2)} ${(12 + Math.sin(a) * r).toFixed(2)}`;
  }).join("");
  return (
    <svg className="dscreen__spark" viewBox="0 0 24 24" aria-hidden focusable="false">
      <path d={rays} />
    </svg>
  );
}

export function DeskScreen({
  quads,
  crabLabel,
  crabLines,
}: {
  quads: { wide: Quad; tall: Quad };
  /** 桌宠按钮的读屏文字和气泡（服务端从 content/ 现取，见 lib/crabLines） */
  crabLabel?: string;
  crabLines?: string[];
}) {
  const t = useTranslations("desk");
  const ref = useRef<HTMLDivElement | null>(null);
  const [tall, setTall] = useState(false);

  /** 贴合：量 .plate__box 的尺寸，算 matrix3d。尺寸、横竖变了就重算 */
  useEffect(() => {
    const el = ref.current;
    const box = el?.parentElement;
    if (!el || !box) return;
    const media = window.matchMedia(TALL_QUERY);
    const fit = () => {
      const isTall = media.matches;
      setTall(isTall);
      const key = isTall ? "tall" : "wide";
      const size = SIZE[key];
      const bw = box.offsetWidth;
      const bh = box.offsetHeight;
      const px = quads[key].map((p) => ({ x: p.x * bw, y: p.y * bh })) as Quad;
      el.style.width = `${size.w}px`;
      el.style.height = `${size.h}px`;
      el.style.transform = homography(grow(px, BLEED[key]), size.w, size.h);
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

  return (
    <div ref={ref} className={`dscreen${tall ? " is-tall" : " is-wide"}`}>
      {/* 窗口顶边上面那一条：桌宠蹲在这儿，偶尔沿着窗口顶边走几步 */}
      <div className="dscreen__perch">
        <Crab variant="desk" roam greet={false} side="auto" label={crabLabel} lines={crabLines} className="dscreen__crab" />
      </div>
      <div className="dscreen__win" aria-hidden>
        <div className="dscreen__bar">
          <span className="dscreen__lights">
            <i />
            <i />
            <i />
          </span>
          <span className="dscreen__title">{t("chatTitle")}</span>
        </div>
        <div className="dscreen__log">
          <p className="dscreen__me">{t("hello")}</p>
          <div className="dscreen__ai">
            <Spark />
            <p className="dscreen__reply">{t("reply")}</p>
          </div>
        </div>
        <div className="dscreen__input">
          <span className="dscreen__text is-empty">{t("placeholder")}</span>
          <span className="dscreen__send">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden focusable="false">
              <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}
