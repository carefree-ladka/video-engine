import React from "react";

// A production-grade surface: gradient fill, layered shadows (ambient + key +
// contact), a 1px inner top highlight and a hairline border. This is what makes
// cards read as real, lit objects instead of flat AI rectangles.
export const Card: React.FC<{
  children: React.ReactNode;
  accent?: string;
  highlighted?: boolean;
  style?: React.CSSProperties;
  radius?: number;
}> = ({ children, accent = "#F5A524", highlighted = false, style, radius = 22 }) => {
  const base: React.CSSProperties = {
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
      {/* soft top sheen */}
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
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
};
