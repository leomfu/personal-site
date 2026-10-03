"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PLACES, type PlaceKey } from "@/lib/nav";

/**
 * 签名动作：他房间的平面图（BRIEF §7）。
 *
 * 一张代码画的建筑平面图线稿，固定在完整介绍页的角落：
 * 1. 图上 7 个地方（书桌前 · 屏幕 · 书架 · 投影 · 暗房 · 唱片架 · 窗边）对应 7 幕；
 * 2. 代表「你」的小点随滚动沿着房间里的路线走，走过的路会一直亮着（足迹）；
 * 3. 点任意一个地方直接跳过去，它就是这一页的导航；
 * 4. 走到「窗边」，平面图缩小，换回首页那组上海坐标，首尾呼应；
 * 5. 手机上收成一个小按钮，点开是抽屉。减少动态效果时小点直接跳到所在的地方，不走路。
 * 6. 第二版：走进纸面段落之后（<html data-ground="paper">），换成彩铅画在纸上的样子，功能不变（plan.css）。
 * 7. 第 0 幕「沿江飞行」在房间外面（[data-plan-outside]）：小点停在窗外，写「窗外 · 黄浦江」；
 *    穿过窗户那一段，小点从窗口进来、走到书桌前。
 *
 * 小点走在哪儿完全由滚动位置算出来（不是动画）：每一幕的顶部进到屏幕 35% 处算「到了」，
 * 底部升到屏幕 85% 处算「离开」，离开和下一处到达之间那半屏的滚动，小点沿路线走过去。
 * 每一帧只改 SVG 的几个属性，不走 React 重渲染；只有「现在在哪」「去过哪」变了才 setState。
 */

type Labels = Record<PlaceKey, { name: string; title: string }>;

/** 平面图坐标系 240 × 180，墙体在 10..230 × 10..170 */
const STATIONS: Record<PlaceKey, [number, number]> = {
  desk: [46, 64],
  screen: [84, 60],
  shelf: [44, 114],
  projector: [104, 126],
  darkroom: [207, 144],
  records: [196, 72],
  window: [168, 36],
};

/** 路线：地方之间夹几个拐点，绕开家具；进暗房要从门帘进、原路出来 */
const ROUTE: Array<PlaceKey | [number, number]> = [
  "desk",
  "screen",
  [66, 90],
  "shelf",
  "projector",
  [195, 104],
  "darkroom",
  [195, 104],
  "records",
  "window",
];

function buildRoute() {
  const points: Array<[number, number]> = [];
  const at: Partial<Record<PlaceKey, number>> = {};
  let length = 0;
  ROUTE.forEach((step) => {
    const point = typeof step === "string" ? STATIONS[step] : step;
    const prev = points[points.length - 1];
    if (prev) length += Math.hypot(point[0] - prev[0], point[1] - prev[1]);
    points.push(point);
    if (typeof step === "string" && at[step] === undefined) at[step] = length;
  });
  return { points, at: at as Record<PlaceKey, number>, total: length };
}

/** 窗外（第 0 幕）：上墙那段窗户的外面一点；穿窗时先到窗里这一点，再去书桌 */
const OUTSIDE: [number, number] = [167, 3.5];
const INSIDE: [number, number] = [167, 20];

/** 路线是死的（房间不会变），模块加载时算一次 */
const ROUTE_DATA = buildRoute();
const ROUTE_POINTS = ROUTE_DATA.points.map((p) => p.join(",")).join(" ");

/** 沿路线走到长度 l 处的坐标 */
function pointAt(points: Array<[number, number]>, l: number): [number, number] {
  let rest = l;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const seg = Math.hypot(x1 - x0, y1 - y0);
    if (rest <= seg || i === points.length - 1) {
      const k = seg === 0 ? 0 : Math.min(1, Math.max(0, rest / seg));
      return [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k];
    }
    rest -= seg;
  }
  return points[0];
}

