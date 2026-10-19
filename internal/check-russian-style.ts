// Editorial aid for the Russian adaptation; not an ASD-STE100 compliance checker.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { root, parseEntry } from "./content.js";
const sentences = new Intl.Segmenter("ru", { granularity: "sentence" });
const words = new Intl.Segmenter("ru", { granularity: "word" });
let findings = 0;
let reviewed = 0;
for (const file of readdirSync(join(root, "translations/ru")).filter((name) =>
  name.endsWith(".md")
)) {
  const { body } = parseEntry(
    readFileSync(join(root, "translations/ru", file), "utf8"),
    file
  );
  const paragraphs = body.split(/\n\s*\n/).filter((p) => !p.startsWith("|"));
  for (const paragraph of paragraphs) {
    const plain = paragraph
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/`[^`]+`/g, "IDENTIFIER")
      .replace(/[*_]/g, "");
    const segments = [...sentences.segment(plain)];
    reviewed += segments.length;
    for (const { segment } of segments) {
      const count = [...words.segment(segment)].filter(
        (word) => word.isWordLike
      ).length;
      if (count > 25) {
        console.log(`${file}: ${count} words: ${segment.trim()}`);
        findings++;
      }
    }
    if (!paragraph.startsWith("-") && segments.length > 6) {
      console.log(
        `${file}: paragraph has ${segments.length} sentences (target: 6 or fewer)`
      );
      findings++;
    }
  }
}
console.log(
  `Russian editorial check: ${reviewed} sentences; ${findings} length findings.`
);
process.exitCode = findings ? 1 : 0;
