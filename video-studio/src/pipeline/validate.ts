// Lightweight storyboard contract check. Runs before voiceover/render so a
// malformed storyboard fails fast with a clear message instead of producing a
// broken video. Zero dependencies (no Zod) to keep the pipeline install-light;
// swap for a schema library later if migrations are needed.

const KNOWN_TEMPLATES = new Set([
  "title",
  "bullets",
  "cta",
  "code",
  "diagram",
  "tokens",
  "stat",
  "hook",
  "chart",
  "broll",
  "compare",
  "interstitial",
  "terminal",
  "diff",
  "beforeafter",
]);

// Platform max durations (seconds); 0 = no limit. Mirrors src/config.ts PRESETS
// but kept inline so validate stays dependency-free.
const PLATFORM_MAX: Record<string, number> = {
  youtube: 0,
  short: 60,
  reel: 90,
  story: 60,
  "ig-feed": 60,
  "ig-square": 60,
};

export type ValidationResult = { errors: string[]; warnings: string[] };

export function validateStoryboard(sb: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const e = (m: string) => errors.push(m);
  const w = (m: string) => warnings.push(m);

  if (!sb || typeof sb !== "object") {
    return { errors: ["storyboard is not an object"], warnings };
  }

  for (const k of ["width", "height", "fps"] as const) {
    if (typeof sb[k] !== "number" || sb[k] <= 0)
      e(`"${k}" must be a positive number (got ${JSON.stringify(sb[k])})`);
  }

  if (!Array.isArray(sb.scenes) || sb.scenes.length === 0) {
    e(`"scenes" must be a non-empty array`);
    return { errors, warnings };
  }

  const ids = new Set<string>();
  sb.scenes.forEach((s: any, i: number) => {
    const where = `scenes[${i}]${s?.id ? ` (id=${s.id})` : ""}`;
    if (!s || typeof s !== "object") {
      e(`${where} is not an object`);
      return;
    }
    if (!s.id) e(`${where} is missing "id"`);
    else if (ids.has(s.id)) e(`${where} duplicate id "${s.id}"`);
    else ids.add(s.id);

    if (!s.template) e(`${where} is missing "template"`);
    else if (!KNOWN_TEMPLATES.has(s.template))
      e(
        `${where} unknown template "${s.template}" (known: ${[...KNOWN_TEMPLATES].join(", ")})`,
      );

    // Per-template content expectations.
    if (s.template === "code") {
      const code = s.text?.code ?? s.text?.bullets;
      if (!Array.isArray(code) || code.length === 0)
        e(`${where} code scene needs text.code as a non-empty string array`);
    }
    if (s.template === "bullets") {
      if (!Array.isArray(s.text?.bullets) || s.text.bullets.length === 0)
        e(`${where} bullets scene needs text.bullets`);
    }
    if (s.template === "tokens") {
      if (!Array.isArray(s.text?.tokens) || s.text.tokens.length === 0)
        e(`${where} tokens scene needs text.tokens`);
    }
    if (s.template === "stat") {
      if (!String(s.text?.value ?? "").trim())
        e(`${where} stat scene needs text.value (e.g. "50ms", "3x", "99%")`);
    }
    if (s.template === "chart") {
      const d = s.text?.chart?.data;
      if (!Array.isArray(d) || d.length === 0)
        e(
          `${where} chart scene needs text.chart.data (array of {label,value})`,
        );
      else if (!d.every((x: any) => x && typeof x.value === "number"))
        e(`${where} chart data entries need a numeric "value"`);
    }
    if (s.template === "broll") {
      if (!s.media?.src)
        w(`${where} broll scene has no media.src; a placeholder will render`);
    }
    if (s.template === "compare") {
      const c = s.text?.compare;
      if (!c?.left || !c?.right)
        e(
          `${where} compare scene needs text.compare.left and text.compare.right`,
        );
    }
    if (s.template === "diagram") {
      const boxes = s.text?.diagram?.boxes;
      if (!Array.isArray(boxes) || boxes.length === 0)
        e(`${where} diagram scene needs text.diagram.boxes`);
    }
    if (s.template === "beforeafter") {
      const b = s.text?.before?.code;
      const a = s.text?.after?.code;
      if (!Array.isArray(b) || !Array.isArray(a))
        e(
          `${where} beforeafter scene needs text.before.code and text.after.code (string arrays)`,
        );
    }

    if (s.durationSec != null && typeof s.durationSec !== "number")
      w(`${where} durationSec should be a number`);
    if (!("narration" in s) || !String(s.narration ?? "").trim())
      w(`${where} has no narration (scene will be silent)`);
  });

  return { errors, warnings };
}

