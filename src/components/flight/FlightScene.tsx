import type { CSSProperties, ReactNode } from "react";
import { DeskScreen } from "@/components/about/DeskScreen";
import { ScenePlate } from "@/components/scene/ScenePlate";
import { DESK_LANDING_SHIFT } from "@/lib/tour";
import type { FacadeSpots, SceneManifest } from "@/lib/sceneTypes";

/**
 * 第 0 幕「沿江飞行」的画面（BRIEF R14）：站主用别的软件生成的一段真视频（夜里贴着黄浦江飞，转向岸边一栋红砖楼，停在一扇窗前），
 * 不再用照片拼 2.5D。没有 hook：完整介绍页（服务端）和俯冲盖层（客户端）共用同一份，俯冲最后一帧和第 0 幕开场才能一模一样。
 *
 *   静帧   视频第一帧（flight-video-first.webp）：落到江面后画面停在这一帧，等访客下滑；俯冲盖层里只有这一层
 *   视频   第一次下滑开播（FlightDriver 控制播放速度和进度），播完停在最后一帧，这一帧就是「墙」
 *   窗洞   穿窗时整面墙以窗洞中心为圆心推近，窗洞里的房间 = 第 1 幕 p = 0，最后一帧 = 书桌前的样子
 * 所有运动都在 styles/flight.css 里从 --vp（视频进度 0..1）和 --sp（落窗台到穿窗进度 0..1）算出来，只动 transform / opacity / clip-path。
 * 俯冲盖层里没有这两个变量，取默认 0，就是开场第一帧。
 */

/** 窗户关键点 → CSS 变量（w = 横版，t = 竖版） */
function spotVars(k: "w" | "t", v: FacadeSpots) {
  return {
    [`--sill-x-${k}`]: v.sill.x,
    [`--sill-y-${k}`]: v.sill.y,
    [`--gap-x-${k}`]: v.gap.x,
    [`--gap-y-${k}`]: v.gap.y,
    [`--org-x-${k}`]: v.origin.x,
    [`--org-y-${k}`]: v.origin.y,
    [`--hl-${k}`]: v.hole.l,
    [`--hr-${k}`]: v.hole.r,
    [`--ht-${k}`]: v.hole.t,
    [`--hb-${k}`]: v.hole.b,
    [`--zk-${k}`]: v.zk,
  };
}

/** 视频最后一帧（窗户）的比例和关键点，写成 CSS 变量（第 0 幕、俯冲盖层里起飞的那只都要用，位置公式在 flight.css 里） */
export function facadeVars(scene: SceneManifest): CSSProperties {
  const { last } = scene.flightVideo;
  const { wide, tall } = scene.facadeSpots;
  return {
    "--far": (last.width / last.height).toFixed(5),
    ...spotVars("w", wide),
    ...spotVars("t", tall),
  } as CSSProperties;
}

export function FlightScene({
  scene,
  crab,
  room,
  className,
  children,
}: {
  scene: SceneManifest;
  /** 飞在前面的那只小螃蟹（第 0 幕里是能点的 Crab；俯冲盖层里不放，起飞的那只单独飞过来） */
  crab?: ReactNode;
  /** 给了就画视频、最后一帧和窗洞里的房间（第 0 幕）；不给就只画第一帧静帧（俯冲盖层）。房间 = 第 1 幕 p = 0 时左下角那两行字 */
  room?: { coords: string; name: string } | null;
  className?: string;
  /** 文字（地点标签），叠在最上面 */
  children?: ReactNode;
}) {
  const { src, first, last } = scene.flightVideo;

  return (
    <div className={["flight-scene", className ?? ""].filter(Boolean).join(" ")} style={facadeVars(scene)}>
      <div className="flight__frame" aria-hidden>
        {/* 墙：第一帧静帧 → 视频 →（视频播不了时）最后一帧静帧。穿窗时整面以窗洞中心推近 */}
        {/* 静帧是 CSS 里自己做的 cover（和视频同一套算法），不用 next/image；alt 为空 = 装饰图 */}
        {/* eslint-disable @next/next/no-img-element */}
        <div className="flight__wallbox">
          {first.exists && <img className="flight__still flight__still--first" src={first.src} alt="" decoding="async" fetchPriority="high" />}
          {room && (
            <>
              {last.exists && <img className="flight__still flight__still--last" src={last.src} alt="" decoding="async" loading="lazy" />}
              {/* 视频不带 src 出厂：FlightDriver 确认要播（没看过、没减少动态效果）才设 src，看过的访客不会白下载 */}
              <video className="flight__video" data-src={src} muted playsInline preload="none" disablePictureInPicture tabIndex={-1} />
            </>
          )}
        </div>
        {/* eslint-enable @next/next/no-img-element */}

        {/* 结尾：窗洞里的房间 = 第 1 幕 p = 0（远景同样放大 1.05、同样的落地位移；屏幕上还没有桌宠） */}
        {room && (
          <div className="flight__room">
            <div className="flight__roomzoom">
              <div className="room-far" style={{ transform: `translate3d(0, ${DESK_LANDING_SHIFT}px, 0)` }}>
                <ScenePlate pair={scene.room} className="tone-room">
                  <DeskScreen quads={scene.screen} still pet={false} />
                </ScenePlate>
              </div>
            </div>
            <div className="sc-scrim sc-scrim--lead desk__scrim" />
            <div className="sc-copy sc-copy--lead desk__copy flight__roomcopy">
              <div className="desk__hello">
                <p className="desk__coords mono">{room.coords}</p>
                <p className="desk__name">{room.name}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {crab && (
        <div className="flight__crabslot">
          <div className="flight__crabfloat">{crab}</div>
        </div>
      )}
      {children}
    </div>
  );
}
