/**
 * 场景素材清单的类型（客户端组件也要用，所以这里不能有 node:fs；读文件的一半在 ./scene.ts）。
 */

/** 归一化坐标（0–1），相对于图片本身的宽高 */
export type Point = { x: number; y: number };

/** 四个角（左上、右上、右下、左下），归一化坐标 */
export type Quad = [Point, Point, Point, Point];

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
   * 房间图是窗户玻璃的中心（第 1 幕的推镜、第 7 幕「窗边」都朝这里）；
   * 沿江飞行图是江面的消失点。
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
  /** 书房图上 MacBook 屏幕的四个角（横版、竖版各一组） */
  screen: { wide: Quad; tall: Quad };
  /**
   * 第 0 幕「沿江飞行」的底图（BRIEF R9）：21:9 给桌面，9:16 给手机。focus 是江面的消失点，
   * 推镜、楼群带的透视和流光都对准它。
   */
  flight: ScenePair;
  /** 两岸楼群带（近黑底，用 screen 叠加）：外滩从左边掠过，陆家嘴从右边掠过 */
  flightBands: { bund: SceneImage; lujiazui: SceneImage };
  /** 临江住宅楼的外墙近景（第 0 幕结尾，BRIEF R10）：一扇推开的窗，窗台空着 */
  facade: ScenePair;
  /** 外墙图上要用到的几个点（归一化坐标，横竖各一组，看图量的，见 lib/scene.ts） */
  facadeSpots: { wide: FacadeSpots; tall: FacadeSpots };
  /**
   * 彩铅画像（暖色素描纸，不透明）：只用在首页名片上，当作一张真实的画纸。
   * 站主的真人照片全站不出现；第 1 幕也不放人像（2026-10 站主要求）。
   */
  portraitCard: SceneImage;
  dive: {
    wide: SceneVideo;
    tall: SceneVideo;
    poster: SceneImage;
  };
};

/** 外墙图上的关键点（归一化坐标） */
export type FacadeSpots = {
  /** 小宇航员落在窗台上的脚底位置 */
  sill: Point;
  /** 窗缝：它踮着脚走到这里，再钻进去 */
  gap: Point;
  /** 镜头穿窗时推近的中心（窗洞中心） */
  origin: Point;
  /** 窗洞（亮着灯的那几块玻璃）的四边：左、右、上、下 */
  hole: { l: number; r: number; t: number; b: number };
  /** 穿窗时放大到多大时窗洞撑满屏幕（1 / (1 - zk × 进度)） */
  zk: number;
};
