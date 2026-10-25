#!/bin/bash
# Setup script for F5-TTS voice cloning

set -e

echo "🎙️  F5-TTS Setup Script"
echo "====================="
echo ""

# Check current Python version
CURRENT_PY=$(python3 --version 2>&1 | awk '{print $2}')
echo "Current Python: $CURRENT_PY"

# Check if we need a different Python
if [[ "$CURRENT_PY" =~ ^3\.(1[1-3])\. ]]; then
    echo "✅ Python version is compatible with PyTorch"
    PY_CMD="python3"
else
    echo "⚠️  Python $CURRENT_PY is not compatible (need 3.11-3.13)"
    echo ""
    echo "Please install Python 3.12 using one of these methods:"
    echo ""
    echo "Option 1 - pyenv (recommended):"
    echo "  brew install pyenv"
    echo "  pyenv install 3.12.7"
    echo "  cd $(pwd)"
    echo "  pyenv local 3.12.7"
    echo ""
    echo "Option 2 - conda:"
    echo "  conda create -n f5 python=3.12 -y"
    echo "  conda activate f5"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo ""
echo "📦 Installing F5-TTS and dependencies..."
echo ""

# Check if torch is installed
if $PY_CMD -c "import torch" 2>/dev/null; then
    echo "✅ PyTorch already installed"
else
    echo "Installing PyTorch..."
    $PY_CMD -m pip install torch torchaudio --quiet
fi

# Check if f5_tts is installed
if $PY_CMD -c "import f5_tts" 2>/dev/null; then
    echo "✅ F5-TTS already installed"
else
    echo "Installing F5-TTS..."
    $PY_CMD -m pip install f5-tts --quiet
fi

echo ""
echo "🧪 Testing F5-TTS installation..."
$PY_CMD -c "from f5_tts.api import F5TTS; print('✅ F5-TTS imports successfully')"

echo ""
echo "✅ Setup complete!"
echo ""
echo "To use F5-TTS with your cloned voice, run:"
echo "  npm run make -- en --f5"
echo ""
echo "On first run, F5-TTS will download model weights (~500MB) from HuggingFace."
echo "Make sure you have an unrestricted internet connection for the first run."
