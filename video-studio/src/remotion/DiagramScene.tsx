import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { FitStage } from "./Stage";
import { Background } from "./Background";
import { useReveal, wipeUp, EASING } from "./motion";
import { FONT, DISPLAY } from "./fonts";

type Box = { title: string; items?: string[] };
type Scene = {
  text?: {
    heading?: string;
    diagram?: { boxes: Box[]; accentIndex?: number; loop?: string };
  };
  durationSec?: number;
};
type Theme = { bg: string; fg: string; accent: string; bgVariant?: string };

export const DiagramScene: React.FC<{ scene: Scene; theme: Theme }> = ({
  scene,
  theme,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const vertical = height > width;
  const hp = useReveal(2, 12, EASING.snap);
  const diagram = scene.text?.diagram ?? { boxes: [] as Box[] };
  const accentIndex = diagram.accentIndex ?? -1;
  const dash = -(frame * 6) % 48;

  // Estimate content height so FitStage can scale it to clear the caption band.
  // Vertical stacks boxes (sum); horizontal lays them in a row (tallest box).
  const boxHeight = (b: Box) => {
    const items = b.items?.length ?? 0;
    return 36 + 48 + (items ? 16 : 0) + items * 64;
  };
  const headingH = scene.text?.heading ? 118 : 0;
  const loopH = diagram.loop ? 110 : 0;
  const estHeight = vertical
    ? headingH +
      diagram.boxes.reduce((h, b) => h + boxHeight(b), 0) +
      Math.max(0, diagram.boxes.length - 1) * 20 +
      loopH
    : headingH + Math.max(260, ...diagram.boxes.map(boxHeight)) + loopH || 1;

  const boxesEl = (
    <div
      style={{
        display: "flex",
        flexDirection: vertical ? "column" : "row",
        gap: vertical ? 20 : 28,
        alignItems: "stretch",
        justifyContent: "center",
      }}
    >
      {diagram.boxes.map((box, i) => {
        const p = useReveal(8 + i * 5, 14, EASING.overshoot);
        const isAccent = i === accentIndex;
        return (
          <div
            key={i}
            style={{
              flex: vertical ? "0 0 auto" : 1,
              minHeight: vertical ? 0 : 260,
              borderRadius: 18,
              border: `3px solid ${isAccent ? theme.accent : "#2A2F37"}`,
              background: isAccent ? `${theme.accent}18` : "#13171E",
              padding: vertical ? "18px 22px" : "24px 22px",
              opacity: p,
              transform: `translateY(${(1 - p) * 40}px)`,
              boxShadow: isAccent
                ? `0 16px 50px ${theme.accent}33`
                : "0 10px 30px rgba(0,0,0,0.35)",
            }}
          >
            <div
              style={{
                fontFamily: DISPLAY,
                fontSize: vertical ? 34 : 30,
                fontWeight: 700,
                color: isAccent ? theme.accent : theme.fg,
                marginBottom: (box.items?.length ?? 0) ? 16 : 0,
              }}
            >
              {box.title}
            </div>
            {(box.items ?? []).map((it, j) => {
              const cp = useReveal(16 + i * 5 + j * 4, 10, EASING.snap);
              return (
                <div
                  key={j}
                  style={{
                    fontSize: vertical ? 26 : 24,
                    background: "#1C222B",
                    borderRadius: 10,
                    padding: "8px 14px",
                    margin: "8px 0",
                    clipPath: wipeUp(cp),
                  }}
                >
                  {it}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );

  const loopEl = diagram.loop ? (
    <div style={{ marginTop: 36, position: "relative", height: 70 }}>
      <svg width="100%" height="70" style={{ overflow: "visible" }}>
        <path
          d="M 40 50 C 40 10, 95% 10, 95% 50"
          fill="none"
          stroke={theme.accent}
          strokeWidth={4}
          strokeDasharray="14 10"
          strokeDashoffset={dash}
          markerEnd="url(#arrow)"
          opacity={interpolate(frame, [20, 34], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}
        />
        <defs>
          <marker
            id="arrow"
            markerWidth="10"
            markerHeight="10"
            refX="6"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L6,3 L0,6 Z" fill={theme.accent} />
          </marker>
        </defs>
      </svg>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          color: theme.accent,
          fontWeight: 800,
          fontSize: vertical ? 28 : 26,
        }}
      >
        {diagram.loop}
      </div>
    </div>
  ) : null;

  const heading = scene.text?.heading ? (
    <h2
      style={{
        fontFamily: DISPLAY,
        letterSpacing: "-0.02em",
        fontSize: vertical ? 64 : 58,
        fontWeight: 700,
        marginBottom: 40,
        clipPath: wipeUp(hp),
      }}
    >
      {scene.text.heading}
    </h2>
  ) : null;

  return (
    <AbsoluteFill style={{ color: theme.fg, fontFamily: FONT }}>
      <Background theme={theme} variant={theme.bgVariant} />
      {/* top-aligned + scaled so content always clears the caption band */}
      <FitStage estHeight={estHeight} align="center">
        {heading}
        {boxesEl}
        {loopEl}
      </FitStage>
    </AbsoluteFill>
  );
};
