import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

/**
 * Next 16 的 eslint-config-next 直接导出 flat config，
 * 不再需要 @eslint/eslintrc 的 FlatCompat（用它会报 circular structure）。
 */
const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // scroll-craft 引擎原样拷贝（src/vendor）和技能目录本身都不是本站代码，不改也不 lint
      "src/vendor/**",
      "scrollcraft/**",
    ],
  },
];

export default eslintConfig;
