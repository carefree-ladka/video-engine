import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { FitStage } from "./Stage";
import { Background } from "./Background";
import { useReveal, EASING } from "./motion";
import { FONT } from "./fonts";
import { RenderLook } from "./looks";

type Scene = {
  text?: {
    kicker?: string;
    heading?: string;
    sub?: string;
    fill?: "solid" | "gradient" | "outline";
  };
  durationSec?: number;
};
type Theme = RenderLook;

// A punchy, full-bleed opener built for the first ~1.5s of a short: the hook.
// Entrance is FAST (readable by ~frame 6) so the very first frames already
// carry the message — that is what stops the scroll and lifts retention.
export const HookScene: React.FC<{ scene: Scene; theme: Theme }> = ({
  scene,
  theme,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  const heading = scene.text?.heading ?? "";
  const words = heading.split(/\s+/).filter(Boolean);
  const fill = scene.text?.fill ?? "solid";

  // fast pop-in
  const pop = useReveal(0, 7, EASING.overshoot);
  const kick = useReveal(0, 5, EASING.snap);
  const subP = useReveal(6, 8, EASING.snap);
  const sheen = interpolate(frame % 120, [0, 120], [0, 220]);

  // width-fit the oversized heading
  const glyph =
    theme.displayRole === "unbounded"
      ? 0.82
      : theme.displayRole === "heavy"
        ? 0.54
        : theme.displayRole === "serif" || theme.displayRole === "instrument"
          ? 0.52
          : 0.6;
  const longest = words.reduce((m, w) => Math.max(m, w.length), 1);
  const innerWidth = width * 0.86;
  const size = Math.max(
    72,
    Math.min(170, Math.floor(innerWidth / Math.max(1, longest * glyph))),
  );

  const wordFill = (isAccent: boolean): React.CSSProperties => {
    if (fill === "gradient")
      return {
        backgroundImage: `linear-gradient(100deg, ${theme.accent}, ${theme.accent2}, ${theme.accent})`,
        backgroundSize: "220% 100%",
        backgroundPosition: `${sheen}% 0`,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
        color: "transparent",
      };
    if (fill === "outline")
      return isAccent
        ? { color: theme.accent }
        : { color: "transparent", WebkitTextStroke: `2px ${theme.fg}` };
    return { color: isAccent ? theme.accent : theme.fg };
  };

  const estHeight =
    (scene.text?.kicker ? 70 : 0) +
    words.length * (size * 1.02) +
    (scene.text?.sub ? 90 : 0);

  return (
    <AbsoluteFill style={{ color: theme.fg, fontFamily: FONT }}>
      <Background theme={theme} variant={theme.bgVariant} />
      <FitStage estHeight={estHeight} align="center">
        {scene.text?.kicker ? (
          <div
            style={{
              alignSelf: "center",
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 22px",
              borderRadius: 999,
              background: theme.accent,
              color: theme.light ? "#fff" : theme.bg,
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 30,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 26,
              opacity: kick,
              transform: `scale(${0.8 + kick * 0.2})`,
              boxShadow: theme.light ? "none" : `0 0 32px ${theme.accent}66`,
            }}
          >
            {scene.text.kicker}
          </div>
        ) : null}

        <h1
          style={{
            margin: 0,
            textAlign: "center",
            fontFamily: theme.displayFamily,
            fontSize: size,
            fontWeight: Math.max(theme.displayWeight, 800),
            letterSpacing: theme.displayTracking,
            lineHeight: 1.0,
            textTransform: theme.displayUpper ? "uppercase" : "none",
            opacity: pop,
            transform: `scale(${0.82 + pop * 0.18})`,
          }}
        >
          {words.map((w, i) => {
            const isAccent =
              words.length > 1 &&
              (i === words.length - 1 || i === words.length - 2 ? i === words.length - 1 : false);
            return (
              <span key={i} style={wordFill(isAccent)}>
                {w}
                {i < words.length - 1 ? " " : ""}
              </span>
            );
          })}
        </h1>

        {scene.text?.sub ? (
          <div
            style={{
              textAlign: "center",
              fontFamily: FONT,
              fontSize: 42,
              fontWeight: 500,
              color: theme.muted,
              marginTop: 24,
              opacity: subP,
              transform: `translateY(${(1 - subP) * 14}px)`,
            }}
          >
            {scene.text.sub}
          </div>
        ) : null}
      </FitStage>
    </AbsoluteFill>
  );
};
