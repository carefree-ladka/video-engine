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
import { resolveLook } from "./looks";

export type VideoProps = {
  storyboard: any;
  captions: { pages: any[] };
  brand: any;
};

const TRANSITION_FRAMES = 11;

const Watermark: React.FC<{ brand: any; fg: string; light: boolean }> = ({
  brand,
  fg,
  light,
}) => {
  const { width, height } = useVideoConfig();
  if (!brand?.handle) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: height * 0.06,
          right: width * 0.06,
          opacity: light ? 0.7 : 0.85,
          color: fg,
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: Math.round(height * 0.028),
          textShadow: light ? "none" : "0 2px 8px rgba(0,0,0,0.6)",
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
  const theme = resolveLook(storyboard.style);

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
        <Comp scene={s} theme={theme} brand={brand} />
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
          have contrast. Dark scrim on dark looks; soft light scrim on paper looks. */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(to top, ${
            theme.light ? "rgba(255,255,255,0.72)" : "rgba(0,0,0,0.6)"
          }, ${theme.light ? "rgba(255,255,255,0)" : "rgba(0,0,0,0)"} ${Math.round(
            captionBandPct({ width, height }) * 100,
          )}%)`,
          pointerEvents: "none",
        }}
      />

      <Captions
        pages={captions?.pages ?? []}
        style={storyboard.style?.captionStyle ?? theme.captionStyle}
        colors={theme.captions}
      />

      <Watermark brand={brand} fg={theme.fg} light={theme.light} />
    </AbsoluteFill>
  );
};
