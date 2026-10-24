// Single source of truth for the caption band and the content-safe area.
//
// The frame is split into two regions that MUST NOT overlap:
//   1. The content area  — the top part, where scene templates render.
//   2. The caption band  — a strip at the bottom reserved for subtitles.
//
// Every scene keeps its content above `contentBottom`, and the <Captions>
// component renders inside the band below it. Because both read the same
// numbers here, captions can never overlap content for any platform
// (short, reel, story, long-form 16:9, square, ...).

export type Geom = { width: number; height: number };

export const isVertical = (g: Geom): boolean => g.height > g.width;

// Fraction of the frame height reserved at the bottom for captions
// (includes the breathing gap beneath the text). Portrait formats give the
// caption more room because the text is larger and wraps sooner.
export function captionBandPct(g: Geom): number {
  return isVertical(g) ? 0.3 : 0.26;
}

// Distance (px) from the bottom of the frame to the bottom edge of the
// caption text — the breathing gap below the subtitles.
export function captionBottomInset(g: Geom): number {
  return g.height * (isVertical(g) ? 0.1 : 0.09);
}

// Y position (px from the top) where the caption band begins. Scene content
// must stay strictly above this line.
export function captionBandTop(g: Geom): number {
  return g.height * (1 - captionBandPct(g));
}

// Alias read by scenes: the lowest y content may occupy.
export const contentBottom = captionBandTop;

// Top padding (px) for content, matching the old SafeZone insets.
export function contentTopInset(g: Geom): number {
  return g.height * (isVertical(g) ? 0.1 : 0.08);
}

// Horizontal content inset (px).
export function contentSideInset(g: Geom): number {
  return g.width * (isVertical(g) ? 0.07 : 0.06);
}

// Usable vertical space for content between the top inset and the caption band.
export function contentAvailHeight(g: Geom): number {
  return Math.max(1, captionBandTop(g) - contentTopInset(g));
}

// Maximum height (px) the caption text block may occupy before it would
// reach into the content area.
export function captionMaxHeight(g: Geom): number {
  return Math.max(1, captionBandTop(g) - captionBottomInset(g));
}

// Caption font size, shrunk for long pages so a wordy caption wraps to more
// lines WITHOUT growing past the band. Pairs with captionMaxHeight as a hard
// safety clamp in the renderer.
export function captionFontSize(g: Geom, wordCount: number): number {
  const base = isVertical(g) ? 66 : 48;
  if (wordCount <= 4) return base;
  if (wordCount <= 6) return Math.round(base * 0.85);
  if (wordCount <= 9) return Math.round(base * 0.72);
  return Math.round(base * 0.6);
}
