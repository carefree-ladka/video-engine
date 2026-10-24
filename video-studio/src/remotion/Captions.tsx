import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { captionFont } from "./fonts";
import {
  captionBottomInset,
  captionFontSize,
  captionMaxHeight,
} from "./layout";
import { CODE2OFFER, CaptionColors, roleFor } from "./captionStyle";

type Token = {
  text: string;
  startMs: number;
  endMs: number;
  emphasis?: boolean;
};
type Page = { startMs: number; endMs: number; tokens: Token[] };
export type CaptionStyle = "karaoke" | "block" | "minimal";

export const Captions: React.FC<{
  pages: Page[];
  style?: CaptionStyle;
  colors?: CaptionColors;
}> = ({ pages, style = "karaoke", colors = CODE2OFFER }) => {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();
  const g = { width, height };
  const vertical = height > width;
  const ms = (frame / fps) * 1000;

  const page = pages.find((p) => ms >= p.startMs && ms <= p.endMs);
  if (!page) return null;

  const size = captionFontSize(g, page.tokens.length);

  // Whole-page entrance (used as-is for long-form; words also reveal
  // individually in vertical Shorts/Reels).
  const pagePin = interpolate(ms, [page.startMs, page.startMs + 140], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const strokePx = Math.max(2, Math.min(4, Math.round(size * 0.05)));
  const stroke: React.CSSProperties = {
    WebkitTextStroke: `${strokePx}px ${colors.outline}`,
    paintOrder: "stroke fill",
    textShadow: "0 3px 14px rgba(0,0,0,0.6)",
  };

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: captionBottomInset(g),
      }}
    >
      <div
        style={{
          maxWidth: "88%",
          maxHeight: captionMaxHeight(g),
          overflow: "hidden",
          textAlign: "center",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignContent: "flex-end",
          gap: `${Math.round(size * 0.22)}px ${Math.round(size * 0.2)}px`,
          fontFamily: captionFont(vertical),
          fontWeight: vertical ? 700 : 600,
          lineHeight: 1.22,
          // long-form: whole phrase fades in together and stays calm
          opacity: vertical ? 1 : pagePin,
          transform: vertical
            ? undefined
            : `translateY(${(1 - pagePin) * 14}px)`,
        }}
      >
        {page.tokens.map((t, i) => {
          const active = ms >= t.startMs && ms <= t.endMs;
          const role = roleFor(t.text, t.emphasis);
          const popWord = role !== "base";

          // word-by-word reveal (vertical only); long-form reveals the page.
          const rev = vertical
            ? interpolate(ms, [t.startMs - 80, t.startMs + 80], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })
            : 1;

          // keyword pop 90% -> 105% -> 100% (~180ms) on Shorts keywords
          const since = ms - t.startMs;
          const pop =
            vertical && active && popWord && style !== "minimal"
              ? interpolate(since, [0, 90, 180], [0.9, 1.05, 1.0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })
              : 0.9 + rev * 0.1;

          let color = colors.base;
          let bg = "transparent";
          if (role === "technical") color = colors.technical;
          else if (role === "keyword") color = colors.keyword;

          if (style === "karaoke" && active) {
            bg = colors.activeBg;
            color = colors.activeFg;
          } else if (style === "block" && (active || role !== "base")) {
            color = role === "technical" ? colors.technical : colors.keyword;
          } else if (style === "minimal") {
            color = role === "technical" ? colors.technical : colors.base;
          }

          return (
            <span
              key={i}
              style={{
                fontSize: size,
                fontWeight: role !== "base" ? 800 : vertical ? 700 : 600,
                color,
                background: bg,
                padding:
                  bg !== "transparent" ? `0 ${Math.round(size * 0.14)}px` : 0,
                borderRadius: 12,
                opacity: vertical ? rev : 1,
                transform: `translateY(${(1 - rev) * 12}px) scale(${pop})`,
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
