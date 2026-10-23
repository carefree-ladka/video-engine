import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { FONT } from "./fonts";

type Token = { text: string; startMs: number; endMs: number; emphasis?: boolean };
type Page = { startMs: number; endMs: number; tokens: Token[] };
export type CaptionStyle = "karaoke" | "block" | "minimal";

export const Captions: React.FC<{
  pages: Page[];
  style?: CaptionStyle;
  accent?: string;
  bottomPct?: number;
}> = ({ pages, style = "karaoke", accent = "#FF3366", bottomPct = 0.22 }) => {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const vertical = height > width;
  const size = vertical ? 70 : 50;

  const page = pages.find((p) => ms >= p.startMs && ms <= p.endMs);
  if (!page) return null;

  const pin = interpolate(ms, [page.startMs, page.startMs + 120], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const stroke: React.CSSProperties = {
    WebkitTextStroke: `${Math.round(size * 0.055)}px #000`,
    paintOrder: "stroke fill",
    textShadow: "0 4px 18px rgba(0,0,0,0.55)",
  };

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: height * bottomPct }}>
      <div
        style={{
          maxWidth: "88%",
          textAlign: "center",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: `${Math.round(size * 0.25)}px ${Math.round(size * 0.22)}px`,
          fontFamily: FONT,
          lineHeight: 1.25,
          opacity: pin,
          transform: `translateY(${(1 - pin) * 20}px) scale(${0.96 + pin * 0.04})`,
        }}
      >
        {page.tokens.map((t, i) => {
          const active = ms >= t.startMs && ms <= t.endMs;
          const key = t.emphasis;
          let color = "#FFFFFF";
          let bg = "transparent";
          if (style === "karaoke") {
            if (active) {
              color = "#FFFFFF";
              bg = accent;
            } else if (key) color = accent;
          } else if (style === "block") {
            color = active || key ? accent : "#FFFFFF";
          }
          const pop = active && style !== "minimal" ? 1.08 : 1;
          return (
            <span
              key={i}
              style={{
                fontSize: size,
                fontWeight: 700,
                color,
                background: bg,
                padding: bg !== "transparent" ? `0 ${Math.round(size * 0.14)}px` : 0,
                borderRadius: 12,
                transform: `scale(${pop})`,
                ...stroke,
              }}
            >
              {t.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
