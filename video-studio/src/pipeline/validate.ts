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
]);

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
