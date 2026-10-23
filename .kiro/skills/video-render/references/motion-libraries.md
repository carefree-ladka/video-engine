# Motion libraries in Remotion (all free)

The golden rule: **Remotion renders frame-by-frame, so animation must be deterministic and driven by `useCurrentFrame()`** — never by wall-clock time, `setTimeout`, `requestAnimationFrame`, or a library's own autoplay. Anything time-based must be *scrubbed* to the current frame instead of left to play. Break this and animations render frozen or jittery even though they look fine in a browser preview.

## Tier 1 — Remotion-native (use these first)
All shipped as `@remotion/*`, same license and version as `remotion`. Keep every `@remotion/*` package pinned to the exact `remotion` version.

- **Core**: `spring()` and `interpolate()` from `remotion` — cover most entrances, eases, and value mapping. See motion-recipes.md.
- **`@remotion/transitions`** — scene-to-scene transitions (fade, slide, wipe, clockWipe, flip):
  ```tsx
  import { TransitionSeries, linearTiming } from "@remotion/transitions";
  import { fade } from "@remotion/transitions/fade";
  import { slide } from "@remotion/transitions/slide";

  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={60}><SceneA /></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 15 })} />
    <TransitionSeries.Sequence durationInFrames={90}><SceneB /></TransitionSeries.Sequence>
  </TransitionSeries>
  ```
  Use this instead of hand-rolled cross-fades between scenes.
- **`@remotion/shapes`** — `<Rect>`, `<Circle>`, `<Triangle>`, `<Star>` etc. Animate size/position with interpolate for backgrounds and accents.
- **`@remotion/paths`** — measure and trim SVG paths for line-draw / signature / underline reveals:
  ```tsx
  import { getLength } from "@remotion/paths";
  const len = getLength(d);
  const draw = interpolate(frame, [0, 20], [0, 1]);
  <path d={d} strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
  ```
- **`@remotion/animation-utils`** — `makeTransform`, `translate`, `scale`, `interpolateStyles` for composing transforms cleanly.
- **`@remotion/motion-blur`** — `<Trail>` / `<MotionBlur>` to add blur on fast-moving elements.
- **`@remotion/lottie`** — play After Effects / LottieFiles JSON. Best route to polished motion graphics without hand-coding:
  ```tsx
  import { Lottie } from "@remotion/lottie";
  import data from "../../assets/confetti.json";
  <Lottie animationData={data} />   // auto-synced to the Remotion timeline
  ```

## Tier 2 — GSAP (now 100% free, incl. all former premium plugins)
Great for complex, multi-step timelines (SplitText, MorphSVG, MotionPath). Create a **paused** timeline and scrub it from the frame — do not let GSAP autoplay.

```tsx
import { useCurrentFrame, useVideoConfig } from "remotion";
import { useMemo, useRef, useLayoutEffect } from "react";
import gsap from "gsap";

export const GsapScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ref = useRef<HTMLDivElement>(null);

  // build the timeline once, paused
  const tl = useMemo(() => gsap.timeline({ paused: true }), []);
  useLayoutEffect(() => {
    tl.clear();
    tl.from(ref.current, { x: -200, opacity: 0, duration: 0.5 })
      .to(ref.current, { scale: 1.1, duration: 0.3 });
  }, [tl]);

  // scrub to the exact current time every frame
  tl.seek(frame / fps);

  return <div ref={ref}>…</div>;
};
```
Rule of thumb: use GSAP only when the Remotion primitives can't express the sequence cleanly. Everything stays free and render-safe.

## Not recommended inside Remotion
- **Motion / Framer Motion** (MIT, free) and **anime.js v4** (MIT, free) are excellent for live web UI but are time/autoplay driven; they don't map cleanly to deterministic rendering. Skip them here, or you'd have to manually scrub like GSAP for no added benefit.
- **AOS** (scroll-triggered) and **Three.js** (3D) are out of scope unless you specifically need 3D.

## Licensing summary
- `@remotion/*`: free for individuals and small teams; company license above the size threshold (same terms as Remotion).
- GSAP + all plugins: free for everyone including commercial use (Webflow, April 2025).
- Lottie JSON: free to create and render; check individual file licenses if sourced from a marketplace.
