import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setConcurrency(1); // Single thread for maximum stability

// Increase browser timeout to prevent "Target closed" errors
Config.setDelayRenderTimeoutInMilliseconds(120000);

// Use system Chrome instead of bundled chrome-headless-shell (which crashes on Apple Silicon)
Config.setChromiumExecutablePath("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome");
Config.setChromiumDisableWebSecurity(false);
Config.setChromiumHeadlessMode(true);
