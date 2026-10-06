"use client";

import { createContext, useCallback, useContext, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";

/**
 * 首页 → /about/ 的冲击转场：「光点爆开冲进去」（2026-10-06 站主选定）。总长约 0.7 秒，点下去自动放完：
 *
 *   0–300ms     冲   以上海光点为中心，首页整页猛地推近（ease-in 加速）；
 *                    叠两层同样以光点为中心、放得更大的半透明首页副本 + 一圈放射状光线，像一次径向速度模糊
 *                    （全是 transform / opacity，不用实时 filter: blur）
 *   300–450ms   爆   一团暖白的光从光点炸开，盖满全屏（暖白和书房台灯的光同一个色相）
 *   450ms       跳   光盖满的那一刻才 router.push；等 /about/ 的引擎挂好（`wl:engine`）、书房图 decode 完
 *   之后 250ms  散   光淡出，书房第一屏已经在眼前，从 1.04 缩回 1 落定
 *
 * 新页面迟迟没好（网络慢）：光就停在盖满的状态等着，最多等 3 秒，到点照样揭开。
 * 只有从首页的两个入口（WarpLink）点进来才放；直接打开 /about/、从别的页进来都没有这一段。
 * 减少动态效果时什么都不放，直接跳。
 *
 * 这一层挂在 [locale]/layout 上（跳页时不卸载），盖层才能跨过路由切换一直留在屏幕上，两头接得上。
 * 时间和颜色写在这里和 styles/warp.css 里，改的时候两边一起看。
 */

type Origin = { x: number; y: number };

const WarpContext = createContext<{ warp: (href: string, origin?: Origin) => void; preload: (href: string) => void } | null>(null);

export function useWarp() {
  return useContext(WarpContext);
}

/** 时间轴（毫秒） */
const T = {
  /** 首页推近（包含被光盖住之后那一小段，推近不停） */
  push: 450,
  /** 闪光开始炸开 */
  flashAt: 280,
  /** 闪光盖满（= 跳页） */
  full: 450,
  /** 揭开：闪光淡出 + 书房落定 */
  out: 250,
  /** 新页面最多等多久 */
  wait: 3000,
} as const;

/** 首页推近到多大；两层副本各自再大多少、多亮 */
const ZOOM = 3.4;
const GHOSTS = [
  { scale: 1.12, opacity: 0.34 },
  { scale: 1.28, opacity: 0.2 },
] as const;
/** 闪光圆本身的直径（px）。只画这么大，用 scale 放到盖满全屏，免得生成一张巨大的图层 */
const FLASH_SIZE = 512;

const EASE_IN = "cubic-bezier(0.55, 0, 0.9, 0.4)";
const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";

/** 去掉末尾的斜杠再比路径（trailingSlash 打开了，两边写法可能不一样） */
const samePath = (a: string, b: string) => a.replace(/\/+$/, "") === b.replace(/\/+$/, "");

export function WarpProvider({ room, children }: { room: { wide: string; tall: string | null }; children: ReactNode }) {
  const router = useRouter();
  const layer = useRef<HTMLDivElement | null>(null);
  const busy = useRef(false);
  const warmed = useRef(new Set<string>());
  const roomImg = useRef<HTMLImageElement | null>(null);

  /** 预加载：书房图（按当前横竖选那一张）+ /about/ 的路由数据。光标移上入口、键盘聚焦、点下去时各调一次，只做一次 */
  const preload = useCallback(
    (href: string) => {
      if (!roomImg.current) {
        const tall = room.tall && window.matchMedia("(max-aspect-ratio: 4/5)").matches;
        const img = new Image();
        img.decoding = "async";
        img.src = tall ? (room.tall as string) : room.wide;
        roomImg.current = img;
      }
      if (!warmed.current.has(href)) {
        warmed.current.add(href);
        router.prefetch(href);
      }
    },
    [room, router],
  );

  const warp = useCallback(
    (href: string, at?: Origin) => {
      if (busy.current) return;
      const el = layer.current;
      const home = document.querySelector<HTMLElement>(".home");
      if (!el || !home || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        router.push(href);
        return;
      }
      busy.current = true;
      preload(href);

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const o = at ?? { x: vw / 2, y: vh / 2 };
      const box = home.getBoundingClientRect();
      const origin = `${(o.x - box.left).toFixed(1)}px ${(o.y - box.top).toFixed(1)}px`;
      // 光点离最远那个角多远：闪光要放到这么大才盖得满（圆的不透明部分只到半径的 55%，见 warp.css）
      const reach = Math.hypot(Math.max(o.x, vw - o.x), Math.max(o.y, vh - o.y));
      const flashScale = (reach * 2) / 0.55 / FLASH_SIZE;

      el.style.setProperty("--wx", `${o.x}px`);
      el.style.setProperty("--wy", `${o.y}px`);
      el.hidden = false;
      document.documentElement.dataset.warp = "on";

      // 首页推近。外面那层裁一下，放大的首页不会把文档撑出滚动条
      const clip = home.parentElement;
      const clipBefore = clip?.style.overflow ?? "";
      if (clip) clip.style.overflow = "clip";
      home.style.transformOrigin = origin;
      const anims: Animation[] = [];
      anims.push(
        home.animate([{ transform: "scale(1)" }, { transform: `scale(${ZOOM})` }], {
          duration: T.push,
          easing: EASE_IN,
          fill: "forwards",
        }),
      );

      // 两层更大的半透明副本：和首页同一个原点、同一条曲线，只是跑在前面，叠起来就是一道径向拖影
      const ghosts = el.querySelector<HTMLElement>(".warp__ghosts");
      if (ghosts) {
        for (const g of GHOSTS) {
          const copy = home.cloneNode(true) as HTMLElement;
          copy.removeAttribute("id");
          copy.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
          const wrap = document.createElement("div");
          wrap.className = "warp__ghost";
          wrap.inert = true;
          wrap.style.cssText = `left:${box.left}px;top:${box.top}px;width:${box.width}px;height:${box.height}px;transform-origin:${origin}`;
          wrap.appendChild(copy);
          ghosts.appendChild(wrap);
          anims.push(
            wrap.animate(
              [
                { transform: "scale(1)", opacity: 0 },
                { transform: `scale(${1 + (g.scale - 1) * 0.5})`, opacity: g.opacity, offset: 0.3 },
                { transform: `scale(${ZOOM * g.scale})`, opacity: g.opacity },
              ],
              { duration: T.push, easing: EASE_IN, fill: "forwards" },
            ),
          );
        }
      }

      // 放射状光线：从光点往外甩，越往后越亮
      const rays = el.querySelector<HTMLElement>(".warp__rays");
      if (rays) {
        anims.push(
          rays.animate(
            [
              { transform: "scale(0.7)", opacity: 0 },
              { transform: "scale(1.15)", opacity: 0.75, offset: 0.6 },
              { transform: "scale(1.9)", opacity: 1 },
            ],
            { duration: T.push, easing: EASE_IN, fill: "forwards" },
          ),
        );
      }

      // 闪光：一团暖白从光点炸开，再加一层整屏的暖白兜底，保证盖满的那一刻一点缝都不漏
      const flash = el.querySelector<HTMLElement>(".warp__flash");
      const veil = el.querySelector<HTMLElement>(".warp__veil");
      const flashDur = T.full - T.flashAt;
      flash?.animate(
        [
          { transform: "translate(-50%, -50%) scale(0.04)", opacity: 0 },
          { transform: `translate(-50%, -50%) scale(${(flashScale * 0.35).toFixed(3)})`, opacity: 1, offset: 0.35 },
          { transform: `translate(-50%, -50%) scale(${flashScale.toFixed(3)})`, opacity: 1 },
        ],
        { duration: flashDur, delay: T.flashAt, easing: "cubic-bezier(0.3, 0.6, 0.4, 1)", fill: "both" },
      );
      veil?.animate([{ opacity: 0 }, { opacity: 0, offset: 0.45 }, { opacity: 1 }], {
        duration: flashDur,
        delay: T.flashAt,
        easing: "ease-in",
        fill: "both",
      });

      // 新页面挂好的信号：引擎发的 wl:engine（第 1 幕的字靠引擎显示出来，等它才不会揭开一张没字的图）
      const target = new URL(href, location.href).pathname;
      let engineReady = false;
      const onEngine = (event: Event) => {
        const path = (event as CustomEvent<{ path?: string }>).detail?.path ?? location.pathname;
        if (samePath(path, target)) engineReady = true;
      };
      window.addEventListener("wl:engine", onEngine);

      const finish = () => {
        window.removeEventListener("wl:engine", onEngine);
        for (const a of anims) a.cancel();
        home.style.transformOrigin = "";
        if (clip) clip.style.overflow = clipBefore;
        if (ghosts) ghosts.replaceChildren();
        for (const a of el.getAnimations({ subtree: true })) a.cancel();
        el.hidden = true;
        delete document.documentElement.dataset.warp;
        busy.current = false;
      };

      /** 揭开：闪光淡出，书房从 1.04 缩回 1 */
      const reveal = () => {
        const stage = document.querySelector<HTMLElement>("#desk [data-sc-stage]");
        stage?.animate([{ transform: "scale(1.04)" }, { transform: "scale(1)" }], { duration: T.out, easing: EASE_OUT });
        // 首页已经卸载了，副本和光线留着也看不见（被光盖着），先收掉，免得淡出时露出来
        if (ghosts) ghosts.replaceChildren();
        rays?.getAnimations().forEach((a) => a.cancel());
        if (rays) rays.style.opacity = "0";
        const fade = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: T.out, easing: "ease-out", fill: "forwards" });
        fade.onfinish = () => {
          if (rays) rays.style.opacity = "";
          fade.cancel();
          finish();
        };
      };

      /** 盖满之后：跳页，等新页面的引擎和书房图都好了再揭开（两帧缓冲，让第 1 幕先按 p = 0 摆好） */
      const swap = () => {
        router.push(href);
        const started = performance.now();
        let decoding: Promise<void> | null = null;
        const check = () => {
          const late = performance.now() - started > T.wait;
          const here = samePath(location.pathname, target);
          const img = here ? document.querySelector<HTMLImageElement>("#desk .plate__media img") : null;
          if (!late && !(here && engineReady && img)) {
            requestAnimationFrame(check);
            return;
          }
          if (!decoding) {
            decoding = img && !late ? img.decode().catch(() => undefined) : Promise.resolve();
            const guard = new Promise<void>((resolve) => window.setTimeout(resolve, Math.max(0, T.wait - (performance.now() - started))));
            void Promise.race([decoding, guard]).then(() => {
              requestAnimationFrame(() => requestAnimationFrame(reveal));
            });
          }
        };
        requestAnimationFrame(check);
      };
      window.setTimeout(swap, T.full);
    },
    [router, preload],
  );

  return (
    <WarpContext.Provider value={{ warp, preload }}>
      {children}
      <div ref={layer} className="warp" hidden aria-hidden>
        <div className="warp__ghosts" />
        <div className="warp__rays" />
        <div className="warp__veil" />
        <div className="warp__flash" style={{ width: FLASH_SIZE, height: FLASH_SIZE }} />
      </div>
    </WarpContext.Provider>
  );
}
