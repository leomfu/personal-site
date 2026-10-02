import fs from "node:fs";
import path from "node:path";
import type { Point, SceneImage, SceneManifest, SceneVideo } from "./sceneTypes";

/**
 * 场景素材清单（2026-10 改版，scroll-craft）。只在构建时跑（有 node:fs）。
 *
 * 所有生成类素材集中放在 public/scene/，文件名是约定好的，替换素材 = 用同名文件覆盖，
 * 然后重新构建。每个文件的用途、尺寸要求、当前是占位还是正式、替换步骤，
 * 见 scrollcraft/builds/weiliang/ASSETS.md。
 *
 * - 文件不在：exists=false，页面走后备（没有俯冲视频时用三段推进「地球 → 航拍 → 书房」代替，
 *   航拍也不在就只剩「地球 → 书房」两段）。
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
  /** 房间 16:9：窗户玻璃的中心（在显示器上方） */
  roomWide: { x: 0.51, y: 0.25 },
  /** 房间 9:16：窗户玻璃的中心 */
  roomTall: { x: 0.6, y: 0.22 },
} satisfies Record<string, Point>;

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
    portrait: image("scene/portrait.webp", { width: 1200, height: 1600 }),
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
