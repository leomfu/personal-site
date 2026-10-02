import type { CSSProperties, ReactNode } from "react";
import type { Point, ScenePair } from "@/lib/sceneTypes";

/**
 * 一张铺满容器的场景图（地球 / 房间），横竖两套构图：
 * 视口比 4:5 还窄（竖着拿的手机、竖放的平板）用 9:16 那张，其余用 16:9。
 *
 * 为什么不用 object-fit: cover：图上有要对准的点（上海的光点、窗户），
 * 需要知道那个点此刻落在屏幕的哪里。所以这里用纯 CSS 做 cover：
 * `.plate__box` 的宽 = max(容器宽, 容器高 × 图片宽高比)，高按宽高比走，
 * 再按 position（等价于 object-position）对齐。图上的点就可以用百分比坐标
 * 直接摆进 box 里（children 里的 `.plate__mark`，用 --fx / --fy 定位），
 * 不管屏幕多宽多高都钉在同一个像素上。
 *
 * 换图不用改这里：宽高和关键点都来自 lib/scene.ts 的清单。
 */
export function ScenePlate({
  pair,
  position = { x: 0.5, y: 0.5 },
  positionTall = position,
  eager = false,
  ghost = false,
  className,
  children,
}: {
  pair: ScenePair;
  /** 等价于 object-position（0–1），16:9 那张 */
  position?: Point;
  /** 9:16 那张的对齐 */
  positionTall?: Point;
  /** 首屏的图：立即加载、提高优先级 */
  eager?: boolean;
  /** 只要几何、不画图：给叠在图上的标记层用，保证和下面那张图用的是同一套坐标 */
  ghost?: boolean;
  className?: string;
  /** 摆在图上的东西（光点、准星），坐标系就是图本身 */
  children?: ReactNode;
}) {
  // 竖版不在就整套退回横版（比例、关键点都跟着退），否则 CSS 会按竖版的比例去摆横版的图
  const wide = pair.wide.exists || !pair.tall.exists ? pair.wide : pair.tall;
  const tall = pair.tall.exists ? pair.tall : wide;
  const alignTall = pair.tall.exists ? positionTall : position;
  const style = {
    "--ar-w": (wide.width / wide.height).toFixed(5),
    "--ar-t": (tall.width / tall.height).toFixed(5),
    "--px-w": position.x,
    "--py-w": position.y,
    "--px-t": alignTall.x,
    "--py-t": alignTall.y,
    "--fx-w": wide.focus?.x ?? 0.5,
    "--fy-w": wide.focus?.y ?? 0.5,
    "--fx-t": tall.focus?.x ?? 0.5,
    "--fy-t": tall.focus?.y ?? 0.5,
  } as CSSProperties;

  return (
    <div className={className ? `plate ${className}` : "plate"} style={style}>
      <div className="plate__box">
        {!ghost && (wide.exists || tall.exists) && (
          <picture className="plate__media">
            {pair.tall.exists && pair.wide.exists && (
              <source media="(max-aspect-ratio: 4/5)" srcSet={tall.src} width={tall.width} height={tall.height} />
            )}
            {/* 场景图是 CSS 里自己做的 cover（见上），不用 next/image；alt 为空 = 装饰图，读屏跳过 */}
            <img
              src={wide.src}
              width={wide.width}
              height={wide.height}
              alt=""
              decoding="async"
              loading={eager ? "eager" : "lazy"}
              fetchPriority={eager ? "high" : "auto"}
            />
          </picture>
        )}
        {children}
      </div>
    </div>
  );
}
