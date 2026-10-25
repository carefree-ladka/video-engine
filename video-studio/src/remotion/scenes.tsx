import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { SafeZone } from "./SafeZone";
import { FitStage } from "./Stage";
import { Card } from "./Card";
import { Stickers } from "./Stickers";
import { Background } from "./Background";
import { useReveal, wipeX, wipeUp, LightSweep, EASING } from "./motion";
import { FONT } from "./fonts";
import { CodeScene } from "./CodeScene";
import { DiagramScene } from "./DiagramScene";
import { TokensScene } from "./TokensScene";
import { StatScene } from "./StatScene";
import { HookScene } from "./HookScene";
import { ChartScene } from "./ChartScene";
import { BrollScene } from "./BrollScene";
import { CompareScene } from "./CompareScene";
import { TerminalScene } from "./TerminalScene";
import { DiffScene } from "./DiffScene";
import { BeforeAfterScene } from "./BeforeAfterScene";
import { SocialHandles } from "./Social";
import { parseEmphasis } from "./emphasis";
import { RenderLook } from "./looks";

export type HeadingFill = "solid" | "gradient" | "outline";

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
    // Modern type options.
    fill?: HeadingFill; // solid (default) | gradient | outline
  };
};
type Theme = RenderLook;

// Per-word gradient/outline/solid span style. Gradient clips an animated
// accent->accent2 sheen to the text; outline draws hollow letters.
const fillStyle = (
  fill: HeadingFill,
  theme: Theme,
  isAccent: boolean,
  sheen: number,
): React.CSSProperties => {
  if (fill === "gradient") {
    return {
      backgroundImage: `linear-gradient(100deg, ${theme.accent}, ${theme.accent2}, ${theme.accent})`,
      backgroundSize: "220% 100%",
      backgroundPosition: `${sheen}% 0`,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      WebkitTextFillColor: "transparent",
      color: "transparent",
    };
  }
  if (fill === "outline") {
    return isAccent
      ? { color: theme.accent }
      : {
          color: "transparent",
          WebkitTextStroke: `2px ${theme.fg}`,
        };
  }
  // solid
  return {
    color: isAccent ? theme.accent : theme.fg,
    fontStyle: isAccent && theme.italicAccent ? "italic" : "normal",
  };
};

