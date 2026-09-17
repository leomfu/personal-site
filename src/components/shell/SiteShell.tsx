import type { ReactNode } from "react";
import { ScrollProgress } from "./ScrollProgress";
import { SiteFooter } from "./SiteFooter";
import { TopNav } from "./TopNav";

/**
 * 主站骨架 —— 2026-09-17 改版重做。
 *
 * 背景是**三层叠起来的**，改版的体感全靠它们（handoff §5.2）：
 *
 *   ① body 的雾蓝底 --color-bg（globals.css 的 @layer base）
 *   ② .bg-texture   30px 细网格，position:fixed，顶部清晰、底部被遮罩淡出
 *   ③ 两颗漂移光斑   蓝的在右上、橙的在左中，26s / 32s 各自缓慢漂
 *
 * ⚠️ **卡面是半透明的，这三层必须从卡背后透出来**，所以内容层只能是
 * `relative z-1`，不能给它任何实色底。哪一处把卡改成实色白，那块就会
 * 像贴上去的一张纸。
 *
 * 光斑那一层单独包了一个 `fixed inset-0 overflow-hidden`：光斑直径 680px、
 * 定位是负值，不裁的话会把文档撑出横向滚动条。裁在 fixed 容器里而不是
 * 裁在 main 上 —— **main 绝对不能 overflow-hidden**，博客详情页的 sticky
 * 目录探出正文列，一裁就没了。
 *
 * 原来那层 Grain（SVG 噪点纸纹）已经撤掉：新设计的质感来源是网格和光斑，
 * 再叠一层 multiply 噪点只会把雾蓝底搅浑。
 */
export function SiteShell({
  locale,
  children,
}: {
  locale: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <ScrollProgress />

      <div className="bg-texture" aria-hidden />
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
        <span className="bg-blob bg-blob-a" />
        <span className="bg-blob bg-blob-b" />
      </div>

      <div className="relative z-1 flex min-h-dvh flex-col">
        <TopNav />
        <main className="w-full flex-1 pb-16 sm:pb-24">
          {/* min-w-0：文章里一行很长的代码块会按最大内容宽度把容器撑开，
              反而让 <pre> 自己的 overflow-x:auto 失效，窄屏整页横向溢出 */}
          <div className="mx-auto w-full max-w-page min-w-0 px-6">{children}</div>
        </main>
        <SiteFooter locale={locale} />
      </div>
    </div>
  );
}
