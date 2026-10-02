/**
 * Claude 小螃蟹一家的像素图（BRIEF R6 / R7）。纯数据，没有 React，服务端、客户端、预览脚本都能用。
 *
 * 身体：一律照 scrollcraft/builds/weiliang/ref/claude/clawd.svg（站主截图里 Claude Code 那只，按像素量的）。
 *   viewBox 0 0 112 78，身体 98×60，颜色 #D77757。**下面 CLAWD 里的数一个都不能改**，形状和比例就是它。
 * 衣服和道具：画在同一套像素网格上（一格 = 3.5，正好是钳子宽度的一半），用 ASCII 小图写，
 *   一个字符一格，「.」是空。每件衣服、道具单独成组，动画只动组的 transform / opacity。
 *
 * 坐标都在 clawd 的坐标系里（身体左上角是 (7, 0)），衣服可以画出 0..112 的范围，
 * 每个造型自己报一个 box（最终 SVG 的 viewBox），身体在每个造型里大小一样。
 */

/** 一格像素的边长（clawd 坐标） */
export const CELL = 3.5;

export type Rect = { x: number; y: number; w: number; h: number; f: string };

/** clawd.svg 原样（单位 = 参考图 1px） */
export const CLAWD = {
  color: "#D77757",
  eye: "#000",
  body: { x: 7, y: 0, w: 98, h: 60 },
  clawL: { x: 0, y: 17, w: 7, h: 12.5 },
  clawR: { x: 105, y: 17, w: 7, h: 12.5 },
  eyeL: { x: 28, y: 17, w: 8, h: 12.5 },
  eyeR: { x: 76, y: 17, w: 8, h: 12.5 },
  /** 四条腿，从左到右。走路时 0、2 一组，1、3 一组交替抬起 */
  legs: [
    { x: 7, y: 65, w: 7.7, h: 13 },
    { x: 21, y: 65, w: 7.7, h: 13 },
    { x: 84, y: 65, w: 8, h: 13 },
    { x: 98, y: 65, w: 8, h: 13 },
  ],
} as const;

/** ASCII 小图 → 一行一行合并好的矩形。ox / oy 是左上角在 clawd 坐标里的位置 */
export function pix(rows: string[], ox: number, oy: number, pal: Record<string, string>, cell = CELL): Rect[] {
  const out: Rect[] = [];
  rows.forEach((row, r) => {
    let i = 0;
    while (i < row.length) {
      const k = row[i];
      if (k === "." || !pal[k]) {
        i++;
        continue;
      }
      let n = 1;
      while (i + n < row.length && row[i + n] === k) n++;
      out.push({ x: ox + i * cell, y: oy + r * cell, w: n * cell, h: cell, f: pal[k] });
      i += n;
    }
  });
  return out;
}

/** 左右镜像一张小图 */
export const mirror = (rows: string[]) => rows.map((row) => [...row].reverse().join(""));

/**
 * 一个造型由几块组成，每块挂在一个「层」上：
 *   back   身体后面
 *   front  身体前面（帽子、眼镜、相机、头盔）
 *   clawL / clawR  跟着左 / 右钳子一起动（扳手、场记板、信封、手套）；画在钳子下面，钳子像是握着它
 *   fx     特效（闪光、音符），平时看不见，动作时才出现
 * `origin` 是这一块自己转动 / 翻转时的支点（clawd 坐标），比如场记板的合页、便签纸的上沿。
 */
export type Layer = "back" | "front" | "clawL" | "clawR" | "fx";
export type Part = {
  name: string;
  layer: Layer;
  rects: Rect[];
  origin?: [number, number];
  /** 挂在钳子上的东西默认画在钳子下面（钳子像握着它）；above = 盖在钳子上（拳击手套套住钳子） */
  above?: boolean;
};
export type Look = { box: [number, number, number, number]; parts: Part[] };

export const VARIANTS = ["desk", "astronaut", "builder", "reader", "director", "photographer", "dj", "mail", "boxer"] as const;
export type Variant = (typeof VARIANTS)[number];

/* ------------------------------------------------------------ 宇航员头盔（首页） */

/**
 * 头盔玻璃罩：按行给出半宽（格），从中线 x = 56 往两边量；最下面一行被领圈盖住。
 * 返回两份：玻璃（放在身体后面，身体的颜色不被罩浅）和边框 + 反光（放在前面）。
 */
