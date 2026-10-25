import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { Background } from "./Background";
import { useReveal, EASING } from "./motion";
import { FONT, DISPLAY } from "./fonts";
import { captionBandTop, contentSideInset } from "./layout";
import { RenderLook } from "./looks";

type Scene = {
  text?: { kicker?: string; heading?: string; caption?: string };
  media?: {
    src?: string; // path under public/, e.g. "assets/editor.jpg" or "assets/clip.mp4"
    fit?: "cover" | "contain";
    kenBurns?: boolean; // slow zoom/pan (default true)
    from?: "left" | "right" | "center"; // pan direction
    muted?: boolean; // for video sources (default true)
  };
  durationSec?: number;
};
type Theme = RenderLook;

// Full-bleed b-roll: an image (or screenshot) with a slow Ken Burns move, a
// bottom scrim for contrast, and a lower-third title/caption. Breaks up
// text-only scenes, which lifts watch time. Falls back to a styled placeholder
// if no media is set, so a storyboard never crashes mid-render.
export const BrollScene: React.FC<{ scene: Scene; theme: Theme }> = ({
  scene,
  theme,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const g = { width, height };
  const durFrames = Math.max(1, Math.round((scene.durationSec || 4) * fps));

  const media = scene.media ?? {};
  const kb = media.kenBurns !== false;
  const t = interpolate(frame, [0, durFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASING.longTail,
  });
  const scale = kb ? 1.06 + t * 0.1 : 1.06;
  const dir = media.from ?? "left";
  const panX = kb
    ? (dir === "right" ? -1 : dir === "center" ? 0 : 1) * (t - 0.5) * 3
    : 0;

  const heading = useReveal(6, 14, EASING.snap);
  const cap = useReveal(12, 14, EASING.snap);

  const lowerThirdBottom = height - captionBandTop(g) + 18;
  const side = contentSideInset(g);

  return (
    <AbsoluteFill style={{ color: "#fff", fontFamily: FONT }}>
      {media.src ? (
        <AbsoluteFill style={{ overflow: "hidden" }}>
          {/\.(mp4|mov|webm|m4v)$/i.test(media.src) ? (
            <OffthreadVideo
              src={staticFile(media.src)}
              muted={media.muted !== false}
              style={{
                width: "100%",
                height: "100%",
                objectFit: media.fit ?? "cover",
                transform: `scale(${scale}) translateX(${panX}%)`,
              }}
            />
          ) : (
            <Img
              src={staticFile(media.src)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: media.fit ?? "cover",
                transform: `scale(${scale}) translateX(${panX}%)`,
              }}
            />
          )}
        </AbsoluteFill>
      ) : (
        // placeholder when no media is supplied
        <AbsoluteFill>
          <Background theme={theme} variant={theme.bgVariant} />
          <AbsoluteFill
            style={{
              alignItems: "center",
              justifyContent: "center",
              color: theme.muted,
              fontSize: 42,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {`\u25A3 b-roll`}
          </AbsoluteFill>
        </AbsoluteFill>
      )}

      {/* bottom scrim so the lower-third is always legible on any image */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.78), rgba(0,0,0,0.15) 42%, rgba(0,0,0,0) 62%)",
          pointerEvents: "none",
        }}
      />

      {/* lower-third, kept clear of the caption band */}
      <div
        style={{
          position: "absolute",
          left: side,
          right: side,
          bottom: lowerThirdBottom,
        }}
      >
        {scene.text?.kicker ? (
          <div
            style={{
              display: "inline-block",
              padding: "6px 16px",
              borderRadius: 8,
              background: theme.accent,
              color: theme.light ? "#fff" : theme.bg,
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: 16,
              opacity: heading,
            }}
          >
            {scene.text.kicker}
          </div>
        ) : null}
        {scene.text?.heading ? (
          <div
            style={{
              fontFamily: DISPLAY,
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: "-0.01em",
              textShadow: "0 3px 18px rgba(0,0,0,0.6)",
              opacity: heading,
              transform: `translateY(${(1 - heading) * 20}px)`,
            }}
          >
            {scene.text.heading}
          </div>
        ) : null}
        {scene.text?.caption ? (
          <div
            style={{
              fontSize: 36,
              fontWeight: 500,
              marginTop: 14,
              color: "rgba(255,255,255,0.88)",
              textShadow: "0 2px 12px rgba(0,0,0,0.6)",
              opacity: cap,
              transform: `translateY(${(1 - cap) * 14}px)`,
            }}
          >
            {scene.text.caption}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
