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
import { useReveal, EASING } from "./motion";
import { FONT, MONO, DISPLAY } from "./fonts";

type Panel = { label?: string; code: string[] };
type Scene = {
  text?: {
    heading?: string;
    before: Panel;
    after: Panel;
    fontSize?: number;
    dimBefore?: boolean; // dim the "before" card once "after" lands (default true)
  };
  durationSec?: number;
};
type Theme = { bg: string; fg: string; accent: string };

const DEL = "#FF6B6B";
const ADD = "#39D98A";

// Git-style before/after: two code cards — the old way (red, "−" lines) and the
// fix (green, "+" lines) — with the "after" card popping in and the "before"
// receding. The "stop doing this → do this" format.
export const BeforeAfterScene: React.FC<{ scene: Scene; theme: Theme }> = ({
  scene,
  theme,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const vertical = height > width;
  const before = scene.text?.before ?? { code: [] as string[] };
  const after = scene.text?.after ?? { code: [] as string[] };
  const dimBefore = scene.text?.dimBefore !== false;

  // one font size across both cards so the diff lines up
  const allLines = [...(before.code ?? []), ...(after.code ?? [])];
  const maxLen = allLines.reduce((m, l) => Math.max(m, l.replace(/^[+\-]\s?/, "").length + 2), 1);
  const innerWidth = (vertical ? width * 0.86 : width * 0.44) - 72;
  const fontSize =
    scene.text?.fontSize ?? Math.max(22, Math.min(46, Math.floor(innerWidth / (maxLen * 0.62))));

  const headingP = useReveal(0, 12, EASING.snap);
  const beforeP = useReveal(6, 12, EASING.overshoot);
  const afterStartF = 20;
  const afterP = useReveal(afterStartF, 14, EASING.overshoot);
  // before recedes once after lands
  const beforeFade = dimBefore
    ? interpolate(frame, [afterStartF + 6, afterStartF + 16], [1, 0.5], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;
  // connector + after glow
  const conn = interpolate(frame, [afterStartF - 2, afterStartF + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASING.overshoot,
  });

  const estHeight =
    (scene.text?.heading ? 64 * 1.2 + 32 : 0) +
    (before.code.length + after.code.length) * (fontSize * 1.55) +
    220;

  const Panel: React.FC<{
    panel: Panel;
    sign: "+" | "-";
    color: string;
    op: number;
    glow: boolean;
    pop: number;
  }> = ({ panel, sign, color, op, glow, pop }) => (
    <div style={{ flex: 1, opacity: op, transform: `scale(${pop.toFixed(3)})` }}>
      <Card
        radius={16}
        style={{
          overflow: "hidden",
          borderLeft: `6px solid ${color}`,
          boxShadow: glow ? `0 0 0 2px ${color}, 0 18px 50px -12px ${color}` : undefined,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: color,
              color: "#0b0f14",
              fontFamily: MONO,
              fontWeight: 800,
              fontSize: 22,
            }}
          >
            {sign}
          </span>
          <span
            style={{
              fontFamily: FONT,
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color,
            }}
          >
            {panel.label ?? (sign === "-" ? "before" : "after")}
          </span>
        </div>
        <div
          style={{
            padding: "18px 22px",
            fontFamily: MONO,
            fontSize,
            lineHeight: 1.55,
            background: `${color}12`,
          }}
        >
          {(panel.code ?? []).map((raw, i) => {
            const body = raw.replace(/^[+\-]\s?/, "");
            return (
              <div key={i} style={{ whiteSpace: "pre-wrap", display: "flex", gap: 14 }}>
                <span style={{ color, opacity: 0.85, width: "1ch" }}>{sign}</span>
                <span style={{ color: theme.fg }}>{body}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );

  return (
    <AbsoluteFill style={{ color: theme.fg, fontFamily: FONT }}>
      <Background theme={theme} variant={(theme as any).bgVariant} />
      <FitStage estHeight={estHeight} align="center">
        {scene.text?.heading ? (
          <h2
            style={{
              fontFamily: DISPLAY,
              fontSize: 60,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              textAlign: "center",
              marginBottom: 28,
              opacity: headingP,
            }}
          >
            {scene.text.heading}
          </h2>
        ) : null}
        <div
          style={{
            display: "flex",
            flexDirection: vertical ? "column" : "row",
            gap: vertical ? 16 : 24,
            alignItems: "stretch",
          }}
        >
          <Panel
            panel={before}
            sign="-"
            color={DEL}
            op={beforeP * beforeFade}
            glow={false}
            pop={1}
          />
          {/* connector */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "0 0 auto",
              opacity: conn,
              transform: `scale(${0.6 + conn * 0.4})`,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 999,
                background: theme.accent,
                color: (theme as any).light ? "#fff" : theme.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 34,
                fontWeight: 800,
                boxShadow: `0 0 28px ${theme.accent}66`,
              }}
            >
              {vertical ? "↓" : "→"}
            </div>
          </div>
          <Panel
            panel={after}
            sign="+"
            color={ADD}
            op={afterP}
            glow={conn > 0.5}
            pop={0.96 + afterP * 0.04}
          />
        </div>
      </FitStage>
    </AbsoluteFill>
  );
};
