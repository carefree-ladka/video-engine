import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { EASING } from "./motion";
import { FONT } from "./fonts";
import { RenderLook } from "./looks";

// ---------------------------------------------------------------------------
// Storyboard-driven annotations / callouts, rendered in FRAME space on top of
// a scene (below the captions layer). A scene adds `annotations: [ ... ]`.
// Positions are % of the frame (0-100). Timing is scene-local seconds.
//
// Common fields on every item:
//   type    "spotlight" | "box" | "arrow" | "underline" | "label" | "pointer"
//   start   seconds into the scene to appear (default 0)
//   in      fade/scale-in duration (default 0.3)
//   dur     seconds visible; omit to stay until the scene ends
//   out     fade-out duration (default 0.3)
//   color   override accent colour
//
// Per-type geometry:
//   spotlight { x, y, w?, h?, r?, shape?:"circle"|"rect", dim?:0..1 }
//   box       { x, y, w, h, radius?, label? }
//   arrow     { x, y, fromX?, fromY? }   // points AT (x,y)
//   underline { x, y, w }
//   label     { x, y, text, align?:"center"|"left" }
//   pointer   { x, y, from?:"br"|"bl"|"tr"|"tl", click?:boolean }
// ---------------------------------------------------------------------------

export type Annotation = {
  type: string;
  start?: number;
  in?: number;
  dur?: number;
  out?: number;
  color?: string;
  [k: string]: any;
};

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

function useLife(it: Annotation, fps: number) {
  const frame = useCurrentFrame();
  const startF = (it.start ?? 0) * fps;
  const inF = Math.max(1, (it.in ?? 0.3) * fps);
  const appear = interpolate(frame, [startF, startF + inF], [0, 1], {
    ...CLAMP,
    easing: EASING.overshoot,
  });
  let vis = appear;
  if (typeof it.dur === "number") {
    const endF = startF + it.dur * fps;
    const outF = Math.max(1, (it.out ?? 0.3) * fps);
    const dis = interpolate(frame, [endF, endF + outF], [1, 0], CLAMP);
    vis = Math.min(appear, dis);
  }
  return { frame, startF, vis };
}

const Spotlight: React.FC<{ it: Annotation; theme: RenderLook }> = ({ it, theme }) => {
  const { fps } = useVideoConfig();
  const { vis } = useLife(it, fps);
  const shape = it.shape ?? "rect";
  const circle = shape === "circle";
  const w = circle ? (it.r ?? 18) * 2 : (it.w ?? 40);
  const h = circle ? (it.r ?? 18) * 2 : (it.h ?? 20);
  const dim = (it.dim ?? 0.6) * vis;
  return (
    <div
      style={{
        position: "absolute",
        left: `${it.x ?? 50}%`,
        top: `${it.y ?? 50}%`,
        width: `${w}%`,
        height: `${h}%`,
        transform: "translate(-50%,-50%)",
        borderRadius: circle ? "50%" : (it.radius ?? 24),
        boxShadow: `0 0 0 9999px rgba(0,0,0,${dim.toFixed(3)})`,
        outline: `2px solid ${it.color ?? theme.accent}${Math.round(vis * 160).toString(16).padStart(2, "0")}`,
        pointerEvents: "none",
      }}
    />
  );
};

const Box: React.FC<{ it: Annotation; theme: RenderLook }> = ({ it, theme }) => {
  const { fps } = useVideoConfig();
  const { vis } = useLife(it, fps);
  const color = it.color ?? theme.accent;
  return (
    <div
      style={{
        position: "absolute",
        left: `${it.x ?? 50}%`,
        top: `${it.y ?? 50}%`,
        width: `${it.w ?? 30}%`,
        height: `${it.h ?? 12}%`,
        transform: `translate(-50%,-50%) scale(${0.92 + vis * 0.08})`,
        border: `${Math.round(6)}px solid ${color}`,
        borderRadius: it.radius ?? 18,
        boxShadow: `0 0 28px -4px ${color}, inset 0 0 20px -8px ${color}`,
        opacity: vis,
        pointerEvents: "none",
      }}
    >
      {it.label ? (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: -14,
            transform: "translate(-50%,-100%)",
            background: color,
            color: theme.light ? "#fff" : theme.bg,
            fontFamily: FONT,
            fontSize: 26,
            fontWeight: 800,
            padding: "6px 16px",
            borderRadius: 10,
            whiteSpace: "nowrap",
          }}
        >
          {it.label}
        </div>
      ) : null}
    </div>
  );
};

const Underline: React.FC<{ it: Annotation; theme: RenderLook }> = ({ it, theme }) => {
  const { fps } = useVideoConfig();
  const { vis } = useLife(it, fps);
  const color = it.color ?? theme.accent;
  return (
    <div
      style={{
        position: "absolute",
        left: `${it.x ?? 50}%`,
        top: `${it.y ?? 50}%`,
        width: `${it.w ?? 24}%`,
        height: 8,
        transform: "translate(-50%,-50%)",
        background: color,
        borderRadius: 999,
        boxShadow: `0 0 18px -2px ${color}`,
        transformOrigin: "left center",
        opacity: vis > 0 ? 1 : 0,
        clipPath: `inset(0 ${Math.max(0, (1 - vis) * 100)}% 0 0)`,
        pointerEvents: "none",
      }}
    />
  );
};

