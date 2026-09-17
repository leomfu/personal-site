import { getTranslations, setRequestLocale } from "next-intl/server";
import { VideoCard } from "@/components/media/VideoCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { getVideos } from "@/lib/content";
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
  return pageMetadata(locale, "videos", "/videos");
}

/**
 * 视频页 —— 数据来自 content/videos.json，播放器点击后才加载（改版规格 §6.6）。
 * 单列玻璃卡收在 880px：视频是这一页唯一的内容，铺成两列只会让每一条都变小。
 */
export default async function VideosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("videos");
  const videos = getVideos();

  return (
    <>
      <PageHeader tag={t("tag")} title={t("title")} lead={t("lead")} />

      <div className="flex max-w-[880px] flex-col gap-8">
        {videos.map((video, i) => (
          <Reveal key={`${video.platform}-${video.id}`} index={i}>
            <VideoCard video={video} />
          </Reveal>
        ))}
      </div>
    </>
  );
}
