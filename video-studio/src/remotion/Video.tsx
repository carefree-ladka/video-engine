import React from "react";
import {
  AbsoluteFill,
  Audio,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { fade } from "@remotion/transitions/fade";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { flip } from "@remotion/transitions/flip";
import { zoomTransition, pushTransition } from "./transitions";
import { SCENES } from "./scenes";
import { ZoomFocus } from "./Zoom";
import { Annotations } from "./Annotations";
import { Captions } from "./Captions";
import { FONT } from "./fonts";
import { captionBandPct } from "./layout";
import { resolveLook } from "./looks";

export type VideoProps = {
  storyboard: any;
  captions: { pages: any[] };
  brand: any;
};

const TRANSITION_FRAMES = 9;

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
    case "slideup":
      return slide({ direction: "from-bottom" });
    case "push":
      return pushTransition({ direction: "from-bottom" });
    case "pushleft":
      return pushTransition({ direction: "from-right" });
    case "clockWipe":
    case "clock":
      return clockWipe({ width, height });
    case "wipe":
      return wipe();
    case "flip":
      return flip();
    case "zoom":
    case "punch":
      return zoomTransition();
    default:
      return slide({ direction: "from-right" });
  }
};

// Thin progress bar that fills across the whole video. A retention cue on
// short-form. Enable via storyboard.style.progressBar (true | { ... }).
const ProgressBar: React.FC<{
  color: string;
  position: "top" | "bottom";
  thickness: number;
  track: string;
}> = ({ color, position, thickness, track }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const p = Math.max(0, Math.min(1, frame / Math.max(1, durationInFrames - 1)));
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        [position]: 0,
        height: thickness,
        background: track,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${p * 100}%`,
          background: color,
          boxShadow: `0 0 12px ${color}`,
        }}
      />
    </div>
  );
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
  const transitionFrames = Math.max(
    1,
    Math.round(storyboard.style?.transitionFrames ?? TRANSITION_FRAMES),
  );

  const capCfg = storyboard.style?.captions ?? {};
  const pb = storyboard.style?.progressBar;
  const pbObj = typeof pb === "object" && pb ? pb : {};
  const pbCfg = pb
    ? {
        color: pbObj.color ?? theme.accent,
        position: (pbObj.position ?? "top") as "top" | "bottom",
        thickness: pbObj.thickness ?? 6,
        track:
          pbObj.track ??
          (theme.light ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.14)"),
      }
    : null;

  // Build TransitionSeries children. Each non-last scene gets +TRANSITION_FRAMES so the
  // total (sum - transitions) still equals the audio length -> audio stays in sync.
  const children: React.ReactNode[] = [];
  scenes.forEach((s, i) => {
    const base = Math.max(1, Math.round((s.durationSec || 2) * fps));
    const isLast = i === scenes.length - 1;
    const dur = useTransitions && !isLast ? base + transitionFrames : base;
    const Comp = SCENES[s.template] ?? SCENES.title;
    const sceneEl = <Comp scene={s} theme={theme} brand={brand} />;
    const zoomed = s.zoom ? (
      <ZoomFocus spec={s.zoom}>{sceneEl}</ZoomFocus>
    ) : (
      sceneEl
    );
    children.push(
      <TransitionSeries.Sequence key={s.id} durationInFrames={dur}>
        {zoomed}
        {s.annotations ? (
          <Annotations items={s.annotations} theme={theme} />
        ) : null}
      </TransitionSeries.Sequence>,
    );
    if (useTransitions && !isLast) {
      // Per-scene override: a scene may set `transition` to pick its own
      // outgoing transition family; otherwise the storyboard default is used.
      // Default "slide" moves scenes in/out so headings never overprint the
      // way a crossfade would.
      const famForScene = scenes[i + 1]?.transition ?? s.transition ?? family;
      children.push(
        <TransitionSeries.Transition
          key={`t-${s.id}`}
          presentation={presentationFor(famForScene, width, height)}
          timing={linearTiming({ durationInFrames: transitionFrames })}
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
        style={
          capCfg.style ?? storyboard.style?.captionStyle ?? theme.captionStyle
        }
        colors={theme.captions}
        position={capCfg.position}
        maxWords={capCfg.maxWords}
      />

      {pbCfg ? <ProgressBar {...pbCfg} /> : null}

      <Watermark brand={brand} fg={theme.fg} light={theme.light} />
    </AbsoluteFill>
  );
};
