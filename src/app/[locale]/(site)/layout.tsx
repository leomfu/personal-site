import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { SiteShell } from "@/components/shell/SiteShell";
import { PageFade } from "@/components/ui/PageFade";

/**
 * 主站骨架层 —— 顶栏 + 整幅内容区。路由组 (site) 不影响 URL。
 * 2026-09-08 之后全站页面都在这一组里：开场页和整屏的放松区/专注页都已下线。
 * 2026-09-17 ⌘K 命令面板下线，这一层不再生成搜索索引。
 */
export default async function SiteLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <SiteShell locale={locale}>
      <PageFade>{children}</PageFade>
    </SiteShell>
  );
}
