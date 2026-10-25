import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setConcurrency(1); // Single thread for maximum stability

// Increase browser timeout to prevent "Target closed" errors
Config.setDelayRenderTimeoutInMilliseconds(120000);

// Prefer system Chrome when present (the bundled headless shell historically
// crashed on some Apple Silicon setups), but only set it if the binary really
// exists — otherwise let Remotion use its bundled chrome-headless-shell.
import { existsSync } from "node:fs";
const SYSTEM_CHROME =
  process.env.REMOTION_BROWSER ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
if (existsSync(SYSTEM_CHROME)) Config.setChromiumExecutablePath(SYSTEM_CHROME);
Config.setChromiumDisableWebSecurity(false);
Config.setChromiumHeadlessMode(true);
