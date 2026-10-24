import React from "react";
import { AbsoluteFill } from "remotion";
import { SafeZone } from "./SafeZone";
import { FitStage } from "./Stage";
import { Card } from "./Card";
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
    kicker?: string;
    heading?: string;
    sub?: string;
    bullets?: string[];
    value?: string;
    code?: string[];
  };
};
type Theme = { bg: string; fg: string; accent: string; bgVariant?: string };

const muted = (fg: string) => `${fg}9E`; // ~62% alpha secondary text

// Small uppercase label that gives scenes an editorial, designed feel.
const Kicker: React.FC<{ text?: string; accent: string; p: number }> = ({
  text,
  accent,
  p,
}) =>
  text ? (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 22,
        opacity: p,
        transform: `translateY(${(1 - p) * 10}px)`,
      }}
    >
      <span
        style={{
          width: 26,
          height: 3,
          borderRadius: 2,
          background: accent,
          boxShadow: `0 0 16px ${accent}AA`,
        }}
      />
      <span
        style={{
          fontFamily: FONT,
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: accent,
        }}
      >
        {text}
      </span>
    </div>
  ) : null;

const Title: React.FC<{ scene: Scene; theme: Theme }> = ({ scene, theme }) => {
  const k = useReveal(1, 10, EASING.snap);
  const h = useReveal(3, 14, EASING.snap);
  const s = useReveal(15, 12, EASING.snap);
  return (
    <AbsoluteFill style={{ color: theme.fg }}>
      <Background theme={theme} variant={theme.bgVariant} />
      <SafeZone>
        <Kicker text={scene.text?.kicker} accent={theme.accent} p={k} />
        <div style={{ position: "relative", display: "inline-block" }}>
          <h1
            style={{
              fontFamily: DISPLAY,
              fontSize: 104,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              margin: 0,
              lineHeight: 1.02,
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
              fontWeight: 400,
              fontStyle: "italic",
              color: muted(theme.fg),
              marginTop: 26,
              clipPath: wipeX(s),
            }}
          >
            {scene.text.sub}
          </p>
        ) : null}
        <div
          style={{
            marginTop: 30,
            height: 6,
            width: `${h * 170}px`,
            background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent}00)`,
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
  const k = useReveal(1, 10, EASING.snap);
  const hp = useReveal(3, 12, EASING.snap);
  const bullets = scene.text?.bullets ?? [];
  const estHeight =
    (scene.text?.kicker ? 46 : 0) +
    (scene.text?.heading ? 74 * 1.1 + 40 : 0) +
    bullets.length * (96 + 22);
  return (
    <AbsoluteFill style={{ color: theme.fg }}>
      <Background theme={theme} variant={theme.bgVariant} />
      <FitStage estHeight={estHeight}>
        <Kicker text={scene.text?.kicker} accent={theme.accent} p={k} />
        {scene.text?.heading ? (
          <h2
            style={{
              fontFamily: DISPLAY,
              fontSize: 74,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: 40,
              clipPath: wipeX(hp),
            }}
          >
            {scene.text.heading}
          </h2>
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {bullets.map((b, i) => {
            const p = useReveal(10 + i * 5, 14, EASING.overshoot);
            const [lead, ...rest] = b.split(/(?<=^[^\s]+)\s/); // bold the first word
            return (
              <div
                key={i}
                style={{
                  opacity: p,
                  transform: `translateY(${(1 - p) * 26}px)`,
                }}
              >
                <Card style={{ padding: "20px 26px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 22,
                    }}
                  >
                    <span
                      style={{
                        flex: "0 0 auto",
                        width: 46,
                        height: 46,
                        borderRadius: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: DISPLAY,
                        fontSize: 26,
                        fontWeight: 800,
                        color: theme.bg,
                        background: `linear-gradient(145deg, ${theme.accent}, ${theme.accent}C0)`,
                        boxShadow: `0 8px 22px -8px ${theme.accent}99`,
                      }}
                    >
                      {i + 1}
                    </span>
                    <div
                      style={{
                        fontFamily: FONT,
                        fontSize: 46,
                        fontWeight: 500,
                        lineHeight: 1.2,
                      }}
                    >
                      <span style={{ fontWeight: 800 }}>{lead}</span>
                      {rest.length ? " " + rest.join(" ") : ""}
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </FitStage>
    </AbsoluteFill>
  );
};

const Cta: React.FC<{ scene: Scene; theme: Theme }> = ({ scene, theme }) => {
  const p = useReveal(2, 16, EASING.longTail);
  const pill = useReveal(12, 14, EASING.overshoot);
  const s = useReveal(22, 12, EASING.snap);
  return (
    <AbsoluteFill style={{ color: theme.fg }}>
      <Background theme={theme} variant="mesh" />
      <SafeZone>
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontFamily: DISPLAY,
              fontSize: 90,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.06,
              clipPath: wipeUp(p),
            }}
          >
            {scene.text?.heading ?? "Follow for more"}
          </h1>

          <div
            style={{
              display: "inline-block",
              marginTop: 44,
              padding: "22px 54px",
              borderRadius: 999,
              background: `linear-gradient(145deg, ${theme.accent}, ${theme.accent}CC)`,
              color: theme.bg,
              fontFamily: DISPLAY,
              fontSize: 50,
              fontWeight: 800,
              letterSpacing: "-0.01em",
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 18px 55px ${theme.accent}55`,
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
                fontWeight: 400,
                fontStyle: "italic",
                color: muted(theme.fg),
                marginTop: 30,
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

// Mid-video re-hook: a short, visually distinct pattern-interrupt.
const Interstitial: React.FC<{ scene: Scene; theme: Theme }> = ({
  scene,
  theme,
}) => {
  const k = useReveal(0, 10, EASING.snap);
  const p = useReveal(1, 12, EASING.overshoot);
  const bar = useReveal(6, 12, EASING.snap);
  return (
    <AbsoluteFill style={{ color: theme.fg }}>
      <Background theme={theme} variant="mesh" />
      <SafeZone>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Kicker text={scene.text?.kicker} accent={theme.accent} p={k} />
          </div>
          <div
            style={{
              fontFamily: DISPLAY,
              fontSize: 88,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.08,
              color: theme.fg,
              opacity: p,
              transform: `scale(${0.92 + p * 0.08})`,
            }}
          >
            {scene.text?.heading}
          </div>
          {scene.text?.sub ? (
            <div
              style={{
                fontFamily: FONT,
                fontSize: 44,
                fontWeight: 400,
                fontStyle: "italic",
                color: muted(theme.fg),
                marginTop: 22,
              }}
            >
              {scene.text.sub}
            </div>
          ) : null}
          <div
            style={{
              height: 6,
              width: 190,
              background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent}00)`,
              borderRadius: 4,
              margin: "32px auto 0",
              transform: `scaleX(${bar})`,
              transformOrigin: "center",
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
