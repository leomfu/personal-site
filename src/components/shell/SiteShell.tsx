import type { ReactNode } from "react";
import { SiteFooter } from "./SiteFooter";
import { TopNav } from "./TopNav";

/**
 * 主站骨架 —— 改版定稿（docs/design/改版规格.md §5、§6）。
 *
 * 背景只有两层（定稿：**无底纹、无顶部滚动进度条**）：
 *
 *   ① body 的雾蓝底 --color-bg（globals.css 的 @layer base）
 *   ② 两颗漂移光斑   蓝的在右上、橙的在左中，26s / 32s 各自缓慢漂
 *
 * ⚠️ **卡面是半透明的，光斑必须从卡背后透出来**，所以内容层只能是
 * `relative z-1`，不能给它任何实色底。
 *
 * 光斑那一层单独包了一个 `fixed inset-0 overflow-hidden`：光斑直径 680px、
 * 定位是负值，不裁的话会把文档撑出横向滚动条。裁在 fixed 容器里而不是
 * 裁在 main 上 —— **main 绝对不能 overflow-hidden**，博客详情页的 sticky
 * 目录探出正文列，一裁就没了。
 *
 * 最外层用的是 `overflow-x: clip`（不是 hidden）：错位滑入里从右边进的块初始位移 +153.6px，
 * 还没滑进来时会把页面撑出横向滚动（手机上会被缩放成整页变小）。clip 只裁不建滚动容器，
 * sticky 不受影响。
 *
 * 版心 1180px（max-w-page），左右 26.4px（px-6，间距基数 4.4px）。
 */
export function SiteShell({
  locale,
  children,
}: {
  locale: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh overflow-x-clip">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
        <span className="bg-blob bg-blob-a" />
        <span className="bg-blob bg-blob-b" />
      </div>

      <div className="relative z-1 flex min-h-dvh flex-col">
        <TopNav />
        <main className="w-full flex-1 pb-14">
          {/* min-w-0：文章里一行很长的代码块会按最大内容宽度把容器撑开，
              反而让 <pre> 自己的 overflow-x:auto 失效，窄屏整页横向溢出 */}
          <div className="mx-auto w-full max-w-page min-w-0 px-6 pt-6">{children}</div>
        </main>
        <SiteFooter locale={locale} />
      </div>
    </div>
  );
}
