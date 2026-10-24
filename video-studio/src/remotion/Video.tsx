import React from "react";
import { AbsoluteFill, Audio, staticFile, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { fade } from "@remotion/transitions/fade";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { SCENES } from "./scenes";
import { Captions } from "./Captions";
import { FONT } from "./fonts";
import { captionBandPct } from "./layout";

export type VideoProps = {
  storyboard: any;
  captions: { pages: any[] };
  brand: any;
};

const TRANSITION_FRAMES = 11;

const Watermark: React.FC<{ brand: any }> = ({ brand }) => {
  const { width, height } = useVideoConfig();
  if (!brand?.handle) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: height * 0.06,
          right: width * 0.06,
          opacity: 0.85,
          color: "#fff",
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: Math.round(height * 0.028),
          textShadow: "0 2px 8px rgba(0,0,0,0.6)",
        }}
      >
        {brand.handle}
      </div>
    </AbsoluteFill>
  );
};

const presentationFor = (
  family: string,
  width: number,
  height: number,
): any => {
  switch (family) {
    case "fade":
      return fade();
    case "slide":
      return slide({ direction: "from-right" });
    case "clockWipe":
    case "clock":
      return clockWipe({ width, height });
    case "wipe":
      return wipe();
    default:
      return slide({ direction: "from-right" });
  }
};

export const Video: React.FC<VideoProps> = ({
  storyboard,
  captions,
  brand,
}) => {
  const { fps, width, height } = useVideoConfig();
  const theme = storyboard.style?.palette
    ? {
        bg: storyboard.style.palette.bg,
        fg: storyboard.style.palette.fg,
        accent: storyboard.style.palette.accent,
        bgVariant: storyboard.style.background ?? "grid-glow",
      }
    : {
        bg: "#0B0B0F",
        fg: "#FFFFFF",
        accent: "#FF3366",
        bgVariant: "grid-glow",
      };

  const scenes: any[] = storyboard.scenes ?? [];
  const family = storyboard.style?.transitionFamily ?? "slide";
  const useTransitions = scenes.length > 1 && family !== "cut";

  // Build TransitionSeries children. Each non-last scene gets +TRANSITION_FRAMES so the
  // total (sum - transitions) still equals the audio length -> audio stays in sync.
  const children: React.ReactNode[] = [];
  scenes.forEach((s, i) => {
    const base = Math.max(1, Math.round((s.durationSec || 2) * fps));
    const isLast = i === scenes.length - 1;
    const dur = useTransitions && !isLast ? base + TRANSITION_FRAMES : base;
    const Comp = SCENES[s.template] ?? SCENES.title;
    children.push(
      <TransitionSeries.Sequence key={s.id} durationInFrames={dur}>
        <Comp scene={s} theme={theme} />
      </TransitionSeries.Sequence>,
    );
    if (useTransitions && !isLast) {
      children.push(
        <TransitionSeries.Transition
          key={`t-${s.id}`}
          presentation={presentationFor(family, width, height)}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />,
      );
    }
  });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      <TransitionSeries>{children}</TransitionSeries>

      {storyboard.audio ? <Audio src={staticFile(storyboard.audio)} /> : null}

      {/* persistent scrim across the reserved caption band so captions always
          have contrast, regardless of scene content behind them */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0) ${Math.round(
            captionBandPct({ width, height }) * 100,
          )}%)`,
          pointerEvents: "none",
        }}
      />

      <Captions
        pages={captions?.pages ?? []}
        style={storyboard.style?.captionStyle ?? "karaoke"}
        accent={theme.accent}
      />

      <Watermark brand={brand} />
    </AbsoluteFill>
  );
};
