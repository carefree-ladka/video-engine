// Shared parser for a scene's `emphasize` key, used by card-based templates
// (bullets, diagram, ...) to pop + glow one or more items and dim the rest.
//
// Accepts:  5  |  [3,5]  |  { item: 5, at?: sec, dimOthers?: bool }  |  { items: [..] }
export type Emphasis = {
  items: Set<number>; // 1-based indices to emphasize
  at: number | null; // scene-local seconds the emphasis fires (null = on reveal)
  dimOthers: boolean; // fade the non-emphasized items
};

export function parseEmphasis(raw: any): Emphasis {
  const items = new Set<number>();
  let at: number | null = null;
  let dimOthers = true;
  if (raw == null) return { items, at, dimOthers };
  if (typeof raw === "number") {
    items.add(raw);
  } else if (Array.isArray(raw)) {
    raw.forEach((n) => typeof n === "number" && items.add(n));
  } else if (typeof raw === "object") {
    const it = raw.items ?? raw.item;
    if (Array.isArray(it))
      it.forEach((n: any) => typeof n === "number" && items.add(n));
    else if (typeof it === "number") items.add(it);
    if (typeof raw.at === "number") at = raw.at;
    if (typeof raw.dimOthers === "boolean") dimOthers = raw.dimOthers;
  }
  return { items, at, dimOthers };
}
