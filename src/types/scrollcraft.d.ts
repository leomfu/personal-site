/**
 * scroll-craft 引擎（src/vendor/scrollcraft/scrollcraft.js，原样拷贝，不改）挂在 window 上的那一点。
 * 只声明本站用到的部分。
 */

type ScrollCraftAct = {
  el: HTMLElement;
  device: string;
  p: number;
  raw: number;
  live: boolean;
};

type ScrollCraftClip = {
  el: HTMLVideoElement;
  ready: boolean;
  live: boolean;
};

interface ScrollCraftApi {
  layout(): void;
  read(): void;
  acts: ScrollCraftAct[];
  worlds: unknown[];
  clips: ScrollCraftClip[];
}

interface Window {
  ScrollCraft?: {
    mount(root: Element, opts?: { lerp?: number }): ScrollCraftApi;
    reduce: boolean;
    instances: ScrollCraftApi[];
  };
}
