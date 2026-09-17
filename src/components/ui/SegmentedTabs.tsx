"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useStoredState } from "@/lib/useStoredState";

/**
 * 页面顶部的一排筛选 —— 点一下切一块，不用往下滑。
 * 现在只有项目页（我做的 / 用到的开源）在用。博客页原来的「文章 / 世界新闻 / AI 更新」
 * 随新闻在 2026-09-17 全站改版第一阶段下线，那一页只剩文章，不再套筛选。
 *
 * 每一块的内容都是**服务端渲染好**再以 props 传进来的（server component 可以作为
 * props 传给 client component），所以这个客户端组件只负责切换，不参与渲染内容本身 ——
 * 页面该发多少 JS 还是多少，不会因为加了筛选就把整页变成客户端组件。
 *
 * 不用条件渲染而是给没选中的那块挂 `hidden`：两块内容始终在 DOM 里，
 * 浏览器的页内查找以及爬虫都能拿到全部内容。
 *
 * **选中项有两个来源，优先级不同**（2026-09-09 修）：
 *
 *   用户手点标签   写进 localStorage（storageKey 各页自己给一个），
 *                 常看哪一边下次进来就停在哪一边 —— 这是「偏好」
 *   地址里的 hash  只在本次浏览生效，**不落盘** —— 这是「这一次想看哪儿」
 *
 * ⚠️ 顺序别搞反。原来 hash 是直接调 `setTab` 的，而那个 setter 会写 localStorage
 * （见 lib/useStoredState.ts），结果点一次带 hash 的链接，偏好就被永久改掉，
 * 之后裸访问这一页默认落在别的栏而不是第一栏 —— 等于一次临时跳转
 * 悄悄改掉了用户的长期偏好。现在 hash 走一个独立的 `linked` state，
 * 用户手点任意标签就把它清掉，偏好重新说了算。
 */
export function SegmentedTabs({
  storageKey,
  tabs,
}: {
  storageKey: string;
  /** 至少两项；第一项是默认选中的那个 */
  tabs: {
    key: string;
    label: string;
    content: ReactNode;
  }[];
}) {
  const fallback = tabs[0]?.key ?? "";
  const [stored, setStored] = useStoredState(storageKey, fallback);
  /** 本次浏览由地址 hash 指定的那一栏。不落盘，刷新即失效 */
  const [linked, setLinked] = useState<string | null>(null);

  const chosen = linked ?? stored;
  const current = tabs.some((t) => t.key === chosen) ? chosen : fallback;

  /** 用户手点标签：这是偏好，落盘；同时把 hash 那次临时选择让开 */
  const pick = (key: string) => {
    setLinked(null);
    setStored(key);
  };

  /**
   * hash → 选中项。放在 effect 里而不是初始值里：服务端渲染时没有 location，
   * 直接读会让首屏 HTML 和水合结果对不上。
   *
   * 两个入口都要认：挂载时读一次（跨页跳过来的）、以及 `hashchange`
   * （浏览器前进后退、页面上的普通 #链接）。
   */
  useEffect(() => {
    const keys = new Set(tabs.map((t) => t.key));
    const select = (key: string) => {
      if (key && keys.has(key)) setLinked(key);
    };
    const fromHash = () =>
      select(decodeURIComponent(window.location.hash.replace(/^#/, "")));

    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => {
      window.removeEventListener("hashchange", fromHash);
    };
    // tabs 每次渲染都是新数组，进依赖会每帧重挂监听；这里只关心挂载和后续事件
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* 筛选按钮组（handoff §6.5）：当前项是主按钮，其余是次按钮 */}
      <div className="flex flex-wrap items-center gap-2.5 text-[13px]">
        {tabs.map((item) => {
          const active = current === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => pick(item.key)}
              aria-pressed={active}
              className={
                active
                  ? "btn-primary-glow cursor-pointer rounded-full bg-accent px-5 py-2 font-medium text-neutral-100"
                  : "glass-soft cursor-pointer rounded-full px-5 py-2 text-muted transition-colors hover:text-accent-700"
              }
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {tabs.map((item) => {
        const isActive = current === item.key;
        return (
          <div key={item.key} className={isActive ? "" : "hidden"}>
            {item.content}
          </div>
        );
      })}
    </>
  );
}
