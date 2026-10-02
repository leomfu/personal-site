"use client";

import type { ComponentProps } from "react";
import { usePlayerMaybe } from "@/components/player/PlayerProvider";
import { Crab } from "./Crab";

/**
 * 戴大耳机的那只（听的和用的）：看全站唯一那台播放器（PlayerProvider）在不在响，
 * 迷你播放器放歌的时候它跟着点头。用 <audio> 真在响（live）而不是「按了播放」来判断，
 * 外链放不出来时它就不会对着静音点头。
 */
export function MusicCrab(props: Omit<ComponentProps<typeof Crab>, "variant" | "playing">) {
  const player = usePlayerMaybe();
  return <Crab {...props} variant="dj" playing={Boolean(player?.live)} />;
}
