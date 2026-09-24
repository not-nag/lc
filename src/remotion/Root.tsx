import React from "react";
import { Composition, getInputProps } from "remotion";
import { Video } from "./Video";
import { compile } from "@/engine";
import { Storyboard as SB } from "@/schema";
import { ALL_STORYBOARDS } from "@/lib/storyboards";

/**
 * Every checked-in storyboard becomes a composition automatically, so the
 * Studio sidebar is the video catalogue. `--props` overrides for one-off renders.
 */
export const RemotionRoot: React.FC = () => {
  const input = getInputProps() as { storyboard?: unknown };
  const list = input?.storyboard
    ? [SB.parse(input.storyboard)]
    : ALL_STORYBOARDS;

  return (
    <>
      {list.map((sb) => {
        const tl = compile(sb);
        return (
          <Composition
            key={sb.meta.slug}
            id={sb.meta.slug.replace(/[^A-Za-z0-9-]/g, "-")}
            component={Video as any}
            durationInFrames={tl.totalFrames}
            fps={tl.fps}
            width={tl.width}
            height={tl.height}
            defaultProps={{ storyboard: sb } as any}
          />
        );
      })}
    </>
  );
};
