# Art direction by topic/genre

Starting treatments to **adapt** from — never apply verbatim. The point is that each video's look is derived from its subject. Read the script, pick the closest genre, then adjust palette/type/motion to the specific topic, brand, and mood. Two tech videos should still differ if one is a calm tutorial and one is a hype product launch.

Each treatment lists: palette direction · typography · motion personality · transition family · pacing · signature scene treatments.

## tech-explainer
- Palette: dark UI (`#0B0B0F` bg) with one cool accent (electric blue/cyan `#22D3EE`) and a warm highlight for emphasis.
- Type: geometric/neo-grotesque sans, heavy display weights (Inter, Satoshi, Space Grotesk).
- Motion: snappy springs, clean slides; UI-card reveals.
- Transitions: slide / fade.
- Pacing: medium.
- Signatures: animated terminals/code snippets, `steps` with `@remotion/paths` connecting arrows, big-`number` stat reveals, `bullets` staggered.

## finance / business
- Palette: trustworthy — deep navy/green, gold or teal accent, lots of negative space.
- Type: confident sans or a restrained serif for premium feel.
- Motion: smooth eases, counters, charts drawing in. Nothing frantic.
- Transitions: fade / clockWipe.
- Pacing: medium–slow.
- Signatures: `number` count-ups, line/bar charts animated via `@remotion/paths`/`shapes`, `quote` for insights, lower-thirds for figures.

## fitness / sports / hype
- Palette: high-energy — black + saturated accent (lime, orange, red), bold contrast.
- Type: condensed heavy caps (Anton, Archivo Black), italic for motion.
- Motion: fast, punchy, overshoot springs, shake/impact on beats; motion-blur on transitions.
- Transitions: hard cuts, fast wipes, occasional glitch.
- Pacing: fast (1.5–2.5s/scene).
- Signatures: kinetic typography, full-bleed `broll` with zoom punches, on-beat captions, `number` reps/stats.

## food / lifestyle
- Palette: warm, appetizing — cream, terracotta, soft greens; natural tones.
- Type: friendly rounded sans or a charming serif.
- Motion: smooth Ken Burns on dishes, gentle fades, soft scale.
- Transitions: fade / slide.
- Pacing: medium.
- Signatures: `image` Ken Burns hero shots, `lower-third` for ingredients/steps, `bullets` for recipe steps.

## storytelling / horror / cinematic
- Palette: desaturated, moody; single ominous accent (blood red, cold cyan) against near-black.
- Type: restrained — thin serif or spaced caps; minimal text.
- Motion: slow cinematic pushes, long holds, creeping zoom; let `broll` breathe.
- Transitions: slow fade to black, dip-to-black.
- Pacing: slow, with sudden fast cut for scares/reveals.
- Signatures: full-bleed `broll`/`image` with vignette, sparse `quote`, minimal captions (or none).

## product promo / launch
- Palette: brand colors first; clean, premium, lots of whitespace or dramatic dark.
- Type: match brand; bold display for feature names.
- Motion: confident springs, product hero rotations/reveals, feature callouts sliding in.
- Transitions: slide / wipe, smooth.
- Pacing: medium, building to a CTA.
- Signatures: `image`/`broll` product hero, `lower-third` feature callouts, `number` for specs/pricing, strong `cta` end card.

## news / education
- Palette: clean, neutral, one brand accent; legibility over flash.
- Type: clear sans; strong hierarchy.
- Motion: minimal — tasteful slides and fades, lower-thirds.
- Transitions: cut / fade.
- Pacing: medium.
- Signatures: `title` headers, `bullets`, `lower-third` sources/names, map/chart graphics.

## How to apply
1. Match the script to the nearest genre above.
2. Write the `style` block (schema) using that direction, tuned to the specific topic and any brand colors/fonts the user gave.
3. Choose per-scene templates/motions that serve each beat (see the storyboard SKILL Step B) — varied, but all within the one motion personality, palette, and transition family so the video is cohesive.
4. Mirror `style.palette` + `style.font` into `config.ts` theme so the scene templates pick them up.
