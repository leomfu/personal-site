"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Crab, CrabArt } from "@/components/crab/Crab";
import type { Point, Quad } from "@/lib/sceneTypes";

/**
 * 第 1 幕书房图里那台 MacBook 的屏幕（BRIEF R6 第 2 条、R7）：一块真实的网页，贴在图上屏幕的位置。
 *
 * 它放在 ScenePlate 的 .plate__box 里，也就是和书房图同一个变换容器：视差、推镜、俯冲最后一帧的放大
 * 都会带着它一起动。.plate__box 就是整张图按 cover 缩放后的大小（被视口裁掉的部分也算在里面），
 * 所以屏幕四个角（lib/scene.ts 的 SCREEN，相对图片宽高的比例）直接乘 box 的宽高就是像素位置，裁切自动算进去了。
 * 这里按那四个角，把一块固定设计尺寸的界面用 matrix3d（单应变换）贴上去：横版屏幕正对镜头，竖版是透视四边形。
 * 四个角往外多放一点点（BLEED），边上不会漏出底图那块亮屏。
 *
 * 屏幕内容是一个简化的 Claude 应用窗口（自己画的示意，不是截图，没有官方 logo 矢量，也不冒充真实对话）：
 * 暖色浅底、标题栏、右边用户气泡「Hello Claude」、左边一句简短友好的回复（橙色星芒代表 Claude）、底部输入框。
 * 第 1 幕里小宇航员落到书桌、摘了头盔、跳上窗口顶边变成桌宠之后（DeskLanding 在书桌那一幕上打 data-landed、
 * 发 wl:landed），输入框里才逐字打出「Hello Claude」，发送，再出回复；消息发出去那一刻，桌宠跳起来挥手。
 * 手机上屏幕只有一百多像素宽：不要标题栏的字，只留气泡、输入框和小螃蟹，字号按屏幕放大。
 * 减少动态效果时直接是对话完成的样子；`still` 时是还没打字的初始画面（第 0 幕穿过窗户后的那一帧用，和第 1 幕 p = 0 一致），
 * 那里 `pet={false}`：桌宠还没到。
 */

/** 设计尺寸（px）：和屏幕在图上的长宽比一致（横版 553×353 ≈ 1.57，竖版透视过的约 1.25） */
const SIZE = { wide: { w: 640, h: 408 }, tall: { w: 560, h: 450 } } as const;
/** 四个角从中心往外放大的比例（坐标本身已经比亮屏大 2px 左右，这里再保险一点点，免得缩放取整后露出亮边） */
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

type Stage = "idle" | "typing" | "sent" | "thinking" | "replied";

export function DeskScreen({
  quads,
  still = false,
  pet = true,
  crabLabel,
  crabLines,
}: {
  quads: { wide: Quad; tall: Quad };
  still?: boolean;
  /** 窗口顶边上有没有桌宠（第 0 幕穿窗那一帧里还没有） */
  pet?: boolean;
  /** 桌宠按钮的读屏文字和气泡（服务端从 content/ 现取，见 lib/crabLines） */
  crabLabel?: string;
  crabLines?: string[];
}) {
  const t = useTranslations("desk");
  const ref = useRef<HTMLDivElement | null>(null);
  const [tall, setTall] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [typed, setTyped] = useState(0);
  const [hop, setHop] = useState(0);
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

  /**
   * 对话：小螃蟹从屏幕下沿钻进来、走到输入框前以后才开始，只演一遍（DeskLanding 发 wl:landed；演完发 wl:replied，它再跳上顶边）。
   * 被跳过 / 直接打开 / 看过一次了 / 减少动态效果（书桌那一幕上有 data-final，或收到 wl:finish）：直接是对话完成的样子。
   * 没有 DeskLanding 的地方（以后别处复用）退回老规矩：屏幕第一次出现在视口里约 1.4 秒后开始。
   */
  useEffect(() => {
    if (still) return;
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers: number[] = [];
    const later = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    const desk = el.closest<HTMLElement>("[data-desk-landing]");
    let started = false;
    const finish = () => {
      started = true;
      timers.splice(0).forEach((id) => window.clearTimeout(id));
      setTyped(hello.length);
      setStage("replied");
    };
    const run = (lead: number) => {
      if (started) return;
      started = true;
      if (reduce) {
        later(0, finish);
        return;
      }
      let at = lead;
      later(at, () => setStage("typing"));
      for (let i = 1; i <= hello.length; i++) {
        at += 75 + (hello[i - 1] === " " ? 110 : 0);
        later(at, () => setTyped(i));
      }
      at += 460;
      later(at, () => {
        setStage("sent");
        // 消息发出去：桌宠跳起来挥手
        setHop((n) => n + 1);
      });
      at += 420;
      later(at, () => setStage("thinking"));
      at += 1150;
      later(at, () => {
        setStage("replied");
        desk?.dispatchEvent(new Event("wl:replied"));
      });
    };

    let io: IntersectionObserver | null = null;
    const onLanded = () => run(350);
    if (desk) {
      if (desk.hasAttribute("data-final") || reduce) later(0, finish);
      else desk.addEventListener("wl:landed", onLanded);
      desk.addEventListener("wl:finish", finish);
    } else {
      io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          run(1400);
          io?.disconnect();
        }
      });
      io.observe(el);
    }
    return () => {
      io?.disconnect();
      desk?.removeEventListener("wl:landed", onLanded);
      desk?.removeEventListener("wl:finish", finish);
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [still, hello]);

  const sent = stage === "sent" || stage === "thinking" || stage === "replied";
  const draft = stage === "typing" ? hello.slice(0, typed) : "";
  const ready = stage === "typing" && typed === hello.length;

  return (
    <div ref={ref} className={`dscreen${tall ? " is-tall" : " is-wide"}`} style={{ "--typed": typed } as CSSProperties}>
      {/* 窗口顶边上面那一条：桌宠蹲在这儿，偶尔沿着窗口顶边走几步 */}
      <div className="dscreen__perch">
        {pet && (
        <Crab
          variant="desk"
          roam
          greet={false}
          actKey={hop}
          still={still}
          side="auto"
          label={crabLabel}
          lines={crabLines}
          className="dscreen__crab"
        />
        )}
      </div>
      {/* 进屏幕的那只（小尺寸）：从屏幕下沿钻进来，走到输入框前；演完跳上顶边，这只就藏起来 */}
      {!still && (
        <span className="dscreen__walker" aria-hidden>
          <span className="crab crab--desk crab--still dscreen__wcrab" style={{ "--crab-w": 112, "--crab-h": 78 } as CSSProperties}>
            <CrabArt variant="desk" />
          </span>
        </span>
      )}
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
          <p className={`dscreen__me${sent ? " is-on" : ""}`}>{hello}</p>
          <div className={`dscreen__ai${stage === "thinking" ? " is-thinking" : ""}${stage === "replied" ? " is-on" : ""}`}>
            <Spark />
            <p className="dscreen__reply">{t("reply")}</p>
          </div>
        </div>
        <div className="dscreen__input">
          <span className={`dscreen__text${draft ? "" : " is-empty"}`}>
            {draft || t("placeholder")}
            {stage === "typing" && <span className="dscreen__caret" />}
          </span>
          <span className={`dscreen__send${ready ? " is-ready" : ""}`}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden focusable="false">
              <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}
