/**
 * 摄影板块的类型和纯函数 —— 客户端组件（放大看图的那个网格）也要用它们，
 * 所以这里**不能出现 node:fs**。读文件的那一半在 ./photos.ts（只在服务端跑）。
 * 这条边界踩过一次坑：客户端组件一引带 node:fs 的模块，Turbopack 直接 panic。
 */

/** content/photos/<slug>.json 里 photos 数组的一条 */
export type PhotoEntry = {
  /** public/images/photos/ 下的文件名 */
  file: string;
  /** 像素尺寸（next/image 要用，手动放图时照实填） */
  width: number;
  height: number;
  caption?: string;
  captionEn?: string;
};

/** content/photos/<slug>.json 的整体结构。文件名就是 slug */
export type AlbumData = {
  title: string;
  titleEn?: string;
  /** 小字里的年份：「2025 · 2 张」 */
  year: string;
  /** 摄影页上的先后顺序，小的在前 */
  order?: number;
  photos: PhotoEntry[];
};

/** 页面里用的照片：路径已经拼好 */
export type Photo = PhotoEntry & { src: string };

export type Album = Omit<AlbumData, "photos"> & { slug: string; photos: Photo[] };

export const photoSrc = (file: string) => `/images/photos/${file}`;
