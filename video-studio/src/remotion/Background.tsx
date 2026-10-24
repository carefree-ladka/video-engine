import React from "react";
import { AbsoluteFill } from "remotion";

// Fine film grain as an inline SVG data URI — the single biggest thing that
// stops a dark background from looking flat and "AI-generated".
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/></svg>\")";

// Layered, designed background: deep gradient base + warm accent glow + a cool
// counter-glow for richness + masked hairline grid + grain + vignette.
// variants: "grid-glow" (default), "mesh" (two blobs, no grid), "plain".
export const Background: React.FC<{
  theme: { bg: string; accent: string };
  variant?: string;
}> = ({ theme, variant = "grid-glow" }) => {
  const warm = `${theme.accent}22`;
  const warmSoft = `${theme.accent}14`;
  const cool = "rgba(109,94,246,0.10)"; // faint indigo, adds depth without the "AI gradient" cliche
  const gridMask =
    "radial-gradient(135% 100% at 50% 24%, black 52%, transparent 94%)";

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      {/* deep diagonal gradient base */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(158deg, ${lighten(theme.bg, 10)} 0%, ${theme.bg} 46%, ${darken(theme.bg, 8)} 100%)`,
        }}
      />
      {/* top sheen */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(120% 70% at 50% -18%, rgba(255,255,255,0.055), transparent 60%)",
        }}
      />
      {/* warm accent glow (top-right) */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(52% 40% at 84% 8%, ${warm}, transparent 64%)`,
        }}
      />
      {/* cool counter-glow (bottom-left) for a rich two-tone depth */}
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
      {/* masked hairline grid */}
      {variant !== "plain" && variant !== "mesh" ? (
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
      {/* grain */}
      <AbsoluteFill
        style={{
          backgroundImage: GRAIN,
          backgroundSize: "260px 260px",
          opacity: 0.05,
          mixBlendMode: "overlay",
          pointerEvents: "none",
        }}
      />
      {/* vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(135% 120% at 50% 40%, transparent 50%, rgba(0,0,0,0.6))",
        }}
      />
    </AbsoluteFill>
  );
};

// --- tiny hex shade helpers (keep background self-contained) ---
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
const lighten = (hex: string, amt: number) => shade(hex, amt);
const darken = (hex: string, amt: number) => shade(hex, -amt);
