/**
 * 生成 public/scene/ 下的占位素材（2026-10 改版，scroll-craft）。
 *
 * 正式素材由即梦生成后直接覆盖同名文件即可，不需要再跑这个脚本。
 * 这个脚本只在「正式素材还没到」时用来重建占位图，步骤和每个文件的要求见
 * scrollcraft/builds/weiliang/ASSETS.md。
 *
 *   node scripts/scene-placeholders.mjs          只补缺的文件，已有的一个都不碰
 *   node scripts/scene-placeholders.mjs --force  全部重新生成（会覆盖正式素材，慎用）
 *
 * 依赖 sharp（Next.js 自带的可选依赖，node_modules 里已有）。
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "public", "scene");
const EARTH_SRC = path.join(ROOT, "scrollcraft/builds/weiliang/out/B1-earth-16x9-a.png");
const POSTER = path.join(ROOT, "public/images/hero/poster.webp");
const SKYLINE = path.join(ROOT, "public/images/photos/shanghai-01.webp");

fs.mkdirSync(OUT, { recursive: true });

/** 正式素材到位后再跑这个脚本，不能把它们覆盖掉：默认只写不存在的文件 */
const FORCE = process.argv.includes("--force");
const skip = (...files) => {
  const existing = files.filter((f) => fs.existsSync(path.join(OUT, f)));
  if (!FORCE && existing.length === files.length) {
    console.log("已存在，跳过：", existing.join(" / "));
    return true;
  }
  return false;
};

const svg = (w, h, body) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`);

/* ------------------------------------------------------------------ 地球 */
async function earth() {
  if (skip("earth-16x9.webp", "earth-9x16.webp")) return;
  if (!fs.existsSync(EARTH_SRC)) {
    console.warn("跳过地球：找不到", EARTH_SRC);
    return;
  }
  // 16:9：原图 2560×1440 直接转 webp
  await sharp(EARTH_SRC).webp({ quality: 80 }).toFile(path.join(OUT, "earth-16x9.webp"));
  // 9:16：从 16:9 里竖着裁一条，上海在裁出来那条的 55% 处
  await sharp(EARTH_SRC)
    .extract({ left: 1110, top: 0, width: 810, height: 1440 })
    .webp({ quality: 80 })
    .toFile(path.join(OUT, "earth-9x16.webp"));
  console.log("earth-16x9.webp / earth-9x16.webp");
}

/* ------------------------------------------------------------------ 房间 */
async function room({ w, h, file, win, desk, lamp, monitor }) {
  if (skip(file)) return;
  const base = svg(
    w,
    h,
    `<defs>
      <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0d1015"/><stop offset="1" stop-color="#08090c"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#wall)"/>`,
  );

  // 窗外：陆家嘴照片压暗、虚化，当作失焦的城市夜景
  const ww = Math.round(w * (win.x2 - win.x1));
  const wh = Math.round(h * (win.y2 - win.y1));
  const view = await sharp(SKYLINE)
    .resize(ww, wh, { fit: "cover", position: "centre" })
    .blur(Math.max(6, Math.round(ww / 90)))
    .modulate({ brightness: 0.34, saturation: 0.7 })
    .linear(1.05, -6)
    .toBuffer();

  const mullion = Math.max(8, Math.round(w / 180));
  const frame = svg(
    w,
    h,
    `<g fill="#050608">
      <rect x="${w * win.x1 - mullion}" y="${h * win.y1 - mullion}" width="${ww + mullion * 2}" height="${mullion}"/>
      <rect x="${w * win.x1 - mullion}" y="${h * win.y2}" width="${ww + mullion * 2}" height="${mullion}"/>
      <rect x="${w * win.x1 - mullion}" y="${h * win.y1}" width="${mullion}" height="${wh}"/>
      <rect x="${w * win.x2}" y="${h * win.y1}" width="${mullion}" height="${wh}"/>
      <rect x="${w * (win.x1 + win.x2) / 2 - mullion / 2}" y="${h * win.y1}" width="${mullion}" height="${wh}"/>
      <rect x="${w * win.x1}" y="${h * (win.y1 + (win.y2 - win.y1) * 0.38)}" width="${ww}" height="${mullion * 0.7}"/>
    </g>
    <rect x="${w * win.x1}" y="${h * win.y1}" width="${ww}" height="${wh}" fill="#3a5a8a" opacity="0.10"/>`,
  );

  const light = svg(
    w,
    h,
    `<defs>
      <radialGradient id="lamp" cx="${lamp.x}" cy="${lamp.y}" r="${lamp.r}" gradientUnits="objectBoundingBox">
        <stop offset="0" stop-color="#f0b45a" stop-opacity="0.42"/>
        <stop offset="0.45" stop-color="#c98a3c" stop-opacity="0.14"/>
        <stop offset="1" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="mon" cx="${monitor.gx}" cy="${monitor.gy}" r="${monitor.gr}" gradientUnits="objectBoundingBox">
        <stop offset="0" stop-color="#6f93c8" stop-opacity="0.20"/>
        <stop offset="1" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="desk" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#16110c"/><stop offset="1" stop-color="#090807"/>
      </linearGradient>
      <linearGradient id="edge" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#e9a23b" stop-opacity="0.55"/>
        <stop offset="0.5" stop-color="#e9a23b" stop-opacity="0.12"/>
        <stop offset="1" stop-color="#7d9cc8" stop-opacity="0.18"/>
      </linearGradient>
      <radialGradient id="vig" cx="0.5" cy="0.45" r="0.75">
        <stop offset="0.55" stop-color="#000" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity="0.55"/>
      </radialGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#lamp)"/>
    <rect width="${w}" height="${h}" fill="url(#mon)"/>
    <rect x="${w * monitor.x1}" y="${h * monitor.y1}" width="${w * (monitor.x2 - monitor.x1)}" height="${h * (monitor.y2 - monitor.y1)}" fill="#07090c"/>
    <rect x="${w * monitor.x1 + 6}" y="${h * monitor.y1 + 6}" width="${w * (monitor.x2 - monitor.x1) - 12}" height="${h * (monitor.y2 - monitor.y1) - 12}" fill="#1a2738" opacity="0.85"/>
    <rect x="0" y="${h * desk}" width="${w}" height="${h * (1 - desk)}" fill="url(#desk)"/>
    <rect x="0" y="${h * desk}" width="${w}" height="${Math.max(2, h / 400)}" fill="url(#edge)"/>
    <rect width="${w}" height="${h}" fill="url(#vig)"/>`,
  );

  await sharp(base)
    .composite([
      { input: view, left: Math.round(w * win.x1), top: Math.round(h * win.y1) },
      { input: frame },
      { input: light },
    ])
    .webp({ quality: 78 })
    .toFile(path.join(OUT, file));
  console.log(file);
}