// Throws on hard errors; prints warnings. Call at the start of voiceover/render.
export function assertValidStoryboard(sb: any, lang = "en"): void {
  const { errors, warnings } = validateStoryboard(sb);
  for (const warn of warnings) console.warn(`[validate:${lang}] warn: ${warn}`);
  if (errors.length) {
    throw new Error(
      `[validate:${lang}] storyboard has ${errors.length} error(s):\n` +
        errors.map((m) => `  - ${m}`).join("\n"),
    );
  }
  console.log(
    `[validate:${lang}] storyboard OK (${sb.scenes.length} scenes, ${warnings.length} warning(s))`,
  );
}

// ---------------------------------------------------------------------------
// Lint: non-fatal quality checks that catch things which make a video look
// broken or off-brand (handle drift, overflow, length, safe zones). Separate
// from validateStoryboard (which is about structural correctness).
// ---------------------------------------------------------------------------
export type LintResult = { warnings: string[]; notes: string[] };

function collectHandles(obj: any, out: Set<string>) {
  if (obj == null) return;
  if (typeof obj === "string") {
    const m = obj.match(/@[A-Za-z0-9_.]+/g);
    if (m) for (const h of m) out.add(h.toLowerCase());
    return;
  }
  if (Array.isArray(obj)) {
    for (const v of obj) collectHandles(v, out);
    return;
  }
  if (typeof obj === "object") {
    for (const v of Object.values(obj)) collectHandles(v, out);
  }
}

export function lintStoryboard(sb: any, brand?: any): LintResult {
  const warnings: string[] = [];
  const notes: string[] = [];
  if (!sb || typeof sb !== "object") return { warnings, notes };

  // 1) handle consistency across storyboard + brand
  const handles = new Set<string>();
  collectHandles(sb, handles);
  collectHandles(brand, handles);
  if (handles.size > 1)
    warnings.push(
      `multiple distinct @handles appear (${[...handles].join(", ")}). Use one everywhere.`,
    );

  // 2) total length vs platform limit
  const plat = sb.platform;
  const max = plat ? PLATFORM_MAX[plat] : 0;
  if (max && typeof sb.totalSeconds === "number" && sb.totalSeconds > max)
    warnings.push(
      `totalSeconds ${sb.totalSeconds.toFixed(1)}s exceeds the ${plat} limit of ${max}s.`,
    );

  // 3) per-scene overflow / safe-zone heuristics
  (sb.scenes ?? []).forEach((s: any, i: number) => {
    const where = `scenes[${i}]${s?.id ? ` (id=${s.id})` : ""}`;
    const t = s?.text ?? {};
    if (typeof t.heading === "string" && t.heading.length > 42)
      notes.push(
        `${where} heading is long (${t.heading.length} chars); may wrap/shrink.`,
      );
    if (Array.isArray(t.bullets) && t.bullets.length > 5)
      warnings.push(
        `${where} has ${t.bullets.length} bullets; 5 or fewer reads better.`,
      );
    if (Array.isArray(t.code)) {
      const longest = t.code.reduce(
        (m: number, l: string) => Math.max(m, l.length),
        0,
      );
      if (longest > 52 && !t.fontSize && !t.codeScale)
        notes.push(
          `${where} longest code line is ${longest} chars; it will shrink to fit.`,
        );
    }
    if (
      s?.template === "stat" &&
      typeof t.value === "string" &&
      t.value.length > 7
    )
      notes.push(
        `${where} stat value "${t.value}" is long; big-number impact drops past ~6 chars.`,
      );
    if (typeof s?.durationSec === "number" && s.durationSec > 12)
      notes.push(
        `${where} is ${s.durationSec.toFixed(1)}s; consider splitting (a visual change every 2-4s lifts retention).`,
      );
  });

  // 4) pacing: average seconds-per-scene
  const n = (sb.scenes ?? []).length;
  if (n > 0 && typeof sb.totalSeconds === "number") {
    const avg = sb.totalSeconds / n;
    if (avg > 7)
      notes.push(
        `~${avg.toFixed(1)}s per scene on average; short-form favors faster cuts (2-4s).`,
      );
  }

  return { warnings, notes };
}
