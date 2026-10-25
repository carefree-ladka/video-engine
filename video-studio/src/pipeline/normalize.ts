// Light, safe text normalization so TTS doesn't choke on code/math symbols.
// Narration should already be written in spoken form; this is a safety net, not a rewriter.
export function normalizeForTTS(input: string): string {
  let t = ` ${input} `;

  // Big-O and common complexities
  t = t.replace(/O\(n\^?2\)|O\(n²\)/gi, "O of n squared");
  t = t.replace(/O\(log\s*n\)/gi, "O of log n");
  t = t.replace(/O\(n\s*log\s*n\)/gi, "O of n log n");
  t = t.replace(/O\(1\)/gi, "O of one");
  t = t.replace(/O\(n\)/gi, "O of n");

  // arrows / operators when surrounded by spaces
  t = t.replace(/\s->\s/g, " to ");
  t = t.replace(/\s=>\s/g, " becomes ");
  t = t.replace(/\s==\s/g, " equals ");
  t = t.replace(/\s!=\s/g, " not equals ");
  t = t.replace(/\s>=\s/g, " greater or equal ");
  t = t.replace(/\s<=\s/g, " less or equal ");

  // standalone math operators between spaces
  t = t.replace(/\s\+\s/g, " plus ");
  t = t.replace(/\s-\s/g, " minus ");
  t = t.replace(/\s\*\s/g, " times ");

  // percent and empty call parens
  t = t.replace(/%/g, " percent");
  t = t.replace(/\(\)/g, "");

  // drop leftover code-ish brackets/braces that read badly
  t = t.replace(/[{}\[\]`]/g, " ");

  // collapse whitespace
  t = t.replace(/\s{2,}/g, " ").trim();
  return t;
}

// Apply a pronunciation lexicon (case-insensitive, whole-token) to spoken text.
// Longer keys are applied first so "dict.fromkeys" wins over "fromkeys".
export function applyLexicon(
  input: string,
  lexicon: Record<string, string>,
): string {
  let t = input;
  const keys = Object.keys(lexicon).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    const esc = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(^|[^\\w.])${esc}(?![\\w])`, "gi");
    t = t.replace(re, (_m, pre) => `${pre}${lexicon[k]}`);
  }
  return t;
}
