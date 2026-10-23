import { voiceover } from "./voiceover.js";
import { captions as makeCaptions } from "./captions.js";
import { syntheticCaptions } from "./captions-fallback.js";
import { render } from "./render.js";

// Usage: npm run make -- <lang> [--no-captions] [--synthetic]
async function main() {
  const lang = process.argv[2] || "en";
  const noCaptions = process.argv.includes("--no-captions");
  const forceSynthetic = process.argv.includes("--synthetic");

  console.log(`\n=== make ${lang}${noCaptions ? " (no captions)" : ""} ===`);
  const { full16k } = await voiceover(lang);

  if (!noCaptions) {
    if (forceSynthetic) {
      await syntheticCaptions(lang);
    } else {
      try {
        await makeCaptions(lang, full16k);
      } catch (e) {
        console.warn(
          `[make:${lang}] Whisper unavailable (${(e as Error).message}); using synthetic alignment.`,
        );
        await syntheticCaptions(lang);
      }
    }
  }

  await render(lang);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
