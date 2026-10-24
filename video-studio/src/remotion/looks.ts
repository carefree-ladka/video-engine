import { CaptionColors } from "./captionStyle";
import { fontFor, FontRole } from "./fonts";

// ---------------------------------------------------------------------------
// Art-direction "looks": hyperframes-style editorial frames expressed as design
// tokens (palette + typography + background treatment + decorations) that the
// scenes render generically. A storyboard opts in via style.look = "<id>".
// ---------------------------------------------------------------------------

export type BgTreatment =
  | "ink" // dark, flat
  | "grid-glow" // dark + hairline grid + accent glow (default Code2Offer)
  | "mesh" // dark + two accent blobs
  | "paper" // light warm paper + faint grain
  | "plane" // single flat colour plane (bg is the colour)
  | "grid" // light + graph-paper lines
  | "glow"; // light + accent glow behind the headline

export type LookDef = {
  id: string;
  palette: {
    bg: string;
    fg: string;
    accent: string;
    accent2?: string;
    card?: string;
  };
  bgVariant: BgTreatment;
  display: {
    role: FontRole;
    weight: number;
    uppercase?: boolean;
    italicAccent?: boolean; // paint the accent word in italic (serif looks)
    tracking?: string;
    lineHeight?: number;
  };
  body: { role: FontRole; weight?: number };
  deco?: {
    stickers?: boolean;
    border?: boolean;
    rule?: boolean;
    rotate?: number;
    grain?: boolean;
  };
  captionStyle?: "karaoke" | "block" | "minimal";
};

export const LOOKS: Record<string, LookDef> = {
  // our signature dark look (default)
  "code2offer": {
    id: "code2offer",
    palette: { bg: "#0E0B12", fg: "#F5F3F7", accent: "#F5A524", accent2: "#00D9FF" },
    bgVariant: "grid-glow",
    display: { role: "montserrat", weight: 800, tracking: "-0.02em", lineHeight: 1.02 },
    body: { role: "inter", weight: 500 },
    deco: { grain: true },
  },

  "bold-poster": {
    id: "bold-poster",
    palette: { bg: "#F5F0E6", fg: "#17120D", accent: "#D7261E", card: "#FFFFFF" },
    bgVariant: "paper",
    display: { role: "serif", weight: 800, italicAccent: true, tracking: "-0.01em", lineHeight: 1.0 },
    body: { role: "inter", weight: 500 },
    deco: { rule: true, grain: true },
  },

  "broadside": {
    id: "broadside",
    palette: { bg: "#E8481C", fg: "#141210", accent: "#141210", accent2: "#F6EFE2", card: "#F6EFE2" },
    bgVariant: "plane",
    display: { role: "heavy", weight: 400, tracking: "-0.01em", lineHeight: 0.95 },
    body: { role: "inter", weight: 600 },
    deco: { rule: true },
  },

  "coral": {
    id: "coral",
    palette: { bg: "#F15F5A", fg: "#161210", accent: "#161210", accent2: "#FFFFFF", card: "#FFFFFF" },
    bgVariant: "plane",
    display: { role: "heavy", weight: 400, uppercase: true, tracking: "-0.005em", lineHeight: 0.96 },
    body: { role: "inter", weight: 600 },
    deco: { rule: true },
  },

  "creative-mode": {
    id: "creative-mode",
    palette: { bg: "#F3EDE2", fg: "#141210", accent: "#FF3FA4", accent2: "#15B46B", card: "#FFFFFF" },
    bgVariant: "paper",
    display: { role: "heavy", weight: 400, uppercase: true, tracking: "-0.005em", lineHeight: 0.95 },
    body: { role: "inter", weight: 600 },
    deco: { stickers: true, grain: true },
  },

  "cobalt-grid": {
    id: "cobalt-grid",
    palette: { bg: "#F1ECE0", fg: "#22317A", accent: "#2742D8", accent2: "#8E9BE8", card: "#FFFFFF" },
    bgVariant: "grid",
    display: { role: "serif", weight: 800, italicAccent: true, tracking: "-0.01em", lineHeight: 1.0 },
    body: { role: "inter", weight: 500 },
    deco: { rule: true },
  },

  "capsule": {
    id: "capsule",
    palette: { bg: "#F3EDE2", fg: "#17120D", accent: "#F15F5A", accent2: "#15B46B", card: "#FFFFFF" },
    bgVariant: "paper",
    display: { role: "serif", weight: 800, italicAccent: true, tracking: "-0.01em", lineHeight: 1.0 },
    body: { role: "inter", weight: 500 },
    deco: { stickers: true, grain: true },
  },

  "biennale-yellow": {
    id: "biennale-yellow",
    palette: { bg: "#ECE6D8", fg: "#2B2A4A", accent: "#F2C200", accent2: "#2B2A4A", card: "#FFFFFF" },
    bgVariant: "glow",
    display: { role: "serif", weight: 800, italicAccent: true, tracking: "-0.01em", lineHeight: 1.0 },
    body: { role: "inter", weight: 500 },
    deco: { rule: true },
  },

  "blockframe": {
    id: "blockframe",
    palette: { bg: "#F3EDE2", fg: "#141210", accent: "#FF3FA4", accent2: "#27B0E6", card: "#FFFFFF" },
    bgVariant: "paper",
    display: { role: "heavy", weight: 400, uppercase: true, tracking: "-0.005em", lineHeight: 0.95 },
    body: { role: "inter", weight: 600 },
    deco: { border: true, rotate: -2, stickers: true, grain: true },
  },

  "blue-professional": {
    id: "blue-professional",
    palette: { bg: "#ECE9E0", fg: "#1A1A1A", accent: "#2B4AD7", accent2: "#9AA3B2", card: "#FFFFFF" },
    bgVariant: "paper",
    display: { role: "inter", weight: 800, tracking: "-0.02em", lineHeight: 1.04 },
    body: { role: "inter", weight: 500 },
    deco: { rule: true },
    captionStyle: "minimal",
  },

  "cartesian": {
    id: "cartesian",
    palette: { bg: "#EDEAE1", fg: "#1A1A1A", accent: "#1A1A1A", accent2: "#B9342B", card: "#FFFFFF" },
    bgVariant: "paper",
    display: { role: "serif", weight: 700, italicAccent: true, tracking: "0em", lineHeight: 1.04 },
    body: { role: "inter", weight: 500 },
    deco: { rule: true },
  },
};

