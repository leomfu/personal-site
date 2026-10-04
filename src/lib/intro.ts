/**
 * 开场（第 0 幕飞行 + 进屋后那段）的「只播一次」判断，飞行覆盖层（FlightDriver）和进屋动画（DeskLanding）共用。
 * 同一次访问（sessionStorage）里开过一次就不再播；直接打开 /about/#xxx、浏览器恢复了滚动位置、减少动态效果，也都直接是最终状态。
 */
const KEY = "wl-intro-played";

export function introSeen(): boolean {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function markIntro() {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    // 无痕模式写不了：这一次访问里就可能再播一遍，不碍事
  }
}

/** 滑到离开第一屏这么远（视口高度的倍数）就算「滑走了」：开场直接完成，不再等它演 */
export const AWAY = 0.7;

export function introSkipped(): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  if (introSeen()) return true;
  if (location.hash && location.hash !== "#") return true;
  return window.scrollY > window.innerHeight * AWAY;
}

/**
 * 开场的两段时长（毫秒，BRIEF R14：江面飞行换成真视频）。想调快慢只改这两个数：
 *   VIDEO_MS  视频（原片 10 秒）加速到多长播完，FlightDriver 按视频实际时长算 playbackRate；这一段里小宇航员叠在视频前面飞
 *   SNEAK_MS  视频停在最后一帧（窗户）以后：落窗台、左右看、踮脚、钻窗缝、镜头穿窗进屋
 * 各动作占 SNEAK_MS 的比例写在 flight.css 文件头和 FlightDriver 的 beat 切点里，整体快慢不用动它们。
 * 进屋后那段（DeskLanding）的时长不在这里，不受影响。
 */
export const VIDEO_MS = 3500;
export const SNEAK_MS = 1500;