function dome(): { glass: Rect[]; rim: Rect[] } {
  const HALF: Record<number, number> = { [-7]: 6, [-6]: 10, [-5]: 13, [-4]: 15, [-3]: 17 };
  const top = -7;
  const bottom = 15;
  const half = (r: number) => (r < top || r > bottom + 1 ? 0 : (HALF[r] ?? 18));
  const inside = (c: number, r: number) => {
    const h = half(r);
    return h > 0 && c >= 16 - h && c < 16 + h;
  };
  const rimColor = "#E9EEF5";
  const glassColor = "rgba(214, 230, 250, 0.16)";
  const glass: Rect[] = [];
  const out: Rect[] = [];
  for (let r = top; r <= bottom; r++) {
    const h = half(r);
    let c = 16 - h;
    // 一行里：边框格画实色，中间的玻璃合成一段
    let glassFrom: number | null = null;
    for (; c < 16 + h; c++) {
      const edge = !inside(c - 1, r) || !inside(c + 1, r) || !inside(c, r - 1);
      if (edge) {
        if (glassFrom !== null) {
          glass.push({ x: glassFrom * CELL, y: r * CELL, w: (c - glassFrom) * CELL, h: CELL, f: glassColor });
          glassFrom = null;
        }
        out.push({ x: c * CELL, y: r * CELL, w: CELL, h: CELL, f: rimColor });
      } else if (glassFrom === null) {
        glassFrom = c;
      }
    }
    if (glassFrom !== null) glass.push({ x: glassFrom * CELL, y: r * CELL, w: (c - glassFrom) * CELL, h: CELL, f: glassColor });
  }
  // 玻璃上的反光：左上一道弧，右上一点
  const shine = "rgba(255, 255, 255, 0.72)";
  for (const [c, r, n] of [
    [6, -5, 3],
    [3, -4, 2],
    [1, -3, 2],
    [0, -2, 1],
    [0, -1, 1],
    [24, -5, 2],
  ]) {
    out.push({ x: c * CELL, y: r * CELL, w: n * CELL, h: CELL, f: shine });
  }
  return { glass, rim: out };
}

const DOME = dome();

const astronaut: Look = {
  box: [-10.5, -42, 133, 120],
  parts: [
    { name: "glass", layer: "back", rects: DOME.glass },
    { name: "helmet", layer: "front", rects: DOME.rim },
    {
      name: "collar",
      layer: "front",
      rects: pix(
        [
          "......................................",
          ".WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.",
          "..gggggggggggggggggggggggggggggggggg..",
        ],
        -10.5,
        52.5,
        { W: "#EEF2F7", g: "#9EA9B8" },
      ),
    },
    {
      name: "antenna",
      layer: "front",
      rects: pix(["k", "k", "k", "k"], 77, -35, { k: "#E9EEF5" }),
    },
    {
      name: "light",
      layer: "front",
      rects: pix(["LL", "LL"], 75.25, -42, { L: "#FF7A4D" }),
      origin: [78.75, -38.5],
    },
  ],
};

/* ------------------------------------------------------------ 安全帽 + 扳手（在做的东西） */

const builder: Look = {
  box: [0, -24.5, 126, 102.5],
  parts: [
    {
      name: "hat",
      layer: "front",
      rects: pix(
        [
          ".........dddddddd.........",
          ".......ddYYYHHYYYdd.......",
          "......dYYYYYHHYYYYYd......",
          ".....dYYYYYYHHYYYYYYd.....",
          "....dYYYYYYYHHYYYYYYYd....",
          "dyyyyyyyyyyyyyyyyyyyyyyyyd",
          "dddddddddddddddddddddddddd",
        ],
        10.5,
        -24.5,
        { Y: "#F4C430", H: "#FFE58A", y: "#E0A81E", d: "#9C6A0A" },
      ),
    },
    {
      name: "wrench",
      layer: "clawR",
      rects: pix(
        [
          "gg..gg",
          "gG..Gg",
          "gG..Gg",
          "gGggGg",
          ".gGGg.",
          "..gG..",
          "..gG..",
          "..gG..",
          "..gG..",
          "..gG..",
          "..gG..",
          ".gGGg.",
          ".gggg.",
        ],
        105,
        -7.5,
        { g: "#76808C", G: "#B8C0C9" },
      ),
      origin: [112, 23],
    },
  ],
};

/* ------------------------------------------------------------ 圆眼镜 + 铅笔 + 便签本（写下来的） */

const RING = ["..kkk..", ".kw..k.", "kw....k", "k.....k", "k.....k", ".k...k.", "..kkk.."];
const INK = { k: "#2B2420", w: "rgba(255, 255, 255, 0.85)" };

