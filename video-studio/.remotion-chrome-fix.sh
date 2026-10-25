#!/bin/bash

# Workaround for Remotion chrome-headless-shell crashing on Apple M5
# This script removes the bundled chrome-headless-shell and creates a symlink
# to the system Chrome to force Remotion to use it.

REMOTION_CHROME_DIR="node_modules/.remotion/chrome-headless-shell/mac-arm64/chrome-headless-shell-mac-arm64"
SYSTEM_CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

if [ ! -f "$SYSTEM_CHROME" ]; then
    echo "Error: System Chrome not found at $SYSTEM_CHROME"
    exit 1
fi

if [ -d "$REMOTION_CHROME_DIR" ]; then
    echo "Backing up bundled chrome-headless-shell..."
    mv "$REMOTION_CHROME_DIR" "${REMOTION_CHROME_DIR}.bak" 2>/dev/null || true
fi

echo "Creating symlink to system Chrome..."
mkdir -p "$(dirname "$REMOTION_CHROME_DIR")"
ln -sf "$SYSTEM_CHROME" "$REMOTION_CHROME_DIR"

echo "Chrome fix applied successfully!"
