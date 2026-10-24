import React from "react";
import { AbsoluteFill } from "remotion";
import { SafeZone } from "./SafeZone";
import { FitStage } from "./Stage";
import { Card } from "./Card";
import { Stickers } from "./Stickers";
import { Background } from "./Background";
import { useReveal, wipeX, wipeUp, LightSweep, EASING } from "./motion";
import { FONT } from "./fonts";
import { CodeScene } from "./CodeScene";
import { DiagramScene } from "./DiagramScene";
import { SocialHandles } from "./Social";
import { RenderLook } from "./looks";

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
type Theme = RenderLook;

// Render a headline, painting the last word in the accent colour (italic for
// serif looks). Uppercases for heavy/poster looks.
const Headline: React.FC<{
  text: string;
  theme: Theme;
  size: number;
  clip?: string;
  align?: "left" | "center";
}> = ({ text, theme, size, clip, align = "left" }) => {
  const words = (text || "").split(/\s+/);
  return (
    <h1
      style={{
        fontFamily: theme.displayFamily,
        fontSize: size,
        fontWeight: theme.displayWeight,
        letterSpacing: theme.displayTracking,
        lineHeight: theme.displayLineHeight,
        textTransform: theme.displayUpper ? "uppercase" : "none",
        margin: 0,
        textAlign: align,
        clipPath: clip,
      }}
    >
      {words.map((w, i) => {
        const last = i === words.length - 1 && words.length > 1;
        return (
          <span
            key={i}
            style={{
              color: last ? theme.accent : theme.fg,
              fontStyle: last && theme.italicAccent ? "italic" : "normal",
            }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </h1>
  );
};

const Kicker: React.FC<{ text?: string; theme: Theme; p: number }> = ({
  text,
  theme,
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
          background: theme.accent,
          boxShadow: theme.light ? "none" : `0 0 16px ${theme.accent}AA`,
        }}
      />
      <span
        style={{
          fontFamily: FONT,
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: theme.accent,
        }}
      >
        {text}
      </span>
    </div>
  ) : null;

const Rule: React.FC<{ theme: Theme; w: number }> = ({ theme, w }) => (
  <div
    style={{
      marginTop: 30,
      height: theme.light ? 4 : 6,
      width: `${w}px`,
      background: theme.light
        ? theme.accent
        : `linear-gradient(90deg, ${theme.accent}, ${theme.accent}00)`,
      borderRadius: 4,
    }}
  />
);

const Title: React.FC<{ scene: Scene; theme: Theme }> = ({ scene, theme }) => {
  const k = useReveal(1, 10, EASING.snap);
  const h = useReveal(3, 14, EASING.snap);
  const s = useReveal(15, 12, EASING.snap);
  return (
    <AbsoluteFill style={{ color: theme.fg }}>
      <Background theme={theme} variant={theme.bgVariant} />
      {theme.deco.stickers ? (
        <Stickers accent={theme.accent} accent2={theme.accent2} fg={theme.fg} />
      ) : null}
      <SafeZone>
        <Kicker text={scene.text?.kicker} theme={theme} p={k} />
        <div style={{ position: "relative", display: "inline-block" }}>
          <Headline
            text={scene.text?.heading ?? ""}
            theme={theme}
            size={104}
            clip={wipeX(h)}
          />
          {!theme.light ? <LightSweep start={6} dur={26} /> : null}
        </div>
        {scene.text?.sub ? (
          <p
            style={{
              fontFamily: FONT,
              fontSize: 42,
              fontWeight: 400,
              fontStyle: "italic",
              color: theme.muted,
              marginTop: 26,
              clipPath: wipeX(s),
            }}
          >
            {scene.text.sub}
          </p>
        ) : null}
        <Rule theme={theme} w={h * 170} />
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
        <Kicker text={scene.text?.kicker} theme={theme} p={k} />
        {scene.text?.heading ? (
          <div style={{ marginBottom: 40 }}>
            <Headline
              text={scene.text.heading}
              theme={theme}
              size={74}
              clip={wipeX(hp)}
            />
          </div>
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {bullets.map((b, i) => {
            const p = useReveal(10 + i * 5, 14, EASING.overshoot);
            const [lead, ...rest] = b.split(/(?<=^[^\s]+)\s/);
            return (
              <div
                key={i}
                style={{
                  opacity: p,
                  transform: `translateY(${(1 - p) * 26}px)`,
                }}
              >
                <Card
                  light={theme.light}
                  surface={theme.card}
                  accent={theme.accent}
                  style={{ padding: "20px 26px" }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 22 }}
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
                        fontFamily: theme.displayFamily,
                        fontSize: 26,
                        fontWeight: 800,
                        color: theme.light ? "#fff" : theme.bg,
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
                        color: theme.fg,
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

const Cta: React.FC<{ scene: Scene; theme: Theme; brand?: any }> = ({
  scene,
  theme,
  brand,
}) => {
  const p = useReveal(2, 16, EASING.longTail);
  const pill = useReveal(12, 14, EASING.overshoot);
  const s = useReveal(22, 12, EASING.snap);
  const soc = useReveal(26, 14, EASING.overshoot);
  const socials = brand?.socials ?? {};
  return (
    <AbsoluteFill style={{ color: theme.fg }}>
      <Background theme={theme} variant={theme.bgVariant} />
      {theme.deco.stickers ? (
        <Stickers accent={theme.accent} accent2={theme.accent2} fg={theme.fg} />
      ) : null}
      <SafeZone>
        <div
          style={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Headline
            text={scene.text?.heading ?? "Follow for more"}
            theme={theme}
            size={90}
            clip={wipeUp(p)}
            align="center"
          />

          <div
            style={{
              display: "inline-block",
              marginTop: 44,
              padding: "22px 54px",
              borderRadius: 999,
              background: `linear-gradient(145deg, ${theme.accent}, ${theme.accent}CC)`,
              color: theme.light ? "#fff" : theme.bg,
              fontFamily: theme.displayFamily,
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

          {socials.instagram || socials.youtube ? (
            <div style={{ marginTop: 40 }}>
              <SocialHandlesLazy socials={socials} theme={theme} soc={soc} />
            </div>
          ) : scene.text?.sub ? (
            <p
              style={{
                fontFamily: FONT,
                fontSize: 44,
                fontStyle: "italic",
                color: theme.muted,
                marginTop: 30,
                clipPath: wipeX(s),
              }}
            >
              {scene.text.sub}
            </p>
          ) : null}
        </div>
      </SafeZone>
      {!theme.light ? <LightSweep start={6} dur={28} /> : null}
    </AbsoluteFill>
  );
};

const Interstitial: React.FC<{ scene: Scene; theme: Theme }> = ({
  scene,
  theme,
}) => {
  const k = useReveal(0, 10, EASING.snap);
  const p = useReveal(1, 12, EASING.overshoot);
  const bar = useReveal(6, 12, EASING.snap);
  return (
    <AbsoluteFill style={{ color: theme.fg }}>
      <Background
        theme={theme}
        variant={theme.bgVariant === "ink" ? "mesh" : theme.bgVariant}
      />
      {theme.deco.stickers ? (
        <Stickers accent={theme.accent} accent2={theme.accent2} fg={theme.fg} />
      ) : null}
      <SafeZone>
        <div
          style={{
            textAlign: "center",
            opacity: p,
            transform: `scale(${0.92 + p * 0.08})`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Kicker text={scene.text?.kicker} theme={theme} p={k} />
          </div>
          <Headline
            text={scene.text?.heading ?? ""}
            theme={theme}
            size={88}
            align="center"
          />
          {scene.text?.sub ? (
            <div
              style={{
                fontFamily: FONT,
                fontSize: 44,
                fontStyle: "italic",
                color: theme.muted,
                marginTop: 22,
              }}
            >
              {scene.text.sub}
            </div>
          ) : null}
          <div
            style={{
              height: theme.light ? 4 : 6,
              width: 190,
              background: theme.light
                ? theme.accent
                : `linear-gradient(90deg, ${theme.accent}, ${theme.accent}00)`,
              borderRadius: 4,
              margin: "32px auto 0",
              transform: `scaleX(${bar})`,
              transformOrigin: "center",
            }}
          />
        </div>
      </SafeZone>
      {!theme.light ? <LightSweep start={3} dur={26} /> : null}
    </AbsoluteFill>
  );
};

const SocialHandlesLazy: React.FC<{
  socials: any;
  theme: Theme;
  soc: number;
}> = ({ socials, theme, soc }) => (
  <SocialHandles
    instagram={socials.instagram}
    youtube={socials.youtube}
    fg={theme.fg}
    opacity={soc}
    rise={(1 - soc) * 18}
  />
);

export const SCENES: Record<
  string,
  React.FC<{ scene: Scene; theme: Theme; brand?: any }>
> = {
  title: Title,
  bullets: Bullets,
  cta: Cta,
  code: CodeScene,
  diagram: DiagramScene,
  interstitial: Interstitial,
};
