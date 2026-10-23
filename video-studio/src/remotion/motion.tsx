import React from "react";
import {
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Easing,
} from "remotion";

// Named easing curves from the motion-graphics style system (numbers, not adjectives).
export const EASING = {
  snap: Easing.bezier(0.7, 0, 0.2, 1), // Swiss grid snaps
  overshoot: Easing.bezier(0.34, 1.56, 0.64, 1), // flat-vector confident pop
  longTail: Easing.bezier(0.16, 1, 0.3, 1), // dark-keynote slow reveal
  out: Easing.out(Easing.cubic),
};

// 0..1 progress over [delay, delay+dur] with a named easing.
export const useReveal = (
  delay = 0,
  dur = 12,
  easing: (n: number) => number = EASING.snap,
) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [delay, delay + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });
};

// clip-path wipes (entrances are wipes, not fades)
export const wipeX = (p: number): string =>
  `inset(0 ${Math.max(0, (1 - p) * 100)}% 0 0)`;
export const wipeUp = (p: number): string =>
  `inset(${Math.max(0, (1 - p) * 100)}% 0 0 0)`;

// legacy spring (kept for compatibility)
export const useEnter = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 200 } });
};

// A single soft light sweep across a container (dark-keynote reveal).
export const LightSweep: React.FC<{
  start?: number;
  dur?: number;
  color?: string;
}> = ({ start = 4, dur = 24, color = "rgba(255,255,255,0.28)" }) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [start, start + dur], [-140, 240], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASING.longTail,
  });
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-20%",
          bottom: "-20%",
          left: `${x}%`,
          width: "35%",
          transform: "skewX(-18deg)",
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        }}
      />
    </div>
  );
};
