import React from "react";

// A production-grade surface. On dark looks it's a lit glass panel; on light
// (paper/editorial) looks it's a clean white card with a hairline border and a
// crisp offset shadow — the magazine-card feel.
export const Card: React.FC<{
  children: React.ReactNode;
  accent?: string;
  highlighted?: boolean;
  light?: boolean;
  surface?: string;
  style?: React.CSSProperties;
  radius?: number;
}> = ({
  children,
  accent = "#F5A524",
  highlighted = false,
  light = false,
  surface,
  style,
  radius = 22,
}) => {
  const base: React.CSSProperties = light
    ? {
        position: "relative",
        borderRadius: radius,
        background: highlighted ? `${accent}14` : (surface ?? "#FFFFFF"),
        border: highlighted
          ? `2px solid ${accent}`
          : "1.5px solid rgba(20,16,12,0.14)",
        boxShadow: highlighted
          ? `6px 6px 0 ${accent}33, 0 10px 30px -16px rgba(0,0,0,0.35)`
          : "5px 5px 0 rgba(20,16,12,0.08), 0 8px 24px -16px rgba(0,0,0,0.25)",
      }
    : {
        position: "relative",
        borderRadius: radius,
        background: highlighted
          ? `linear-gradient(165deg, ${accent}1F, ${accent}0A 42%, rgba(18,16,24,0.9))`
          : "linear-gradient(165deg, #1C1A24 0%, #15131C 55%, #100E16 100%)",
        border: highlighted
          ? `1px solid ${accent}99`
          : "1px solid rgba(255,255,255,0.08)",
        boxShadow: highlighted
          ? [
              "inset 0 1px 0 rgba(255,255,255,0.12)",
              `0 0 0 1px ${accent}22`,
              `0 24px 70px -24px ${accent}55`,
              "0 10px 30px -14px rgba(0,0,0,0.7)",
            ].join(", ")
          : [
              "inset 0 1px 0 rgba(255,255,255,0.07)",
              "0 24px 60px -26px rgba(0,0,0,0.85)",
              "0 8px 24px -14px rgba(0,0,0,0.6)",
            ].join(", "),
        backdropFilter: "blur(2px)",
      };
  return (
    <div style={{ ...base, ...style }}>
      {!light ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.05), transparent 30%)",
            pointerEvents: "none",
          }}
        />
      ) : null}
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
};
