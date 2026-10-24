# Platform playbook — reach-optimized metadata

Reference for the `video-metadata` skill. Apply per-video; never boilerplate.

## Keyword first

Pick ONE primary keyword = the exact phrase the target viewer types into search
(e.g. "javascript debounce", "python enumerate", "react useEffect"). Everything
anchors to it. Pick 2–3 secondary keywords (variations / related intents) for the
description body and tags.

## YouTube (long-form)

**Title (50–65 chars, hard max ~70 before truncation):**
- Lead with the primary keyword, then an angle: benefit, curiosity gap, stakes, or a number.
- Formulas that work: `<Keyword>: <benefit>`, `<Keyword> explained (<specific>)`, `Stop <bad thing> — <keyword>`, `<N> <keyword> mistakes`.
- No ALL CAPS, no emoji in the title, no promise the video doesn't keep.

**Description:**
- Lines 1–2 (~150 chars, shown in search + above "more"): restate the hook AND include the primary keyword naturally. This is the highest-SEO real estate.
- Body: 3–6 bullets of what the viewer learns, in the video's real terms.
- Chapters/timestamps if long-form (`0:00 Intro` …) — boosts watch time + SEO.
- CTA with the channel handles.
- Last line: 3–5 relevant hashtags (YouTube renders the first 3 above the title).

**Tags (12–18, joined string < 480 chars):**
- Exact topic + close variations + broad category. Example for a debounce video:
  `javascript debounce, debounce function, debounce vs throttle, javascript performance, js interview questions, frontend optimization, javascript tutorial, web development`.

## YouTube Shorts

- **Title:** primary keyword + hook, end with `#Shorts` (≤70 chars).
- **Description:** 1 hook line + 3–5 hashtags + handle. Keep it tight.

## Instagram (Reel)

- **Caption:** first line is the hook, < 125 chars (everything after is hidden behind "more"). Then 2–4 short value lines, skimmable with line breaks and sparse emoji. One clear CTA — "Save this" + "Follow @handle".
- **Hashtag ladder (20–28 total)** — the key to reach. Mix three pools so the Reel can win smaller pools instead of only competing in giant ones:
  - LARGE (broad, millions): `#coding #programming #javascript #webdevelopment #developer`
  - MEDIUM (100k–1M, niche): `#javascripttips #webdev #frontenddeveloper #codingtips #learntocode`
  - SMALL (<100k, specific): `#debounce #javascriptinterview #reactperformance #jsdeveloper`
- All lowercase, all relevant, no banned/spam/engagement-bait tags, no repeats.
- Hashtags can go at the end of the caption or in the first comment (either is fine; be consistent).

## LinkedIn

- Professional, no hype/emoji spam.
- Hook line (an insight or a crisp problem statement), then 1–2 sentences of context, then 3–4 concrete takeaways (`→ …`), then a genuine question CTA.
- 3–5 clean professional hashtags (`#softwareengineering #webdevelopment #javascript`).
- Put any external link in the FIRST COMMENT, not the post body (body links suppress reach).

## Format awareness

- 9:16 (Short/Reel): punchy, keyword-forward, hook in the first line, tighter copy.
- 16:9 (long-form YouTube): fuller description, chapters, more secondary keywords, richer tag set.

## Thumbnails

- Short (1080×1920) and long (1280×720) rendered from `Thumbnail.tsx`.
- 3–5 word hook max, one accent-coloured keyword, high contrast, channel handle, a topic badge.
- The thumbnail text should NOT duplicate the title verbatim — it complements it (title carries the keyword for search; thumbnail carries the emotional hook for the click).
