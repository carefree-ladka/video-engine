# Hooks & retention (scene 1 is everything)

Short-form lives or dies in the first ~1.5 seconds. The opening scene is not an intro — it is a **scroll-stopper + an open loop**. Design it deliberately using a pattern below. This is as important as the whole rest of the script.

## Hard rules (numbers, not vibes)

- The spoken hook lands in the **first 1.5s** — roughly **≤ 7 words**.
- On-screen hook headline is **3–6 words**, the largest text in the video, in the display font.
- **No intros, no pleasantries, no slow logo sting before the hook.** Cut "In this video", "Hey guys", "Today we'll", "Let's talk about".
- Something is on screen and moving by **frame 1** (title word pop-in / number / bold claim).
- **Open a loop** in scene 1 that only closes at the end (a promise, a question, a "wait for it").
- First scene ≤ **2.5s**. Get to real value immediately; never warm up.

## Hook patterns (pick one that fits the topic)

1. **Contrarian / "you're doing it wrong"** — challenges a belief.
   - "You're using `useEffect` wrong." · "Stop using `forEach`."
2. **Curiosity gap / open loop** — tease a payoff, resolve later.
   - "This one line deleted half my code." · "The bug here is almost invisible."
3. **Problem-first / pain** — name the viewer's pain in their words.
   - "Your React app re-renders 100 times a second. Here's why."
4. **Direct question** — pulls the viewer to answer in their head.
   - "Can you spot the bug in 5 seconds?" · "What does this print?"
5. **Result-first / outcome** — show the win before the how.
   - "This turns 20 lines into 3." · "Make this 100x faster."
6. **Stakes / FOMO** — raise the cost of not knowing.
   - "99% of devs fail this interview question." · "This mistake leaks memory."
7. **Secret / "nobody tells you"** — insider knowledge framing.
   - "The git command nobody taught you." · "Senior devs do this, juniors don't."
8. **Numbered promise** — explicit, fast payoff (then actually deliver fast).
   - "3 JavaScript tricks in 30 seconds." · "5 CSS one-liners."
9. **Pattern interrupt** — a bold number, a surprising visual, a hard cut on a claim.

## Retention tactics (beyond scene 1)

- **Hook text mirrors the spoken hook** but sharper/shorter — the eye and ear reinforce.
- **Front-load value**: deliver the first useful thing within ~3s. Save definitions/history for later or cut them.
- **Re-hook at the midpoint** of longer videos (see below).
- **Close the loop** at the end — pay off the scene-1 promise, then CTA.
- **One read per shot**, fast cuts; dead air kills retention.
- **End on momentum** — the CTA references the value just delivered ("now you'll never misuse it again").

## Re-hook (mid-video) — long-form only

Retention sags in the middle of longer videos. For anything over **~75 seconds** (YouTube long-form, multi-section), insert **one** re-hook beat — a short pattern-interrupt that re-earns attention right before the most valuable / hardest section.

- Use the **`interstitial`** scene template: a short (~1.5–2.5s), visually distinct beat (centered bold line, accent flash) so it reads as a gear-change, not just another slide.
- It **opens a new mini-loop or raises stakes**, e.g.:
  - "But here's where everyone trips up."
  - "This next part is the whole point."
  - "Most tutorials stop here — the real trick is next."
  - a surprising stat, or a direct question to re-engage.
- **Placement**: around 40–60% in, or exactly at the boundary before the climax section — never random.
- **Dosage**: one re-hook per ~90s; two max for a very long video. Overusing it feels gimmicky and hurts flow.
- Short-form (Reels/Shorts under ~60s) usually needs **no** re-hook — the scene-1 hook carries it.

## Apply it to the storyboard

- Scene 1 `template` is usually `title`; write the **spoken `narration`** as the hook (≤7 words to the hook) and the **on-screen `text.heading`** as the 3–6 word hook headline. The `sub` can state the open-loop promise.
- Pick the pattern that matches the topic's angle; note which pattern you used.
- Make sure the final scene (or CTA) closes the loop opened in scene 1.

## Good vs weak (dev examples)

- Weak: "Hey everyone, today we're going to learn about JavaScript closures." → slow, no stakes.
- Strong: heading "Closures, finally clear" · narration "Closures confuse everyone — in 40 seconds they won't." (curiosity + promise = open loop).
- Weak: "In this video I'll show you the map method."
- Strong: heading "Stop looping like this" · narration "Still writing index loops? `map` does it in one line." (contrarian + result).
