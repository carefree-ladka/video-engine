// Code2Offer caption identity: white captions, yellow for important words,
// cyan for technical/code tokens, on a dark stage. Three colours max per video
// keeps it readable and premium.

export const PALETTE = {
  white: "#FFFFFF",
  yellow: "#FFD43B",
  cyan: "#00D9FF",
  navy: "#0B1020",
  gray: "#C5CBD5",
  red: "#FF5C5C",
  green: "#39D98A",
  purple: "#8B7CFF",
} as const;

export type CaptionColors = {
  base: string; // ordinary spoken words
  keyword: string; // important/emphasised words
  technical: string; // code-like tokens (APIs, methods, keywords)
  activeBg: string; // karaoke highlight behind the current word
  activeFg: string; // text colour on the highlight
  outline: string; // text stroke
};

export const CODE2OFFER: CaptionColors = {
  base: PALETTE.white,
  keyword: PALETTE.yellow,
  technical: PALETTE.cyan,
  activeBg: PALETTE.yellow,
  activeFg: PALETTE.navy,
  outline: "#05070D",
};

// Common coding terms that read as "technical" even without obvious symbols.
const TECH_WORDS = new Set([
  "api",
  "async",
  "await",
  "promise",
  "useeffect",
  "usestate",
  "usememo",
  "usecallback",
  "useref",
  "react",
  "node",
  "nodejs",
  "javascript",
  "typescript",
  "python",
  "fastapi",
  "json",
  "http",
  "https",
  "rag",
  "llm",
  "ai",
  "gpt",
  "embedding",
  "embeddings",
  "vector",
  "token",
  "tokens",
  "const",
  "let",
  "var",
  "function",
  "return",
  "import",
  "export",
  "enumerate",
  "range",
  "len",
  "map",
  "filter",
  "reduce",
  "setinterval",
  "settimeout",
  "cleartimeout",
  "debounce",
  "throttle",
  "fetch",
  "axios",
  "dom",
  "css",
  "html",
  "sql",
  "cli",
  "sdk",
  "gpu",
  "cpu",
]);

// Does a token look like code? Symbols, camelCase, snake_case, call syntax,
// all-caps acronyms, or a known tech word. Surrounding quotes and sentence
// punctuation are stripped first so a normal word like "stop." stays base.
export function isTechnical(raw: string): boolean {
  const t = raw
    .trim()
    .replace(/^[("'`[{]+/, "")
    .replace(/[)"'`\]}.,!?;:]+$/, "");
  if (!t) return false;
  if (/\(\)|=>|::|[_/\\<>${}[\]()]/.test(t)) return true; // structural code punctuation
  if (/\w\.\w/.test(t)) return true; // method.call / file.ext (dot between word chars)
  if (/[a-z][A-Z]/.test(t)) return true; // camelCase
  if (/^[A-Z]{2,}$/.test(t.replace(/[^A-Za-z]/g, ""))) return true; // ACRONYM
  const w = t.toLowerCase().replace(/[^a-z0-9]/g, "");
  return TECH_WORDS.has(w);
}

export type TokenRole = "base" | "keyword" | "technical";

// Priority: technical (cyan) > keyword (yellow) > base (white).
export function roleFor(
  text: string,
  emphasis: boolean | undefined,
): TokenRole {
  if (isTechnical(text)) return "technical";
  if (emphasis) return "keyword";
  return "base";
}
