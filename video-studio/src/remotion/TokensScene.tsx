import React from "react";
import { AbsoluteFill } from "remotion";
import { FitStage } from "./Stage";
import { Background } from "./Background";
import { useReveal, wipeUp, EASING } from "./motion";
import { FONT, DISPLAY, MONO } from "./fonts";
import { RenderLook } from "./looks";

// A token can be a plain string or an object with an optional explicit colour
// and an `accent` flag (painted in the theme accent). This is the "tokens"
// visual from the engine audit: colored chips, good for tokenization, labels,
// tags, or any set of discrete items.
type Token = string | { text: string; color?: string; accent?: boolean };

type Scene = {
  text?: {
    heading?: string;
    kicker?: string;
    footnote?: string;
    tokens?: Token[];
  };
  durationSec?: number;
};
type Theme = RenderLook;

const CHIP_PALETTE = [
  "#61DAFB",
  "#FFD43B",
  "#39D98A",
  "#FF8CC6",
  "#8B7CFF",
  "#FF8A5C",
];

export const TokensScene: React.FC<{ scene: Scene; theme: Theme }> = ({
  scene,
  theme,
}) => {
  const tokens = scene.text?.tokens ?? [];
  const hp = useReveal(2, 12, EASING.snap);

  const chipH = 92;
  const estHeight =
    (scene.text?.kicker ? 46 : 0) +
    (scene.text?.heading ? 74 * 1.1 + 40 : 0) +
    // chips wrap to roughly 3 per row in vertical; estimate rows generously
    Math.ceil(Math.max(1, tokens.length) / 3) * (chipH + 24) +
    (scene.text?.footnote ? 64 : 0);

  return (
    <AbsoluteFill style={{ color: theme.fg, fontFamily: FONT }}>
      <Background theme={theme} variant={theme.bgVariant} />
      <FitStage estHeight={estHeight} align="center">
        {scene.text?.heading ? (
          <h2
            style={{
              fontFamily: DISPLAY,
              fontSize: 72,
              fontWeight: theme.displayWeight,
              letterSpacing: theme.displayTracking,
              textAlign: "center",
              marginBottom: 44,
              clipPath: wipeUp(hp),
            }}
          >
            {scene.text.heading}
          </h2>
        ) : null}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 24,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {tokens.map((raw, i) => {
            const tok: { text: string; color?: string; accent?: boolean } =
              typeof raw === "string" ? { text: raw } : raw;
            const color =
              tok.color ??
              (tok.accent
                ? theme.accent
                : CHIP_PALETTE[i % CHIP_PALETTE.length]);
            const p = useReveal(8 + i * 4, 12, EASING.overshoot);
            return (
              <span
                key={i}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  height: chipH,
                  padding: "0 34px",
                  borderRadius: 18,
                  fontFamily: MONO,
                  fontSize: 44,
                  fontWeight: 700,
                  color: theme.light ? "#141210" : color,
                  background: theme.light ? color : `${color}1F`,
                  border: `2px solid ${color}${theme.light ? "" : "66"}`,
                  boxShadow: theme.light
                    ? "0 8px 22px -10px rgba(0,0,0,0.3)"
                    : `0 0 26px -6px ${color}55`,
                  opacity: p,
                  transform: `translateY(${(1 - p) * 26}px) scale(${
                    0.9 + p * 0.1
                  })`,
                }}
              >
                {tok.text}
              </span>
            );
          })}
        </div>

        {scene.text?.footnote ? (
          <div
            style={{
              marginTop: 36,
              textAlign: "center",
              fontFamily: FONT,
              fontSize: 30,
              fontWeight: 500,
              color: theme.muted,
            }}
          >
            {scene.text.footnote}
          </div>
        ) : null}
      </FitStage>
    </AbsoluteFill>
  );
};
