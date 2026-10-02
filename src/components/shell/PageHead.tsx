import type { ReactNode } from "react";
import { Mark } from "@/components/sketch/Doodle";

/**
 * 子页的页头：一行手写的小字写这一页在房间里的哪个地方（和完整介绍页的平面图对得上），
 * 下面是标题（标题下一道彩铅波浪线，打开时画出来）和一句说明。
 * 全站子页共用这一个，所以「眉题」每页只有这一处。
 */
export function PageHead({
  place,
  title,
  lead,
  crab,
}: {
  place: string;
  title: string;
  lead?: ReactNode;
  /** 给这一区的小螃蟹（BRIEF R7）预留的位置：页头右侧约 72px 见方。把 <Crab /> 当 crab 传进来；不传就是个空位，不占交互 */
  crab?: ReactNode;
}) {
  return (
    <header className="pagehead" data-sc-in>
      <p className="pagehead__place hand">{place}</p>
      <h1 className="pagehead__title">
        {title}
        <Mark kind="wave" className="pagehead__wave mark--timed" />
      </h1>
      {lead && <p className="pagehead__lead">{lead}</p>}
      <span className="crab-slot crab-slot--page" data-crab-slot="page">
        {crab}
      </span>
    </header>
  );
}
