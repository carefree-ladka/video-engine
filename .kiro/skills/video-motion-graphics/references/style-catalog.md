# Motion-graphics style catalog

Pick ONE per video. Each style lists: best for · easing · timing · colour · entrances/transitions · avoid · how to build in Remotion (frame-driven, free libs). Numbers are the point — copy them into the storyboard `style` block and implement with the `motion.tsx` helpers.

> Adapted from awesomeclaude.ai's 17 motion-graphics styles (https://awesomeclaude.ai/claude-motion-graphics). Rephrased for licensing compliance; see that page for the originals and font/music licensing notes.

## 1. Swiss grid / typographic
- Best for: brand identity, event openers, conference titles.
- Easing: snaps on `cubic-bezier(.7,0,.2,1)`; linear only for lines being drawn.
- Timing: type snaps into grid cells; crisp, no overshoot.
- Colour: one typeface, one signal colour; that element is the subject.
- Entrances: wipes / clip reveals, never fades. Deletions are hard cuts. Positions on a 12-col grid, ~4% margins.
- Avoid: overshoot, springs, drop shadows, 2+ typefaces, centred-everything.
- Remotion: clip-path `inset()` reveal driven by `EASING.snap`; left-aligned grid layout; single accent.

## 2. Flat vector / springy
- Best for: SaaS promos, onboarding, science explainers.
- Easing: overshoot `cubic-bezier(0.34,1.56,0.64,1)`, settle within 12 frames.
- Timing: stagger groups by 2–4 frames, never all at once.
- Colour: 4–5 flat colours, no gradients, strokes ≥3px at 1080p.
- Transitions: an element grows to fill frame and becomes the next background.
- Avoid: tiny-head stock people, gradients, crossfades.
- Remotion: `spring()` with light damping or `EASING.overshoot`; `@remotion/shapes`; a shape scaling to full-frame between scenes.

## 3. Shape morph / transformation
- Best for: music videos, brand stories, topic transitions.
- Timing: each morph 18–30 frames, passes through a readable in-between; hold finished shape ≥1s.
- Transitions: no cuts — every idea grows out of the previous shape; liquid joins use smooth-min.
- Avoid: morphing through a shapeless blob, constant motion with no holds.
- Remotion: `@remotion/paths` (interpolate path `d` / `evolvePath`); hold frames between morphs.

## 4. Single-line draw / ink
- Best for: minimal ads, luxury brands, whiteboard explainers.
- Easing: linear draw at steady ~800px/s at 1080p; constant stroke width, round caps.
- Timing: one fill moment — the closed line floods with colour on a downbeat.
- Camera: pans to keep the pen tip in the middle third.
- Avoid: many lines at once, fade-ins, letter-by-letter typing.
- Remotion: `@remotion/paths` `getLength` + animated `strokeDashoffset`; translate the frame to follow the tip.

## 5. Data / editorial charts
- Best for: reports, data journalism, investor updates.
- Timing: one reading per screen; bars grow from baseline in ~20 frames ease-out; counters roll to the exact value and stop.
- Colour: no rainbow; axis labels ≥28px at 1080p.
- Avoid: 3D charts, decorative gridlines, numbers not in the source data.
- Remotion: `@remotion/shapes` rects with eased height; count-up via `interpolate`; one chart at a time.

## 6. Isometric diorama
- Best for: architecture diagrams, supply chains, app feature demos.
- Camera: true isometric; slides, never rotates in perspective.
- Timing: objects drop from 40px above with a small bounce, staggered by 3 frames.
- Colour: three tones per material (top light, left mid, right dark); things open to reveal insides.
- Avoid: perspective cameras, realistic textures, floating labels without leader lines.
- Remotion: CSS transforms (`rotateX/rotateZ` iso matrix) or Three via `@remotion/three`; staggered drop-ins.

## 7. Dark tech keynote / spotlight
- Best for: product launches, AI & SaaS, feature reveals.
- Easing: slow long-tail `cubic-bezier(.16,1,.3,1)`, 30–45 frames per move.
- Colour: near-black stage, hairline grid, exactly one accent on one thing.
- Signature: one giant number (~30% of frame height) counts up to its value; reveals come from a soft light sweep that leaves the object lit.
- Avoid: lens flares, neon glow, particle bursts, more than one accent.
- Remotion: `EASING.longTail`; light-sweep overlay (moving gradient); big count-up number scene.

## 8. Living UI screencast
- Best for: product tutorials, feature launches, changelogs.
- Rule: rebuild the real UI in HTML with real copy/colours (never screenshots).
- Timing: cursor moves on eased curves 20–30 frames, pauses ~8 frames before a click; zoom to ~1.6x on what matters, then pull back; one action every 3–4s.
- Avoid: fake features, teleporting cursor, lorem ipsum, zooming on nothing.
- Remotion: build the UI as components; animate an overlay cursor + scale transform on a container.

