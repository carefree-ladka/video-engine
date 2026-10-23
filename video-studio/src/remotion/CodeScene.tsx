import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { SafeZone } from "./SafeZone";
import { Background } from "./Background";
import { useEnter } from "./motion";
import { FONT, MONO, DISPLAY } from "./fonts";

type Scene = {
  text?: { heading?: string; bullets?: string[]; code?: string[] };
  durationSec?: number;
};
type Theme = { bg: string; fg: string; accent: string };

// Minimal JS tokenizer -> colored spans. Good enough for short code snippets.
const KEYWORDS = new Set([
  "function",
  "return",
  "let",
  "const",
  "var",
  "if",
  "else",
  "for",
  "while",
  "class",
  "new",
  "=>",
  "await",
  "async",
  "import",
  "from",
  "export",
  "default",
  "typeof",
  "of",
  "in",
  "this",
]);

type Tok = { text: string; color: string };

function tokenizeLine(line: string, theme: Theme): Tok[] {
  const toks: Tok[] = [];
  // order matters: comments, strings, numbers, words, symbols
  const re =
    /(\/\/[^\n]*)|(`[^`]*`|"[^"]*"|'[^']*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][A-Za-z0-9_$]*)|(=>)|([(){}\[\];,.:])|(\s+)|(.)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m[1])
      toks.push({ text: m[1], color: "#6B7280" }); // comment
    else if (m[2])
      toks.push({ text: m[2], color: "#F59E0B" }); // string
    else if (m[3])
      toks.push({ text: m[3], color: "#F97316" }); // number
    else if (m[4])
      toks.push({
        text: m[4],
        color: KEYWORDS.has(m[4]) ? theme.accent : "#E5E7EB",
      });
    // word/keyword
    else if (m[5])
      toks.push({ text: m[5], color: theme.accent }); // =>
    else if (m[6])
      toks.push({ text: m[6], color: "#94A3B8" }); // punctuation
    else if (m[7])
      toks.push({ text: m[7], color: "#E5E7EB" }); // whitespace
    else toks.push({ text: m[8] ?? "", color: "#E5E7EB" });
  }
  return toks;
}

export const CodeScene: React.FC<{ scene: Scene; theme: Theme }> = ({
  scene,
  theme,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const lines = scene.text?.code ?? scene.text?.bullets ?? [];
  const headingP = useEnter(0);

  // auto-size the font so the longest line fits the code card (no horizontal clipping)
  const maxLen = lines.reduce((m, l) => Math.max(m, l.length), 1);
  const innerWidth = width * 0.86 - 80; // safe-zone width minus card padding
  const fittedSize = Math.max(
    22,
    Math.min(46, Math.floor(innerWidth / (maxLen * 0.62))),
  );

  const code = lines.join("\n");
  const totalChars = code.length || 1;
  // typewriter: reveal over ~60% of the scene, then hold
  const durFrames = Math.max(1, Math.round((scene.durationSec || 4) * fps));
  const revealFrames = Math.max(1, Math.round(durFrames * 0.6));
  const shown = Math.floor(
    interpolate(frame, [6, revealFrames], [0, totalChars], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const caretOn = frame % 16 < 8 && shown < totalChars;

  // walk lines, revealing up to `shown` characters total
  let consumed = 0;
  const fontSize = fittedSize;

  return (
    <AbsoluteFill style={{ color: theme.fg, fontFamily: FONT }}>
      <Background theme={theme} variant={(theme as any).bgVariant} />
      <SafeZone center={false}>
        {scene.text?.heading ? (
          <h2
            style={{
              fontFamily: DISPLAY,
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginBottom: 36,
              opacity: headingP,
              transform: `translateY(${(1 - headingP) * 20}px)`,
            }}
          >
            {scene.text.heading}
          </h2>
        ) : null}

        <div
          style={{
            background: "#15151C",
            border: "1px solid #26262F",
            borderRadius: 20,
            padding: "36px 40px",
            fontFamily: MONO,
            fontSize,
            lineHeight: 1.5,
            boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
          }}
        >
          {lines.map((line, li) => {
            const toks = tokenizeLine(line, theme);
            const rendered: React.ReactNode[] = [];
            for (let ti = 0; ti < toks.length; ti++) {
              const t = toks[ti];
              if (consumed >= shown) break;
              const remaining = shown - consumed;
              const slice = t.text.slice(0, remaining);
              rendered.push(
                <span key={ti} style={{ color: t.color }}>
                  {slice}
                </span>,
              );
              consumed += t.text.length;
            }
            // account for the newline char between lines
            if (li < lines.length - 1) consumed += 1;
            const lineHasContent = rendered.length > 0;
            return (
              <div
                key={li}
                style={{ minHeight: fontSize * 1.5, whiteSpace: "pre" }}
              >
                {rendered}
                {lineHasContent && caretOn && consumed >= shown ? (
                  <span style={{ color: theme.accent }}>▋</span>
                ) : null}
              </div>
            );
          })}
        </div>
      </SafeZone>
    </AbsoluteFill>
  );
};
