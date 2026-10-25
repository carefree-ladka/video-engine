import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";
import { FitStage } from "./Stage";
import { Card } from "./Card";
import { Background } from "./Background";
import { useEnter, EASING } from "./motion";
import { FONT, MONO, DISPLAY } from "./fonts";

type Highlight = {
  line: number; // 1-based line in text.code
  start?: number; // scene-local seconds; default: after the typewriter
  dur?: number; // seconds; default: until scene end
  color?: string;
};
type Scene = {
  text?: {
    heading?: string;
    bullets?: string[];
    code?: string[];
    windowLabel?: string;
    footnote?: string;
    // NEW: size controls
    fontSize?: number; // absolute px (overrides auto-fit)
    codeScale?: number; // multiply the auto-fitted size (e.g. 1.3)
    wrap?: boolean; // allow long lines to wrap (lets fontSize/codeScale grow)
    // NEW: real result shown in an output panel with a pop
    output?: string | string[];
    outputLabel?: string; // e.g. "output" / ">>>"
    // NEW: line highlights synced to narration
    highlights?: Highlight[];
    // NEW: error state — red border on `line`, a red error in the output, and
    // a one-shot card shake when it triggers (`at` seconds, default: after typing).
    error?: {
      line?: number; // 1-based code line to flag red
      at?: number; // scene-local seconds the error "fires"
      message?: string; // error text shown in the (red) output panel
      shake?: boolean; // card vibrate on trigger (default true)
    };
  };
  durationSec?: number;
};

const ERR = "#FF5C5C";
type Theme = { bg: string; fg: string; accent: string };

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
  // python-ish
  "def",
  "lambda",
  "yield",
  "with",
  "as",
  "not",
  "and",
  "or",
  "None",
  "True",
  "False",
]);

type Tok = { text: string; color: string };

