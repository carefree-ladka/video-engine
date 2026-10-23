#!/usr/bin/env bash
# F5-TTS doctor: checks every prerequisite for cloned-voice narration and reports
# exactly what's missing. Exit 0 = ready to run `npm run make -- <lang> --f5`.
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1

PY="${F5_PYTHON:-python3}"
GREEN=$'\033[32m'; RED=$'\033[31m'; YEL=$'\033[33m'; DIM=$'\033[2m'; RST=$'\033[0m'
ok(){ printf "  ${GREEN}✓${RST} %s\n" "$1"; }
bad(){ printf "  ${RED}✗${RST} %s\n" "$1"; FAIL=1; }
warn(){ printf "  ${YEL}!${RST} %s\n" "$1"; }
FAIL=0

echo "F5-TTS readiness check"
echo "${DIM}interpreter: $PY  (override with F5_PYTHON=/path/to/python3.12)${RST}"
echo

# 1. Python interpreter + version (PyTorch needs 3.9-3.13)
echo "Python"
if command -v "$PY" >/dev/null 2>&1; then
  PV="$($PY -c 'import sys;print("%d.%d"%sys.version_info[:2])' 2>/dev/null)"
  MAJ="${PV%%.*}"; MIN="${PV##*.}"
  if [ "$MAJ" = "3" ] && [ "$MIN" -ge 9 ] && [ "$MIN" -le 13 ]; then
    ok "$PY is Python $PV (PyTorch-compatible)"
  else
    bad "$PY is Python $PV — PyTorch needs 3.9-3.13. Install one (pyenv install 3.12) and set F5_PYTHON."
  fi
else
  bad "interpreter '$PY' not found. Install Python 3.12 and/or set F5_PYTHON."
  PV=""
fi
echo

# 2. Python packages: torch, torchaudio, f5-tts
echo "Python packages"
if [ -n "${PV:-}" ]; then
  for pkg in torch torchaudio f5_tts; do
    label="$pkg"; [ "$pkg" = "f5_tts" ] && label="f5-tts"
    if $PY -c "import $pkg" >/dev/null 2>&1; then
      ver="$($PY -c "import $pkg,sys; print(getattr($pkg,'__version__',''))" 2>/dev/null)"
      ok "$label installed ${DIM}$ver${RST}"
    else
      bad "$label not installed  ->  $PY -m pip install torch torchaudio f5-tts"
    fi
  done
  # compute device that F5 will use
  DEV="$($PY -c "import torch;print('cuda' if torch.cuda.is_available() else ('mps' if torch.backends.mps.is_available() else 'cpu'))" 2>/dev/null)"
  [ -n "$DEV" ] && warn "F5 will run on: $DEV ${DIM}(cpu is slow; mps/cuda recommended)${RST}"
else
  warn "skipped (no usable Python)"
fi
echo

# 3. Model weights cache (HuggingFace). Blocked networks must pre-cache or set HF_HUB_OFFLINE.
echo "Model weights"
HF_DIR="${HF_HOME:-$HOME/.cache/huggingface}"
if [ -d "$HF_DIR" ] && find "$HF_DIR" -iname '*F5*' -o -iname '*vocos*' 2>/dev/null | grep -qi .; then
  ok "found cached F5/vocoder weights in $HF_DIR"
else
  warn "no cached F5 weights in $HF_DIR"
  warn "F5 downloads from huggingface.co on first run. If HF is blocked, run once on an"
  warn "unrestricted network/VPN to cache them, or set HF_HOME + HF_HUB_OFFLINE=1."
fi
echo

# 4. Your reference recording + transcript
echo "Your voice reference"
if [ -f input/voice/reference.wav ]; then
  ok "input/voice/reference.wav present"
  if command -v "$(node -e 'process.stdout.write(require("ffprobe-static").path)' 2>/dev/null)" >/dev/null 2>&1 || true; then
    DUR="$(node -e 'const{path}=require("ffprobe-static");const{execFileSync}=require("child_process");try{process.stdout.write(execFileSync(path,["-v","error","-show_entries","format=duration","-of","default=nk=1:noprint_wrappers=1","input/voice/reference.wav"]).toString().trim())}catch(e){}' 2>/dev/null)"
    if [ -n "$DUR" ]; then
      SEC="${DUR%.*}"
      if [ "${SEC:-0}" -ge 6 ] && [ "${SEC:-0}" -le 20 ]; then ok "duration ${DUR}s (good: 8-15s ideal)"; else warn "duration ${DUR}s (aim for 8-15s)"; fi
    fi
  fi
else
  bad "input/voice/reference.wav missing — add a clean 8-15s recording of your voice."
fi
if [ -f input/voice/reference.txt ] && [ -s input/voice/reference.txt ]; then
  ok "input/voice/reference.txt present"
else
  bad "input/voice/reference.txt missing/empty — add the verbatim transcript of your recording."
fi
echo

# 5. Pipeline files
echo "Pipeline"
[ -f scripts/f5_infer.py ] && ok "scripts/f5_infer.py present" || bad "scripts/f5_infer.py missing"
echo

if [ "$FAIL" -eq 0 ]; then
  printf "${GREEN}READY${RST} — run: npm run make -- en --f5\n"
  exit 0
else
  printf "${RED}NOT READY${RST} — fix the ✗ items above. See scripts/F5-SETUP.md\n"
  exit 1
fi
