import { getTranslations, setRequestLocale } from "next-intl/server";
import { CopyEmail } from "@/components/common/CopyEmail";
import { LangSwitch } from "@/components/common/LangSwitch";
import { SocialLinks } from "@/components/common/SocialLinks";
import { ScrollCraftRoot } from "@/components/engine/ScrollCraftRoot";
import { DiveLink } from "@/components/home/DiveLink";
import { HomeStage } from "@/components/home/HomeStage";
import { ScenePlate } from "@/components/scene/ScenePlate";
import { Note } from "@/components/sketch/Note";
import { pageMetadata } from "@/lib/metadata";
import { localePath } from "@/lib/nav";
import { getScene } from "@/lib/scene";
import { routing } from "@/i18n/routing";
import { siteConfig } from "~/site.config";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return pageMetadata(locale, "home", "");
}

/**
 * 首页 · 轨道（BRIEF §5、§10，第二版 R1）。单屏，不滚动。
 *
 *   远景  夜里的地球（public/scene/earth-*.webp），上海亮着。CSS 提亮加暖，不重新生成素材
 *   主体  名片：一张真实的彩铅画纸（portrait-card.webp，不去色、不压暗、不做遮罩）+ 名字 + 票根形的事实标签；
 *         一根引线连到上海的脉冲光点
 *   前景  坐标刻度、发丝线（只是线，不挡名字和入口）
 *   氛围  大气层边缘一道很淡的光，比第一版暖
 *   文字  名字、一句话、邮箱、社交图标、语言切换、入口
 *   批注  一支彩铅手画的箭头 + 手写字，指着入口按钮，打开约 1 秒后一笔一笔画出来
 *
 * 名片放在右边那片海面上（暗、干净），左边那一大片金色的城市灯光不再被暗面压住，整页就亮了。
 * 入口有两个，做同一件事（俯冲进完整介绍页）：上海那颗脉冲光点，和全页唯一用强调色填满的主按钮。
 * 手机上主按钮是底部的全宽大按钮。
 */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tProfile = await getTranslations("profile");

  const en = locale === "en";
  const scene = getScene();
  const tour = localePath(locale, "/about");
  const { profile, coords } = siteConfig;

  const name = en ? siteConfig.nameEn : siteConfig.name;
  const altName = en ? siteConfig.name : siteConfig.nameEn;
  const facts = tProfile("facts", {
    city: en ? profile.cityEn : profile.city,
    age: profile.age,
    major: en ? profile.majorEn : profile.major,
    year: profile.classOf,
  });

  return (
    <ScrollCraftRoot>
      <HomeStage>
        <header className="home__top">
          <LangSwitch />
        </header>

        {/* 文字层。DOM 顺序 = 键盘顺序：名片、一句话、联系方式、入口（光点在最后，是第二个入口） */}
        <main className="home__copy">
          {/* 引线从这一整块出发：手机上从一句话的下面往下连，不会竖着穿过文字 */}
          <div className="home__intro" data-home-anchor>
            <section className="idcard" aria-labelledby="home-name">
              {scene.portraitCard.exists && (
                <figure className="idcard__sheet scrap scrap--lift">
                  <span className="tape tape--orange" aria-hidden />
                  {/* eslint-disable-next-line @next/next/no-img-element -- 彩铅画纸，原图原色，尺寸固定 */}
                  <img
                    className="idcard__drawing deckle"
                    src={scene.portraitCard.src}
                    width={scene.portraitCard.width}
                    height={scene.portraitCard.height}
                    alt={t("portraitAlt", { name })}
                    fetchPriority="high"
                  />
                </figure>
              )}
              <div className="idcard__body">
                <p className="idcard__coords mono">{coords.text}</p>
                <h1 id="home-name" className="idcard__name">
                  {name}
                  <span className="idcard__alt" lang={en ? "zh" : "en"}>
                    {altName}
                  </span>
                </h1>
                <p className="placard__label idcard__facts">{facts}</p>
              </div>
            </section>
            <p className="home__tagline">{en ? siteConfig.taglineEn : siteConfig.tagline}</p>
          </div>

          <div className="home__actions">
            <div className="home__contact">
              <CopyEmail email={siteConfig.email} />
              <SocialLinks locale={locale} />
            </div>
            <div className="home__go">
              <DiveLink href={tour} className="cta home__cta" ariaLabel={t("ctaAria")}>
                <span>{t("cta")}</span>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                  <path d="M4 4.5 13.5 14M13.5 6.5V14H6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </DiveLink>
              {/* 同一句批注，桌面写在按钮右边（箭头往左），手机写在按钮上方（箭头往下）。和按钮的读屏文字重复，读屏跳过 */}
              <Note className="home__note home__note--wide" text={t("note")} arrow="left" timed rot={-3} hidden />
              <Note className="home__note home__note--narrow" text={t("note")} arrow="down-left" timed rot={-2} hidden />
            </div>
          </div>
        </main>

        {/* 远景：地球（CSS 提亮加暖：.tone-earth） */}
        <div className="home__earth" aria-hidden>
          <ScenePlate pair={scene.earth} eager className="tone-earth" />
        </div>

        {/* 氛围：大气层边缘的一道光，冷里带一点暖（只是光，不是霓虹） */}
        <div className="home__limb" aria-hidden />

        {/* 文字那一侧很轻的暗面（只压文字所在的那一列，只压到字能读清为止） */}
        <div className="home__scrim" aria-hidden />

        {/* 前景：坐标刻度和发丝线 */}
        <div className="home__hud" aria-hidden>
          <span className="hud__rule hud__rule--top" />
          <span className="hud__rule hud__rule--bottom" />
          <span className="hud__rule hud__rule--left" />
          <span className="hud__corner hud__corner--tl" />
          <span className="hud__corner hud__corner--tr" />
          <span className="hud__corner hud__corner--bl" />
          <span className="hud__corner hud__corner--br" />
        </div>

        {/* 名片到光点的引线（两头每一帧在 HomeStage 里量） */}
        <svg className="home__leader" data-home-leader aria-hidden>
          <polyline points="" />
          <circle r="2.5" cx="-10" cy="-10" />
        </svg>

        {/* 地球那层上的标记：和地球用同一套几何（同一个 ScenePlate，只是不画图），所以永远钉在上海上 */}
        <div className="home__marks">
          <ScenePlate className="plate--ghost" pair={scene.earth} ghost>
            <div className="plate__mark sh">
              <span className="sh__cross sh__cross--h" aria-hidden />
              <span className="sh__cross sh__cross--v" aria-hidden />
              <span className="sh__lat mono" aria-hidden>
                {coords.lat.toFixed(2)}°N
              </span>
              <span className="sh__lng mono" aria-hidden>
                {coords.lng.toFixed(2)}°E
              </span>
              <DiveLink href={tour} className="sh__dot" ariaLabel={t("dotAria")} dot>
                <span className="sh__ring" aria-hidden />
                <span className="sh__core" aria-hidden />
                <span className="sh__label mono" aria-hidden>
                  {t("dotLabel")}
                </span>
              </DiveLink>
            </div>
          </ScenePlate>
        </div>
      </HomeStage>
    </ScrollCraftRoot>
  );
}
