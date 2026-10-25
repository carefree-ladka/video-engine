// Code2Offer type system.
// - Montserrat ExtraBold  -> hooks / big titles
// - Inter                 -> long-form (16:9) captions + headings (clean, pro)
// - Poppins               -> Reels/Shorts (9:16) captions (friendly, punchy)
// - JetBrains Mono        -> code / terminal
// - Hind                  -> Devanagari fallback so Hindi never renders as boxes
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadHind } from "@remotion/google-fonts/Hind";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadFredoka } from "@remotion/google-fonts/Fredoka";
import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadUnbounded } from "@remotion/google-fonts/Unbounded";
import { loadFont as loadInstrument } from "@remotion/google-fonts/InstrumentSerif";

const { fontFamily: montserrat } = loadMontserrat("normal", {
  weights: ["700", "800"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});
const { fontFamily: inter } = loadInter("normal", {
  weights: ["500", "600", "700", "800"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});
const { fontFamily: poppins } = loadPoppins("normal", {
  weights: ["600", "700"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});
const { fontFamily: hind } = loadHind("normal", {
  weights: ["400", "700"],
  subsets: ["latin", "devanagari"],
  ignoreTooManyRequestsWarning: true,
});
const { fontFamily: playfair } = loadPlayfair("normal", {
  weights: ["700", "800", "900"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});
const { fontFamily: playfairItalic } = loadPlayfair("italic", {
  weights: ["700", "800"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});
const { fontFamily: anton } = loadAnton("normal", {
  weights: ["400"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});
const { fontFamily: fredoka } = loadFredoka("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});
// Modern display faces. Space Grotesk + Unbounded are variable (wght), so the
// kinetic headline can animate weight on entrance.
const { fontFamily: spaceGrotesk } = loadSpaceGrotesk("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});
const { fontFamily: unbounded } = loadUnbounded("normal", {
  weights: ["400", "600", "800", "900"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});
const { fontFamily: instrument } = loadInstrument("normal", {
  weights: ["400"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});
const { fontFamily: instrumentItalic } = loadInstrument("italic", {
  weights: ["400"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

// Role-based stacks.
export const DISPLAY = `${montserrat}, ${hind}, Inter, system-ui, sans-serif`; // hooks / titles
export const FONT = `${inter}, ${hind}, system-ui, sans-serif`; // default body / long-form captions
export const POPPINS = `${poppins}, ${hind}, system-ui, sans-serif`; // Reels/Shorts captions
export const INTER = `${inter}, ${hind}, system-ui, sans-serif`;
export const MONO = `${mono}, ui-monospace, "SF Mono", Menlo, monospace`;
export const SERIF = `${playfair}, Georgia, "Times New Roman", serif`; // editorial serif display
export const SERIF_ITALIC = `${playfairItalic}, Georgia, serif`;
export const HEAVY = `${anton}, ${montserrat}, Impact, sans-serif`; // poster / broadside headlines
export const ROUNDED = `${fredoka}, ${poppins}, ${hind}, system-ui, sans-serif`; // playful rounded display (Daisy Days)
export const GROTESK = `${spaceGrotesk}, ${inter}, ${hind}, system-ui, sans-serif`; // modern techy display
export const UNBOUNDED = `${unbounded}, ${montserrat}, ${hind}, system-ui, sans-serif`; // chunky rounded display
export const INSTRUMENT = `${instrument}, ${playfair}, Georgia, serif`; // light editorial serif display
export const INSTRUMENT_ITALIC = `${instrumentItalic}, ${playfairItalic}, Georgia, serif`;

// Map a look's font role to a real stack.
export type FontRole =
  | "montserrat"
  | "inter"
  | "poppins"
  | "serif"
  | "heavy"
  | "rounded"
  | "grotesk"
  | "unbounded"
  | "instrument";
export const fontFor = (role: FontRole): string => {
  switch (role) {
    case "serif":
      return SERIF;
    case "heavy":
      return HEAVY;
    case "rounded":
      return ROUNDED;
    case "grotesk":
      return GROTESK;
    case "unbounded":
      return UNBOUNDED;
    case "instrument":
      return INSTRUMENT;
    case "inter":
      return INTER;
    case "poppins":
      return POPPINS;
    default:
      return DISPLAY;
  }
};

// Variable fonts (support animating font-weight / wght). Used by the kinetic
// headline to animate weight on entrance only when it will actually tween.
export const VARIABLE_ROLES = new Set<FontRole>(["grotesk", "unbounded"]);
export const isVariableRole = (role: FontRole): boolean =>
  VARIABLE_ROLES.has(role);

// Caption face by orientation: Poppins for vertical Shorts/Reels, Inter for 16:9 long-form.
export const captionFont = (vertical: boolean): string =>
  vertical ? POPPINS : INTER;
