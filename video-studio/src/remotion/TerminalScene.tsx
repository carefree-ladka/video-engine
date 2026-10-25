import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";
import { FitStage } from "./Stage";
import { Card } from "./Card";
import { Background } from "./Background";
import { useEnter, EASING } from "./motion";
import { FONT, MONO, DISPLAY } from "./fonts";

type Scene = {
  text?: {
    heading?: string;
    prompt?: string; // shell prompt, default "$"
    command?: string; // the typed command
    output?: string | string[]; // result lines, revealed after the command
    windowLabel?: string;
    fontSize?: number;
  };
  durationSec?: number;
};
type Theme = { bg: string; fg: string; accent: string };

// A terminal window: a prompt + typed command, then the output appears. Great
// for CLI tips, installs, and "run it and see" moments.
export const TerminalScene: React.FC<{ scene: Scene; theme: Theme }> = ({
  scene,
  theme,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const headingP = useEnter(0);
  const prompt = scene.text?.prompt ?? "$";
  const command = scene.text?.command ?? "";
  const outLines =
    scene.text?.output == null
      ? []
      : Array.isArray(scene.text.output)
        ? scene.text.output
        : [scene.text.output];

  const innerWidth = width * 0.86 - 80;
  const maxLen = Math.max(
    command.length + prompt.length + 1,
    ...outLines.map((l) => l.length),
    1,
  );
  const fontSize =
    scene.text?.fontSize ?? Math.max(26, Math.min(58, Math.floor(innerWidth / (maxLen * 0.6))));

  const durFrames = Math.max(1, Math.round((scene.durationSec || 4) * fps));
  const typeEnd = Math.round(durFrames * 0.4);
  const typed = Math.floor(
    interpolate(frame, [6, typeEnd], [0, command.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.ease),
    }),
  );
  const caretOn = frame % 16 < 8 && typed < command.length;

  const outStart = typeEnd + 6;
  const outReveal = interpolate(frame, [outStart, outStart + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASING.overshoot,
  });

  const estHeight =
    (scene.text?.heading ? 64 * 1.2 + 36 : 0) +
    72 +
    (1 + outLines.length) * (fontSize * 1.6);

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
            }}
          >
            {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
              <span
                key={c}
                style={{ width: 15, height: 15, borderRadius: 999, background: c }}
              />
            ))}
            <span
              style={{
                marginLeft: 8,
                fontFamily: MONO,
                fontSize: 20,
                color: "rgba(245,243,247,0.5)",
              }}
            >
              {scene.text?.windowLabel ?? "zsh"}
            </span>
          </div>
          <div style={{ padding: "26px 34px 30px", fontFamily: MONO, fontSize, lineHeight: 1.55 }}>
            <div style={{ whiteSpace: "pre-wrap" }}>
              <span style={{ color: theme.accent }}>{prompt} </span>
              <span>{command.slice(0, typed)}</span>
              {caretOn ? <span style={{ color: theme.accent }}>▋</span> : null}
            </div>
            <div style={{ opacity: outReveal, transform: `translateY(${(1 - outReveal) * 8}px)` }}>
              {outLines.map((l, i) => (
                <div key={i} style={{ whiteSpace: "pre-wrap", color: "#9FE7C4" }}>
                  {l}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </FitStage>
    </AbsoluteFill>
  );
};
