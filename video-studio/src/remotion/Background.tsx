import React from "react";
import { AbsoluteFill } from "remotion";

// Layered, designed background: base + top sheen + accent glow + masked hairline grid + vignette.
// variants: "grid-glow" (default), "mesh" (two accent blobs, no grid), "plain" (base + vignette only).
export const Background: React.FC<{
  theme: { bg: string; accent: string };
  variant?: string;
}> = ({ theme, variant = "grid-glow" }) => {
  const glowA = `${theme.accent}24`;
  const glowB = `${theme.accent}16`;
  const gridMask = "radial-gradient(130% 100% at 50% 28%, black 55%, transparent 96%)";

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      {/* soft top sheen for depth */}
      <AbsoluteFill
        style={{ background: "radial-gradient(120% 70% at 50% -15%, rgba(255,255,255,0.06), transparent 60%)" }}
      />
      {/* primary accent glow */}
      <AbsoluteFill style={{ background: `radial-gradient(55% 42% at 82% 10%, ${glowA}, transparent 62%)` }} />
      {/* second blob for mesh */}
      {variant === "mesh" ? (
        <AbsoluteFill style={{ background: `radial-gradient(48% 40% at 12% 88%, ${glowB}, transparent 62%)` }} />
      ) : null}
      {/* masked hairline grid (dark-keynote) */}
      {variant !== "plain" && variant !== "mesh" ? (
        <AbsoluteFill
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "74px 74px",
            maskImage: gridMask,
            WebkitMaskImage: gridMask,
          }}
        />
      ) : null}
      {/* vignette to focus the center */}
      <AbsoluteFill style={{ background: "radial-gradient(130% 120% at 50% 42%, transparent 52%, rgba(0,0,0,0.55))" }} />
    </AbsoluteFill>
  );
};
