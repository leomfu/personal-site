import fs from "node:fs";
import path from "node:path";
import type { Point, Quad, SceneImage, SceneManifest } from "./sceneTypes";

/**
 * 场景素材清单（2026-10 改版，scroll-craft）。只在构建时跑（有 node:fs）。
 *
 * 所有生成类素材集中放在 public/scene/，文件名是约定好的，替换素材 = 用同名文件覆盖，
 * 然后重新构建。每个文件的用途、尺寸要求、当前是占位还是正式、替换步骤，
 * 见 scrollcraft/builds/weiliang/ASSETS.md。
 *
 * - 文件不在：exists=false，页面走后备（不画图，只留文字）。
 *   2026-10-05 开场（俯冲、沿江飞行、窗户）整套下线，航拍 / 飞行 / 外墙素材一并删掉。
 * - 宽高：构建时直接读 webp 文件头，换了尺寸不用改这里。
 * - focus（上海在地球图上的位置）和书房图上的屏幕四角 **要人看图量出来**，
 *   换了图之后改下面 FOCUS / SCREEN 这几个数。量法见 ASSETS.md。
 */

const PUBLIC = path.join(process.cwd(), "public");

/** 关键点（归一化坐标）。换图之后必须重新量。下面是 2026-10-02 正式素材上主会话量好的值 */
const FOCUS = {
  /** 地球 16:9：上海（海岸边那片高楼光点） */
  earthWide: { x: 0.46, y: 0.63 },
  /** 地球 9:16：上海（东方明珠那片） */
  earthTall: { x: 0.48, y: 0.63 },
  // 房间图不再需要关键点：2026-10-05 开场下线后没有东西要对准窗户了（2026-10-06 换新书房图时删掉）
} satisfies Record<string, Point>;

/**
 * 书房图上 MacBook 屏幕的四个角（归一化坐标，顺序：左上、右上、右下、左下）。
 * 第 1 幕把一块真实的网页（Claude 应用窗口 + 桌宠小螃蟹）贴在这里，页面上用 matrix3d 贴合（components/about/DeskScreen），换图之后要重新量。
 *
 * 2026-10-06 换新书房图（台灯在左、MacBook 在正中、窗外东方明珠在右）后量的，横竖两张都是：
 * 黑色显示区（含黑边框，不含银色外框）的四角。量法：亮度阈值 70，从屏幕中心往上下左右走到亮度上去为止，
 * 每条边取几十个点拟合直线再求交点。两张都是下沿比上沿略宽的轻微梯形。
 * 横版下沿是一条深灰的铰链条，右半边的银框落在阴影里（亮度只有 40–80），下沿按「黑→铰链/银框」那一跳取，不按阈值硬切。
 */
const SCREEN = {
  // 像素（2560×1440）：TL 1361,700  TR 1877,700  BR 1891,1027  BL 1346,1027
  roomWide: [
    { x: 0.5316, y: 0.4861 },
    { x: 0.7332, y: 0.4861 },
    { x: 0.7387, y: 0.7132 },
    { x: 0.5258, y: 0.7132 },
  ],
  // 像素（1440×2560）：TL 452,1154  TR 1042,1154  BR 1051,1470  BL 443,1465
  roomTall: [
    { x: 0.3139, y: 0.4508 },
    { x: 0.7236, y: 0.4508 },
    { x: 0.7299, y: 0.5742 },
    { x: 0.3076, y: 0.5723 },
  ],
} satisfies Record<string, Quad>;

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

export function getScene(): SceneManifest {
  return {
    earth: {
      wide: image("scene/earth-16x9.webp", { width: 2560, height: 1440 }, FOCUS.earthWide),
      tall: image("scene/earth-9x16.webp", { width: 1440, height: 2560 }, FOCUS.earthTall),
    },
    room: {
      wide: image("scene/room-16x9.webp", { width: 2560, height: 1440 }),
      tall: image("scene/room-9x16.webp", { width: 1440, height: 2560 }),
    },
    screen: { wide: SCREEN.roomWide, tall: SCREEN.roomTall },
    portraitCard: image("scene/portrait-card.webp", { width: 600, height: 800 }),
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
