"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Crab } from "@/components/crab/Crab";
import { FlightScene } from "@/components/flight/FlightScene";
import { ScenePlate } from "@/components/scene/ScenePlate";
import type { SceneManifest } from "@/lib/sceneTypes";

/**
 * 开场：「小宇航员带你飞下来」（BRIEF R9 第 1 条第 1、2 点）。
 *
 * 首页点上海的光点或「降落，进来看看」→ 这里接管：
 *   fall   点下去立刻开始，一共约 1.3 秒，自动播放：
 *            首页那只宇航员小螃蟹原地换成超人飞行姿势（斗篷、速度线），先往后一缩、再冲出去，跟着镜头往下飞；
 *            地球朝上海推进 → 叠化成上海航拍、继续往下 → 叠化成黄浦江上的起点（第 0 幕「沿江飞行」的第一帧），
 *            小螃蟹正好落在它在第 0 幕里的位置上
 *          航拍图（public/scene/aerial-*.webp）不在时跳过中间那段，约 1 秒
 *   land   画面停在江面起点（= 第 0 幕 p = 0），这时才跳到 /about/
 *   out    等落地页的引擎挂好（`wl:engine` 事件），盖层淡出，露出一模一样的第 0 幕
 *
 * 随时能跳过：点击、按键、滚轮、手指滑动都直接落地。减少动态效果时什么都不放，直接跳转。
 * 只有从首页点进来才会走这一套；直接打开 /about/ 也是从第 0 幕开始，只是没有这段下降。
 * 2026-10-03 起不再落到书房（书房在第 0 幕的结尾穿窗进去），也不再用俯冲视频。
 *
 * 这一层挂在 [locale]/layout 上（跳页时不卸载），所以盖层能跨过路由切换一直留在屏幕上，
 * 两头才接得上：开头是首页的那张地球，结尾是第 0 幕的第一帧。
 * 点下去的那一刻顺手预加载飞行图（光标移到入口上时也会先预加载一次）。
 */

type Phase = "idle" | "fall" | "land" | "out";
type Origin = { x: number; y: number };
/** 首页那只小螃蟹：身体中心和身体宽度（屏幕像素） */
type HeroFrom = { x: number; y: number; w: number } | null;

const DiveContext = createContext<{ dive: (href: string, origin?: Origin) => void; preload: () => void } | null>(null);

export function useDive() {
  return useContext(DiveContext);
}

/** 下降的总长（和 dive.css 里的关键帧时间对齐）：有航拍 / 没有航拍 */
const FALL = { three: 1320, two: 1000 } as const;
const TALL_QUERY = "(max-aspect-ratio: 4/5)";

