"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { useWarp } from "./WarpProvider";

/**
 * 首页进 /about/ 的入口：点下去放「光点爆开冲进去」转场（见 WarpProvider），再跳页。
 * 它仍然是一个普通 <a href>：没有 JS、按住修饰键（新标签打开）、右键、拿不到 WarpProvider 时都走浏览器自己的行为。
 * Enter 键会触发 click，所以键盘也能放。转场的中心永远是上海光点（[data-home-dot]），主按钮点下去也一样。
 */
export function WarpLink({ href, onClick, onPointerEnter, onFocus, onPointerDown, ...rest }: ComponentProps<typeof Link>) {
  const warp = useWarp();
  const target = typeof href === "string" ? href : "";

  const warm = () => {
    if (warp && target) warp.preload(target);
  };

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || !warp || !target) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const dot = document.querySelector<HTMLElement>("[data-home-dot]");
    const box = (dot ?? event.currentTarget).getBoundingClientRect();
    warp.warp(target, { x: box.left + box.width / 2, y: box.top + box.height / 2 });
  };

  return (
    <Link
      href={href}
      {...rest}
      onClick={handleClick}
      onPointerEnter={(e) => {
        onPointerEnter?.(e);
        warm();
      }}
      onFocus={(e) => {
        onFocus?.(e);
        warm();
      }}
      onPointerDown={(e) => {
        onPointerDown?.(e);
        warm();
      }}
    />
  );
}
