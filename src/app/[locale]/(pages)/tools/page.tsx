import { getTranslations, setRequestLocale } from "next-intl/server";
import { ScrollCraftRoot } from "@/components/engine/ScrollCraftRoot";
import { ToolIcon } from "@/components/icons/ToolIcon";
import { PageHead } from "@/components/shell/PageHead";
import { MusicCrab } from "@/components/crab/MusicCrab";
import { getCrabCopy } from "@/lib/crabLines";
import { getTools, localized } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return pageMetadata(locale, "tools", "/tools");
}

/** 工具（「唱片架」旁边那一格的查看全部）。content/tools.json，点一下去官网 */
export default async function ToolsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("tools");
  const tp = await getTranslations("places");
  const crab = await getCrabCopy(locale);
  const tools = getTools();

  return (
    <ScrollCraftRoot>
      <main id="main" className="pagemain">
        <PageHead
          place={tp("records.name")}
          title={t("title")}
          lead={t("lead")}
          crab={<MusicCrab label={crab.label.dj} lines={crab.lines.tools} side="up-left" />}
        />
        <div className="toolcard scrap">
          <span className="tape tape--blue" aria-hidden />
          <div className="scrap__paper deckle-top toolcard__paper">
            <ul className="toolgrid" data-sc-in data-sc-stagger="40">
              {tools.map((tool) => (
                <li key={tool.name}>
                  <a href={tool.url} target="_blank" rel="noreferrer noopener" className="tool tool--card">
                    <ToolIcon name={tool.icon} size={22} />
                    <span className="tool__name">{tool.name}</span>
                    <span className="tool__desc">{localized(locale, tool.desc, tool.desc_en)}</span>
                    <span className="tool__arrow" aria-hidden>
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </ScrollCraftRoot>
  );
}
