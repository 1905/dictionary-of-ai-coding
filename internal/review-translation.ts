import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { hash, parseEntry, root } from "./content.js";
const term = process.argv[2];
if (!term || term.includes("/") || term.includes("\\"))
  throw new Error(
    'Pass one exact English term, e.g. npm run translations:review -- "Context window"'
  );
const source = readFileSync(join(root, "dictionary", term + ".md"), "utf8");
parseEntry(
  readFileSync(join(root, "translations/ru", term + ".md"), "utf8"),
  term
);
const path = join(root, "translations/ru/source-hashes.json");
const manifest = JSON.parse(readFileSync(path, "utf8")) as Record<
  string,
  string
>;
manifest[term] = hash(source);
writeFileSync(path, JSON.stringify(manifest, null, 2) + "\n");
console.log(
  `Recorded reviewed English source for ${term}. Run npm test and npm run build before committing.`
);