// Render a headline, painting the last word in the accent colour (italic for
// serif looks). Uppercases for heavy/poster looks.
const Headline: React.FC<{
  text: string;
  theme: Theme;
  size: number;
  clip?: string;
  align?: "left" | "center";
  kinetic?: boolean;
  fill?: HeadingFill;
  delay?: number;
}> = ({
  text,
  theme,
  size,
  clip,
  align = "left",
  kinetic = false,
  fill = "solid",
  delay = 3,
}) => {
  const frame = useCurrentFrame();
  const words = (text || "").split(/\s+/).filter(Boolean);
  // Animated sheen position for gradient fill (slow, looping).
  const sheen = interpolate(frame % 120, [0, 120], [0, 220]);

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
        // kinetic handles its own per-word reveal; only clip in static mode
        clipPath: kinetic ? undefined : clip,
      }}
    >
      {words.map((w, i) => {
        const last = i === words.length - 1 && words.length > 1;
        const fStyle = fillStyle(fill, theme, last, sheen);

        if (!kinetic) {
          return (
            <span key={i} style={fStyle}>
              {w}
              {i < words.length - 1 ? " " : ""}
            </span>
          );
        }

        // Kinetic: each word rises from behind a mask with a per-word spring
        // stagger; variable fonts also tween weight thin -> bold on entrance.
        const p = useReveal(delay + i * 4, 16, EASING.overshoot);
        const wght = theme.displayVariable
          ? Math.round(
              interpolate(
                p,
                [0, 1],
                [Math.max(200, theme.displayWeight - 400), theme.displayWeight],
              ),
            )
          : theme.displayWeight;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              overflow: "hidden",
              verticalAlign: "bottom",
              paddingBottom: "0.08em",
            }}
          >
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${(1 - p) * 112}%)`,
                fontWeight: wght,
                fontVariationSettings: theme.displayVariable
                  ? `"wght" ${wght}`
                  : undefined,
                ...fStyle,
              }}
            >
              {w}
            </span>
            {i < words.length - 1 ? "\u00A0" : ""}
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
            kinetic={scene.motion === "kinetic"}
            fill={scene.text?.fill}
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
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = useReveal(1, 10, EASING.snap);
  const hp = useReveal(3, 12, EASING.snap);
  const bullets = scene.text?.bullets ?? [];

  // Emphasis: pop + glow one (or more) items, and dim the rest — e.g. the
  // "the 5th one will shock you" beat. `at` is scene-local seconds; default is
  // right after the item reveals.
  const em = parseEmphasis((scene as any).emphasize);
  const revealEndF = (i: number) => 10 + i * 5 + 16; // frame an item has settled
  const dimStartF = em.items.size
    ? em.at != null
      ? em.at * fps
      : Math.min(...[...em.items].map((idx) => revealEndF(idx - 1)))
    : Infinity;

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

            const isEm = em.items.has(i + 1);
            const emF = em.at != null ? em.at * fps : revealEndF(i);
            // the ring/glow only appears at the trigger, so the item looks
            // ordinary until the "shock" reveal.
            const emActive = isEm && frame >= emF;
            // pop on trigger, settle slightly enlarged and held
            const pop = isEm
              ? interpolate(frame - emF, [0, 8, 18], [1, 1.09, 1.05], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: EASING.overshoot,
                })
              : 1;
            // dim non-emphasized items once the emphasis fires
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
                  opacity: p * dim,
                  transform: `translateY(${(1 - p) * 26}px) scale(${pop.toFixed(3)})`,
                  transformOrigin: "left center",
                }}
              >
                <Card
                  light={theme.light}
                  surface={theme.card}
                  accent={theme.accent}
                  style={{
                    padding: "20px 26px",
                    ...(emActive
                      ? {
                          boxShadow: `0 0 0 3px ${theme.accent}, 0 20px 60px -12px ${theme.accent}`,
                        }
                      : {}),
                  }}
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
                        boxShadow: emActive
                          ? `0 0 26px -2px ${theme.accent}`
                          : `0 8px 22px -8px ${theme.accent}99`,
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

// Classic macOS-style arrow pointer (white fill, dark hairline, soft shadow).
const CursorArrow: React.FC<{ size?: number }> = ({ size = 58 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M4 2.5 L4 19.5 L8.4 15.2 L11.7 22 L14.3 20.8 L11 14.2 L17 14.2 Z"
      fill="#ffffff"
      stroke="rgba(0,0,0,0.70)"
      strokeWidth={1.1}
      strokeLinejoin="round"
    />
  </svg>
);

const CheckIcon: React.FC<{ color: string; size?: number }> = ({
  color,
  size = 42,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M20 6L9 17l-5-5"
      stroke={color}
      strokeWidth={3.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// The hero interaction: a cursor glides in, presses the button, the button
// dips + bounces, and the label flips Follow -> Following ✓ with a tap ripple
// and a confetti burst. All frame-timed; holds the confirmed state afterwards.
const ClickFollow: React.FC<{
  theme: Theme;
  label?: string;
  labelDone?: string;
}> = ({ theme, label = "Follow", labelDone = "Following" }) => {
  const frame = useCurrentFrame();
  const CLICK = 46;
  const onColor = theme.light ? "#ffffff" : theme.bg;
  const clampOpts = {
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
  };

  // entrance + press
  const pill = useReveal(12, 14, EASING.overshoot);
  const press = interpolate(
    frame,
    [CLICK - 2, CLICK, CLICK + 4, CLICK + 10],
    [1, 0.92, 1.06, 1],
    { ...clampOpts, easing: EASING.overshoot },
  );
  const scale = (0.85 + pill * 0.15) * press;

  // label flip
  const done = frame >= CLICK + 2;
  const followOp = interpolate(frame, [CLICK, CLICK + 3], [1, 0], clampOpts);
  const doneOp = interpolate(frame, [CLICK + 2, CLICK + 6], [0, 1], clampOpts);
  const donePop = interpolate(frame, [CLICK + 2, CLICK + 11], [0.5, 1], {
    ...clampOpts,
    easing: EASING.overshoot,
  });

  // confirm glow pulse (alpha on the accent drop shadow)
  const glow = interpolate(
    frame,
    [CLICK, CLICK + 6, CLICK + 26],
    [0.3, 1, 0.5],
    clampOpts,
  );
  const glowHex = Math.round(Math.max(0, Math.min(1, glow)) * 0x80)
    .toString(16)
    .padStart(2, "0");

  // cursor: appear -> travel in -> press dip -> lift away
  const appear = interpolate(frame, [22, 28], [0, 1], clampOpts);
  const travel = interpolate(frame, [26, CLICK - 2], [0, 1], {
    ...clampOpts,
    easing: EASING.longTail,
  });
  const cx = interpolate(travel, [0, 1], [205, 16]);
  const cy = interpolate(travel, [0, 1], [168, 22]);
  const cyPress = interpolate(
    frame,
    [CLICK - 2, CLICK, CLICK + 6],
    [0, 12, 0],
    clampOpts,
  );
  const exit = interpolate(frame, [CLICK + 16, CLICK + 30], [0, 1], {
    ...clampOpts,
    easing: EASING.out,
  });
  const cursorOp = appear * (1 - exit);

  // tap ripple
  const rip = interpolate(frame, [CLICK, CLICK + 22], [0.3, 2.1], {
    ...clampOpts,
    easing: EASING.out,
  });
  const ripOp = interpolate(frame, [CLICK, CLICK + 22], [0.55, 0], clampOpts);

  // confetti burst
  const N = 12;
  const burst = interpolate(frame, [CLICK + 1, CLICK + 20], [0, 1], {
    ...clampOpts,
    easing: EASING.out,
  });
  const burstOp = interpolate(
    frame,
    [CLICK + 1, CLICK + 20],
    [1, 0],
    clampOpts,
  );
  const burstColors = [theme.accent, theme.accent2, theme.fg];

  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        marginTop: 46,
      }}
    >
      {/* tap ripple ring */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 150,
          height: 150,
          marginLeft: -75,
          marginTop: -75,
          borderRadius: 999,
          border: `3px solid ${theme.accent}`,
          transform: `scale(${rip})`,
          opacity: ripOp,
          pointerEvents: "none",
        }}
      />

      {/* confetti burst */}
      {Array.from({ length: N }).map((_, i) => {
        const a = (i / N) * Math.PI * 2;
        const d = burst * 150;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 13,
              height: 13,
              marginLeft: -6.5,
              marginTop: -6.5,
              borderRadius: i % 2 ? 999 : 3,
              background: burstColors[i % burstColors.length],
              transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px) scale(${Math.max(0, 1 - burst)})`,
              opacity: burstOp,
              pointerEvents: "none",
            }}
          />
        );
      })}

      {/* the button */}
      <div
        style={{
          position: "relative",
          height: 96,
          minWidth: 300,
          padding: "0 54px",
          borderRadius: 999,
          background: `linear-gradient(145deg, ${theme.accent}, ${theme.accent}CC)`,
          fontFamily: theme.displayFamily,
          fontSize: 50,
          fontWeight: 800,
          letterSpacing: "-0.01em",
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 20px 60px ${theme.accent}${glowHex}`,
          opacity: pill,
          transform: `scale(${scale})`,
          boxSizing: "border-box",
        }}
      >
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            color: onColor,
            opacity: followOp,
          }}
        >
          {label}
          <span style={{ fontSize: 38 }}>▸</span>
        </span>
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            color: onColor,
            opacity: doneOp,
            transform: `scale(${donePop})`,
          }}
        >
          {labelDone}
          <CheckIcon color={onColor} />
        </span>
      </div>

      {/* cursor */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(${cx + exit * 150}px, ${cy + cyPress + exit * 150}px)`,
          opacity: cursorOp,
          pointerEvents: "none",
          filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.45))",
        }}
      >
        <CursorArrow />
      </div>
    </div>
  );
};

const Cta: React.FC<{ scene: Scene; theme: Theme; brand?: any }> = ({
  scene,
  theme,
  brand,
}) => {
  const p = useReveal(2, 16, EASING.longTail);
  const s = useReveal(22, 12, EASING.snap);
  const soc = useReveal(56, 16, EASING.overshoot);
  const socials = brand?.socials ?? {};
  const labels = scene.text as any;
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

          <ClickFollow
            theme={theme}
            label={labels?.cta ?? "Follow"}
            labelDone={labels?.ctaDone ?? "Following"}
          />

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
  tokens: TokensScene,
  stat: StatScene,
  hook: HookScene,
  chart: ChartScene,
  broll: BrollScene,
  compare: CompareScene,
  interstitial: Interstitial,
  terminal: TerminalScene,
  diff: DiffScene,
  beforeafter: BeforeAfterScene,
};
