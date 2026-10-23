# brand/<channel>.json schema

```jsonc
{
  "channel": "string — channel/creator name",
  "handle": "@yourhandle",                 // shown in watermark + outro
  "tagline": "optional short tagline for outro",

  "logo": {
    "src": "brand/assets/logo.png",         // or null
    "lockupSrc": "brand/assets/logo-wordmark.png" // optional full logo for intro/outro
  },

  "watermark": {
    "enabled": true,
    "element": "logo | handle | both",
    "position": "top-left | top-right | bottom-left | bottom-right",
    "opacity": 0.85,
    "scale": 1.0                             // relative size multiplier
  },

  "colors": {                                // brand defaults; art direction may adapt
    "primary": "#0B0B0F",
    "accent": "#FF3366",
    "accent2": "#22D3EE",
    "textOnPrimary": "#FFFFFF"
  },

  "fonts": {
    "display": "Satoshi, Inter, sans-serif", // headings
    "body": "Inter, system-ui, sans-serif",  // captions/body
    "files": ["brand/assets/Satoshi-Black.otf"] // optional self-hosted fonts to load
  },

  "captionStyle": "karaoke | block | minimal",  // default caption look for this channel
  "captionAccent": "#FF3366",                    // usually == colors.accent

  "intro": {
    "enabled": true,
    "type": "logo | lottie | video | none",
    "src": "brand/assets/intro.json",        // for lottie/video
    "durationSec": 1.2
  },

  "outro": {
    "enabled": true,
    "type": "cta-card | lottie | video",
    "headline": "Follow for more",
    "sub": "@yourhandle",
    "src": null,
    "durationSec": 2.5,
    "showSubscribe": true                     // platform-appropriate CTA
  },

  "musicVibe": "lofi | cinematic | upbeat | corporate | none", // default bg music direction
  "lowerThirdStyle": "bar | pill | underline"  // consistent name/label look
}
```

## Notes
- `handle`, `logo`, `intro`, and `outro` are the recognizability anchors — keep them stable across videos.
- `colors`/`fonts` are defaults; the storyboard `style` block starts from these. If a topic needs a different palette, keep the brand accent or logo so the channel stays identifiable, and note the deviation to the user.
- Self-hosted fonts in `fonts.files` should be loaded via `@remotion/fonts` `loadFont()` (or a `<link>` for Google Fonts) at the top of `Root.tsx` so they're available during render.
- Multiple channels: keep one JSON per channel (`default.json`, `cooking.json`, …) and pick the active one per job.

## Minimal example

```json
{
  "channel": "DevShorts",
  "handle": "@devshorts",
  "logo": { "src": "brand/assets/logo.png", "lockupSrc": null },
  "watermark": { "enabled": true, "element": "both", "position": "top-right", "opacity": 0.85, "scale": 1.0 },
  "colors": { "primary": "#0B0B0F", "accent": "#22D3EE", "accent2": "#A3E635", "textOnPrimary": "#FFFFFF" },
  "fonts": { "display": "Space Grotesk, sans-serif", "body": "Inter, sans-serif", "files": [] },
  "captionStyle": "karaoke",
  "captionAccent": "#22D3EE",
  "intro": { "enabled": true, "type": "logo", "src": null, "durationSec": 1.0 },
  "outro": { "enabled": true, "type": "cta-card", "headline": "Follow for daily dev tips", "sub": "@devshorts", "src": null, "durationSec": 2.2, "showSubscribe": true },
  "musicVibe": "lofi",
  "lowerThirdStyle": "pill"
}
```
