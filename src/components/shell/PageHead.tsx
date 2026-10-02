import type { ReactNode } from "react";

/**
 * 子页的页头：一行等宽小字写这一页在房间里的哪个地方（和完整介绍页的平面图对得上），
 * 下面是标题和一句说明。全站子页共用这一个，所以「眉题」每页只有这一处。
 */
export function PageHead({ place, title, lead }: { place: string; title: string; lead?: ReactNode }) {
  return (
    <header className="pagehead" data-sc-in>
      <p className="pagehead__place mono">{place}</p>
      <h1 className="pagehead__title">{title}</h1>
      {lead && <p className="pagehead__lead">{lead}</p>}
    </header>
  );
}
