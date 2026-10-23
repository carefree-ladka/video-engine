# Setting up F5-TTS (cloned voice)

F5-TTS clones your voice locally from a short recording. It needs a PyTorch-compatible
Python and the model weights. On this machine two things currently block it:

1. **Python 3.15 is too new for PyTorch** (supports ~3.9–3.13). Install a 3.12.
2. **HuggingFace is blocked by the network proxy** — F5 downloads weights from HF on first run.

## One-time setup

### 1. Get a compatible Python (3.12)
Pick any of these:
- pyenv: `pyenv install 3.12.7 && pyenv local 3.12.7`
- or conda/mamba: `conda create -n f5 python=3.12 -y && conda activate f5`
- or an official python.org 3.12 installer

### 2. Install F5-TTS + torch (in that Python)
```bash
pip install torch torchaudio        # CPU/MPS build is fine on macOS
pip install f5-tts
```
Point the pipeline at this interpreter:
```bash
export F5_PYTHON=/path/to/python3.12   # e.g. the pyenv/conda python
```

### 3. Get the model weights (works around the HF block)
F5 pulls `SWivid/F5-TTS` + a vocoder from HuggingFace on first run. If HF is blocked:
- **Best:** run the first generation once on an unrestricted network/VPN so weights cache into
  `~/.cache/huggingface`. After that it runs fully offline.
- **Or** set `HF_HOME` to a folder where you've manually placed the model, and
  `export HF_HUB_OFFLINE=1` to force offline use.

### 4. Add your recording
See `input/voice/README.md` — add `reference.wav` (8–15s of you) and `reference.txt` (its transcript).

## Run
```bash
npm run make -- en --f5          # English, your cloned voice
npm run make -- hi --f5          # Hindi, your cloned voice (F5 supports multilingual refs)
```
If F5 can't run, the command STOPS with a clear error — it never silently uses a robot voice.

## Why it sounds human here
- Narration is normalized (symbols/Big-O expanded) so it never mispronounces code.
- Generated per scene with `remove_silence`, then a short breathing pause is appended between scenes.
- `speed: 0.95` for a calmer delivery; your reference clip's tone and pacing carry through.
- Keep sentences in the script short and punctuated — commas and periods become natural pauses.
