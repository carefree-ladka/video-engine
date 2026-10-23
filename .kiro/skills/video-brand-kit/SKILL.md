---
name: video-brand-kit
description: Define and apply a persistent per-channel brand identity (logo, watermark, intro sting, outro/CTA card, fonts, color system, caption style, social handle) so every video from the same creator looks consistent and recognizable. Use at the start of a video job to load or create the brand, and have it layer underneath the per-video art direction.
---

# video-brand-kit — persistent channel identity

A creator's videos must look like *their* channel, not generic AI output. This skill maintains a reusable brand that sits **underneath** the per-video art direction: the art direction changes mood/palette per topic, but the brand's non-negotiables (logo/watermark, handle, intro/outro, default fonts and colors) stay consistent across every video.

Run this before storyboarding (right after video-studio setup).

## 1. Load or create the brand

Brands live in `video-studio/brand/`. Support multiple channels via named profiles:
```
video-studio/brand/
  <channel>.json       # e.g. default.json, tech-channel.json
  assets/              # logo.png, watermark.png, intro.json/.mp4, outro bg, brand font files
```
- If a brand profile exists, load it and tell the user which one is active.
- If none exists, interview the user briefly (channel name, @handle, 1–2 brand colors, logo file if any, preferred vibe) and write `brand/default.json` following `references/brand-schema.md`. Offer sensible defaults so they can start immediately and refine later.

## 2. How brand + art direction combine (precedence)

For each video the effective style is computed as: **brand defaults → overridden by per-video art direction → overridden by explicit user instructions.**

Rules:
- **Always present regardless of topic:** logo watermark + @handle (per brand position/opacity), intro sting (if enabled), outro/CTA card, and the safe-zone discipline.
- **Brand-preferred but genre-adaptable:** fonts and colors. Keep the brand font/palette by default; the art-direction step may shift the palette for a strongly different topic, but should keep at least the brand accent or logo lockup so it stays recognizable. If it deviates, say why.
- **Fully art-direction-driven:** motion personality, transitions, pacing, per-scene templates.

The storyboard `style` block should be seeded from the brand, then adapted. Mirror the resolved palette/font into `config.ts` theme.

## 3. Apply in the composition

Add persistent brand layers in `Video.tsx` (see `references/brand-components.md`):
- `<Watermark>` — logo + @handle, rendered above all scenes for the whole duration, inside the safe zone corner.
- `<Intro>` — optional opening sting (first ~1–1.5s): brand logo reveal. Prepend as the first sequence.
- `<Outro>` — closing CTA/end card using brand colors + handle; usually the final scene (can replace a generic `cta`).

## 4. Output / handoff
- Written/updated `brand/<channel>.json`.
- Confirm to the user: active channel, what's locked (logo, handle, intro/outro, default font/colors) vs what the art direction may adapt.

## Supporting files
- `references/brand-schema.md` — the brand profile JSON schema with an example.
- `references/brand-components.md` — Watermark, Intro, and Outro Remotion components.
