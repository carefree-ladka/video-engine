// Shared text analysis for thumbnails + social metadata: pull the words out of
// a storyboard, rank keywords, and detect the tech stack so we can pick an
// accent word, a thumbnail badge, and sensible hashtags.

export type Storyboard = any;

const STOP = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "to",
  "of",
  "in",
  "on",
  "for",
  "is",
  "are",
  "it",
  "that",
  "this",
  "with",
  "as",
  "at",
  "be",
  "was",
  "you",
  "your",
  "me",
  "my",
  "so",
  "can",
  "how",
  "why",
  "what",
  "when",
  "then",
  "than",
  "from",
  "by",
  "use",
  "using",
  "it's",
  "its",
  "into",
  "out",
  "up",
  "down",
  "get",
  "got",
  "do",
  "does",
  "if",
  "no",
  "yes",
  "just",
  "like",
  "more",
  "most",
  "each",
  "per",
  "every",
  "will",
  "once",
  "after",
  "before",
  "they",
  "them",
  "we",
  "our",
]);

const TECH = new Set([
  "api",
  "async",
  "await",
  "promise",
  "promises",
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
  "closure",
  "closures",
  "return",
  "import",
  "export",
  "enumerate",
  "range",
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
  "settimeout",
  "cleartimeout",
  "setinterval",
  "event",
  "events",
  "callback",
  "hook",
  "hooks",
  "state",
  "props",
  "component",
  "render",
  "array",
  "object",
  "string",
  "number",
  "loop",
  "recursion",
  "algorithm",
  "bigo",
  "complexity",
  "cache",
  "caching",
  "memoization",
  "interview",
]);

export function collectText(sb: Storyboard): string[] {
  const out: string[] = [];
  for (const s of sb.scenes ?? []) {
    const t = s.text ?? {};
    for (const k of ["kicker", "heading", "sub", "value"])
      if (t[k]) out.push(String(t[k]));
    if (Array.isArray(t.bullets)) out.push(...t.bullets);
    if (Array.isArray(t.code)) out.push(...t.code);
    if (t.diagram?.boxes) {
      for (const b of t.diagram.boxes) {
        if (b.title) out.push(b.title);
        if (Array.isArray(b.items)) out.push(...b.items);
      }
    }
    if (s.narration) out.push(String(s.narration));
  }
  return out;
}

export function isTechWord(raw: string): boolean {
  const t = raw.replace(/^[("'`[{]+/, "").replace(/[)"'`\]}.,!?;:]+$/, "");
  if (/\(\)|=>|::|[_/\\<>${}[\]()]/.test(t)) return true;
  if (/\w\.\w/.test(t)) return true;
  if (/[a-z][A-Z]/.test(t)) return true;
  if (/^[A-Z]{2,}$/.test(t.replace(/[^A-Za-z]/g, ""))) return true;
  return TECH.has(t.toLowerCase().replace(/[^a-z0-9]/g, ""));
}

// Ranked, de-duplicated keywords (most salient first).
export function keywords(sb: Storyboard, limit = 16): string[] {
  const freq = new Map<string, number>();
  const display = new Map<string, string>();
  for (const line of collectText(sb)) {
    for (const raw of line.split(/\s+/)) {
      const norm = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (norm.length < 3 || STOP.has(norm)) continue;
      const tech = isTechWord(raw);
      const score = (tech ? 5 : 1) + (/^[A-Z]/.test(raw) ? 1 : 0);
      freq.set(norm, (freq.get(norm) ?? 0) + score);
      if (!display.has(norm))
        display.set(norm, raw.replace(/[^A-Za-z0-9+#.]/g, ""));
    }
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => display.get(k) || k);
}

type Stack = { topic: string; label: string; base: string[] };

// Detect the primary stack to drive the badge + hashtag pool.
export function detectStack(sb: Storyboard): Stack {
  const text = collectText(sb).join(" ").toLowerCase();
  const has = (w: string) => new RegExp(`\\b${w}`).test(text);
  if (has("python") || has("fastapi") || has("enumerate") || has("django"))
    return {
      topic: "python",
      label: "PY",
      base: [
        "python",
        "pythonprogramming",
        "pythontips",
        "coding",
        "programming",
        "developer",
        "learnpython",
        "code",
      ],
    };
  if (
    has("rag") ||
    has("llm") ||
    has("agent") ||
    has("embedding") ||
    has(" ai")
  )
    return {
      topic: "ai",
      label: "AI",
      base: [
        "ai",
        "machinelearning",
        "llm",
        "genai",
        "artificialintelligence",
        "coding",
        "developer",
        "tech",
      ],
    };
  if (has("react") || has("usestate") || has("useeffect") || has("component"))
    return {
      topic: "react",
      label: "⚛",
      base: [
        "react",
        "reactjs",
        "frontend",
        "webdev",
        "javascript",
        "coding",
        "developer",
        "webdevelopment",
      ],
    };
  if (has("css") || has("flexbox") || has("grid") || has("tailwind"))
    return {
      topic: "css",
      label: "CSS",
      base: [
        "css",
        "frontend",
        "webdev",
        "webdevelopment",
        "design",
        "coding",
        "developer",
        "html",
      ],
    };
  // default: javascript
  return {
    topic: "javascript",
    label: "JS",
    base: [
      "javascript",
      "js",
      "webdev",
      "webdevelopment",
      "coding",
      "programming",
      "developer",
      "frontend",
    ],
  };
}

// Pick a title word to paint in the accent colour (prefer a technical token).
export function pickAccentWord(heading: string): string {
  const words = (heading || "").split(/\s+/).filter(Boolean);
  const tech = words.find((w) => isTechWord(w));
  return (tech || words[words.length - 1] || "").replace(
    /[^A-Za-z0-9+#.]/g,
    "",
  );
}

export function titleScene(sb: Storyboard): any {
  return (
    (sb.scenes ?? []).find((s: any) => s.template === "title") ??
    sb.scenes?.[0] ??
    {}
  );
}
