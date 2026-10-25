#!/bin/bash
# Quick installer for F5-TTS with Python 3.12 via pyenv

set -e

echo "🎙️  F5-TTS Python 3.12 Setup"
echo "=============================="
echo ""

# Check if pyenv is installed
if ! command -v pyenv &> /dev/null; then
    echo "📦 Installing pyenv..."
    brew install pyenv
    
    echo ""
    echo "⚙️  Configuring shell..."
    
    # Add to .zshrc if not already there
    if ! grep -q 'PYENV_ROOT' ~/.zshrc 2>/dev/null; then
        echo '' >> ~/.zshrc
        echo '# pyenv configuration' >> ~/.zshrc
        echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.zshrc
        echo 'export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.zshrc
        echo 'eval "$(pyenv init -)"' >> ~/.zshrc
    fi
    
    # Initialize pyenv for current session
    export PYENV_ROOT="$HOME/.pyenv"
    export PATH="$PYENV_ROOT/bin:$PATH"
    eval "$(pyenv init -)"
    
    echo "✅ pyenv installed and configured"
else
    echo "✅ pyenv already installed"
    eval "$(pyenv init -)"
fi

echo ""
echo "📦 Installing Python 3.12.7..."

# Install Python 3.12 if not already installed
if ! pyenv versions | grep -q 3.12.7; then
    pyenv install 3.12.7
    echo "✅ Python 3.12.7 installed"
else
    echo "✅ Python 3.12.7 already installed"
fi

echo ""
echo "🔧 Setting Python 3.12.7 for this project..."
cd "$(dirname "$0")/.."
pyenv local 3.12.7

echo ""
echo "📦 Installing F5-TTS and dependencies..."
python -m pip install --upgrade pip --quiet
python -m pip install torch torchaudio f5-tts --quiet

echo ""
echo "🧪 Testing installation..."
python -c "from f5_tts.api import F5TTS; print('✅ F5-TTS imports successfully')"
python -c "import torch; print('✅ PyTorch device:', 'cuda' if torch.cuda.is_available() else ('mps' if torch.backends.mps.is_available() else 'cpu'))"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Run the readiness check:"
echo "  ./scripts/check-f5.sh"
echo ""
echo "Generate a video with your cloned voice:"
echo "  npm run make -- en --f5"
echo ""
echo "⚠️  Important: Close and reopen your terminal for pyenv to work in new sessions."
