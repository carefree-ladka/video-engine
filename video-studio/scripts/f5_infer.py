#!/usr/bin/env python3
"""
F5-TTS batch inference for the video pipeline.

Reads a manifest JSON and synthesises one WAV per scene in the user's CLONED voice,
loading the model only once. Fails loudly (non-zero exit + stderr) so the caller
never silently falls back to a different voice.

Manifest shape:
{
  "ref_audio": "input/voice/reference.wav",
  "ref_text":  "verbatim transcript of the reference clip",
  "out_dir":   "tmp/en/f5",
  "speed":     0.95,
  "nfe":       32,
  "scenes":    [ { "id": "s1", "text": "normalized narration ..." }, ... ]
}

Exit codes: 3 ref audio missing, 4 f5-tts/torch missing, 5 model load failed
(usually HuggingFace weight download blocked), 6 generation failed.
"""
import sys
import os
import json
import argparse


def err(msg: str, code: int):
    print(f"[f5] ERROR: {msg}", file=sys.stderr)
    sys.exit(code)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--manifest", required=True)
    args = ap.parse_args()

    with open(args.manifest, "r", encoding="utf-8") as f:
        m = json.load(f)

    ref_audio = m["ref_audio"]
    ref_text = (m.get("ref_text") or "").strip()
    out_dir = m["out_dir"]
    speed = float(m.get("speed", 0.95))
    nfe = int(m.get("nfe", 32))
    scenes = m["scenes"]

    if not os.path.exists(ref_audio):
        err(f"reference audio not found: {ref_audio} (add input/voice/reference.wav)", 3)
    if not ref_text:
        err("reference text is empty (add input/voice/reference.txt with the verbatim transcript)", 3)

    try:
        from f5_tts.api import F5TTS  # type: ignore
    except Exception as e:  # noqa
        err(
            "f5-tts / torch not importable. Use Python 3.11-3.13 and:\n"
            "  pip install torch torchaudio f5-tts\n"
            f"import error: {e}",
            4,
        )

    os.makedirs(out_dir, exist_ok=True)

    try:
        # device is auto-selected (cuda > mps > cpu). First run downloads weights from HuggingFace.
        f5 = F5TTS()
    except Exception as e:  # noqa
        err(
            "failed to load F5-TTS model. The weights download from HuggingFace — if your "
            "network blocks huggingface.co, pre-download the model and set HF_HOME, or run off-network.\n"
            f"load error: {e}",
            5,
        )

    for scene in scenes:
        out = os.path.join(out_dir, f"{scene['id']}.wav")
        text = (scene.get("text") or "").strip()
        if not text:
            continue
        try:
            # Short, punctuated text + remove_silence gives clean, human output with natural pauses.
            f5.infer(
                ref_file=ref_audio,
                ref_text=ref_text,
                gen_text=text,
                file_wave=out,
                speed=speed,
                nfe_step=nfe,
                cross_fade_duration=0.15,
                remove_silence=True,
            )
        except Exception as e:  # noqa
            err(f"generation failed for {scene['id']}: {e}", 6)
        print(f"[f5] ok {scene['id']} -> {out}", flush=True)

    print("[f5] DONE", flush=True)


if __name__ == "__main__":
    main()