/* ------------------------------------------------------------------ 人像 */
async function portraits() {
  if (skip("portrait-card.webp", "portrait.webp")) return;
  // 从拍立得海报里裁脸部附近的 3:4，压暗、去饱和（临时图，不是正式的即梦人像）
  const crop = { left: 200, top: 100, width: 390, height: 520 };

  // 海报底色是白的，压暗之后四角还会发灰、左上角还有海报字，所以再压一层暗角
  const vignette = (w, h) =>
    svg(
      w,
      h,
      `<defs><radialGradient id="v" cx="0.52" cy="0.46" r="0.62">
        <stop offset="0.38" stop-color="#000" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity="0.86"/>
      </radialGradient>
      <linearGradient id="k" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#000" stop-opacity="0.55"/>
        <stop offset="0.4" stop-color="#000" stop-opacity="0"/>
      </linearGradient></defs>
      <rect width="${w}" height="${h}" fill="url(#v)"/><rect width="${w}" height="${h}" fill="url(#k)"/>`,
    );

  const graded = async (w, h) => {
    const base = await sharp(POSTER)
      .extract(crop)
      .resize(w, h)
      .modulate({ saturation: 0.16, brightness: 0.5 })
      .linear(1.12, -16)
      .tint({ r: 214, g: 194, b: 168 })
      .toBuffer();
    return sharp(base).composite([{ input: vignette(w, h) }]);
  };

  await (await graded(600, 800)).webp({ quality: 82 }).toFile(path.join(OUT, "portrait-card.webp"));

  // 抠图版占位：同一张图加一个羽化的椭圆 alpha（正式版要真抠图）
  const W = 900;
  const H = 1200;
  const mask = svg(
    W,
    H,
    `<defs><radialGradient id="m" cx="0.5" cy="0.44" rx="0.5" ry="0.5" r="0.5">
      <stop offset="0.62" stop-color="#fff" stop-opacity="1"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient></defs>
    <ellipse cx="${W * 0.5}" cy="${H * 0.5}" rx="${W * 0.47}" ry="${H * 0.52}" fill="url(#m)"/>`,
  );
  const body = await (await graded(W, H)).ensureAlpha().toBuffer();
  await sharp(body)
    .composite([{ input: mask, blend: "dest-in" }])
    .webp({ quality: 82, alphaQuality: 90 })
    .toFile(path.join(OUT, "portrait.webp"));
  console.log("portrait-card.webp / portrait.webp");
}

await earth();
await room({
  w: 1920,
  h: 1080,
  file: "room-16x9.webp",
  win: { x1: 0.27, x2: 0.75, y1: 0.07, y2: 0.56 },
  desk: 0.68,
  lamp: { x: 0.12, y: 0.55, r: 0.42 },
  monitor: { x1: 0.68, x2: 0.84, y1: 0.47, y2: 0.66, gx: 0.76, gy: 0.58, gr: 0.3 },
});
await room({
  w: 1080,
  h: 1920,
  file: "room-9x16.webp",
  win: { x1: 0.1, x2: 0.9, y1: 0.06, y2: 0.42 },
  desk: 0.72,
  lamp: { x: 0.08, y: 0.6, r: 0.5 },
  monitor: { x1: 0.66, x2: 0.96, y1: 0.58, y2: 0.7, gx: 0.8, gy: 0.64, gr: 0.4 },
});
await portraits();
