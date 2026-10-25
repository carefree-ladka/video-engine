import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { EASING } from "./motion";

// ---------------------------------------------------------------------------
// Storyboard-driven focus zoom ("camera push-in"), the way screen-recording
// editors highlight a region. A scene opts in with a `zoom` key:
//
//   "zoom": { "x": 62, "y": 46, "scale": 1.6, "start": 1.0, "in": 0.5 }
//
// which smoothly pushes into the point (x%, y%) of the frame and HOLDS there
// for the rest of the scene. Add "hold" + "out" to zoom back out, or pass an
// ARRAY of steps to move focus between several regions in one scene.
//
// Two touches make the hold feel alive and cinematic (both on by default while
// zoomed, both tunable, set to 0 to disable):
//   - drift : a slow extra push-in (Ken Burns) once the zoom settles
//   - dim   : a soft vignette that darkens the edges toward the focal point
//
// Fields (seconds / percentages):
//   x, y   focal point in % of the frame (0-100). default 50/50 (center)
//   scale  zoom level (1 = none). default 1.6
//   start  when to begin the push, seconds into the scene. default 0
//   in     push-in duration. default 0.5
//   hold   how long to stay zoomed before zooming out (only with `out`)
//   out    zoom-out duration. omit to hold the zoom until the scene ends
//   drift  extra slow push-in while held, as a scale fraction. default 0.045
//   dim    vignette strength 0..1. default 0.32
//
// Captions and the caption scrim live ABOVE the scenes in the composition, so
// the zoom/vignette never scale or hide the subtitles.
// ---------------------------------------------------------------------------

export type ZoomStep = {
  x?: number;
  y?: number;
  scale?: number;
  start?: number;
  in?: number;
  hold?: number;
  out?: number;
  drift?: number;
  dim?: number;
};

type Resolved = {
  x: number;
  y: number;
  scale: number;
  drift: number;
  dim: number;
  t0: number; // frame the push begins
  inEnd: number; // frame the push-in completes
  outStart: number | null; // frame the zoom-out begins
  outEnd: number | null; // frame the zoom-out completes
  driftEnd: number; // frame the drift ramp completes
};

const DRIFT_RAMP_SEC = 2.5;

const clampNum = (v: any, lo: number, hi: number, dflt: number): number => {
  const n = typeof v === "number" && Number.isFinite(v) ? v : dflt;
  return Math.max(lo, Math.min(hi, n));
};

function resolve(step: ZoomStep, fps: number): Resolved {
  const scale = clampNum(step.scale, 1, 5, 1.6);
  const x = clampNum(step.x, 0, 100, 50);
  const y = clampNum(step.y, 0, 100, 50);
  const drift = clampNum(step.drift, 0, 0.3, 0.045);
  const dim = clampNum(step.dim, 0, 1, 0.32);
  const t0 = Math.max(0, (step.start ?? 0) * fps);
  const inEnd = t0 + Math.max(1, (step.in ?? 0.5) * fps);
  let outStart: number | null = null;
  let outEnd: number | null = null;
  if (typeof step.out === "number" && step.out > 0) {
    outStart = inEnd + Math.max(0, step.hold ?? 1.5) * fps;
    outEnd = outStart + Math.max(1, step.out * fps);
  }
  return {
    x,
    y,
    scale,
    drift,
    dim,
    t0,
    inEnd,
    outStart,
    outEnd,
    driftEnd: inEnd + DRIFT_RAMP_SEC * fps,
  };
}

// Base zoom curve (push-in, hold, optional push-out) -> 1..scale.
function baseScaleAt(frame: number, r: Resolved): number {
  const zin = interpolate(frame, [r.t0, r.inEnd], [1, r.scale], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASING.longTail,
  });
  if (r.outStart == null || r.outEnd == null) return zin;
  if (frame <= r.outStart) return zin;
  return interpolate(frame, [r.outStart, r.outEnd], [r.scale, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASING.out,
  });
}

export const ZoomFocus: React.FC<{
  spec: ZoomStep | ZoomStep[];
  children: React.ReactNode;
}> = ({ spec, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const steps = (Array.isArray(spec) ? spec : [spec])
    .map((s) => resolve(s, fps))
    .sort((a, b) => a.t0 - b.t0);

  // The active step is the latest one whose push has started.
  let active: Resolved | null = null;
  for (const s of steps) if (frame >= s.t0) active = s;

  if (!active) return <>{children}</>;

  const base = baseScaleAt(frame, active);
  // normalized zoom amount 0..1 (used to fade drift + vignette with the zoom)
  const z =
    active.scale > 1
      ? Math.max(0, Math.min(1, (base - 1) / (active.scale - 1)))
      : 0;

  // slow Ken Burns drift that ramps in after the push-in settles and unwinds
  // with the zoom (so a zoom-out still returns cleanly to 1).
  const driftProg = interpolate(
    frame,
    [active.inEnd, active.driftEnd],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const scale = base * (1 + active.drift * driftProg * z);

  if (scale <= 1.0001) return <>{children}</>;

  const dimOp = active.dim * z;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          transformOrigin: `${active.x}% ${active.y}%`,
          willChange: "transform",
        }}
      >
        {children}
      </AbsoluteFill>
      {dimOp > 0.002 ? (
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            background: `radial-gradient(circle at ${active.x}% ${active.y}%, rgba(0,0,0,0) 20%, rgba(0,0,0,${(dimOp * 0.5).toFixed(3)}) 55%, rgba(0,0,0,${dimOp.toFixed(3)}) 92%)`,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