export function FloorPlan({
  labels,
  coords,
  city,
  navLabel,
  openLabel,
  closeLabel,
  hereLabel,
  gotoLabel,
  outsideLabel,
}: {
  labels: Labels;
  coords: string;
  city: string;
  navLabel: string;
  openLabel: string;
  closeLabel: string;
  hereLabel: string;
  /** 每个地方链接的读屏文字，已经按地方填好 */
  gotoLabel: Record<PlaceKey, string>;
  /** 第 0 幕在房间外面时显示的地方 */
  outsideLabel: { name: string; title: string };
}) {
  const route = ROUTE_DATA;
  const routePoints = ROUTE_POINTS;

  const [current, setCurrent] = useState<PlaceKey>("desk");
  const [outside, setOutside] = useState(false);
  const [visited, setVisited] = useState<number>(0);
  const [open, setOpen] = useState(false);

  const rootRef = useRef<HTMLElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const groups = PLACES.map((key) => Array.from(document.querySelectorAll<HTMLElement>(`[data-place="${key}"]`)));
    const yous = Array.from(root.querySelectorAll<SVGGElement>("[data-plan-you]"));
    const trails = Array.from(root.querySelectorAll<SVGPolylineElement>("[data-plan-trail]"));

    let maxL = 0;
    let lastL = -1;
    let lastCurrent: PlaceKey | null = null;
    let lastOutside: boolean | null = null;
    const outsideEl = document.querySelector<HTMLElement>("[data-plan-outside]");
    let lastVisited = -1;
    let raf = 0;

    const frame = () => {
      raf = 0;
      const vh = window.innerHeight;
      const y = window.scrollY;
      const ranges = groups.map((els) => {
        if (!els.length) return null;
        let top = Infinity;
        let bottom = -Infinity;
        for (const el of els) {
          const r = el.getBoundingClientRect();
          top = Math.min(top, r.top + y);
          bottom = Math.max(bottom, r.bottom + y);
        }
        return { top, bottom };
      });

      let index = 0;
      let l = route.at[PLACES[0]];
      for (let i = 0; i < PLACES.length; i++) {
        const range = ranges[i];
        if (!range) continue;
        const arrive = i === 0 ? 0 : range.top - vh * 0.35;
        if (y >= arrive) index = i;
      }
      const here = PLACES[index];
      const range = ranges[index];
      const next = ranges[index + 1];
      l = route.at[here];
      if (!reduce && range && next && index < PLACES.length - 1) {
        const depart = range.bottom - vh * 0.85;
        const arrive = next.top - vh * 0.35;
        if (y > depart && arrive > depart) {
          const k = Math.min(1, (y - depart) / (arrive - depart));
          l = route.at[here] + (route.at[PLACES[index + 1]] - route.at[here]) * k;
        }
      }

      // 第 0 幕：还在房间外面。书桌那一幕的顶离屏幕顶还有三成半屏以上 = 窗外；之后这一段 = 从窗口进来走到书桌
      const deskTop = ranges[0]?.top ?? 0;
      const enter = deskTop - vh * 0.35;
      const isOutside = Boolean(outsideEl) && y < enter;
      let at: [number, number] | null = null;
      if (outsideEl && y < deskTop) {
        const k = reduce ? (isOutside ? 0 : 1) : Math.min(1, Math.max(0, (y - enter) / (vh * 0.35)));
        if (k <= 0.35) {
          const t = k / 0.35;
          at = [OUTSIDE[0] + (INSIDE[0] - OUTSIDE[0]) * t, OUTSIDE[1] + (INSIDE[1] - OUTSIDE[1]) * t];
        } else {
          const t = (k - 0.35) / 0.65;
          const desk = STATIONS.desk;
          at = [INSIDE[0] + (desk[0] - INSIDE[0]) * t, INSIDE[1] + (desk[1] - INSIDE[1]) * t];
        }
      } else {
        maxL = Math.max(maxL, l);
      }
      if (at) {
        lastL = -1;
        for (const you of yous) you.setAttribute("transform", `translate(${at[0].toFixed(2)} ${at[1].toFixed(2)})`);
      } else if (Math.abs(l - lastL) > 0.05) {
        lastL = l;
        const [x, py] = pointAt(route.points, l);
        for (const you of yous) you.setAttribute("transform", `translate(${x.toFixed(2)} ${py.toFixed(2)})`);
      }
      if (isOutside !== lastOutside) {
        lastOutside = isOutside;
        setOutside(isOutside);
      }
      for (const trail of trails) trail.style.strokeDashoffset = (route.total - maxL).toFixed(2);

      if (here !== lastCurrent) {
        lastCurrent = here;
        setCurrent(here);
      }
      // 去过的地方：走到过它的路线长度就算
      const reached = PLACES.filter((key) => route.at[key] <= maxL + 0.5).length;
      if (reached !== lastVisited) {
        lastVisited = reached;
        setVisited(reached);
      }
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("wl:engine", schedule);

    // 迷你播放器也在右下角：告诉它平面图占了多高，让它摞在上面
    // （手机上平面图收在左下角的小按钮里，和右下角的播放器不打架，就不用摞）
    const setOffset = () => {
      const desktop = window.matchMedia("(min-width: 861px)").matches;
      const h = desktop ? root.getBoundingClientRect().height + 12 : 0;
      document.documentElement.style.setProperty("--plan-offset", `${Math.round(h)}px`);
    };
    setOffset();
    window.addEventListener("resize", setOffset, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("wl:engine", schedule);
      window.removeEventListener("resize", setOffset);
      document.documentElement.style.removeProperty("--plan-offset");
    };
  }, [route]);

  /** 点一个地方：滚过去，焦点给那一幕的标题 */
  const jump = useCallback((key: PlaceKey) => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const els = Array.from(document.querySelectorAll<HTMLElement>(`[data-place="${key}"]`));
    if (!els.length) return;
    // 书桌前也按它自己的位置跳（它前面还有第 0 幕；跳到这里正好是第 1 幕刚钉住、小宇航员飞进来的那一刻）
    const top = Math.min(...els.map((el) => el.getBoundingClientRect().top + window.scrollY));
    window.scrollTo({ top, behavior: reduce ? "instant" : "smooth" });
    setOpen(false);
    const heading = document.getElementById(`${key}-title`);
    heading?.focus({ preventScroll: true });
  }, []);

  /** 手机抽屉：Esc 关，打开时焦点进抽屉，关上后焦点回按钮 */
  useEffect(() => {
    if (!open) return;
    firstLinkRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const atWindow = current === "window";
  const nowName = outside ? outsideLabel.name : labels[current].name;
  const nowTitle = outside ? outsideLabel.title : labels[current].title;
  const reachedSet = new Set(PLACES.slice(0, visited));

  const map = (withLinks: boolean) => (
    <div className="plan__map">
      <svg className="plan__svg" viewBox="0 0 240 180" aria-hidden>
        {/* 墙：上墙右段是窗、下墙左段是门 */}
        <g className="plan__walls">
          <path d="M120 10H10V170H34M64 170H230V10H214" />
        </g>
        <g className="plan__window">
          <path d="M120 8.2H214M120 10H214M120 11.8H214" />
        </g>
        <g className="plan__thin">
          {/* 门扇和开门弧线 */}
          <path d="M34 170V145" />
          <path d="M34 145A25 25 0 0 1 59 170" className="plan__dash" />
          {/* 书桌、显示器、椅子 */}
          <rect x="18" y="16" width="88" height="26" />
          <rect x="60" y="19" width="34" height="3.5" className="plan__fill" />
          <circle cx="46" cy="54" r="6" />
          {/* 书架（靠左墙） */}
          <rect x="14" y="80" width="12" height="72" />
          <path d="M14 92H26M14 104H26M14 116H26M14 128H26M14 140H26" />
          {/* 投影：机器、光束、幕布 */}
          <rect x="112" y="96" width="11" height="6" />
          <path d="M117.5 102 90 165M117.5 102 145 165" className="plan__dash" />
          <path d="M86 166.5H149" className="plan__strong" />
          {/* 暗房：一个隔间，门帘在上边 */}
          <path d="M184 170V114H188M206 114H230" />
          <path d="M188 114q2.25 -2.5 4.5 0t4.5 0 4.5 0 4.5 0" className="plan__dash" />
          <circle cx="220" cy="126" r="2" className="plan__fill" />
          {/* 唱片架（靠右墙）和架上的唱片 */}
          <rect x="216" y="42" width="10" height="56" />
          <circle cx="210" cy="52" r="4.5" />
          <circle cx="210" cy="66" r="4.5" />
          <circle cx="210" cy="80" r="4.5" />
        </g>

        <polyline className="plan__route" points={routePoints} />
        <polyline
          className="plan__trail"
          data-plan-trail
          points={routePoints}
          style={{ strokeDasharray: route.total.toFixed(2), strokeDashoffset: route.total.toFixed(2) }}
        />

        {PLACES.map((key) => (
          <circle
            key={key}
            className={`plan__station${reachedSet.has(key) ? " is-lit" : ""}${current === key && !outside ? " is-here" : ""}`}
            cx={STATIONS[key][0]}
            cy={STATIONS[key][1]}
            r={3.2}
          />
        ))}

        <g className="plan__you" data-plan-you transform={`translate(${STATIONS.desk[0]} ${STATIONS.desk[1]})`}>
          <circle r="6.5" className="plan__you-ring" />
          <circle r="2.8" className="plan__you-core" />
        </g>
      </svg>

      {withLinks && (
        <ol className="plan__hits">
          {PLACES.map((key) => (
            <li key={key} style={{ left: `${(STATIONS[key][0] / 240) * 100}%`, top: `${(STATIONS[key][1] / 180) * 100}%` }}>
              <a
                href={`#${key}`}
                className="plan__hit"
                aria-label={gotoLabel[key]}
                aria-current={current === key && !outside ? "location" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  jump(key);
                }}
              >
                <span className="plan__tip" aria-hidden>
                  {labels[key].name} · {labels[key].title}
                </span>
              </a>
            </li>
          ))}
        </ol>
      )}
    </div>
  );

  return (
    <nav
      ref={rootRef}
      className={`plan wl-chrome${atWindow ? " is-window" : ""}${outside ? " is-outside" : ""}${open ? " is-open" : ""}`}
      aria-label={navLabel}
    >
      {/* 手机：收成一个小按钮 */}
      <button
        ref={toggleRef}
        type="button"
        className="plan__toggle"
        aria-expanded={open}
        aria-controls="plan-sheet"
        aria-label={open ? closeLabel : `${openLabel} · ${nowName}`}
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
          <path d="M3 3h18v18H3zM3 15h6M15 3v6M15 15h6v6" />
          <circle cx="9" cy="9" r="2" fill="currentColor" stroke="none" />
        </svg>
      </button>
      <button type="button" className="plan__backdrop" tabIndex={-1} aria-hidden onClick={() => setOpen(false)} />

      <div id="plan-sheet" className="plan__panel">
        {map(true)}

        <p className="plan__now">
          <span className="plan__now-label mono">{hereLabel}</span>
          <span className="plan__now-place">
            {nowName}
            <span className="plan__now-title"> · {nowTitle}</span>
          </span>
        </p>
        <p className="plan__coords mono" aria-hidden={!atWindow}>
          {coords}
          <span>{city}</span>
        </p>

        {/* 抽屉里的文字列表（桌面不显示，地图上的点就是入口） */}
        <ol className="plan__list">
          {PLACES.map((key, i) => (
            <li key={key}>
              <a
                ref={i === 0 ? firstLinkRef : undefined}
                href={`#${key}`}
                className={reachedSet.has(key) ? "is-lit" : undefined}
                aria-current={current === key && !outside ? "location" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  jump(key);
                }}
              >
                <span className="plan__list-name">{labels[key].name}</span>
                <span className="plan__list-title">{labels[key].title}</span>
              </a>
            </li>
          ))}
        </ol>
        <button type="button" className="plan__close" onClick={() => setOpen(false)}>
          {closeLabel}
        </button>
      </div>
    </nav>
  );
}
