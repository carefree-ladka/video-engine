# Platform specifications

Numbers are safe, widely-supported defaults. Platforms accept ranges; these are the recommended production targets.

## YouTube (long-form / landscape)
- Resolution: 1920×1080 (1080p). Use 3840×2160 only if source assets are 4K.
- Aspect: 16:9 · FPS: 30 (use 60 for gameplay/motion-heavy) · Codec: H.264 high profile, AAC audio.
- Duration: no practical limit. Hook within first 5s.

## YouTube Shorts
- Resolution: 1080×1920 · Aspect: 9:16 · FPS: 30.
- Duration: keep ≤ 60s for classic Shorts behavior (platform now allows up to 3 min, but 60s is the safe default).
- Must be vertical/square to be treated as a Short.

## Instagram Reels
- Resolution: 1080×1920 · Aspect: 9:16 · FPS: 30.
- Duration: up to 90s. Sweet spot 15–30s.

## Instagram Stories
- Resolution: 1080×1920 · Aspect: 9:16 · FPS: 30.
- Duration: 60s per segment (auto-splits).

## Instagram Feed (portrait)
- Resolution: 1080×1350 · Aspect: 4:5 · FPS: 30.
- Portrait 4:5 occupies the most feed real estate.

## Instagram Feed (square)
- Resolution: 1080×1080 · Aspect: 1:1 · FPS: 30.

## Safe zones (vertical 9:16)
Platform UI (captions, profile, buttons, progress bar) overlaps the edges. Keep essential text and graphics inside:
- Top margin: ~10% (≈ 190px at 1920 tall) — avoid the top for key info.
- Bottom margin: ~20% (≈ 380px) — reserved for platform caption + action buttons.
- Side margins: ~6% (≈ 65px at 1080 wide).
The `SafeZone` component applies these automatically based on the active preset.

## Encoding (final FFmpeg pass)
- Video: `-c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p` (yuv420p is required for broad playback compatibility).
- Audio: `-c:a aac -b:a 192k`.
- Faststart for web/streaming: `-movflags +faststart`.
- Loudness: normalize narration to about -14 LUFS for social (`loudnorm` filter).
