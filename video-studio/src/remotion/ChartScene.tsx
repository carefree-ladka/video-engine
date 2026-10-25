import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { FitStage } from "./Stage";
import { Background } from "./Background";
import { useReveal, wipeUp, EASING } from "./motion";
import { FONT, DISPLAY } from "./fonts";
import { RenderLook } from "./looks";

type Datum = { label: string; value: number; color?: string };
type Scene = {
  text?: {
    kicker?: string;
    heading?: string;
    chart?: {
      type?: "bar" | "line"; // default "bar"
      data: Datum[];
      unit?: string; // suffix on each value, e.g. "ms", "%", "x"
      max?: number; // axis max; defaults to the largest value
    };
  };
  durationSec?: number;
};
type Theme = RenderLook;

const CHART_PALETTE = [
  "#61DAFB",
  "#FFD23F",
  "#7CF5C4",
  "#FF8CC6",
  "#8B7CFF",
  "#FF8A5C",
];

// Animated horizontal bar chart. Bars grow from zero and their values count up
// together on entrance. Horizontal bars read well in both portrait and
// landscape and leave room for long labels.
export const ChartScene: React.FC<{ scene: Scene; theme: Theme }> = ({
  scene,
  theme,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const chart = scene.text?.chart ?? { data: [] as Datum[] };
  const data = chart.data ?? [];
  const unit = chart.unit ?? "";
  const max = chart.max ?? Math.max(1, ...data.map((d) => d.value));
  const hp = useReveal(2, 12, EASING.snap);

  const isLine = chart.type === "line";
  const vertical = height > width;
  const draw = useReveal(8, 30, EASING.longTail);

  const rowH = 132;
  const lineH = vertical ? 520 : 420;
  const estHeight =
    (scene.text?.kicker ? 50 : 0) +
    (scene.text?.heading ? 74 * 1.1 + 40 : 0) +
    (isLine ? lineH + 80 : data.length * rowH);

  // --- line chart geometry (stretched viewBox, non-scaling stroke) ----------
  const VBW = 1000;
  const VBH = 520;
  const pad = 46;
  const n = Math.max(1, data.length);
  const lineColor = data[0]?.color ?? theme.accent;
  const xs = data.map((_, i) =>
    n > 1 ? pad + (i / (n - 1)) * (VBW - 2 * pad) : VBW / 2,
  );
  const ys = data.map(
    (d) =>
      VBH - pad - Math.max(0, Math.min(1, d.value / max)) * (VBH - 2 * pad),
  );
  const dAttr = xs
    .map((x, i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${ys[i].toFixed(1)}`)
    .join(" ");
  const areaD =
    n > 1
      ? `${dAttr} L ${xs[n - 1].toFixed(1)} ${VBH - pad} L ${xs[0].toFixed(1)} ${VBH - pad} Z`
      : "";

  const lineEl = (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: lineH,
      }}
    >
      <svg
        viewBox={`0 0 ${VBW} ${VBH}`}
        width="100%"
        height={lineH}
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <linearGradient id="chartArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={lineColor} stopOpacity={0.32} />
            <stop offset="1" stopColor={lineColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        {areaD ? (
          <path d={areaD} fill="url(#chartArea)" opacity={draw} />
        ) : null}
        <path
          d={dAttr}
          fill="none"
          stroke={lineColor}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - draw}
        />
      </svg>
      {/* dots + value labels as HTML overlays so they stay circular */}
      {data.map((d, i) => {
        const thr = n > 1 ? i / (n - 1) : 0;
        const pp = interpolate(draw, [thr - 0.04, thr + 0.04], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div key={i}>
            <div
              style={{
                position: "absolute",
                left: `${(xs[i] / VBW) * 100}%`,
                top: `${(ys[i] / VBH) * 100}%`,
                width: 18,
                height: 18,
                borderRadius: 999,
                background: lineColor,
                boxShadow: theme.light ? "none" : `0 0 16px ${lineColor}`,
                transform: `translate(-50%, -50%) scale(${pp})`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: `${(xs[i] / VBW) * 100}%`,
                top: `${(ys[i] / VBH) * 100}%`,
                transform: "translate(-50%, -150%)",
                fontFamily: DISPLAY,
                fontSize: 30,
                fontWeight: 800,
                color: theme.fg,
                opacity: pp,
                whiteSpace: "nowrap",
              }}
            >
              {d.value}
              {unit}
            </div>
            <div
              style={{
                position: "absolute",
                left: `${(xs[i] / VBW) * 100}%`,
                top: "100%",
                transform: "translate(-50%, 8px)",
                fontFamily: FONT,
                fontSize: 26,
                fontWeight: 500,
                color: theme.muted,
                opacity: draw,
                whiteSpace: "nowrap",
              }}
            >
              {d.label}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <AbsoluteFill style={{ color: theme.fg, fontFamily: FONT }}>
      <Background theme={theme} variant={theme.bgVariant} />
      <FitStage estHeight={estHeight}>
        {scene.text?.kicker ? (
          <div
            style={{
              fontFamily: FONT,
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: theme.accent,
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
              fontSize: 72,
              fontWeight: theme.displayWeight,
              letterSpacing: theme.displayTracking,
              marginBottom: 40,
              clipPath: wipeUp(hp),
            }}
          >
            {scene.text.heading}
          </h2>
        ) : null}

        {isLine ? (
          lineEl
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {data.map((d, i) => {
              const grow = useReveal(10 + i * 6, 20, EASING.overshoot);
              const frac = (d.value / max) * grow;
              const shown = Math.round(d.value * grow);
              const color = d.color ?? CHART_PALETTE[i % CHART_PALETTE.length];
              return (
                <div key={i}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      marginBottom: 12,
                    }}
                  >
                    <span
                      style={{ fontSize: 34, fontWeight: 600, color: theme.fg }}
                    >
                      {d.label}
                    </span>
                    <span
                      style={{
                        fontFamily: DISPLAY,
                        fontSize: 40,
                        fontWeight: 800,
                        color,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {shown}
                      {unit}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 26,
                      borderRadius: 999,
                      background: theme.light
                        ? "rgba(20,16,12,0.08)"
                        : "rgba(255,255,255,0.08)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.max(0, Math.min(1, frac)) * 100}%`,
                        borderRadius: 999,
                        background: `linear-gradient(90deg, ${color}, ${color}B0)`,
                        boxShadow: theme.light
                          ? "none"
                          : `0 0 24px -6px ${color}`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </FitStage>
    </AbsoluteFill>
  );
};
