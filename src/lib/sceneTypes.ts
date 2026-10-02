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
   * 房间图是窗户的中心（第 7 幕「窗边」放大到这里）。
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
  room: ScenePair;
  /** 真 alpha 抠图的人像（第 1 幕主体层） */
  portrait: SceneImage;
  /** 不抠图的人像（首页名片） */
  portraitCard: SceneImage;
  dive: {
    wide: SceneVideo;
    tall: SceneVideo;
    poster: SceneImage;
  };
};