## 9. HUD / sci-fi terminal
- Best for: developer tools, spec walkthroughs, sci-fi/AI demos.
- Type: all monospace on a character grid; numbers roll through random glyphs 6–10 frames before settling.
- Signature: brackets lock onto a target in 3 steps (wide → tighter → locked + tick); two colours max on dark + dim grid.
- Avoid: heavy glow/bloom, glitch tearing, unreadable tiny text.
- Remotion: monospace font (JetBrains Mono); seeded glyph scramble via frame-indexed RNG; SVG bracket overlays.

## 10. Watercolour / painterly
- Best for: storytelling, travel/nature, cultural brands.
- Rule: everything painted with strokes; washes reveal over 15–25 frames and bleed 4–8px past the ink; paper texture always visible; no pure white/black.
- Avoid: perfect geometric shapes, digital gradients, labels on everything.
- Remotion: pre-rendered brush PNG assets revealed via masks; a paper-texture overlay. (Heavier; use assets.)

## 11. Risograph print
- Best for: indie brands, zines, event posters.
- Rule: 2–3 spot inks, overlaps multiply; plates offset 2–4px and stay; halftone dots, no smooth gradients; motion steps at 12fps.
- Avoid: a 4th ink, perfect registration, glossy highlights.
- Remotion: duplicate layers tinted per ink with `mixBlendMode:"multiply"` and a few px offset; halftone via SVG pattern; step playback by quantising frame.

## 12. Paper cut-out / collage
- Best for: music/fashion, kids stories, editorial.
- Rule: every piece has a white/cut edge + small hard shadow; stop-motion steps at 12fps (camera can move at 24); depth from 3–6 parallax layers; split-pin joints.
- Avoid: soft blurred shadows, smooth 60fps character motion, vector-perfect edges.
- Remotion: layered images with hard `box-shadow`; quantise motion to 12fps; parallax by layer depth.

## 13. Hand-drawn / boil
- Best for: character shorts, playful brands, social clips.
- Rule: animate on twos (change every 2 frames at 24fps); cycle 3 jitter variants per line; smear frame on fast moves; anticipation 4–6 frames before big actions.
- Avoid: tweened 60fps vector motion, perfect circles, text instead of acting.
- Remotion: 3 line variants swapped by `floor(frame/2)%3`; a smear asset on fast moves.

## 14. Pixel art
- Best for: game trailers, nostalgia, year-in-review.
- Rule: draw at 320×180, scale ×6 nearest-neighbour; fixed 16–32 colour palette; dithering not blending; sprites 8–12fps; pixel font; camera snaps to whole pixels.
- Avoid: mixed pixel sizes, blurry scaling, anti-aliased edges.
- Remotion: render small then upscale with `imageRendering:"pixelated"`; quantise positions to the pixel grid.

## 15. Retro media / analog
- Best for: music videos, throwback campaigns, mystery teasers.
- Rule: pick ONE era (1920s film / 80s VHS / 90s camcorder); grain seeded per frame index (same every render); film gate weave ~1px + ~5% brightness flicker; tape chroma shift 2–3px; effect sits over a clear composition.
- Avoid: stacking every retro effect, glitch tearing over important text.
- Remotion: `@remotion/motion-blur` sparingly + a seeded grain overlay keyed to `useCurrentFrame()`; small transform wobble.

## 16. Soft 3D / claymation
- Best for: product films, brand idents, playful explainers.
- Rule: one big soft key + fill; matte/soft-gloss materials; shallow depth of field; objects arrive with weight (fast in, 2 small settles, no floating); fixed random seed; contact shadows.
- Avoid: chrome everything, hard black shadows, floating objects without contact shadow.
- Remotion: `@remotion/three` (R3F) with soft lighting + env map; spring settle on arrival.

---

## Quick picker
- Dev / AI / product → **Dark tech keynote (7)** or **HUD terminal (9)**.
- Explain a concept to non-technical → **Flat vector (2)** or **Swiss (1)**.
- Interface is the product → **Living UI screencast (8)**.
- Data/numbers → **Data charts (5)**.
- Story / brand / emotional → **Shape morph (3)**, **Ink line (4)**, **Watercolour (10)**.
- Playful / social → **Hand-drawn (13)**, **Paper cut-out (12)**, **Pixel (14)**.

Our current `video-studio` scene templates implement the **Swiss** and **Dark keynote** families best (grid type, clip/wipe reveals, light sweep, big numbers, mono code). The others are roadmap targets that mostly need extra asset work or `@remotion/three`.
