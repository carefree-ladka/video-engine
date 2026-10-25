import { AbsoluteFill, useVideoConfig } from "remotion";
import { FitStage } from "./Stage";
import { Card } from "./Card";
import { Background } from "./Background";
import { useReveal, wipeUp, EASING } from "./motion";
import { FONT, DISPLAY } from "./fonts";
import { RenderLook } from "./looks";

type Side = {
  label: string;
  tone?: "good" | "bad" | "neutral";
  items?: string[];
  value?: string;
};
type Scene = {
  text?: {
    kicker?: string;
    heading?: string;
    compare?: { left: Side; right: Side; divider?: string };
  };
  durationSec?: number;
};
type Theme = RenderLook;

const TONES = { good: "#39D98A", bad: "#FF5C5C" };

// Side-by-side (landscape) or stacked (portrait) comparison — "before vs after",
// "this vs that". Panels slide in from opposite edges; a divider badge pops in
// between. Items are marked by tone (good ✓ / bad ✗ / neutral •).
export const CompareScene: React.FC<{ scene: Scene; theme: Theme }> = ({
  scene,
  theme,
}) => {
  const { width, height } = useVideoConfig();
  const vertical = height > width;
  const cmp = scene.text?.compare ?? ({} as any);
  const left: Side = cmp.left ?? { label: "A" };
  const right: Side = cmp.right ?? { label: "B" };
  const divider = cmp.divider ?? "VS";
  const hp = useReveal(2, 12, EASING.snap);
  const lp = useReveal(8, 16, EASING.overshoot);
  const rp = useReveal(12, 16, EASING.overshoot);
  const dp = useReveal(16, 14, EASING.overshoot);

  const panelEst = 120 + Math.max(left.items?.length ?? 0, right.items?.length ?? 0) * 78;
  const estHeight =
    (scene.text?.kicker ? 50 : 0) +
    (scene.text?.heading ? 74 * 1.1 + 36 : 0) +
    (vertical ? panelEst * 2 + 90 : panelEst);

  const toneColor = (s: Side) =>
    s.tone === "good" ? TONES.good : s.tone === "bad" ? TONES.bad : theme.accent;
  const toneMark = (s: Side) =>
    s.tone === "good" ? "\u2713" : s.tone === "bad" ? "\u2717" : "\u2022";

  const Panel: React.FC<{ s: Side; p: number; from: number }> = ({ s, p, from }) => {
    const c = toneColor(s);
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          opacity: p,
          transform: `translateX(${(1 - p) * from}px)`,
        }}
      >
        <Card
          light={theme.light}
          surface={theme.card}
          accent={c}
          radius={20}
          style={{ flex: 1, padding: "28px 30px", borderTop: `5px solid ${c}` }}
        >
          <div
            style={{
              fontFamily: DISPLAY,
              fontSize: vertical ? 40 : 36,
              fontWeight: 800,
              color: c,
              marginBottom: s.items?.length || s.value ? 18 : 0,
            }}
          >
            {s.label}
          </div>
          {s.value ? (
            <div
              style={{
                fontFamily: DISPLAY,
                fontSize: vertical ? 84 : 72,
                fontWeight: 800,
                color: theme.fg,
                letterSpacing: "-0.02em",
              }}
            >
              {s.value}
            </div>
          ) : null}
          {(s.items ?? []).map((it, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 14,
                fontFamily: FONT,
                fontSize: vertical ? 32 : 28,
                fontWeight: 500,
                color: theme.fg,
                margin: "10px 0",
              }}
            >
              <span style={{ color: c, fontWeight: 800 }}>{toneMark(s)}</span>
              <span>{it}</span>
            </div>
          ))}
        </Card>
      </div>
    );
  };

  const Divider = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "0 0 auto",
        opacity: dp,
        transform: `scale(${0.6 + dp * 0.4})`,
      }}
    >
      <div
        style={{
          width: 92,
          height: 92,
          borderRadius: 999,
          background: theme.accent,
          color: theme.light ? "#fff" : theme.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: DISPLAY,
          fontSize: 34,
          fontWeight: 800,
          boxShadow: theme.light ? "none" : `0 0 36px ${theme.accent}66`,
        }}
      >
        {divider}
      </div>
    </div>
  );

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
              marginBottom: 16,
              opacity: hp,
            }}
          >
            {scene.text.kicker}
          </div>
        ) : null}
        {scene.text?.heading ? (
          <h2
            style={{
              fontFamily: DISPLAY,
              fontSize: 66,
              fontWeight: theme.displayWeight,
              letterSpacing: theme.displayTracking,
              textAlign: "center",
              marginBottom: 34,
              clipPath: wipeUp(hp),
            }}
          >
            {scene.text.heading}
          </h2>
        ) : null}
        <div
          style={{
            display: "flex",
            flexDirection: vertical ? "column" : "row",
            gap: vertical ? 22 : 28,
            alignItems: "stretch",
          }}
        >
          <Panel s={left} p={lp} from={vertical ? -60 : -80} />
          {Divider}
          <Panel s={right} p={rp} from={vertical ? 60 : 80} />
        </div>
      </FitStage>
    </AbsoluteFill>
  );
};
