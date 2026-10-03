"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * 把 scroll-craft 引擎挂到这一块页面上。
 *
 * 引擎（src/vendor/scrollcraft/scrollcraft.js）**原样使用，一个字都不改**。它是为「一份 HTML 一个文档」
 * 写的：mount() 时一次性收集 data-sc-* 元素，事件监听挂在 window 上，没有 destroy。
 * 本站是 Next.js 客户端跳页，同一个文档里页面会换来换去，所以这里做两件页面侧的事：
 *
 * 1. 每个页面挂一次：这个组件在每个页面里各渲染一份，页面卸载它就卸载。
 * 2. 卸载时把那份实例「掏空」：把它的 acts / clips 数组清空（引擎的 read() 和 tick() 遍历的就是这两个数组，
 *    空了就什么都不做），act 的 raw 归零（drift 只认 0<raw<1 的 act，归零后不会再往 <html> 上写底色），
 *    再把它从 ScrollCraft.instances 里摘掉（验证工具 shoot.mjs 读的就是这个列表）。
 *    引擎留下的 rAF 循环只会空转，代价可以忽略。
 *
 * 另外两件：
 * - 引擎只在 resize 和字体加载完时重新量尺寸。这一块的高度变了（图片、客户端组件），
 *   就用 ResizeObserver 补一次 layout()。
 * - 挂好之后在 window 上发一个 `wl:engine` 事件：俯冲过渡等它，确认落地页已经就位才淡出。
 */
export function ScrollCraftRoot({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let api: ScrollCraftApi | null = null;
    let cancelled = false;
    let observer: ResizeObserver | null = null;

    // @ts-expect-error -- 引擎是原样拷贝的 IIFE 脚本（挂到 window.ScrollCraft 上），没有模块导出
    import("@/vendor/scrollcraft/scrollcraft.js")
      .then(() => {
        const root = ref.current;
        const engine = window.ScrollCraft;
        if (cancelled || !root || !engine) return;
        // 页面侧的一个小约定：data-span-compact 是窄屏上的 span。引擎只在 mount 时读一次 data-sc-span，
        // 所以在 mount 之前按视口宽度换好（不改引擎）
        if (window.matchMedia("(max-width: 860px)").matches) {
          root.querySelectorAll<HTMLElement>("[data-span-compact]").forEach((el) => {
            el.setAttribute("data-sc-span", el.getAttribute("data-span-compact") ?? "");
          });
        }
        // 同样的办法：data-span-reduce 是减少动态效果时的 span（第 0 幕那时只是一张静止的江景，不占三屏多的空滚动）
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          root.querySelectorAll<HTMLElement>("[data-span-reduce]").forEach((el) => {
            el.setAttribute("data-sc-span", el.getAttribute("data-span-reduce") ?? "");
          });
        }
        api = engine.mount(root);

        let last = root.offsetHeight;
        observer = new ResizeObserver(() => {
          const height = root.offsetHeight;
          if (Math.abs(height - last) > 2) {
            last = height;
            api?.layout();
          }
        });
        observer.observe(root);

        window.dispatchEvent(new CustomEvent("wl:engine", { detail: { path: location.pathname } }));
      })
      .catch(() => {
        // 引擎没加载出来：内容还在（见 layout 里的 noscript 兜底样式），只是不动
        document.documentElement.classList.add("sc-failed");
      });

    return () => {
      cancelled = true;
      observer?.disconnect();
      if (api) retire(api);
    };
  }, []);

  return (
    <div ref={ref} id={id} className={className}>
      {children}
    </div>
  );
}

/** 掏空一份已经不在页面上的引擎实例（见上面的说明） */
function retire(api: ScrollCraftApi) {
  for (const act of api.acts) {
    act.raw = 0;
    act.p = 0;
    act.live = false;
  }
  api.acts.length = 0;
  api.worlds.length = 0;
  for (const clip of api.clips) {
    clip.ready = false;
    clip.live = false;
    try {
      clip.el.pause();
    } catch {
      // 已经不在文档里了
    }
  }
  api.clips.length = 0;
  const list = window.ScrollCraft?.instances;
  if (list) {
    const index = list.indexOf(api);
    if (index > -1) list.splice(index, 1);
  }
  document.documentElement.style.removeProperty("--sc-canvas");
}
