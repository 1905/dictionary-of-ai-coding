import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { loadDictionary, root } from "./content.js";

const data = loadDictionary();
const output = join(root, "dist");
mkdirSync(join(output, "fonts"), { recursive: true });
const template = readFileSync(join(root, "site/index.html"), "utf8");
const json = JSON.stringify(data).replaceAll("<", "\\u003c");
writeFileSync(
  join(output, "index.html"),
  template.replace("<!-- DICTIONARY_DATA -->", json)
);
for (const file of ["app.js", "i18n.js", "search.js", "styles.css"]) {
  copyFileSync(join(root, "site", file), join(output, file));
}
for (const [packageName, file] of [
  ["dm-sans", "dm-sans-latin-wght-normal.woff2"],
  ["noto-sans", "noto-sans-cyrillic-wght-normal.woff2"],
]) {
  copyFileSync(
    join(
      root,
      "node_modules/@fontsource-variable",
      packageName!,
      "files",
      file!
    ),
    join(output, "fonts", file!)
  );
  copyFileSync(
    join(root, "node_modules/@fontsource-variable", packageName!, "LICENSE"),
    join(output, "fonts", packageName! + "-LICENSE.txt")
  );
}
console.log(
  `Built ${data.entries.length} complete bilingual entries in ${data.sections.length} sections → dist/`
);