const reader: Look = {
  box: [0, 0, 143.5, 78],
  parts: [
    {
      name: "pad",
      layer: "back",
      rects: pix(
        [
          "eeeeeeee",
          "elllllle",
          "eeeeeeee",
          "elllllle",
          "eeeeeeee",
          "elllllle",
          "eeeeeeee",
          "elllllle",
          "eeeeeeee",
          "eeeeeeee",
          "EEEEEEEE",
        ],
        115.5,
        39.5,
        { e: "#FBF6EA", l: "#B9C9DE", E: "#D9CDB4" },
      ),
    },
    {
      name: "sheet",
      layer: "back",
      rects: pix(
        [
          "eeeeeeee",
          "elllllle",
          "eeeeeeee",
          "elllllle",
          "eeeeeeee",
          "elllllle",
          "eeeeeeee",
          "elllllle",
          "eeeeeeee",
          "eeeeeeeE",
        ],
        115.5,
        39.5,
        { e: "#FFFDF6", l: "#B9C9DE", E: "#E4D9C2" },
      ),
      origin: [115.5, 39.5],
    },
    {
      name: "ink",
      layer: "back",
      rects: pix([".k.kk.k.", "k.k..k.k"], 115.5, 47, { k: "#3A6AA8" }, 3.5),
      origin: [115.5, 47],
    },
    {
      name: "spiral",
      layer: "back",
      rects: pix([".k.k.k.k"], 115.5, 36, { k: "#5A5048" }),
    },
    {
      name: "glasses",
      layer: "front",
      rects: [
        ...pix(RING, 19.75, 11, INK),
        ...pix(RING, 67.75, 11, INK),
        { x: 44.25, y: 18, w: 23.5, h: 3.5, f: INK.k },
      ],
    },
    {
      name: "pencil",
      layer: "clawR",
      rects: pix(
        [
          "pp.........",
          "ppp........",
          ".sss.......",
          "..sYY......",
          "...YYO.....",
          "....YYO....",
          ".....YYO...",
          "......YYO..",
          ".......wwO.",
          "........www",
          ".........wk",
        ],
        91,
        7,
        { p: "#E98FA0", s: "#AEB6C0", Y: "#F4C430", O: "#C98418", w: "#EBC48C", k: "#2B2420" },
      ),
    },
  ],
};

/* ------------------------------------------------------------ 导演帽 + 场记板（录下来的） */

const CLAP = { k: "#1E1F24", W: "#F4F1EA", g: "#8C919B" };

const director: Look = {
  box: [0, -21, 136.5, 99],
  parts: [
    {
      name: "cap",
      layer: "front",
      rects: pix(
        [
          "............nnnnnnnn.........",
          "..........nnnnnnnnnnnn.......",
          ".........nnnnNNnnnWnnnn......",
          "........nnnnNNnnnnWWnnnn.....",
          "........nnnnnnnnnnWnnnnn.....",
          "vvvvvvvvvvvvvbbbbbbbbbbb.....",
        ],
        0,
        -21,
        { n: "#2B2E36", N: "#4A4F5C", W: "#F4F1EA", v: "#15171C", b: "#3B3F49" },
      ),
    },
    {
      name: "board",
      layer: "clawR",
      rects: pix(["WkkWWkkW", "kkkkkkkk", "kgggkggk", "kkkkkkkk", "kggkgggk", "kkkkkkkk"], 108.5, 14, CLAP),
    },
    {
      name: "arm",
      layer: "clawR",
      rects: pix(["kWWkkWWk", "WWkkWWkk"], 108.5, 7, CLAP),
      origin: [108.5, 14],
    },
  ],
};

/* ------------------------------------------------------------ 贝雷帽 + 胸前相机（拍下来的） */

