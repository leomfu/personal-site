"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { DeskScreen } from "@/components/about/DeskScreen";
import { ScenePlate } from "@/components/scene/ScenePlate";
import type { SceneManifest } from "@/lib/sceneTypes";
import { DESK_LANDING_SHIFT } from "@/lib/tour";

/**
 * 峰值的前半段：「从太空俯冲到你桌前」（BRIEF §3 及其修订）。
 *
 * 首页点上海的光点或主按钮 → 这里接管：
 *   lock   （只在有俯冲视频时）0.4 秒「锁定上海」：盖住首页，地球朝上海放大一点，准星收拢，同时给视频缓冲
 *   video  有俯冲视频（public/scene/dive-16x9.mp4）就全屏放，静音，最长 6 秒，只留一个「跳过」
 *   fall   没有视频时的后备，点下去立刻开始，先快后慢，一共约 1.7 秒，三段：
 *            地球朝上海推进 → 叠化成上海航拍、推向陆家嘴 → 叠化成书房：从窗户拉回到书桌前，停稳
 *          航拍图（public/scene/aerial-*.webp）不在时退回两段：地球 → 书房，约 1.3 秒
 *   land   画面停在书房（= 第 1 幕的远景，连 MacBook 屏幕里的画面和桌宠都一样），这时才跳到 /about/
 *   out    等落地页的引擎挂好（`wl:engine` 事件），盖层淡出，露出第 1 幕
 *
 * 随时能跳过：点击、按键、滚轮、手指滑动都直接落地。减少动态效果时什么都不放，直接跳转。
 * 只有从首页点进来才会走这一套；直接打开 /about/、从子页回来，都直接从第 1 幕开始。
 *
 * 这一层挂在 [locale]/layout 上（跳页时不卸载），所以盖层能跨过路由切换一直留在屏幕上，
 * 两头才接得上：开头是首页的那张地球，结尾是第 1 幕的那张房间。
 */

type Phase = "idle" | "lock" | "video" | "fall" | "land" | "out";
type Origin = { x: number; y: number };

const DiveContext = createContext<{ dive: (href: string, origin?: Origin) => void } | null>(null);

export function useDive() {
  return useContext(DiveContext);
}

/** 6 秒封顶：视频再长也在这里落地 */
const VIDEO_CAP = 6000;
const LOCK = 400;
/** 后备推进的总长（和 dive.css 里的关键帧时间对齐）：三段 / 两段 */
const FALL = { three: 1720, two: 1320 } as const;

export function DiveProvider({ scene, children }: { scene: SceneManifest; children: ReactNode }) {
  const router = useRouter();
  const t = useTranslations("dive");
  const [phase, setPhase] = useState<Phase>("idle");
  const [origin, setOrigin] = useState<Origin>({ x: 0, y: 0 });
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  const target = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const skipRef = useRef<HTMLButtonElement | null>(null);
  const phaseRef = useRef<Phase>("idle");

  const go = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  /** 落地：画面换成书房，然后才跳页 */
  const land = useCallback(() => {
    if (!["lock", "video", "fall"].includes(phaseRef.current)) return;
    try {
      videoRef.current?.pause();
    } catch {
      // 视频可能已经没了
    }
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
      target.current = href;
      setOrigin(at ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 });

      const tall = window.matchMedia("(max-aspect-ratio: 4/5)").matches;
      const clip = tall && scene.dive.tall.exists ? scene.dive.tall : scene.dive.wide.exists ? scene.dive.wide : null;
      setVideoSrc(clip ? clip.src : null);
      // 有视频才需要那 0.4 秒去缓冲；没有视频，点下去立刻开始往下冲
      go(clip ? "lock" : "fall");
    },
    [go, router, scene.dive.tall, scene.dive.wide],
  );

  /** lock：0.4 秒之后，视频能放就放，放不了走后备 */
  useEffect(() => {
    if (phase !== "lock") return;
    const video = videoRef.current;
    if (videoSrc && video) {
      video.muted = true;
      video.load();
    }
    let waited = 0;
    let id = 0;
    const decide = () => {
      if (phaseRef.current !== "lock") return;
      if (!videoSrc || !video) {
        go("fall");
        return;
      }
      // 视频还没缓冲出画面：最多再等 1.2 秒，等不到就走后备，不让人对着黑屏
      if (video.readyState >= 2) {
        go("video");
        void video.play().catch(() => {
          if (phaseRef.current === "video") go("fall");
        });
        return;
      }
      waited += 100;
      if (waited > 1200) go("fall");
      else id = window.setTimeout(decide, 100);
    };
    id = window.setTimeout(decide, LOCK);
    return () => window.clearTimeout(id);
  }, [phase, videoSrc, go]);

  /** video：6 秒封顶；视频开始放时焦点给「跳过」 */
  useEffect(() => {
    if (phase !== "video") return;
    skipRef.current?.focus({ preventScroll: true });
    const id = window.setTimeout(land, VIDEO_CAP);
    return () => window.clearTimeout(id);
  }, [phase, land]);

  /** fall（没有视频的后备）：三段（或两段）推进放完就落地 */
  const threeStage = scene.aerial.wide.exists || scene.aerial.tall.exists;
  useEffect(() => {
    if (phase !== "fall") return;
    const id = window.setTimeout(land, (threeStage ? FALL.three : FALL.two) + 40);
    return () => window.clearTimeout(id);
  }, [phase, land, threeStage]);

  /** 随时能跳过：点、按键、滚轮、手指滑动 */
  useEffect(() => {
    if (phase !== "lock" && phase !== "video" && phase !== "fall") return;
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
      // 再等两帧，让第 1 幕的各层先按 p = 0 摆好
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
      setVideoSrc(null);
      go("idle");
    }, 520);
    return () => window.clearTimeout(id);
  }, [phase, go]);

  const style = {
    "--ox": `${origin.x}px`,
    "--oy": `${origin.y}px`,
    "--land-shift": `${DESK_LANDING_SHIFT}px`,
  } as CSSProperties;

  return (
    <DiveContext.Provider value={{ dive }}>
      {children}
      {phase !== "idle" && (
        <div className={`dive is-${phase}${threeStage ? " has-aerial" : ""}`} style={style} data-dive={phase}>
          <div className="dive__earth">
            <ScenePlate pair={scene.earth} eager className="tone-earth" />
          </div>
          {threeStage && (
            <div className="dive__aerial">
              <ScenePlate pair={scene.aerial} eager className="tone-aerial" />
            </div>
          )}
          <div className="dive__room room-far">
            <ScenePlate pair={scene.room} eager className="tone-room">
              <DeskScreen quads={scene.screen} still />
            </ScenePlate>
          </div>
          {videoSrc && (
            <video
              ref={videoRef}
              className="dive__video"
              src={videoSrc}
              muted
              playsInline
              preload="auto"
              poster={scene.dive.poster.exists ? scene.dive.poster.src : undefined}
              onEnded={land}
              onError={() => (phaseRef.current === "video" ? land() : undefined)}
              aria-hidden
            />
          )}
          <div className="dive__reticle" aria-hidden>
            <span />
            <span />
            <span />
            <span />
          </div>
          {phase === "video" && (
            <button ref={skipRef} type="button" className="dive__skip" onClick={land}>
              {t("skip")}
            </button>
          )}
          <p className="sr-only" role="status">
            {t("status")}
          </p>
        </div>
      )}
    </DiveContext.Provider>
  );
}
