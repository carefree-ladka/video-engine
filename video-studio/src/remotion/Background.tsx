import React from "react";
import { AbsoluteFill } from "remotion";

// Fine film grain — stops flat fills looking sterile. Used on both dark and paper.
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/></svg>\")";

type BgTheme = {
  bg: string;
  accent: string;
  accent2?: string;
  light?: boolean;
};

export const Background: React.FC<{ theme: BgTheme; variant?: string }> = ({
  theme,
  variant = "grid-glow",
}) => {
  const accent = theme.accent;
  const accent2 = theme.accent2 ?? accent;

  // ---- light / editorial treatments ----
  if (
    variant === "paper" ||
    variant === "plane" ||
    variant === "grid" ||
    variant === "glow"
  ) {
    return (
      <AbsoluteFill style={{ backgroundColor: theme.bg }}>
        {variant === "plane" ? (
          // flat colour plane with the faintest top sheen for depth
          <AbsoluteFill
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.06), transparent 40%)",
            }}
          />
        ) : (
          <AbsoluteFill
            style={{
              background: `linear-gradient(160deg, ${shade(theme.bg, 4)} 0%, ${theme.bg} 55%, ${shade(theme.bg, -3)} 100%)`,
            }}
          />
        )}

        {variant === "grid" ? (
          <AbsoluteFill
            style={{
              backgroundImage: `linear-gradient(${accent2}22 1px, transparent 1px), linear-gradient(90deg, ${accent2}22 1px, transparent 1px)`,
              backgroundSize: "54px 54px",
            }}
          />
        ) : null}

        {variant === "glow" ? (
          <AbsoluteFill
            style={{
              background: `radial-gradient(42% 32% at 36% 42%, ${accent}66, transparent 70%)`,
            }}
          />
        ) : null}

        {/* paper grain */}
        <AbsoluteFill
          style={{
            backgroundImage: GRAIN,
            backgroundSize: "240px 240px",
            opacity: 0.06,
            mixBlendMode: "multiply",
            pointerEvents: "none",
          }}
        />
        {/* soft edge darken */}
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(130% 120% at 50% 40%, transparent 60%, rgba(0,0,0,0.08))",
          }}
        />
      </AbsoluteFill>
    );
  }

  // ---- dark treatments (ink / grid-glow / mesh) ----
  const warm = `${accent}22`;
  const warmSoft = `${accent}14`;
  const cool = `${accent2}1A`;
  const gridMask =
    "radial-gradient(135% 100% at 50% 24%, black 52%, transparent 94%)";

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      <AbsoluteFill
        style={{
          background: `linear-gradient(158deg, ${shade(theme.bg, 10)} 0%, ${theme.bg} 46%, ${shade(theme.bg, -8)} 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(120% 70% at 50% -18%, rgba(255,255,255,0.055), transparent 60%)",
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(52% 40% at 84% 8%, ${warm}, transparent 64%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(50% 42% at 10% 96%, ${cool}, transparent 66%)`,
        }}
      />
      {variant === "mesh" ? (
        <AbsoluteFill
          style={{
            background: `radial-gradient(46% 38% at 16% 84%, ${warmSoft}, transparent 62%)`,
          }}
        />
      ) : null}
      {variant !== "mesh" ? (
        <AbsoluteFill
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage: gridMask,
            WebkitMaskImage: gridMask,
          }}
        />
      ) : null}
      <AbsoluteFill
        style={{
          backgroundImage: GRAIN,
          backgroundSize: "260px 260px",
          opacity: 0.05,
          mixBlendMode: "overlay",
          pointerEvents: "none",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(135% 120% at 50% 40%, transparent 50%, rgba(0,0,0,0.6))",
        }}
      />
    </AbsoluteFill>
  );
};

function clamp(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}
function shade(hex: string, amt: number) {
  const m = hex.replace("#", "");
  const full =
    m.length === 3
      ? m
          .split("")
          .map((c) => c + c)
          .join("")
      : m;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const to = (v: number) =>
    clamp(v + (amt / 100) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}
