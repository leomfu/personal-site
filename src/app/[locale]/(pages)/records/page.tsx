import { getTranslations, setRequestLocale } from "next-intl/server";
import { ScrollCraftRoot } from "@/components/engine/ScrollCraftRoot";
import { Chart } from "@/components/records/Chart";
import { Turntable } from "@/components/records/Turntable";
import { PageHead } from "@/components/shell/PageHead";
import { MusicCrab } from "@/components/crab/MusicCrab";
import { getCrabCopy } from "@/lib/crabLines";
import { getMusic } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return pageMetadata(locale, "records", "/records");
}

/**
 * 唱片（「唱片架」的查看全部）：一台真能转、真出声的唱机 + 按心情听的榜单。
 * 曲库和播放状态都在 layout 的 PlayerProvider 上，离开这一页音乐不停。
 */
export default async function RecordsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("records");
  const tp = await getTranslations("places");
  const crab = await getCrabCopy(locale);
  const music = getMusic();
  const hasMusic = music.resident.length + music.scenes.reduce((n, s) => n + s.tracks.length, 0) > 0;

  return (
    <ScrollCraftRoot>
      <main id="main" className="pagemain">
        <PageHead
          place={tp("records.name")}
          title={t("title")}
          lead={t("lead")}
          crab={<MusicCrab label={crab.label.dj} lines={crab.lines.records} side="up-left" />}
        />
        {hasMusic && (
          <div data-sc-in>
            <Turntable />
          </div>
        )}
        <Chart scenes={music.scenes} />
        <p className="pagenote">{t("footnote")}</p>
      </main>
    </ScrollCraftRoot>
  );
}
