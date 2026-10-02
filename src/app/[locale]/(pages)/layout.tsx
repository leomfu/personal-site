import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { PageFooter } from "@/components/shell/PageFooter";
import { PageHeader } from "@/components/shell/PageHeader";
import { Ground } from "@/components/sketch/Ground";

/**
 * 子页骨架（路由组 (pages) 不影响 URL）：顶栏 + 正文 + 页脚。
 * 第二版（BRIEF R1）：子页和完整介绍页的第 2–7 幕是同一本速写本，暖色纸面、深墨正文，以好读为先：
 * flow 布局，不堆滚动特效，只有内容进入视口时轻轻浮上来（引擎的 data-sc-in，每一页各自在 ScrollCraftRoot 里挂引擎）。
 * <Ground value="paper" /> 让迷你播放器这类固定在屏幕上的件也换成纸面的样子。
 */
export default async function PagesLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="pageframe paper">
      <Ground value="paper" />
      <PageHeader />
      {children}
      <PageFooter />
    </div>
  );
}
