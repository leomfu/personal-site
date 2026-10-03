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
 * 开场的总长（毫秒，R13 提速到约 4 秒）：沿江飞行约 1.7 秒，转向外墙、落窗台、张望、钻窗缝、穿窗约 2.3 秒。
 * 想再调快慢只改这一个数：FlightDriver 的进度、楼群墙的合成器动画都按它走。
 * 各段占总长的比例写在 flight.css 文件头和 FlightDriver 的 beat 切点里，整体快慢不用动它们。
 */
export const FLIGHT_MS = 4000;
