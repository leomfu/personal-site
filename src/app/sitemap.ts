import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/content";
import { SITEMAP_PATHS, localePath } from "@/lib/nav";
import { getAlbums } from "@/lib/photos";
import { routing } from "@/i18n/routing";
import { siteConfig } from "~/site.config";

/** 静态导出要求这类路由是静态的 */
export const dynamic = "force-static";

/** 站点地图 —— 静态导出时构建成 out/sitemap.xml。每个页面两种语言各一条，并互指 hreflang。 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url.replace(/\/$/, "");
  /* SITEMAP_PATHS 的第一项就是首页（path ""，即 /{locale}/）。/contact/ 只是跳回首页的旧地址，不收 */
  const paths = [
    ...SITEMAP_PATHS,
    ...getPosts().map((post) => `/blog/${post.slug}`),
    ...getAlbums().map((album) => `/photos/${album.slug}`),
  ];

  return paths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: `${base}${localePath(locale, path)}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.7,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, `${base}${localePath(l, path)}`]),
        ),
      },
    })),
  );
}
