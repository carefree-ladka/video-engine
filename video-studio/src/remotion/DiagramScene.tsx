import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { FitStage } from "./Stage";
import { Card } from "./Card";
import { Background } from "./Background";
import { useReveal, wipeUp, EASING } from "./motion";
import { FONT, DISPLAY } from "./fonts";
import { parseEmphasis } from "./emphasis";

type Box = { title: string; items?: string[] };
type Scene = {
  text?: {
    heading?: string;
    diagram?: { boxes: Box[]; accentIndex?: number; loop?: string };
  };
  durationSec?: number;
};
type Theme = {
  bg: string;
  fg: string;
  accent: string;
  bgVariant?: string;
  light?: boolean;
  card?: string;
};

export const DiagramScene: React.FC<{ scene: Scene; theme: Theme }> = ({
  scene,
  theme,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const vertical = height > width;
  const hp = useReveal(2, 12, EASING.snap);
  const diagram = scene.text?.diagram ?? { boxes: [] as Box[] };
  const accentIndex = diagram.accentIndex ?? -1;
  const dash = -(frame * 6) % 48;

  // Timed card emphasis (pop + ring + dim others), same contract as bullets.
  const em = parseEmphasis((scene as any).emphasize);
  const boxRevealEndF = (i: number) => 8 + i * 5 + 16;
  const dimStartF = em.items.size
    ? em.at != null
      ? em.at * fps
      : Math.min(...[...em.items].map((idx) => boxRevealEndF(idx - 1)))
    : Infinity;

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
        const staticAccent = i === accentIndex;
        const isEm = em.items.has(i + 1);
        const emF = em.at != null ? em.at * fps : boxRevealEndF(i);
        const emActive = isEm && frame >= emF;
        const hi = staticAccent || emActive;
        const pop = isEm
          ? interpolate(frame - emF, [0, 8, 18], [1, 1.07, 1.04], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: EASING.overshoot,
            })
          : 1;
        const dim =
          em.dimOthers && em.items.size && !isEm
            ? interpolate(frame, [dimStartF, dimStartF + 10], [1, 0.3], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })
            : 1;
        return (
          <div
            key={i}
            style={{
              flex: vertical ? "0 0 auto" : 1,
              display: "flex",
              opacity: p * dim,
              transform: `translateY(${(1 - p) * 40}px) scale(${pop.toFixed(3)})`,
            }}
          >
            <Card
              highlighted={hi}
              accent={theme.accent}
              light={theme.light}
              surface={theme.card}
              radius={18}
              style={{
                flex: 1,
                minHeight: vertical ? 0 : 260,
                padding: vertical ? "20px 24px" : "26px 24px",
                ...(emActive
                  ? {
                      boxShadow: `0 0 0 3px ${theme.accent}, 0 20px 60px -12px ${theme.accent}`,
                    }
                  : {}),
              }}
            >
              <div
                style={{
                  fontFamily: DISPLAY,
                  fontSize: vertical ? 34 : 30,
                  fontWeight: 800,
                  letterSpacing: "-0.01em",
                  color: hi ? theme.accent : theme.fg,
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
                      fontFamily: FONT,
                      fontWeight: 500,
                      fontSize: vertical ? 26 : 24,
                      background: theme.light
                        ? "rgba(20,16,12,0.05)"
                        : "rgba(255,255,255,0.05)",
                      border: theme.light
                        ? "1px solid rgba(20,16,12,0.08)"
                        : "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 10,
                      padding: "9px 14px",
                      margin: "8px 0",
                      clipPath: wipeUp(cp),
                    }}
                  >
                    {it}
                  </div>
                );
              })}
            </Card>
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
