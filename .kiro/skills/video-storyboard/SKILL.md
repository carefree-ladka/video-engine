---
name: video-storyboard
description: Turn a written script (script.md or script.json) into an editable storyboard.json of scenes with narration text, asset references, per-scene motion intent and timing. Use after the project is set up (video-studio) and before generating voiceover. For planning YouTube/Reel/Short scene breakdowns.
---

# video-storyboard — script → storyboard.json

Stage 2. Convert the user's script into a structured, editable storyboard. This is the contract the rest of the pipeline builds on, so make it reviewable and let the user tweak it before voicing/rendering.

## Inputs

- `video-studio/input/script.md` (prose or lightly structured) or `script.json`.
- `video-studio/assets/` — available images, clips, music (list them; map by filename or by the user's cues).
- Active platform preset (orientation + max length) from `config.ts`.

## Method

### Step A — Read the topic and set the art direction (do this FIRST)

Never apply a generic look. **Seed the `style` block from the active brand** (brand-kit: default colors, fonts, caption style, handle), then adapt it to this topic — keep the brand recognizable, and if a topic needs a different palette, retain the brand accent or logo/handle and note the deviation. Infer from the script what this video _is_ and design a treatment that fits it. Decide:

- **Genre / intent** — e.g. tech explainer, finance, fitness, food, storytelling/horror, product promo, news, education, hype/sports. This drives everything below. See `references/art-direction.md` for distinct starting treatments per genre (adapt, don't copy verbatim).
- **Mood & energy** — calm/premium, punchy/hype, playful, serious, cinematic. This sets pacing and motion curves.
- **Palette** — background, foreground, 1–2 accent colors that suit the subject (fintech cool blues ≠ fitness hot energetic ≠ horror desaturated red/black). Honor any brand colors the user gave.
- **Typography** — weight and personality (geometric sans for tech, condensed bold for sports, elegant serif for luxury/story).
- **Motion personality** — snappy spring vs smooth ease vs cinematic slow; transition family (hard cuts vs smooth wipes vs glitch). Pick curves and `@remotion/transitions` types that match the mood.
- **Pacing** — fast cuts (1.5–2.5s/scene) for hype/Shorts, slower (4–8s) for calm/explainer.

Write these as a `style` block at the top of the storyboard (schema in `references/storyboard-schema.md`). This block is what makes each video look distinct; it feeds `config.ts` theme + the scene templates' styling.

### Step A.5 — Engineer the hook (scene 1) — do NOT skip

The first ~1.5 seconds decide watch time. Scene 1 is a scroll-stopper + an open loop, never an intro. Follow `references/hooks.md`:

- Pick a hook pattern that fits the topic (contrarian, curiosity gap, problem-first, direct question, result-first, stakes/FOMO, secret, numbered promise).
- Spoken hook lands in **≤ 7 words / 1.5s**; on-screen hook headline is **3–6 words** (the biggest text in the video).
- **Cut all warm-up**: no "In this video", "Hey guys", "Today we'll", no slow logo sting first.
- Open a loop (promise / question / "wait for it") in scene 1 and **close it in the final scene / CTA**.
- Note which hook pattern you used so it can be reviewed.

### Step B — Break the script into beats and choose VARIED treatments

1. **Segment** the script into scenes — one idea per scene. Respect the pacing from the art direction. Front-load value: first useful thing by ~3s.
   - **Long-form re-hook:** if the video runs over ~75s (YouTube/multi-section), insert ONE `interstitial` re-hook beat around 40–60% in (or right before the climax section) that opens a new mini-loop ("but here's where everyone trips up", "the real trick is next"). One per ~90s, two max. Short-form under ~60s needs none. See `references/hooks.md`.
2. **Assign narration** verbatim per scene (exact text drives TTS and caption sync).
3. **Choose a template + motion per scene to match the content of that beat**, and deliberately vary them so it doesn't read as a repeated slideshow. Map the _meaning_ of the beat to a treatment:
   - a hook/opener → `title` with word pop-in or a bold kinetic-type moment
   - a statistic or number → an animated counter / big-number treatment
   - a comparison or list → `bullets` with staggered reveal, or a split layout
   - a quote/testimonial → `quote`
   - showing a place/product/person → `image` (Ken Burns) or `broll`, with a `lower-third` for names
   - a process/steps → sequential reveal with connecting path (`@remotion/paths`)
   - an emotional/cinematic beat → full-bleed `broll` with slow push and minimal text
   - the ending → `cta`
     Reach for Lottie (`@remotion/lottie`) or SVG shapes/paths when a beat benefits from illustrated motion graphics rather than photos.
4. **Map assets** by filename. If a needed asset is missing, set `"asset": null`, note it for the user, and fall back to a typographic/graphic scene that still fits the art direction.
5. **Set per-scene `motion` and optional `transition`** consistent with the chosen motion personality (don't mix unrelated styles).
6. **Leave durations provisional** — estimate (words ÷ ~2.5 wps); stage 3 overwrites with real audio length.
7. **Respect max length** — if the estimate exceeds the preset's `maxSeconds`, tighten and tell the user what you cut.

## Output

Write `video-studio/storyboard.json` following `references/storyboard-schema.md`, including the top-level `style` block. Mirror the `style` palette/font into `config.ts` theme. Then present to the user: the art-direction summary (genre, mood, palette, type, pacing) **and** a scene list (number, template, motion, duration estimate, narration snippet), and ask for sign-off before voiceover.

## Supporting files

- `references/hooks.md` — hook patterns + retention rules for scene 1 and beyond (watch-time critical).
- `references/storyboard-schema.md` — the exact JSON schema (incl. the `style` block) with an example.
- `references/art-direction.md` — distinct treatment starting points per genre/topic to adapt from.
