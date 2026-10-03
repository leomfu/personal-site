import fs from "node:fs";
import path from "node:path";
import type { FacadeSpots, Point, Quad, SceneImage, SceneManifest, SceneVideo } from "./sceneTypes";

/**
 * 场景素材清单（2026-10 改版，scroll-craft）。只在构建时跑（有 node:fs）。
 *
 * 所有生成类素材集中放在 public/scene/，文件名是约定好的，替换素材 = 用同名文件覆盖，
 * 然后重新构建。每个文件的用途、尺寸要求、当前是占位还是正式、替换步骤，
 * 见 scrollcraft/builds/weiliang/ASSETS.md。
 *
 * - 文件不在：exists=false，页面走后备（俯冲是「地球 → 航拍 → 江面起点」，航拍不在就跳过那一段；
 *   2026-10-03 起俯冲不再用视频，也不再落到书房，BRIEF R9）。
 * - 宽高：构建时直接读 webp 文件头，换了尺寸不用改这里。
 * - focus（上海在地球图上的位置、窗户在房间图上的位置）**要人看图量出来**，
 *   换了图之后改下面 FOCUS 这几个数。量法见 ASSETS.md。
 */

const PUBLIC = path.join(process.cwd(), "public");

/** 关键点（归一化坐标）。换图之后必须重新量。下面是 2026-10-02 正式素材上主会话量好的值 */
const FOCUS = {
  /** 地球 16:9：上海（海岸边那片高楼光点） */
  earthWide: { x: 0.46, y: 0.63 },
  /** 地球 9:16：上海（东方明珠那片） */
  earthTall: { x: 0.48, y: 0.63 },
  /** 航拍 16:9：陆家嘴塔群 */
  aerialWide: { x: 0.52, y: 0.55 },
  /** 航拍 9:16：陆家嘴塔群 */
  aerialTall: { x: 0.5, y: 0.5 },
  /** 房间 16:9：窗户玻璃的中心（在笔记本上方；笔记本比显示器矮，窗户露得更多，BRIEF R7） */
  roomWide: { x: 0.51, y: 0.27 },
  /** 房间 9:16：窗户玻璃的中心 */
  roomTall: { x: 0.6, y: 0.22 },
  /**
   * 沿江飞行 21:9：江面的消失点（两岸堤线延长后交在一起的地方）。2026-10-03 看图量的：
   * 外滩堤线过 (0.40, 0.60)、(0.54, 0.545)，陆家嘴堤线过 (0.70, 0.575)、(0.585, 0.545)，交点约 (0.56, 0.55)。
   * 第 0 幕的推镜、两侧楼群带的透视、江面流光都以它为中心。
   */
  flightWide: { x: 0.56, y: 0.55 },
  /** 沿江飞行 9:16：江面从外白渡桥下穿过去的地方（桥的中墩，水面上沿） */
  flightTall: { x: 0.63, y: 0.55 },
} satisfies Record<string, Point>;

/**
 * 书房图上 MacBook 屏幕的四个角（归一化坐标，顺序：左上、右上、右下、左下）。2026-10-02 MacBook 版书房图上主会话量的（BRIEF R7）。
 * 第 1 幕把一块真实的网页（Claude 应用窗口 + 桌宠小螃蟹）贴在这里，换图之后也要重新量。
 * 横版正对镜头，是个矩形；竖版是透视四边形，页面上用 matrix3d 贴合（components/about/DeskScreen）。
 */
const SCREEN = {
  roomWide: [
    { x: 0.401, y: 0.454 },
    { x: 0.617, y: 0.454 },
    { x: 0.617, y: 0.699 },
    { x: 0.401, y: 0.699 },
  ],
  // 竖版在主会话量的 (0.319, 0.542) (0.608, 0.539) (0.639, 0.658) (0.351, 0.682) 基础上按亮屏边缘重新拟合过：
  // 原值左上角高出亮屏约 18px（盖掉了上边框）、左边和右下各往里缩了约 2px（会露出亮边）。
  // 现在四条边各沿亮屏边缘往外留 2px（图片像素），量法：从屏幕中间往外走到亮度掉下去为止，每条边取几十个点拟合直线。
  roomTall: [
    { x: 0.3164, y: 0.5482 },
    { x: 0.6066, y: 0.5389 },
    { x: 0.6416, y: 0.6573 },
    { x: 0.35, y: 0.683 },
  ],
} satisfies Record<string, Quad>;