const photographer: Look = {
  box: [0, -17.5, 112, 95.5],
  parts: [
    {
      name: "beret",
      layer: "front",
      rects: pix(
        [
          "..........ss..............",
          "......rrrrrrrrrrrr........",
          "...rrrrRRRrrrrrrrrrr......",
          ".rrrrrrrrrrrrrrrrrrrrrrr..",
          "...ddddddddddddddddddd....",
        ],
        12.25,
        -17.5,
        { r: "#A9343E", R: "#CC5A63", d: "#7C1F29", s: "#7C1F29" },
      ),
    },
    {
      name: "strap",
      layer: "front",
      rects: [
        { x: 40.25, y: 0, w: 1.75, h: 38.5, f: "#3A302A" },
        { x: 70, y: 0, w: 1.75, h: 38.5, f: "#3A302A" },
      ],
    },
    {
      name: "camera",
      layer: "front",
      rects: pix(
        [
          "....KKKK....",
          "kkkkkkkkkfkk",
          "kkkkggggkkkk",
          "kkkgLLLLgkkk",
          "kkkgLwLLgkkk",
          "kkkgLLLLgkkk",
          "kkkkggggkkkk",
        ],
        35,
        35,
        { k: "#2A2A2F", K: "#4A4A53", g: "#A7AFB8", L: "#111114", w: "#FFFFFF", f: "#F1ECDD" },
      ),
    },
    {
      name: "flash",
      layer: "fx",
      rects: pix(["y...y...y", ".y..y..y.", "..yywyy..", "yyywwwyyy", "..yywyy..", ".y..y..y.", "y...y...y"], 52.5, 28, {
        y: "#FFE27A",
        w: "#FFFFFF",
      }),
      origin: [68.25, 40.25],
    },
  ],
};

/* ------------------------------------------------------------ 大耳机（听的和用的） */

const NOTE = [".kk", ".k.", ".k.", "kk.", "kk."];

const dj: Look = {
  box: [-10.5, -21, 133, 99],
  parts: [
    {
      name: "phones",
      layer: "front",
      rects: pix(
        [
          "..........kkkkkkkkkkkkkkkkkk..........",
          "......kkkkKKKKKKKKKKKKKKKKKKkkkk......",
          "....kkk........................kkk....",
          "...kk............................kk...",
          ".kkkkk..........................kkkkk.",
          "kbbbbk..........................kbbbbk",
          "kbBBbk..........................kbBBbk",
          "kbBbbk..........................kbbBbk",
          "kbbbbk..........................kbbbbk",
          "kbbbbk..........................kbbbbk",
          ".kkkk............................kkkk.",
        ],
        -10.5,
        -21,
        { k: "#2A2A30", K: "#55555F", b: "#3F6FB8", B: "#7AA2DE" },
      ),
    },
    { name: "note1", layer: "fx", rects: pix(NOTE, 122.5, -17.5, { k: "#3A6AA8" }) },
    { name: "note2", layer: "fx", rects: pix(NOTE, -21, -21, { k: "#C4561C" }) },
  ],
};

/* ------------------------------------------------------------ 邮差帽 + 信封（写给你） */

const mail: Look = {
  box: [0, -17.5, 140, 95.5],
  parts: [
    {
      name: "cap",
      layer: "front",
      rects: pix(
        [
          "...nnnnnnnnnnnnnnnnnnnn...",
          "..nnnnNNNNNNNNNNNNNNnnnn..",
          "....nnnnnnnnnnnnnnnnnn....",
          ".....bbbbbbbyybbbbbbb.....",
          "......vvvvvvvvvvvvvv......",
        ],
        10.5,
        -17.5,
        { n: "#2F4170", N: "#45598F", b: "#1E2A4A", y: "#E9BB45", v: "#162038" },
      ),
    },
    {
      name: "envelope",
      layer: "clawR",
      rects: pix(
        ["EEEEEEEEE", "EEeeeeeEE", "EeEeeeEeE", "EeeErEeeE", "EeeeeeeeE", "EEEEEEEEE"],
        108.5,
        17,
        { E: "#B59E74", e: "#FBF4E4", r: "#C8434B" },
      ),
    },
  ],
};

/* ------------------------------------------------------------ 拳击手套（404） */

const GLOVE = [".rrrrr.", "rRRrrrW", "rRrrrrW", "rrrdrrW", "rrdrrrW", "rrrrrrW", ".ddddd."];
const GLOVE_PAL = { r: "#C8343C", R: "#E8646C", d: "#8E1F26", W: "#F4F1EA" };

const boxer: Look = {
  box: [-17.5, 0, 147, 78],
  parts: [
    { name: "gloveL", layer: "clawL", rects: pix(GLOVE, -17.5, 11, GLOVE_PAL), above: true },
    { name: "gloveR", layer: "clawR", rects: pix(mirror(GLOVE), 105, 11, GLOVE_PAL), above: true },
  ],
};

/* ------------------------------------------------------------ 原样的桌宠（书桌前） */

const desk: Look = { box: [0, 0, 112, 78], parts: [] };

export const LOOKS: Record<Variant, Look> = {
  desk,
  astronaut,
  builder,
  reader,
  director,
  photographer,
  dj,
  mail,
  boxer,
};
