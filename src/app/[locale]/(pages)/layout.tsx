import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { PageFooter } from "@/components/shell/PageFooter";
import { PageHeader } from "@/components/shell/PageHeader";

/**
 * 子页骨架（路由组 (pages) 不影响 URL）：顶栏 + 正文 + 页脚。
 * 子页和首页、完整介绍页用同一套暗色 token，但以好读为先：flow 布局，不堆滚动特效，
 * 只有内容进入视口时轻轻浮上来（引擎的 data-sc-in，每一页各自在 ScrollCraftRoot 里挂引擎）。
 */
export default async function PagesLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="pageframe">
      <PageHeader />
      {children}
      <PageFooter />
    </div>
  );
}
