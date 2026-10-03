import type { CSSProperties, ReactNode } from "react";
import { DeskScreen } from "@/components/about/DeskScreen";
import { ScenePlate } from "@/components/scene/ScenePlate";
import { DESK_LANDING_SHIFT } from "@/lib/tour";
import type { SceneManifest } from "@/lib/sceneTypes";

/**
 * 第 0 幕「沿江飞行」的画面（BRIEF R9）。没有 hook：完整介绍页（服务端）和俯冲盖层（客户端）共用同一份，
 * 俯冲最后一帧和第 0 幕 p = 0 才能一模一样。
 *
 * 所有运动都在 styles/flight.css 里从 --sc-p（引擎写在 section 上，0..1）算出来，只动 transform / opacity / clip-path：
 *   世界层  底图朝江面消失点推近 + 轻微的左右摇移和侧倾；两岸楼群带是两面「透视墙」，
 *          朝镜头流过去（从两岸之间穿过）；楼群带出现时，底图两岸先压暗，楼群带替换它们而不是叠上去
 *   近景    江面光点闪烁、掠过的流光（浓淡跟滚动速度 --fv）、薄雾
 *   结尾    镜头转向一扇亮着暖灯的窗户，窗户越来越大，房间从窗洞里露出来（clip-path），
 *          最后一帧 = 第 1 幕书桌前 p = 0 的样子（房间、屏幕、左下角的名字）
 * 俯冲盖层里 --sc-p 不存在，取默认 0，就是第 0 幕的第一帧。
 */

/** 江面光点：在水面那一片随手撒的位置（百分比）和闪的节奏，写死，服务端客户端一致 */
const GLINTS: Array<[number, number, number, number]> = [
  [8, 66, 0.0, 2.6],
  [17, 78, 1.1, 3.1],
  [24, 63, 0.5, 2.2],
  [31, 88, 1.8, 2.9],
  [38, 71, 0.9, 2.4],
  [44, 60, 2.2, 3.4],
  [49, 82, 0.3, 2.7],
  [55, 66, 1.5, 2.1],
  [61, 93, 2.6, 3.2],
  [66, 74, 0.7, 2.5],
  [72, 62, 1.9, 2.8],
  [78, 85, 0.2, 2.3],
  [84, 69, 1.3, 3.0],
  [90, 77, 2.4, 2.6],
  [95, 64, 0.8, 3.3],
  [35, 95, 1.6, 2.4],
];

/** 掠过的流光：从消失点往外的方向（度，0 = 正右，顺时针；都在水面那一半）、时长、起步延迟 */
const STREAKS: Array<[number, number, number]> = [
  [5, 1.5, 0.0],
  [13, 1.2, 0.6],
  [24, 1.7, 0.2],
  [41, 1.3, 1.0],
  [63, 1.6, 0.4],
  [88, 1.25, 0.8],
  [112, 1.55, 0.1],
  [136, 1.35, 0.7],
  [152, 1.7, 0.3],
  [166, 1.2, 0.9],
  [175, 1.45, 0.5],
];

export function FlightScene({
  scene,
  crab,
  room,
  live = false,
  className,
  children,
}: {
  scene: SceneManifest;
  /** 飞在前面的那只小螃蟹（第 0 幕里是能点的 Crab；俯冲盖层里不放，起飞的那只单独飞过来） */
  crab?: ReactNode;
  /** 穿过窗户后的房间：第 1 幕 p = 0 时左下角那两行字。不给就不画房间（俯冲盖层用不到） */
  room?: { coords: string; name: string } | null;
  /** 近景的闪烁、流光直接开着（俯冲盖层；第 0 幕由 FlightDriver 按在不在视口切换 .is-live） */
  live?: boolean;
  className?: string;
  /** 文字（地点标签），叠在最上面 */
  children?: ReactNode;
}) {
  const { flight, flightBands } = scene;
  const wide = flight.wide;
  const tall = flight.tall.exists ? flight.tall : flight.wide;
  const style = {
    "--ar-w": (wide.width / wide.height).toFixed(5),
    "--ar-t": (tall.width / tall.height).toFixed(5),
    "--fx-w": wide.focus?.x ?? 0.5,
    "--fy-w": wide.focus?.y ?? 0.5,
    "--fx-t": tall.focus?.x ?? 0.5,
    "--fy-t": tall.focus?.y ?? 0.5,
    "--bund": flightBands.bund.exists ? `url(${flightBands.bund.src})` : "none",
    "--lujiazui": flightBands.lujiazui.exists ? `url(${flightBands.lujiazui.src})` : "none",
  } as CSSProperties;

  return (
    <div className={["flight-scene", live ? "is-live" : "", className ?? ""].filter(Boolean).join(" ")} style={style}>
      <div className="flight__frame" aria-hidden>
        {/* 世界层：底图 + 两岸压暗 + 两面楼群墙，一起摇移、侧倾 */}
        <div className="flight__world">
          <div className="flight__base">
            <ScenePlate pair={flight} position={{ x: 0.5, y: 0.5 }} positionTall={{ x: 0.8, y: 0.5 }} eager className="tone-flight" />
          </div>
          <div className="flight__shade" />
          <div className="flight__bank">
            <div className="flight__wall flight__wall--bund" />
            <div className="flight__wall flight__wall--lujiazui" />
          </div>
        </div>

        {/* 近景：薄雾、江面光点、掠过的流光 */}
        <div className="flight__mist" />
        <div className="flight__glints">
          {GLINTS.map(([x, y, delay, dur], i) => (
            <i
              key={i}
              style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${delay}s`, animationDuration: `${dur}s` } as CSSProperties}
            />
          ))}
        </div>
        <div className="flight__streaks">
          {STREAKS.map(([angle, dur, delay], i) => (
            <span key={i} style={{ rotate: `${angle}deg` } as CSSProperties}>
              <i style={{ animationDuration: `${dur}s`, animationDelay: `${delay}s` } as CSSProperties} />
            </span>
          ))}
        </div>

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
