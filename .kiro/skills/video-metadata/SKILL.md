---
name: video-metadata
description: Author reach-optimized publishing metadata (titles, descriptions, tags, hashtags) for YouTube, YouTube Shorts, Instagram Reels and LinkedIn from a finished storyboard, and render matching short/long thumbnails. Use after render when the user wants a description, title, hashtags, tags, or thumbnails for publishing a video.
---

# video-metadata — publishing copy + thumbnails

Final stage. Turn a finished video (its `storyboard.<lang>.json` + `brand.json`) into
publish-ready metadata and thumbnails.

**Kiro writes the copy itself.** Do NOT call an external LLM API and do NOT emit
a mechanical template that just concatenates storyboard text — that produces
generic, low-reach copy. Read the actual script, understand the topic and the
target viewer, then write genuinely good, specific copy using the playbook below.
Ground every line in what the video actually teaches; never invent features.

## Inputs

- `video-studio/input/storyboard.<lang>.json` — the real script (hook, headings, bullets, narration, code).
- `video-studio/input/brand.json` — channel name, `handle`, `socials` (instagram/youtube).
- Platform/orientation from the storyboard dimensions (9:16 short/reel vs 16:9 long).

## Outputs

Authored source of truth (durable, committed): `video-studio/input/metadata.<lang>.json`
— you write this. (Legacy `out/metadata.<lang>.json` is still read as a fallback.)

The final deliverable is a single bundle per video, assembled by `npm run publish -- <lang>`:

```
output/<lang>/
  video/video.mp4
  thumbnails/short.png    long.png
  subtitles/captions.srt  captions.vtt
  socials/youtube.txt     instagram.txt   linkedin.txt
```

- `socials/*.txt` are generated from `input/metadata.<lang>.json` with labelled TITLE / DESCRIPTION / TAGS / CAPTION / HASHTAGS sections for copy-paste.
- `subtitles/captions.srt` + `.vtt` are exported from the caption timings (accessibility + upload).
- `thumbnails/` are rendered straight into the bundle (short 1080×1920, long 1280×720). The thumbnail text is deterministic (title hook + accent word + badge); tune it in `src/remotion/Thumbnail.tsx` or the title scene.
- `video/video.mp4` is copied from the rendered `out/video.<lang>.mp4`.

So the flow is: you author `input/metadata.<lang>.json` → run `npm run publish -- <lang>` → hand the user `output/<lang>/`.

## The playbook (how to make it rank, not just exist)

See `references/platform-playbook.md` for the full detail. Core rules:

- **One primary keyword.** Pick the exact phrase a viewer would search (e.g. "javascript debounce"). It must appear in the YouTube title, the first 2 lines of the description, and the Shorts title.
- **Title = keyword + angle, not a label.** 50–65 chars for long-form. Lead with the keyword, add a curiosity/benefit/stakes angle. Never clickbait a payoff the video doesn't deliver.
- **Description front-load.** The first ~150 chars are the SEO + the hook (shown in search and above "more"). Then concrete "what you'll learn" bullets in the video's real terms, then CTA + handles, then 3–5 hashtags (YouTube shows the first 3).
- **YouTube tags:** 12–18, mixing the exact topic, close variations, and the broad category. Joined string < 480 chars.
- **Instagram hashtags are a reach ladder.** 20–28 tags deliberately mixing LARGE (broad, millions of posts), MEDIUM (100k–1M), and SMALL/niche (<100k) pools, so the Reel can surface in winnable smaller pools instead of drowning in only huge ones. All relevant, lowercase, no banned/spam tags.
- **LinkedIn is professional.** Insight-first hook, 3–4 concrete takeaways, a question CTA, 3–5 clean hashtags, no emoji spam, link in the first comment not the body.
- **Match the format.** Shorts/Reels captions are punchy with a <125-char first line; long-form descriptions are fuller and can carry timestamps/chapters.

## Method

1. Read the storyboard + brand. Identify the primary keyword, the hook, and the 3–6 real teaching points.
2. Write each platform block per the playbook, tailored to this specific video and audience. Vary the angle per platform (search-intent for YouTube, scroll-stopping for Reels, insight for LinkedIn).
3. Write `input/metadata.<lang>.json` (durable, committed source of truth).
4. Run `npm run publish -- <lang>` to assemble `output/<lang>/` (video + thumbnails + subtitles + socials .txt).
5. Show the user the copy and the bundle path, and offer to tweak angle/keywords.
