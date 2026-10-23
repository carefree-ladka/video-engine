import React from "react";
import { AbsoluteFill } from "remotion";
import { SafeZone } from "./SafeZone";
import { Background } from "./Background";
import { useReveal, wipeX, wipeUp, LightSweep, EASING } from "./motion";
import { FONT, DISPLAY } from "./fonts";
import { CodeScene } from "./CodeScene";
import { DiagramScene } from "./DiagramScene";

type Scene = {
  id: string;
  template: string;
  motion?: string;
  text?: {
    heading?: string;
    sub?: string;
    bullets?: string[];
    value?: string;
    code?: string[];
  };
};
type Theme = { bg: string; fg: string; accent: string; bgVariant?: string };

const Title: React.FC<{ scene: Scene; theme: Theme }> = ({ scene, theme }) => {
  const h = useReveal(2, 14, EASING.snap);
  const s = useReveal(14, 12, EASING.snap);
  return (
    <AbsoluteFill style={{ color: theme.fg }}>
      <Background theme={theme} variant={theme.bgVariant} />
      <SafeZone>
        <div style={{ position: "relative", display: "inline-block" }}>
          <h1
            style={{
              fontFamily: DISPLAY,
              fontSize: 96,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              margin: 0,
              lineHeight: 1.05,
              clipPath: wipeX(h),
            }}
          >
            {scene.text?.heading}
          </h1>
          <LightSweep start={6} dur={26} />
        </div>
        {scene.text?.sub ? (
          <p
            style={{
              fontFamily: FONT,
              fontSize: 42,
              fontWeight: 500,
              opacity: 0.78,
              marginTop: 24,
              clipPath: wipeX(s),
            }}
          >
            {scene.text.sub}
          </p>
        ) : null}
        <div
          style={{
            marginTop: 28,
            height: 8,
            width: `${h * 150}px`,
            background: theme.accent,
            borderRadius: 4,
          }}
        />
      </SafeZone>
    </AbsoluteFill>
  );
};

const Bullets: React.FC<{ scene: Scene; theme: Theme }> = ({
  scene,
  theme,
}) => {
  const hp = useReveal(2, 12, EASING.snap);
  return (
    <AbsoluteFill style={{ color: theme.fg }}>
      <Background theme={theme} variant={theme.bgVariant} />
      <SafeZone>
        {scene.text?.heading ? (
          <h2
            style={{
              fontFamily: DISPLAY,
              fontSize: 70,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginBottom: 36,
              clipPath: wipeX(hp),
            }}
          >
            {scene.text.heading}
          </h2>
        ) : null}
        {(scene.text?.bullets ?? []).map((b, i) => {
          const p = useReveal(10 + i * 4, 12, EASING.snap);
          return (
            <div
              key={i}
              style={{
                fontFamily: FONT,
                fontSize: 50,
                fontWeight: 500,
                margin: "16px 0",
                clipPath: wipeX(p),
                display: "flex",
                alignItems: "baseline",
              }}
            >
              <span
                style={{
                  color: theme.accent,
                  marginRight: 18,
                  fontWeight: 800,
                }}
              >
                ▍
              </span>
              {b}
            </div>
          );
        })}
      </SafeZone>
    </AbsoluteFill>
  );
};

const Cta: React.FC<{ scene: Scene; theme: Theme }> = ({ scene, theme }) => {
  const p = useReveal(2, 16, EASING.longTail);
  const pill = useReveal(12, 14, EASING.overshoot);
  const s = useReveal(22, 12, EASING.snap);
  return (
    <AbsoluteFill style={{ color: theme.fg }}>
      {/* same dark, designed stage as every other scene — accent on ONE element only */}
      <Background theme={theme} variant={theme.bgVariant} />
      <SafeZone>
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontFamily: DISPLAY,
              fontSize: 84,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.08,
              clipPath: wipeUp(p),
            }}
          >
            {scene.text?.heading ?? "Follow for more"}
          </h1>

          {/* the one signal-colour element: a Follow pill */}
          <div
            style={{
              display: "inline-block",
              marginTop: 40,
              padding: "20px 48px",
              borderRadius: 999,
              background: theme.accent,
              color: theme.bg,
              fontFamily: DISPLAY,
              fontSize: 48,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              boxShadow: `0 16px 50px ${theme.accent}55`,
              opacity: pill,
              transform: `scale(${0.85 + pill * 0.15})`,
            }}
          >
            Follow ▸
          </div>

          {scene.text?.sub ? (
            <p
              style={{
                fontFamily: FONT,
                fontSize: 44,
                fontWeight: 600,
                opacity: 0.8,
                marginTop: 28,
                clipPath: wipeX(s),
              }}
            >
              {scene.text.sub}
            </p>
          ) : null}
        </div>
      </SafeZone>
      <LightSweep start={6} dur={28} />
    </AbsoluteFill>
  );
};

// Mid-video re-hook: a short, visually distinct pattern-interrupt that opens a new loop.
const Interstitial: React.FC<{ scene: Scene; theme: Theme }> = ({
  scene,
  theme,
}) => {
  const p = useReveal(1, 12, EASING.overshoot);
  const bar = useReveal(6, 12, EASING.snap);
  return (
    <AbsoluteFill style={{ color: theme.fg }}>
      <Background theme={theme} variant="mesh" />
      <SafeZone>
        <div
          style={{
            textAlign: "center",
            opacity: p,
            transform: `scale(${0.9 + p * 0.1})`,
          }}
        >
          <div
            style={{
              fontFamily: DISPLAY,
              fontSize: 82,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              color: theme.accent,
            }}
          >
            {scene.text?.heading}
          </div>
          {scene.text?.sub ? (
            <div
              style={{
                fontFamily: FONT,
                fontSize: 44,
                fontWeight: 600,
                opacity: 0.85,
                marginTop: 20,
              }}
            >
              {scene.text.sub}
            </div>
          ) : null}
          <div
            style={{
              height: 8,
              width: 180,
              background: theme.accent,
              borderRadius: 4,
              margin: "30px auto 0",
              transform: `scaleX(${bar})`,
            }}
          />
        </div>
      </SafeZone>
      <LightSweep start={3} dur={26} />
    </AbsoluteFill>
  );
};

export const SCENES: Record<
  string,
  React.FC<{ scene: Scene; theme: Theme }>
> = {
  title: Title,
  bullets: Bullets,
  cta: Cta,
  code: CodeScene,
  diagram: DiagramScene,
  interstitial: Interstitial,
};