export type RenderLook = {
  id: string;
  bg: string;
  fg: string;
  accent: string;
  accent2: string;
  muted: string;
  card: string;
  bgVariant: BgTreatment;
  light: boolean;
  displayFamily: string;
  displayWeight: number;
  displayUpper: boolean;
  italicAccent: boolean;
  displayTracking: string;
  displayLineHeight: number;
  bodyFamily: string;
  bodyWeight: number;
  deco: NonNullable<LookDef["deco"]>;
  captionStyle: "karaoke" | "block" | "minimal";
  captions: CaptionColors;
};

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.4126 * b;
}

function withAlpha(hex: string, aa: string): string {
  return `${hex}${aa}`;
}

function build(def: LookDef): RenderLook {
  const p = def.palette;
  const light = luminance(p.bg) > 0.55;
  const accent2 = p.accent2 ?? p.accent;
  const muted = light ? `${p.fg}99` : `${p.fg}9E`;
  // Captions: on light paper use ink text with a paper halo; on dark use white
  // with a dark halo. Keyword = accent, technical = accent2.
  const captions: CaptionColors = {
    base: p.fg,
    keyword: p.accent,
    technical: accent2,
    activeBg: p.accent,
    activeFg: light ? "#FFFFFF" : p.bg,
    outline: light ? withAlpha(p.bg, "FF") : "#05070D",
  };
  return {
    id: def.id,
    bg: p.bg,
    fg: p.fg,
    accent: p.accent,
    accent2,
    muted,
    card: p.card ?? (light ? "#FFFFFF" : "#15131C"),
    bgVariant: def.bgVariant,
    light,
    displayFamily: fontFor(def.display.role),
    displayWeight: def.display.weight,
    displayUpper: !!def.display.uppercase,
    italicAccent: !!def.display.italicAccent,
    displayTracking: def.display.tracking ?? "-0.02em",
    displayLineHeight: def.display.lineHeight ?? 1.02,
    bodyFamily: fontFor(def.body.role),
    bodyWeight: def.body.weight ?? 500,
    deco: def.deco ?? {},
    captionStyle: def.captionStyle ?? "karaoke",
    captions,
  };
}

// Resolve the look from a storyboard.style object. If style.look names a known
// look, use it fully. Otherwise fall back to the default look, allowing an
// explicit palette/background to override (keeps older storyboards working).
export function resolveLook(style: any = {}): RenderLook {
  const name = style?.look as string | undefined;
  if (name && LOOKS[name]) return build(LOOKS[name]);
  const base: LookDef = JSON.parse(JSON.stringify(LOOKS["code2offer"]));
  if (style?.palette) base.palette = { ...base.palette, ...style.palette };
  if (style?.background) base.bgVariant = style.background as BgTreatment;
  return build(base);
}
