/**
 * 场景素材清单的类型（客户端组件也要用，所以这里不能有 node:fs；读文件的一半在 ./scene.ts）。
 */

/** 归一化坐标（0–1），相对于图片本身的宽高 */
export type Point = { x: number; y: number };

export type SceneImage = {
  /** public 下的路径，例如 /scene/earth-16x9.webp */
  src: string;
  width: number;
  height: number;
  /** 构建时这个文件在不在 public/ 里 */
  exists: boolean;
  /**
   * 画面里的关键点。地球图是上海的位置（首页光点、俯冲的放大中心都对准它）；
   * 航拍图是陆家嘴塔群（俯冲第二段推向这里）；
   * 房间图是窗户玻璃的中心（俯冲最后一段、第 1 幕的推镜、第 7 幕「窗边」都朝这里）。
   */
  focus?: Point;
};

export type SceneVideo = {
  src: string;
  exists: boolean;
};

/** 一对横竖构图：桌面用 wide（16:9），竖屏手机用 tall（9:16） */
export type ScenePair = { wide: SceneImage; tall: SceneImage };

export type SceneManifest = {
  earth: ScenePair;
  /** 三千米高空的上海夜景航拍：俯冲后备方案的中间一段（不在时退回两段） */
  aerial: ScenePair;
  room: ScenePair;
  /** 彩铅画像（暖色素描纸，不透明）：第 1 幕钉在窗边的那张画纸 */
  portrait: SceneImage;
  /** 同一张彩铅画像的小尺寸：首页名片那张画纸 */
  portraitCard: SceneImage;
  dive: {
    wide: SceneVideo;
    tall: SceneVideo;
    poster: SceneImage;
  };
};
