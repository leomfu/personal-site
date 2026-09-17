import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { ToolCard } from "@/components/ui/ToolCard";
import { getTools, localized } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return pageMetadata(locale, "tools", "/tools");
}

/** 工具页 —— 改版规格 §6.8，清单数据来自 content/tools.json（沿用旧清单，只换外观） */
export default async function ToolsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("tools");
  const tools = getTools();

  return (
    <>
      <PageHeader tag={t("tag")} title={t("title")} lead={t("lead")} />

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(250px,100%),1fr))]">
        {tools.map((tool, i) => (
          <Reveal key={tool.name} index={i}>
            <ToolCard tool={tool} desc={localized(locale, tool.desc, tool.desc_en)} />
          </Reveal>
        ))}
      </div>
    </>
  );
}
