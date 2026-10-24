import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { Background } from "./Background";
import { DISPLAY, FONT } from "./fonts";

export type ThumbProps = {
  title: string;
  kicker?: string;
  accentWord?: string; // a word in the title to paint in the accent colour
  handle?: string;
  badge?: string; // small corner tag e.g. "JS" / "45s" / "HINDI"
  theme: { bg: string; fg: string; accent: string };
};

// A designed still used as the video thumbnail. Works at 9:16 (short) and
// 16:9 (long) — layout adapts to orientation. Big, high-contrast, 3–5 word hook.
export const Thumbnail: React.FC<ThumbProps> = ({
  title,
  kicker,
  accentWord,
  handle,
  badge,
  theme,
}) => {
  const { width, height } = useVideoConfig();
  const vertical = height > width;
  const pad = vertical ? width * 0.08 : width * 0.07;
  const titleSize = vertical ? 150 : 128;

  const words = title.split(/\s+/);
  const acc = (accentWord ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

  return (
    <AbsoluteFill style={{ color: theme.fg }}>
      <Background theme={theme} variant="mesh" />

      {/* oversized decorative glyph for depth */}
      <div
        style={{
          position: "absolute",
          right: vertical ? -width * 0.14 : -width * 0.04,
          bottom: vertical ? height * 0.04 : -height * 0.12,
          fontFamily: DISPLAY,
          fontSize: vertical ? 760 : 620,
          fontWeight: 800,
          color: theme.accent,
          opacity: 0.08,
          lineHeight: 1,
          pointerEvents: "none",
        }}
      >
        {"{ }"}
      </div>

      <AbsoluteFill
        style={{
          padding: pad,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        {kicker ? (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 30,
            }}
          >
            <span
              style={{
                width: 48,
                height: 6,
                borderRadius: 3,
                background: theme.accent,
                boxShadow: `0 0 20px ${theme.accent}`,
              }}
            />
            <span
              style={{
                fontFamily: FONT,
                fontSize: vertical ? 40 : 34,
                fontWeight: 800,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: theme.accent,
              }}
            >
              {kicker}
            </span>
          </div>
        ) : null}

        <h1
          style={{
            fontFamily: DISPLAY,
            fontSize: titleSize,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 0.98,
            margin: 0,
            maxWidth: vertical ? "100%" : "78%",
            textShadow: "0 8px 40px rgba(0,0,0,0.6)",
          }}
        >
          {words.map((w, i) => {
            const norm = w.toLowerCase().replace(/[^a-z0-9]/g, "");
            const hit = acc && norm === acc;
            return (
              <span
                key={i}
                style={{
                  color: hit ? theme.accent : theme.fg,
                  fontStyle: hit ? "italic" : "normal",
                }}
              >
                {w}
                {i < words.length - 1 ? " " : ""}
              </span>
            );
          })}
        </h1>

        <div
          style={{
            marginTop: 36,
            height: 8,
            width: vertical ? 220 : 180,
            borderRadius: 4,
            background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent}00)`,
          }}
        />
      </AbsoluteFill>

      {handle ? (
        <div
          style={{
            position: "absolute",
            left: pad,
            bottom: pad,
            fontFamily: DISPLAY,
            fontSize: vertical ? 44 : 38,
            fontWeight: 700,
            color: theme.fg,
            opacity: 0.9,
            textShadow: "0 2px 10px rgba(0,0,0,0.6)",
          }}
        >
          {handle}
        </div>
      ) : null}

      {badge ? (
        <div
          style={{
            position: "absolute",
            right: pad,
            top: pad,
            padding: "14px 26px",
            borderRadius: 16,
            fontFamily: DISPLAY,
            fontSize: vertical ? 42 : 36,
            fontWeight: 800,
            color: theme.bg,
            background: `linear-gradient(145deg, ${theme.accent}, ${theme.accent}CC)`,
            boxShadow: `0 14px 40px -12px ${theme.accent}99`,
          }}
        >
          {badge}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
