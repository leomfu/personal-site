/**
 * 彩铅质感的 SVG 滤镜，全站只放一份（[locale]/layout 里），用的地方写 `filter: url(#wl-pencil)`。
 *
 *   1. 低频噪点 + feDisplacementMap：线条轻轻抖，不像矢量那么直
 *   2. 高频噪点当作「纸的颗粒」，用 feComposite in 把线条咬出细小的空隙，像彩铅在粗纸上蹭过去
 *
 * 只作用在细线条的小 SVG 上（批注、涂鸦、平面图），不放在大块区域上，滤镜开销很小。
 */
export function PencilDefs() {
  return (
    <svg width="0" height="0" aria-hidden focusable="false" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
      <defs>
        <filter id="wl-pencil" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="4" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="2.6" xChannelSelector="R" yChannelSelector="G" result="wobble" />
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="11" result="grain" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.2 0 0 0 1.78" result="tooth" />
          <feComposite in="wobble" in2="tooth" operator="in" />
        </filter>
      </defs>
    </svg>
  );
}
