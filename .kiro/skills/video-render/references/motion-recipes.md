# Motion recipes + shared components

Reusable Remotion motion snippets and the two shared components every scene relies on. Keep motion subtle and consistent.

## Spring entrance

```tsx
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

export const useEnter = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return p; // 0 -> 1
};
```

## Fade + rise

```tsx
const p = useEnter();
const style = { opacity: p, transform: `translateY(${(1 - p) * 40}px)` };
```

## Ken Burns (slow zoom/pan on an image)

```tsx
import {
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Img,
  AbsoluteFill,
} from "remotion";

export const KenBurns: React.FC<{ src: string }> = ({ src }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const scale = interpolate(frame, [0, durationInFrames], [1.05, 1.18]);
  const x = interpolate(frame, [0, durationInFrames], [0, -30]);
  return (
    <AbsoluteFill>
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale}) translateX(${x}px)`,
        }}
      />
    </AbsoluteFill>
  );
};
```

## Word pop-in (for titles)

```tsx
const words = text.split(" ");
return words.map((w, i) => {
  const p = useEnter(i * 3); // stagger 3 frames per word
  return (
    <span
      key={i}
      style={{
        display: "inline-block",
        opacity: p,
        transform: `translateY(${(1 - p) * 20}px) scale(${0.8 + p * 0.2})`,
        marginRight: 12,
      }}
    >
      {w}
    </span>
  );
});
```

## SafeZone component (platform-aware padding)

```tsx
import { AbsoluteFill, useVideoConfig } from "remotion";

export const SafeZone: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { width, height } = useVideoConfig();
  const vertical = height > width;
  const pad = vertical
    ? {
        top: height * 0.1,
        bottom: height * 0.2,
        left: width * 0.06,
        right: width * 0.06,
      }
    : {
        top: height * 0.08,
        bottom: height * 0.08,
        left: width * 0.06,
        right: width * 0.06,
      };
  return (
    <AbsoluteFill
      style={{
        paddingTop: pad.top,
        paddingBottom: pad.bottom,
        paddingLeft: pad.left,
        paddingRight: pad.right,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
```

## Captions component (production TikTok/Reel style)

Page-based (not a drifting window): shows one short "page" of 3–5 words at a time, pops the active word, emphasizes keywords in the accent color, and renders a stroke+shadow so it's legible over anything. Consumes `captions.json` produced by the video-captions skill (pages of tokens). Style is driven by the brand/art-direction `captionStyle`.

```tsx
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";

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
  accent?: string;
  fontSize?: number; // base; auto-scales for orientation if omitted
  bottomPct?: number; // distance from bottom (safe-zone aware), default 0.22
  font?: string;
}> = ({
  pages,
  style = "karaoke",
  accent = "#FF3366",
  fontSize,
  bottomPct = 0.22,
  font = "Inter, sans-serif",
}) => {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const vertical = height > width;
  const size = fontSize ?? (vertical ? 72 : 52);

  const page = pages.find((p) => ms >= p.startMs && ms <= p.endMs);
  if (!page) return null;

  // page entrance pop
  const pin = interpolate(ms, [page.startMs, page.startMs + 120], [0, 1], {
    extrapolateRight: "clamp",
  });

  const stroke = {
    WebkitTextStroke: `${Math.round(size * 0.06)}px #000`,
    paintOrder: "stroke fill" as const,
    textShadow: "0 4px 18px rgba(0,0,0,0.55)",
  };

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: height * bottomPct,
      }}
    >
      <div
        style={{
          maxWidth: "88%",
          textAlign: "center",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: `0 ${Math.round(size * 0.22)}px`,
          fontFamily: font,
          opacity: pin,
          transform: `translateY(${(1 - pin) * 20}px) scale(${0.96 + pin * 0.04})`,
        }}
      >
        {page.tokens.map((t, i) => {
          const active = ms >= t.startMs && ms <= t.endMs;
          const key = t.emphasis;
          // color logic per style
          let color = "#FFFFFF";
          let bg = "transparent";
          if (style === "karaoke") {
            if (active) {
              color = "#FFFFFF";
              bg = accent;
            } else if (key) color = accent;
          } else if (style === "block") {
            color = active ? accent : key ? accent : "#FFFFFF";
          } else {
            // minimal
            color = "#FFFFFF";
          }
          const pop = active && style !== "minimal" ? 1.08 : 1;
          return (
            <span
              key={i}
              style={{
                fontSize: size,
                fontWeight: 900,
                lineHeight: 1.12,
                color,
                background: bg,
                padding:
                  bg !== "transparent" ? `0 ${Math.round(size * 0.14)}px` : 0,
                borderRadius: 12,
                transform: `scale(${pop})`,
                transition: "none",
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
```

Wire it in `Video.tsx` with the style/accent/font from the storyboard: `<Captions pages={captions.pages} style={storyboard.style?.captionStyle ?? "karaoke"} accent={theme.accent} font={theme.font} />`. Tune `fontSize` smaller for 16:9 and larger for 9:16 (the default already adapts by orientation).
