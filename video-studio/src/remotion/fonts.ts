// Modern type system. Space Grotesk for display, Plus Jakarta Sans for body,
// Hind as the Devanagari fallback (so Hindi still renders), JetBrains Mono for code.
import { loadFont as loadDisplay } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadBody } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as loadHind } from "@remotion/google-fonts/Hind";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: display } = loadDisplay("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});
const { fontFamily: body } = loadBody("normal", {
  weights: ["400", "600", "700", "800"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});
const { fontFamily: hind } = loadHind("normal", {
  weights: ["400", "700"],
  subsets: ["latin", "devanagari"],
  ignoreTooManyRequestsWarning: true,
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

export const DISPLAY = `${display}, ${hind}, Inter, system-ui, sans-serif`;
export const FONT = `${body}, ${hind}, Inter, system-ui, sans-serif`;
export const MONO = `${mono}, ui-monospace, "SF Mono", Menlo, monospace`;
