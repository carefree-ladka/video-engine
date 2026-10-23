---
name: video-motion-graphics
description: Make videos look designed, not generic. A library of named motion-graphics styles defined as hard numbers (easing curves, stagger frames, colour logic, entrance type, avoid lists) that the storyboard/art-direction step picks from, plus the craft rules (one read per shot, hook in the first second, hold the final frame). Use whenever the goal is polished, beautiful motion graphics.
---

# video-motion-graphics — designed looks, defined as numbers

The reason most AI/auto video looks the same is vague direction ("modern, slick") that resolves to the same defaults: glow, particles, bouncy easing, gradients. The fix is to specify the look as **numbers a renderer can obey** — exact easing curves, frame counts, colour rules, grid — plus an explicit avoid list. Pick ONE named style per video and commit to it.

> Style system adapted from awesomeclaude.ai's motion-graphics styles (https://awesomeclaude.ai/claude-motion-graphics). Content was rephrased for compliance with licensing restrictions.

## How this fits our pipeline
- Remotion already gives us the hard part these rules assume: every frame is a pure function of `useCurrentFrame()`, so animation is deterministic and seed-stable. We do NOT need a headless-browser screenshot renderer.
- In the **video-storyboard** step, after choosing genre/mood, also choose ONE motion-graphics style from `references/style-catalog.md` and copy its numbers into the storyboard `style` block (easing, stagger, signal colour, entrance, fps feel, avoid list).
- In **video-render**, the scene templates and the shared `motion` helpers implement those numbers (named easing curves, clip/wipe reveals, light sweep, staggered reveals, transitions via `@remotion/transitions`).

## The craft rules (apply to every style)
- **One read per shot.** Each scene has exactly one thing the viewer must notice. Give slow meanings time (~0.3s per word, min ~1s on screen).
- **Hook in the first second.** Something happens immediately; never open on a static hold.
- **Something moves in every shot;** hold the final frame ~0.8–1.2s so it resolves.
- **Entrances are wipes or clip reveals, not fades** (unless the chosen style says otherwise). Deletions are hard cuts.
- **One signal colour per shot** carries the subject; everything else is neutral.
- **Grid + safe margins.** Land positions on a grid; keep text inside the platform safe zone.
- **On the beat** when music exists: put cuts/accents on the beat grid (not every beat).

## Write the style as numbers (never adjectives)
When filling the storyboard `style` block, specify:
1. Medium/look in one clause (e.g. "Swiss grid typographic").
2. Palette as hex: background, foreground, exactly one signal/accent.
3. Colour logic (which single element gets the accent).
4. Easing as a curve, e.g. `cubic-bezier(.7,0,.2,1)` — map to `EASING.snap` etc. in `motion.tsx`.
5. Timing in frames: stagger by N frames, entrance over N frames, morphs 18–30.
6. How shots connect: wipe / shape-grows-into-next / hard cut.
7. Frame-rate feel if stylised (12fps stepping for paper/riso, "on twos" for hand-drawn).
8. An avoid list.

## Default avoid list (unless the style explicitly wants it)
Particle bursts, lens flares, neon glow, RGB split/glitch, bouncy springs on everything, decorative gradients, drop shadows everywhere, more than one accent colour, text that just repeats what the picture already shows, centred-everything layouts.

## Review before final render
Sample one frame per scene (we already extract frames with ffmpeg) and check: clipped/overlapping text, words on screen too briefly to read, dead time, fallback fonts, elements too small for a phone, black frames. Fix, then render.

## Supporting files
- `references/style-catalog.md` — the named styles, each with its numeric rules, best-fit use, and how to build it in Remotion with the free libraries.
