import fs from "node:fs";

// The renderer needs a Chromium. This project preferred system Chrome (the
// bundled chrome-headless-shell historically crashed on some Apple Silicon
// setups), but that binary isn't always installed. Resolve a browser that
// actually exists, falling back to Remotion's bundled shell (null => Remotion
// auto-detects/downloads it). Override with REMOTION_BROWSER if needed.
const CANDIDATES = [
  process.env.REMOTION_BROWSER,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
].filter(Boolean) as string[];

// Returns a path to a usable browser, or null to let Remotion use its bundled
// chrome-headless-shell.
export function resolveBrowser(): string | null {
  for (const p of CANDIDATES) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {
      /* ignore */
    }
  }
  return null;
}