const Arrow: React.FC<{ it: Annotation; theme: RenderLook }> = ({ it, theme }) => {
  const { fps, width, height } = useVideoConfig();
  const { vis } = useLife(it, fps);
  const color = it.color ?? theme.accent;
  const tx = ((it.x ?? 50) / 100) * width;
  const ty = ((it.y ?? 50) / 100) * height;
  const fx = ((it.fromX ?? (it.x ?? 50) - 14) / 100) * width;
  const fy = ((it.fromY ?? (it.y ?? 50) + 16) / 100) * height;
  const ang = Math.atan2(ty - fy, tx - fx);
  const head = 34;
  const p1 = [tx - head * Math.cos(ang - 0.45), ty - head * Math.sin(ang - 0.45)];
  const p2 = [tx - head * Math.cos(ang + 0.45), ty - head * Math.sin(ang + 0.45)];
  const headOp = interpolate(vis, [0.55, 0.9], [0, 1], CLAMP);
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <line
        x1={fx}
        y1={fy}
        x2={tx}
        y2={ty}
        stroke={color}
        strokeWidth={8}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - vis}
      />
      <polygon
        points={`${tx},${ty} ${p1[0]},${p1[1]} ${p2[0]},${p2[1]}`}
        fill={color}
        opacity={headOp}
      />
    </svg>
  );
};

const Label: React.FC<{ it: Annotation; theme: RenderLook }> = ({ it, theme }) => {
  const { fps } = useVideoConfig();
  const { vis } = useLife(it, fps);
  const color = it.color ?? theme.accent;
  return (
    <div
      style={{
        position: "absolute",
        left: `${it.x ?? 50}%`,
        top: `${it.y ?? 50}%`,
        transform: `translate(-50%,-50%) scale(${0.8 + vis * 0.2})`,
        background: color,
        color: theme.light ? "#fff" : theme.bg,
        fontFamily: FONT,
        fontSize: it.size ?? 34,
        fontWeight: 800,
        letterSpacing: "-0.01em",
        padding: "12px 24px",
        borderRadius: 14,
        boxShadow: `0 14px 40px -12px ${color}`,
        opacity: vis,
        whiteSpace: "nowrap",
        pointerEvents: "none",
      }}
    >
      {it.text ?? ""}
    </div>
  );
};

const Pointer: React.FC<{ it: Annotation; theme: RenderLook }> = ({ it, theme }) => {
  const { fps, width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const startF = (it.start ?? 0) * fps;
  const travelF = Math.max(1, (it.in ?? 0.6) * fps);
  const clickF = startF + travelF;
  const corner = it.from ?? "br";
  const offX = corner.includes("l") ? -220 : 220;
  const offY = corner.includes("t") ? -200 : 200;

  const appear = interpolate(frame, [startF, startF + 5], [0, 1], CLAMP);
  const travel = interpolate(frame, [startF, clickF], [0, 1], {
    ...CLAMP,
    easing: EASING.longTail,
  });
  const dipY = it.click
    ? interpolate(frame, [clickF - 2, clickF, clickF + 6], [0, 10, 0], CLAMP)
    : 0;
  const cx = ((it.x ?? 50) / 100) * width + (1 - travel) * offX;
  const cy = ((it.y ?? 50) / 100) * height + (1 - travel) * offY + dipY;

  const rip = it.click
    ? interpolate(frame, [clickF, clickF + 20], [0.2, 1], { ...CLAMP, easing: EASING.out })
    : 0;
  const ripOp = it.click ? interpolate(frame, [clickF, clickF + 20], [0.5, 0], CLAMP) : 0;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {it.click ? (
        <div
          style={{
            position: "absolute",
            left: `${it.x ?? 50}%`,
            top: `${it.y ?? 50}%`,
            width: 120,
            height: 120,
            marginLeft: -60,
            marginTop: -60,
            borderRadius: 999,
            border: `3px solid ${it.color ?? theme.accent}`,
            transform: `scale(${1 + rip})`,
            opacity: ripOp,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: cx,
          top: cy,
          opacity: appear,
          filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.45))",
        }}
      >
        <svg width={56} height={56} viewBox="0 0 24 24" fill="none">
          <path
            d="M4 2.5 L4 19.5 L8.4 15.2 L11.7 22 L14.3 20.8 L11 14.2 L17 14.2 Z"
            fill="#ffffff"
            stroke="rgba(0,0,0,0.70)"
            strokeWidth={1.1}
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </AbsoluteFill>
  );
};

const RENDERERS: Record<string, React.FC<{ it: Annotation; theme: RenderLook }>> = {
  spotlight: Spotlight,
  box: Box,
  underline: Underline,
  arrow: Arrow,
  label: Label,
  pointer: Pointer,
};

export const Annotations: React.FC<{
  items: Annotation[];
  theme: RenderLook;
}> = ({ items, theme }) => {
  if (!Array.isArray(items) || !items.length) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {items.map((it, i) => {
        const R = RENDERERS[it.type];
        if (!R) return null;
        return <R key={i} it={it} theme={theme} />;
      })}
    </AbsoluteFill>
  );
};
