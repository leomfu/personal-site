import fs from "node:fs";
import path from "node:path";
import { photoSrc, type Album, type AlbumData } from "./photoTypes";

/**
 * content/photos/ 的读取层 —— 构建时跑（有 node:fs，不能进浏览器包）。
 * 一辑一个 json，文件名即 slug（/photos/<slug>/）。图片手动放进 public/images/photos/，
 * 步骤见 docs/如何添加照片.md。类型和纯函数在 ./photoTypes，客户端组件从那里引。
 */

export type * from "./photoTypes";

const DIR = path.join(process.cwd(), "content", "photos");

/** 全部辑，按 order 排（没填 order 的排最后，再按年份倒序）。上一辑/下一辑也按这个顺序。 */
export function getAlbums(): Album[] {
  if (!fs.existsSync(DIR)) return [];

  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".json"))
    .map((file) => {
      const data = JSON.parse(fs.readFileSync(path.join(DIR, file), "utf8")) as AlbumData;
      return {
        ...data,
        slug: file.replace(/\.json$/, ""),
        photos: (data.photos ?? []).map((photo) => ({ ...photo, src: photoSrc(photo.file) })),
      } satisfies Album;
    })
    .sort(
      (a, b) =>
        (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) ||
        b.year.localeCompare(a.year),
    );
}