export function DiveProvider({ scene, children }: { scene: SceneManifest; children: ReactNode }) {
  const router = useRouter();
  const t = useTranslations("dive");
  const [phase, setPhase] = useState<Phase>("idle");
  const [origin, setOrigin] = useState<Origin>({ x: 0, y: 0 });
  const [from, setFrom] = useState<HeroFrom>(null);

  const target = useRef<string | null>(null);
  const phaseRef = useRef<Phase>("idle");
  const heroRef = useRef<HTMLSpanElement | null>(null);
  const heroAnim = useRef<Animation | null>(null);
  const preloaded = useRef(false);

  const go = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  /** 预加载第 0 幕要用的图：这一台设备用的那张底图 + 两条楼群带 */
  const preload = useCallback(() => {
    if (preloaded.current) return;
    preloaded.current = true;
    const tall = window.matchMedia(TALL_QUERY).matches && scene.flight.tall.exists;
    const srcs = [tall ? scene.flight.tall.src : scene.flight.wide.src, scene.flightBands.bund.src, scene.flightBands.lujiazui.src];
    for (const src of srcs) {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
    }
  }, [scene.flight, scene.flightBands]);

  /** 落地：画面停在江面起点，然后才跳页 */
  const land = useCallback(() => {
    if (phaseRef.current !== "fall") return;
    heroAnim.current?.cancel();
    go("land");
    const href = target.current;
    if (href) router.push(href);
  }, [go, router]);

  const dive = useCallback(
    (href: string, at?: Origin) => {
      if (phaseRef.current !== "idle") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        router.push(href);
        return;
      }
      preload();
      target.current = href;
      setOrigin(at ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 });
      // 首页那只宇航员（box -10.5 -42 133 120：身体中心在宽的 50%、高的 60%，身体宽 = 112 / 133）
      const home = document.querySelector<HTMLElement>(".crab-slot--home .crab")?.getBoundingClientRect();
      setFrom(home && home.width > 0 ? { x: home.left + home.width * 0.5, y: home.top + home.height * 0.6, w: (home.width * 112) / 133 } : null);
      document.documentElement.dataset.dive = "on";
      go("fall");
    },
    [go, router, preload],
  );

  /** 起飞：盖层第一帧画出来之前，把超人姿势的那只摆到首页那只的位置上，再让它飞到第 0 幕里它该在的地方 */
  useLayoutEffect(() => {
    if (phase !== "fall") return;
    const hero = heroRef.current;
    if (!hero) return;
    const end = hero.getBoundingClientRect();
    const body = hero.querySelector<HTMLElement>(".crab")?.getBoundingClientRect();
    const start = from ?? { x: origin.x, y: origin.y, w: body?.width ?? 60 };
    const dx = start.x - end.left;
    const dy = start.y - end.top;
    const s0 = body && body.width > 0 ? start.w / body.width : 0.8;
    const tf = (x: number, y: number, s: number) => `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${s.toFixed(3)})`;
    const total = scene.aerial.wide.exists || scene.aerial.tall.exists ? FALL.three : FALL.two;
    heroAnim.current = hero.animate(
      [
        { transform: tf(dx, dy, s0) },
        { transform: tf(dx - 12, dy + 7, s0 * 1.04), offset: 0.1 },
        { transform: tf(dx * 0.72 + 36, dy * 0.72 - 64, s0 * 1.3), offset: 0.32 },
        { transform: tf(dx * 0.28, dy * 0.25 - 40, 0.8), offset: 0.66 },
        { transform: tf(0, 0, 1) },
      ],
      { duration: total, easing: "cubic-bezier(0.45, 0.05, 0.3, 1)", fill: "forwards" },
    );
  }, [phase, from, origin, scene.aerial]);

  /** fall：放完就落地 */
  const threeStage = scene.aerial.wide.exists || scene.aerial.tall.exists;
  useEffect(() => {
    if (phase !== "fall") return;
    const id = window.setTimeout(land, (threeStage ? FALL.three : FALL.two) + 40);
    return () => window.clearTimeout(id);
  }, [phase, land, threeStage]);

  /** 随时能跳过：点、按键、滚轮、手指滑动 */
  useEffect(() => {
    if (phase !== "fall") return;
    const skip = (event: Event) => {
      if (event.type === "keydown") {
        const key = (event as KeyboardEvent).key;
        if (key === "Tab" || key === "Shift") return;
      }
      land();
    };
    const opts = { passive: true } as AddEventListenerOptions;
    window.addEventListener("pointerdown", skip, opts);
    window.addEventListener("keydown", skip);
    window.addEventListener("wheel", skip, opts);
    window.addEventListener("touchmove", skip, opts);
    return () => {
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("wheel", skip);
      window.removeEventListener("touchmove", skip);
    };
  }, [phase, land]);

  /** land：等落地页的引擎挂好再揭开盖层；迟迟不来（网络慢、脚本出错）4 秒后也照样揭开 */
  useEffect(() => {
    if (phase !== "land") return;
    let frame = 0;
    const reveal = () => {
      // 再等两帧，让第 0 幕的各层先按 p = 0 摆好
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => go("out"));
      });
    };
    const onEngine = () => {
      const href = target.current;
      if (!href || location.pathname !== new URL(href, location.href).pathname) return;
      reveal();
    };
    window.addEventListener("wl:engine", onEngine);
    const id = window.setTimeout(() => go("out"), 4000);
    return () => {
      window.removeEventListener("wl:engine", onEngine);
      window.clearTimeout(id);
      cancelAnimationFrame(frame);
    };
  }, [phase, go]);

  /** out：淡出完收起盖层 */
  useEffect(() => {
    if (phase !== "out") return;
    const id = window.setTimeout(() => {
      target.current = null;
      heroAnim.current = null;
      delete document.documentElement.dataset.dive;
      go("idle");
    }, 520);
    return () => window.clearTimeout(id);
  }, [phase, go]);

  const style = { "--ox": `${origin.x}px`, "--oy": `${origin.y}px` } as CSSProperties;

  return (
    <DiveContext.Provider value={{ dive, preload }}>
      {children}
      {phase !== "idle" && (
        <div className={`dive is-${phase}${threeStage ? " has-aerial" : ""}`} style={style} data-dive={phase}>
          <div className="dive__bg">
            <div className="dive__earth">
              <ScenePlate pair={scene.earth} eager className="tone-earth" />
            </div>
            {threeStage && (
              <div className="dive__aerial">
                <ScenePlate pair={scene.aerial} eager className="tone-aerial" />
              </div>
            )}
            <div className="dive__flight">
              <FlightScene scene={scene} live />
            </div>
            <div className="dive__reticle" aria-hidden>
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
          {/* 超人姿势的那只：和第 0 幕里那只用同一个位置（.flight__crabslot），飞完正好停在那里 */}
          <div className="flight-scene dive__heroscene" aria-hidden>
            <div className="flight__crabslot">
              <div className="flight__crabfloat">
                <span ref={heroRef} className="dive__hero">
                  <Crab variant="flyer" still />
                </span>
              </div>
            </div>
          </div>
          <p className="sr-only" role="status">
            {t("status")}
          </p>
        </div>
      )}
    </DiveContext.Provider>
  );
}
