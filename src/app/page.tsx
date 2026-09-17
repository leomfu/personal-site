import { routing } from "@/i18n/routing";

/**
 * 根路径 /：跳到默认语言。
 * 静态导出不能用 middleware / redirect()，所以这里输出一张最小的跳转页
 * （meta refresh + location.replace 双保险，禁用 JS 也能走）。
 * 底色跟站内一致（雾蓝 #EDF1F7），跳转过程中不会闪色。
 */
export default function RootRedirectPage() {
  const target = `/${routing.defaultLocale}/`;

  return (
    <html lang={routing.defaultLocale}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="refresh" content={`0; url=${target}`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      {/* 这一页自带 html/body，不 import globals.css，所以拿不到 CSS 变量，
          颜色只能写字面值。值 = --color-bg / --color-accent-700，改 token 时记得同步。 */}
      <body style={{ margin: 0, background: "#EDF1F7" }}>
        <script
          dangerouslySetInnerHTML={{
            __html: `location.replace(${JSON.stringify(target)})`,
          }}
        />
        <noscript>
          <a href={target} style={{ color: "#2A4A95", fontFamily: "system-ui" }}>
            进入 / Enter
          </a>
        </noscript>
      </body>
    </html>
  );
}
