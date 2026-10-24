import React from "react";
import { Composition } from "remotion";
import { Video } from "./Video";
import "./fonts";

// Fallback props so Remotion Studio can open even before a pipeline run.
const fallback = {
  storyboard: {
    width: 1080,
    height: 1920,
    fps: 30,
    totalSeconds: 6,
    audio: null,
    style: {
      palette: { bg: "#0B1020", fg: "#FFFFFF", accent: "#00D9FF" },
      captionStyle: "karaoke",
    },
    scenes: [
      {
        id: "s1",
        template: "title",
        durationSec: 3,
        text: { heading: "Preview", sub: "run npm run make" },
      },
      { id: "s2", template: "cta", durationSec: 3, text: { heading: "Ready" } },
    ],
  },
  captions: { pages: [] },
  brand: { handle: "@studio" },
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="MainVideo"
      component={Video as any}
      durationInFrames={180}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={fallback as any}
      calculateMetadata={({ props }: any) => {
        const sb = props.storyboard;
        const fps = sb.fps ?? 30;
        return {
          durationInFrames: Math.max(
            1,
            Math.round((sb.totalSeconds || 6) * fps),
          ),
          fps,
          width: sb.width ?? 1080,
          height: sb.height ?? 1920,
        };
      }}
    />
  );
};