/**
 * 外墙图（facade）上的关键点，2026-10-03 对着 facade-16x9 / 9x16 看图量的（BRIEF R10 / R11）：
 *   横版：左扇推开在外面，缝在左：窗台台面 x 0.30–0.59、y 0.74–0.80，推开的窗扇在 x 0.32–0.40，
 *         窗扇和中梃之间的缝在 x ≈ 0.42；窗洞（亮灯的玻璃）x 0.335–0.535、y 0.16–0.74。
 *   竖版：右扇推开在外面，缝在右：窗台台面 x 0.30–0.58、y 0.62–0.67，窗扇铰链在 x ≈ 0.46；
 *         窗洞 x 0.30–0.62、y 0.26–0.61。
 */
const FACADE = {
  wide: {
    sill: { x: 0.52, y: 0.757 },
    gap: { x: 0.425, y: 0.775 },
    origin: { x: 0.435, y: 0.45 },
    hole: { l: 0.335, r: 0.535, t: 0.16, b: 0.74 },
    zk: 0.8,
  },
  tall: {
    sill: { x: 0.34, y: 0.655 },
    gap: { x: 0.5, y: 0.64 },
    origin: { x: 0.46, y: 0.435 },
    hole: { l: 0.3, r: 0.62, t: 0.26, b: 0.61 },
    zk: 0.72,
  },
} satisfies Record<string, FacadeSpots>;

/** 读 webp 文件头拿宽高（VP8 / VP8L / VP8X 三种都认）。读不出来返回 null */
function webpSize(file: string): { width: number; height: number } | null {
  try {
    const fd = fs.openSync(file, "r");
    const buf = Buffer.alloc(32);
    fs.readSync(fd, buf, 0, 32, 0);
    fs.closeSync(fd);
    if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP") return null;
    const chunk = buf.toString("ascii", 12, 16);
    if (chunk === "VP8 ") {
      return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    }
    if (chunk === "VP8L") {
      const bits = buf.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (chunk === "VP8X") {
      return { width: buf.readUIntLE(24, 3) + 1, height: buf.readUIntLE(27, 3) + 1 };
    }
  } catch {
    // 读不了就用声明的尺寸
  }
  return null;
}

function image(rel: string, fallback: { width: number; height: number }, focus?: Point): SceneImage {
  const abs = path.join(PUBLIC, rel);
  const exists = fs.existsSync(abs);
  const size = exists && rel.endsWith(".webp") ? webpSize(abs) : null;
  return {
    src: `/${rel}`,
    width: size?.width ?? fallback.width,
    height: size?.height ?? fallback.height,
    exists,
    ...(focus ? { focus } : {}),
  };
}

function video(rel: string): SceneVideo {
  return { src: `/${rel}`, exists: fs.existsSync(path.join(PUBLIC, rel)) };
}

export function getScene(): SceneManifest {
  return {
    earth: {
      wide: image("scene/earth-16x9.webp", { width: 2560, height: 1440 }, FOCUS.earthWide),
      tall: image("scene/earth-9x16.webp", { width: 1440, height: 2560 }, FOCUS.earthTall),
    },
    aerial: {
      wide: image("scene/aerial-16x9.webp", { width: 2560, height: 1440 }, FOCUS.aerialWide),
      tall: image("scene/aerial-9x16.webp", { width: 1440, height: 2560 }, FOCUS.aerialTall),
    },
    room: {
      wide: image("scene/room-16x9.webp", { width: 2560, height: 1440 }, FOCUS.roomWide),
      tall: image("scene/room-9x16.webp", { width: 1440, height: 2560 }, FOCUS.roomTall),
    },
    screen: { wide: SCREEN.roomWide, tall: SCREEN.roomTall },
    flight: {
      wide: image("scene/flight-21x9.webp", { width: 3024, height: 1296 }, FOCUS.flightWide),
      tall: image("scene/flight-9x16.webp", { width: 1440, height: 2560 }, FOCUS.flightTall),
    },
    flightBands: {
      bund: image("scene/flight-bund.webp", { width: 3024, height: 1296 }),
      lujiazui: image("scene/flight-lujiazui.webp", { width: 3024, height: 1296 }),
    },
    facade: {
      wide: image("scene/facade-16x9.webp", { width: 2560, height: 1440 }),
      tall: image("scene/facade-9x16.webp", { width: 1440, height: 2560 }),
    },
    facadeSpots: FACADE,
    portraitCard: image("scene/portrait-card.webp", { width: 600, height: 800 }),
    dive: {
      wide: video("scene/dive-16x9.mp4"),
      tall: video("scene/dive-9x16.mp4"),
      poster: image("scene/dive-poster.webp", { width: 1920, height: 1080 }),
    },
  };
}

/**
 * 项目展品的真实截图：public/images/projects/<slug>.webp，有就用，没有就只放事实标签。
 * 截图是作品本身的样子，不做生成式改动。
 */
export function getProjectShot(slug: string): SceneImage | null {
  const shot = image(`images/projects/${slug}.webp`, { width: 1280, height: 800 });
  return shot.exists ? shot : null;
}
