import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { FitStage } from "./Stage";
import { Background } from "./Background";
import { useReveal, wipeUp, EASING } from "./motion";
import { FONT } from "./fonts";
import { RenderLook } from "./looks";

type Scene = {
  text?: {
    kicker?: string;
    heading?: string;
    // The headline stat, e.g. "50ms", "3×", "99%", "$1.2M", "10x".
    value?: string;
    // Supporting line under the number.
    sub?: string;
    label?: string;
    // Optional gradient fill on the number.
    fill?: "solid" | "gradient";
  };
  durationSec?: number;
};
type Theme = RenderLook;

// Split "50ms" -> {prefix:"", num:50, suffix:"ms", decimals:0}
function parseValue(v: string) {
  const m = String(v ?? "").match(/^(\D*?)(\d+(?:\.\d+)?)(.*)$/);
  if (!m)
    return {
      prefix: "",
      num: null as number | null,
      suffix: v ?? "",
      decimals: 0,
    };
  const decimals = m[2].includes(".") ? m[2].split(".")[1].length : 0;
  return { prefix: m[1], num: parseFloat(m[2]), suffix: m[3], decimals };
}

export const StatScene: React.FC<{ scene: Scene; theme: Theme }> = ({
  scene,
  theme,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const raw = scene.text?.value ?? "";
  const { prefix, num, suffix, decimals } = parseValue(raw);

  const durFrames = Math.max(1, Math.round((scene.durationSec || 4) * fps));
  const countEnd = Math.min(durFrames - 2, Math.round(durFrames * 0.55));
  const enter = useReveal(2, 16, EASING.longTail);
  const kick = useReveal(0, 10, EASING.snap);
  const subP = useReveal(countEnd / 2 + 6, 14, EASING.snap);

  let display = raw;
  if (num != null) {
    const cur = interpolate(frame, [6, countEnd], [0, num], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASING.longTail,
    });
    const body =
      decimals > 0 ? cur.toFixed(decimals) : Math.round(cur).toLocaleString();
    display = `${prefix}${body}${suffix}`;
  }

  // Width-fit the number: FitStage only scales for height, so a wide value
  // (e.g. "1,200" in a chunky face) would overflow. Size it from the final,
  // longest string so it never jumps or clips during the count-up.
  const finalDisplay =
    num != null
      ? `${prefix}${decimals > 0 ? num.toFixed(decimals) : Math.round(num).toLocaleString()}${suffix}`
      : raw;
  const glyph =
    theme.displayRole === "unbounded"
      ? 0.86
      : theme.displayRole === "heavy"
        ? 0.54
        : theme.displayRole === "serif" || theme.displayRole === "instrument"
          ? 0.52
          : 0.64;
  const innerWidth = width * 0.86;
  const numberSizeMax = 360;
  const numberSize = Math.max(
    120,
    Math.min(
      numberSizeMax,
      Math.floor(innerWidth / Math.max(1, finalDisplay.length * glyph)),
    ),
  );

  const gradient = scene.text?.fill === "gradient";
  const numStyle =
    gradient && !theme.light
      ? {
          backgroundImage: `linear-gradient(120deg, ${theme.accent}, ${theme.accent2})`,
          WebkitBackgroundClip: "text" as const,
          backgroundClip: "text" as const,
          WebkitTextFillColor: "transparent",
          color: "transparent",
        }
      : { color: theme.accent };

  const estHeight =
    (scene.text?.kicker ? 50 : 0) +
    (scene.text?.heading ? 70 : 0) +
    numberSize +
    (scene.text?.sub || scene.text?.label ? 80 : 0);

  return (
    <AbsoluteFill style={{ color: theme.fg, fontFamily: FONT }}>
      <Background theme={theme} variant={theme.bgVariant} />
      <FitStage estHeight={estHeight} align="center">
        {scene.text?.kicker ? (
          <div
            style={{
              fontFamily: FONT,
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: theme.accent,
              textAlign: "center",
              marginBottom: 18,
              opacity: kick,
              transform: `translateY(${(1 - kick) * 10}px)`,
            }}
          >
            {scene.text.kicker}
          </div>
        ) : null}

        {scene.text?.heading ? (
          <div
            style={{
              fontFamily: theme.displayFamily,
              fontSize: 56,
              fontWeight: theme.displayWeight,
              letterSpacing: theme.displayTracking,
              textAlign: "center",
              marginBottom: 10,
              clipPath: wipeUp(kick),
            }}
          >
            {scene.text.heading}
          </div>
        ) : null}

        <div
          style={{
            fontFamily: theme.displayFamily,
            fontSize: numberSize,
            fontWeight: Math.max(theme.displayWeight, 800),
            letterSpacing: "-0.04em",
            lineHeight: 0.9,
            textAlign: "center",
            fontVariantNumeric: "tabular-nums",
            opacity: enter,
            transform: `scale(${0.92 + enter * 0.08})`,
            ...numStyle,
          }}
        >
          {display}
        </div>

        {scene.text?.sub || scene.text?.label ? (
          <div
            style={{
              fontFamily: FONT,
              fontSize: 44,
              fontWeight: 500,
              color: theme.muted,
              textAlign: "center",
              marginTop: 18,
              opacity: subP,
              transform: `translateY(${(1 - subP) * 14}px)`,
            }}
          >
            {scene.text.sub ?? scene.text.label}
          </div>
        ) : null}
      </FitStage>
    </AbsoluteFill>
  );
};
