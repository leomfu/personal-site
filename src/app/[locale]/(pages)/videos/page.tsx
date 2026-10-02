import { getTranslations, setRequestLocale } from "next-intl/server";
import { ScrollCraftRoot } from "@/components/engine/ScrollCraftRoot";
import { VideoCard } from "@/components/media/VideoCard";
import { PageHead } from "@/components/shell/PageHead";
import { getVideos } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return pageMetadata(locale, "videos", "/videos");
}

/** 全部视频（「投影」的查看全部）。content/videos.json，播放器点了才加载 */
export default async function VideosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("videos");
  const tp = await getTranslations("places");
  const videos = getVideos();

  return (
    <ScrollCraftRoot>
      <main id="main" className="pagemain">
        <PageHead place={tp("projector.name")} title={t("title")} lead={t("lead")} />
        <div className="videos">
          {videos.map((video) => (
            <div key={`${video.platform}-${video.id}`} data-sc-in>
              <VideoCard video={video} />
            </div>
          ))}
        </div>
      </main>
    </ScrollCraftRoot>
  );
}