function tokenizeLine(line: string, theme: Theme): Tok[] {
  const toks: Tok[] = [];
  const re =
    /(\/\/[^\n]*|#[^\n]*)|(`[^`]*`|"[^"]*"|'[^']*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][A-Za-z0-9_$]*)|(=>)|([(){}\[\];,.:])|(\s+)|(.)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m[1]) toks.push({ text: m[1], color: "#6B7280" });
    else if (m[2]) toks.push({ text: m[2], color: "#F59E0B" });
    else if (m[3]) toks.push({ text: m[3], color: "#F97316" });
    else if (m[4])
      toks.push({
        text: m[4],
        color: KEYWORDS.has(m[4]) ? theme.accent : "#E5E7EB",
      });
    else if (m[5]) toks.push({ text: m[5], color: theme.accent });
    else if (m[6]) toks.push({ text: m[6], color: "#94A3B8" });
    else if (m[7]) toks.push({ text: m[7], color: "#E5E7EB" });
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

  // Auto-size the font so the longest line fits — now biased LARGER (the old
  // 46px cap read tiny on a 1080px frame). `fontSize` overrides outright;
  // `codeScale` multiplies the fitted size.
  const maxLen = lines.reduce((m, l) => Math.max(m, l.length), 1);
  const innerWidth = width * 0.86 - 80;
  // Largest size that still fits the longest line on one row.
  const fitSize = Math.max(
    24,
    Math.min(60, Math.floor(innerWidth / (maxLen * 0.62))),
  );
  const wrap = scene.text?.wrap === true;
  const desired =
    scene.text?.fontSize ?? Math.round(fitSize * (scene.text?.codeScale ?? 1));
  // Without `wrap`, clamp to the fit size so codeScale/fontSize can never clip
  // a line off the right edge.
  const fontSize = wrap ? desired : Math.min(desired, fitSize);

  const code = lines.join("\n");
  const totalChars = code.length || 1;
  const durFrames = Math.max(1, Math.round((scene.durationSec || 4) * fps));
  const revealFrames = Math.max(1, Math.round(durFrames * 0.5));
  const shown = Math.floor(
    interpolate(frame, [6, revealFrames], [0, totalChars], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.ease),
    }),
  );
  const caretOn = frame % 16 < 8 && shown < totalChars;
  const typedDone = shown >= totalChars;

  const windowLabel = scene.text?.windowLabel ?? "example";
  const footnote = scene.text?.footnote;

  // --- error state ----------------------------------------------------------
  const err = scene.text?.error;
  const isError = err != null;
  const errorAtF = err
    ? err.at != null
      ? err.at * fps
      : revealFrames + 4
    : -1;
  const errorActive = isError && frame >= errorAtF;
  // one-shot damped horizontal shake when the error fires
  const shakeDecay = interpolate(frame, [errorAtF, errorAtF + 16], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shakeX =
    isError && err.shake !== false && errorActive
      ? Math.sin((frame - errorAtF) * 1.7) * 16 * shakeDecay
      : 0;

  // --- output panel ---------------------------------------------------------
  const baseOutput =
    scene.text?.output == null
      ? []
      : Array.isArray(scene.text.output)
        ? scene.text.output
        : [scene.text.output];
  const outputLines = isError
    ? err.message
      ? [err.message]
      : baseOutput
    : baseOutput;
  const hasOutput = outputLines.length > 0;
  // output (or error) appears after typing / at the error moment, with a pop
  const outStartF = isError ? errorAtF + 1 : revealFrames + 4;
  const outPop = interpolate(frame, [outStartF, outStartF + 10], [0.6, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASING.overshoot,
  });
  const outOp = interpolate(frame, [outStartF, outStartF + 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- line highlights ------------------------------------------------------
  const highlights = scene.text?.highlights ?? [];
  const highlightFor = (lineIdx1: number): { on: number; color: string } => {
    let on = 0;
    let color = theme.accent;
    for (const h of highlights) {
      if (h.line !== lineIdx1) continue;
      const startF = h.start != null ? h.start * fps : revealFrames;
      const endF = h.dur != null ? startF + h.dur * fps : durFrames;
      const a = interpolate(frame, [startF, startF + 5], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      const b = interpolate(frame, [endF, endF + 5], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      on = Math.max(on, Math.min(a, b));
      if (h.color) color = h.color;
    }
    return { on, color };
  };

  const estHeight =
    (scene.text?.heading ? 64 * 1.2 + 36 : 0) +
    72 +
    Math.max(1, lines.length) * (fontSize * 1.5) +
    (hasOutput ? outputLines.length * (fontSize * 0.95) + 90 : 0) +
    (footnote ? 64 : 0);

  let consumed = 0;

  return (
    <AbsoluteFill style={{ color: theme.fg, fontFamily: FONT }}>
      <Background theme={theme} variant={(theme as any).bgVariant} />
      <FitStage estHeight={estHeight + 58}>
        {scene.text?.heading ? (
          <h2
            style={{
              fontFamily: DISPLAY,
              fontSize: 64,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: 32,
              opacity: headingP,
              transform: `translateY(${(1 - headingP) * 20}px)`,
            }}
          >
            {scene.text.heading}
          </h2>
        ) : null}

        <div style={{ transform: `translateX(${shakeX.toFixed(2)}px)` }}>
          <Card
            radius={20}
            style={{
              overflow: "hidden",
              boxShadow: errorActive
                ? `0 0 0 3px ${ERR}, 0 0 44px -6px ${ERR}`
                : undefined,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "16px 22px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.04), transparent)",
              }}
            >
              {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
                <span
                  key={c}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 999,
                    background: c,
                    boxShadow: `0 0 10px ${c}66`,
                  }}
                />
              ))}
              <span
                style={{
                  marginLeft: 10,
                  fontFamily: MONO,
                  fontSize: 22,
                  color: "rgba(245,243,247,0.5)",
                }}
              >
                {windowLabel}
              </span>
            </div>

            <div
              style={{
                padding: "30px 40px 36px",
                fontFamily: MONO,
                fontSize,
                lineHeight: 1.55,
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
                if (li < lines.length - 1) consumed += 1;
                const lineHasContent = rendered.length > 0;
                const hl = highlightFor(li + 1);
                const isErrLine =
                  isError && err?.line === li + 1 && errorActive;
                return (
                  <div
                    key={li}
                    style={{
                      position: "relative",
                      minHeight: fontSize * 1.5,
                      borderRadius: 8,
                      margin: "0 -10px",
                      padding: "0 10px",
                      background: isErrLine
                        ? `${ERR}26`
                        : hl.on > 0
                          ? `${hl.color}22`
                          : "transparent",
                      boxShadow: isErrLine
                        ? `inset 0 0 0 2px ${ERR}`
                        : hl.on > 0
                          ? `inset 3px 0 0 ${hl.color}`
                          : "none",
                      whiteSpace: wrap ? "pre-wrap" : "pre",
                      wordBreak: wrap ? "break-word" : "normal",
                      opacity: 1,
                    }}
                  >
                    {rendered}
                    {lineHasContent && caretOn && consumed >= shown ? (
                      <span style={{ color: theme.accent }}>▋</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {hasOutput ? (
          <div
            style={{
              marginTop: 18,
              transform: `scale(${outPop})`,
              opacity: outOp,
              transformOrigin: "center top",
            }}
          >
            <Card
              radius={16}
              style={{
                overflow: "hidden",
                boxShadow: isError ? `inset 0 0 0 2px ${ERR}66` : undefined,
              }}
            >
              <div
                style={{
                  padding: "14px 24px",
                  fontFamily: MONO,
                  fontSize: Math.round(fontSize * 0.86),
                  lineHeight: 1.5,
                  color: isError ? "#FF9B9B" : "#9FE7C4",
                }}
              >
                <span
                  style={{
                    fontFamily: FONT,
                    fontSize: 22,
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: isError ? ERR : "rgba(245,243,247,0.45)",
                    marginRight: 14,
                  }}
                >
                  {scene.text?.outputLabel ?? (isError ? "error" : "output")}
                </span>
                {outputLines.map((o, i) => (
                  <div key={i} style={{ whiteSpace: "pre-wrap" }}>
                    {o}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : null}

        {footnote ? (
          <div
            style={{
              marginTop: 22,
              fontFamily: FONT,
              fontSize: 30,
              fontWeight: 500,
              lineHeight: 1.3,
              color: (theme as any).muted ?? "rgba(245,243,247,0.6)",
              opacity: headingP,
            }}
          >
            {footnote}
          </div>
        ) : null}
      </FitStage>
    </AbsoluteFill>
  );
};
