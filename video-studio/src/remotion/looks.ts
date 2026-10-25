import { CaptionColors } from "./captionStyle";
import { fontFor, FontRole, isVariableRole } from "./fonts";

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
  code2offer: {
    id: "code2offer",
    palette: {
      bg: "#0E0B12",
      fg: "#F5F3F7",
      accent: "#F5A524",
      accent2: "#00D9FF",
    },
    bgVariant: "grid-glow",
    display: {
      role: "montserrat",
      weight: 800,
      tracking: "-0.02em",
      lineHeight: 1.02,
    },
    body: { role: "inter", weight: 500 },
    deco: { grain: true },
  },

  // Populist Italian sports-magazine poster — newsprint, warm brown-black ink,
  // one tomato red. Shrikhand display + Libre Baskerville serif body.
  "bold-poster": {
    id: "bold-poster",
    palette: {
      bg: "#FFFFFF",
      fg: "#1C1410",
      accent: "#D8000F",
      accent2: "#D8000F",
      card: "#F5F2EF",
    },
    bgVariant: "paper",
    display: {
      role: "shrikhand",
      weight: 400,
      tracking: "0em",
      lineHeight: 1.0,
    },
    body: { role: "baskerville", weight: 400 },
    deco: { rule: true, grain: true },
  },

  // Protest-poster editorial — ink on fire. Massive Barlow, one fire-orange.
  broadside: {
    id: "broadside",
    palette: {
      bg: "#111111",
      fg: "#F0ECE5",
      accent: "#E85D26",
      accent2: "#E85D26",
      card: "#1A1A18",
    },
    bgVariant: "ink",
    display: {
      role: "barlow",
      weight: 900,
      tracking: "-0.04em",
      lineHeight: 0.92,
    },
    body: { role: "barlow", weight: 400 },
    deco: {},
  },

  // Solid planes, hard edges — coral fire / ink / cream, Bebas Neue caps.
  coral: {
    id: "coral",
    palette: {
      bg: "#E85D5D",
      fg: "#1A1A1A",
      accent: "#1A1A1A",
      accent2: "#F5F0E8",
      card: "#FFFFFF",
    },
    bgVariant: "plane",
    display: {
      role: "bebas",
      weight: 400,
      uppercase: true,
      tracking: "0.03em",
      lineHeight: 0.9,
    },
    body: { role: "inter", weight: 400 },
    deco: { rule: true },
  },

  // Cream + saturated candy accents, Archivo Black display, mono data.
  "creative-mode": {
    id: "creative-mode",
    palette: {
      bg: "#F3EDE2",
      fg: "#141210",
      accent: "#FF3F8E",
      accent2: "#15B46B",
      card: "#FFFFFF",
    },
    bgVariant: "paper",
    display: {
      role: "archivoBlack",
      weight: 400,
      uppercase: true,
      tracking: "-0.01em",
      lineHeight: 0.95,
    },
    body: { role: "inter", weight: 600 },
    deco: { stickers: true, grain: true },
  },

  // Two-color risograph — warm cream paper, electric cobalt, graph-paper grid.
  // Newsreader serif + Hanken Grotesk; size (not weight) makes hierarchy.
  "cobalt-grid": {
    id: "cobalt-grid",
    palette: {
      bg: "#F0EBDE",
      fg: "#1F2BE0",
      accent: "#1F2BE0",
      accent2: "#5560E5",
      card: "#FFFFFF",
    },
    bgVariant: "grid",
    display: {
      role: "newsreader",
      weight: 400,
      italicAccent: true,
      tracking: "-0.008em",
      lineHeight: 1.0,
    },
    body: { role: "hanken", weight: 400 },
    deco: { rule: true },
  },

  // Pill-shaped editorial — cream paper, candy palette, Bodoni Moda headlines,
  // Space Grotesk body.
  capsule: {
    id: "capsule",
    palette: {
      bg: "#F5F5F0",
      fg: "#1A1A1A",
      accent: "#E85D4E",
      accent2: "#A06CE8",
      card: "#FFFFFF",
    },
    bgVariant: "paper",
    display: {
      role: "bodoni",
      weight: 800,
      tracking: "-0.02em",
      lineHeight: 1.0,
    },
    body: { role: "grotesk", weight: 500 },
    deco: { stickers: true, grain: true },
  },

  // Literary biennale catalogue — warm parchment, indigo ink, solar-yellow
  // bloom. Instrument Serif display + Archivo body, 1px hairline rules.
  "biennale-yellow": {
    id: "biennale-yellow",
    palette: {
      bg: "#E9E5DB",
      fg: "#1B2566",
      accent: "#F1EE2E",
      accent2: "#E26B4A",
      card: "#FFFFFF",
    },
    bgVariant: "glow",
    display: {
      role: "instrument",
      weight: 400,
      italicAccent: true,
      tracking: "-0.018em",
      lineHeight: 0.86,
    },
    body: { role: "archivo", weight: 400 },
    deco: { rule: true },
    captionStyle: "minimal",
  },

  // Maximalist neobrutalist — off-white ground, 4px ink borders, hard offset
  // shadows, five candy pastels, Inter 900 uppercase display.
  blockframe: {
    id: "blockframe",
    palette: {
      bg: "#FFFDF5",
      fg: "#1A1A1A",
      accent: "#FE90E8",
      accent2: "#99E885",
      card: "#FFFFFF",
    },
    bgVariant: "paper",
    display: {
      role: "inter",
      weight: 900,
      uppercase: true,
      tracking: "-0.03em",
      lineHeight: 0.95,
    },
    body: { role: "inter", weight: 500 },
    deco: { border: true, rotate: -2, stickers: true, grain: true },
  },

  // Consulting-grade — warm cream, one saturated cobalt accent, Space Grotesk
  // display + Inter body, soft tinted cards.
  "blue-professional": {
    id: "blue-professional",
    palette: {
      bg: "#FDFAE7",
      fg: "#111111",
      accent: "#1E2BFA",
      accent2: "#1E2BFA",
      card: "#FFFFFF",
    },
    bgVariant: "paper",
    display: {
      role: "grotesk",
      weight: 700,
      tracking: "-0.02em",
      lineHeight: 1.04,
    },
    body: { role: "inter", weight: 400 },
    deco: { rule: true },
    captionStyle: "minimal",
  },

  // Quiet museum-catalog — five warm stones + ink, Playfair + Inter, taupe
  // accents and 1px hairlines. No populist colour; stone and ink only.
  cartesian: {
    id: "cartesian",
    palette: {
      bg: "#EDE8E0",
      fg: "#1A1A1A",
      accent: "#8A8178",
      accent2: "#B8B0A4",
      card: "#FFFFFF",
    },
    bgVariant: "paper",
    display: {
      role: "serif",
      weight: 700,
      tracking: "0em",
      lineHeight: 1.04,
    },
    body: { role: "inter", weight: 400 },
    deco: { rule: true },
    captionStyle: "minimal",
  },

  // Sunny-garden pastels, charcoal outlines + hard offset shadows, rounded
  // Fredoka display. Playful, warm, high-energy.
  "daisy-days": {
    id: "daisy-days",
    palette: {
      bg: "#FFF3D4",
      fg: "#2C2A26",
      accent: "#F76C9C",
      accent2: "#6FBF73",
      card: "#FFFFFF",
    },
    bgVariant: "glow",
    display: {
      role: "rounded",
      weight: 700,
      tracking: "-0.01em",
      lineHeight: 1.0,
    },
    body: { role: "poppins", weight: 600 },
    deco: { border: true, stickers: true, grain: true },
  },

  // Green/pink/cream editorial triad, serif display with an italic accent word,
  // hairline rules. Calm, premium, magazine-like.
  "editorial-forest": {
    id: "editorial-forest",
    palette: {
      bg: "#F3EFE6",
      fg: "#1E3A2B",
      accent: "#2E6E4E",
      accent2: "#E68AAE",
      card: "#FFFFFF",
    },
    bgVariant: "paper",
    display: {
      role: "serif",
      weight: 800,
      italicAccent: true,
      tracking: "-0.01em",
      lineHeight: 1.0,
    },
    body: { role: "inter", weight: 500 },
    deco: { rule: true, grain: true },
    captionStyle: "minimal",
  },

  // --- Modern display looks (variable type + kinetic-friendly) ---------------

  // Techy dark grotesk: Space Grotesk, tight tracking, mint/blue accents.
  "neo-grotesk": {
    id: "neo-grotesk",
    palette: {
      bg: "#0B0F14",
      fg: "#F2F5F7",
      accent: "#7CF5C4",
      accent2: "#5B8CFF",
      card: "#141A21",
    },
    bgVariant: "mesh",
    display: {
      role: "grotesk",
      weight: 700,
      tracking: "-0.03em",
      lineHeight: 1.0,
    },
    body: { role: "inter", weight: 500 },
    deco: {},
  },

  // Chunky poster pop: Unbounded display, electric palette on near-black.
  ultra: {
    id: "ultra",
    palette: {
      bg: "#111018",
      fg: "#FFFFFF",
      accent: "#FF5DA2",
      accent2: "#FFD23F",
      card: "#1B1A24",
    },
    bgVariant: "grid-glow",
    display: {
      role: "unbounded",
      weight: 800,
      tracking: "-0.02em",
      lineHeight: 0.98,
    },
    body: { role: "inter", weight: 600 },
    deco: {},
  },

  // Light editorial with Instrument Serif display — airy, premium, modern.
  instrument: {
    id: "instrument",
    palette: {
      bg: "#F7F4ED",
      fg: "#1A1A1A",
      accent: "#C8452F",
      accent2: "#8A8578",
      card: "#FFFFFF",
    },
    bgVariant: "glow",
    display: {
      role: "instrument",
      weight: 400,
      italicAccent: true,
      tracking: "0em",
      lineHeight: 0.98,
    },
    body: { role: "inter", weight: 500 },
    deco: { rule: true },
    captionStyle: "minimal",
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
  displayRole: FontRole;
  displayVariable: boolean;
  bodyFamily: string;
  bodyWeight: number;
  deco: NonNullable<LookDef["deco"]>;
  captionStyle: "karaoke" | "block" | "minimal";
  captions: CaptionColors;
};

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
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
    displayRole: def.display.role,
    displayVariable: isVariableRole(def.display.role),
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
  // Let a storyboard pick a display face directly (e.g. style.displayFont:
  // "grotesk" | "unbounded" | "instrument" | "serif" | ...) without authoring
  // a whole look.
  if (style?.displayFont) base.display.role = style.displayFont as FontRole;
  return build(base);
}
