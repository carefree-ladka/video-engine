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
import { useEnter, EASING } from "./motion";
import { FONT, MONO, DISPLAY } from "./fonts";

type Scene = {
  text?: {
    heading?: string;
    windowLabel?: string;
    fontSize?: number;
    // Each line starts with "+" (added), "-" (removed), or neither (context).
    diff?: string[];
    code?: string[]; // alias for diff
  };
  durationSec?: number;
};
type Theme = { bg: string; fg: string; accent: string };

const ADD = "#39D98A";
const DEL = "#FF6B6B";

// A git-style diff: removed lines in red, added lines in green, with rows
// staggering in. Perfect for "the long way vs the trick" and refactors.
export const DiffScene: React.FC<{ scene: Scene; theme: Theme }> = ({
  scene,
  theme,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const headingP = useEnter(0);
  const lines = scene.text?.diff ?? scene.text?.code ?? [];

  const innerWidth = width * 0.86 - 80;
  const maxLen = lines.reduce((m, l) => Math.max(m, l.length), 1);
  const fontSize =
    scene.text?.fontSize ?? Math.max(26, Math.min(58, Math.floor(innerWidth / (maxLen * 0.62))));

  const estHeight =
    (scene.text?.heading ? 64 * 1.2 + 36 : 0) + 72 + lines.length * (fontSize * 1.6);

  return (
    <AbsoluteFill style={{ color: theme.fg, fontFamily: FONT }}>
      <Background theme={theme} variant={(theme as any).bgVariant} />
      <FitStage estHeight={estHeight + 58}>
        {scene.text?.heading ? (
          <h2
            style={{
              fontFamily: DISPLAY,
              fontSize: 60,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: 28,
              opacity: headingP,
            }}
          >
            {scene.text.heading}
          </h2>
        ) : null}
        <Card radius={18} style={{ overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              background: "linear-gradient(180deg, rgba(255,255,255,0.04), transparent)",
              fontFamily: MONO,
              fontSize: 20,
              color: "rgba(245,243,247,0.5)",
            }}
          >
            {scene.text?.windowLabel ?? "diff"}
          </div>
          <div style={{ padding: "22px 0", fontFamily: MONO, fontSize, lineHeight: 1.6 }}>
            {lines.map((raw, i) => {
              const sign = raw[0] === "+" ? "+" : raw[0] === "-" ? "-" : " ";
              const body = sign === " " ? raw : raw.slice(1);
              const color = sign === "+" ? ADD : sign === "-" ? DEL : "#C9D2DE";
              const bg =
                sign === "+" ? `${ADD}1c` : sign === "-" ? `${DEL}1c` : "transparent";
              const rev = interpolate(frame, [6 + i * 4, 18 + i * 4], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: EASING.snap,
              });
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 18,
                    padding: "2px 34px",
                    background: bg,
                    opacity: rev,
                    transform: `translateX(${(1 - rev) * -18}px)`,
                    whiteSpace: "pre",
                  }}
                >
                  <span style={{ color, width: "1ch", opacity: 0.9 }}>{sign}</span>
                  <span style={{ color }}>{body}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </FitStage>
    </AbsoluteFill>
  );
};
