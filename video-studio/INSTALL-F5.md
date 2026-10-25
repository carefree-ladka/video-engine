# F5-TTS Voice Cloning Setup Guide

Your voice files are ready:
- ✅ `input/voice/reference.wav` (10 seconds)
- ✅ `input/voice/reference.txt` (transcript)

Now you need to install Python 3.12 for F5-TTS (your current Python 3.14 is too new for PyTorch).

## Quick Setup (Recommended)

### Step 1: Install pyenv
```bash
brew install pyenv
```

### Step 2: Add pyenv to your shell
Add these lines to your `~/.zshrc`:
```bash
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"
```

Then reload your shell:
```bash
source ~/.zshrc
```

### Step 3: Install Python 3.12
```bash
pyenv install 3.12.7
```

### Step 4: Set Python 3.12 for this project
```bash
cd /Users/pawankumar/video-engine/video-studio
pyenv local 3.12.7
```

### Step 5: Install F5-TTS
```bash
pip install torch torchaudio f5-tts
```

### Step 6: Test your setup
```bash
./scripts/check-f5.sh
```

## Alternative: Use a Virtual Environment

If you prefer not to use pyenv:

```bash
# Download Python 3.12 from python.org
# Then create a virtual environment:
/path/to/python3.12 -m venv venv-f5
source venv-f5/bin/activate
pip install torch torchaudio f5-tts

# Set F5_PYTHON in your .env
echo "F5_PYTHON=$(pwd)/venv-f5/bin/python" >> .env
```

## Usage

Once setup is complete, generate videos with your cloned voice:

```bash
# English video with your voice
npm run make -- en --f5

# Hindi video with your voice (F5 supports multilingual)
npm run make -- hi --f5
```

**First run:** F5-TTS will download ~500MB of model weights from HuggingFace. Make sure you have unrestricted internet access.

**Important:** If F5-TTS can't run (missing dependencies, network issues), the pipeline will STOP with an error rather than falling back to a robotic voice. This ensures you never accidentally publish a video without your voice.

## Troubleshooting

### Error: "HuggingFace blocked"
Run the first generation on a VPN or unrestricted network. After the model downloads once, it works offline.

### Error: "torch not compatible"
Make sure you're using Python 3.11-3.13. Check with: `python --version`

### Error: "reference audio not found"
Make sure `input/voice/reference.wav` exists and is readable.

## Tips for Best Results

1. **Keep scripts short and punctuated** - Commas and periods become natural pauses
2. **Use the normalize pipeline** - It expands symbols and code terms for correct pronunciation
3. **Adjust pacing** - Edit `F5.speed` in `src/config.ts` (default: 0.95 = slightly slower/calmer)
4. **Scene pauses** - Edit `F5.scenePauseMs` for breathing gaps between scenes (default: 260ms)

Your reference recording already has good pacing and tone - F5 will clone that style!
