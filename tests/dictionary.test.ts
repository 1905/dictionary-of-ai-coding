import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  cpSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  loadDictionary,
  parseEntry,
  renderMarkdown,
  root,
  slug,
} from "../internal/content.js";
import { createSearch, normalize } from "../site/search.js";
import { termCount, ui } from "../site/i18n.js";

const data = loadDictionary();
const search = createSearch(data.entries);
test("every curriculum term has a complete Russian companion and stable English URL", () => {
  assert.equal(
    data.entries.length,
    data.sections.flatMap((section) => section.terms).length
  );
  assert.equal(
    new Set(data.entries.map((entry) => entry.id)).size,
    data.entries.length
  );
  for (const entry of data.entries) {
    assert.equal(entry.en.title, entry.term);
    assert.match(entry.ru.title, /[А-Яа-яЁё]/);
    assert.match(entry.ru.body, /_Пример:_/);
    assert.doesNotMatch(
      entry.ru.body,
      /_(Usage|Avoid|Fix|Surfaces as|Vendor terms):_/
    );
    assert.equal(entry.id, slug(entry.term));
  }
});
test("Russian and English UI keys remain in parity", () => {
  assert.deepEqual(Object.keys(ui.ru), Object.keys(ui.en));
});
test("search finds canonical names, translations, aliases, body text and mixed scripts", () => {
  assert.equal(search("Context window")[0]?.term, "Context window");
  assert.equal(search("контекстное окно")[0]?.term, "Context window");
  assert.equal(search("КЭШИРОВАННЫЕ ТОКЕНЫ")[0]?.term, "Cache tokens");
  assert.equal(search("reasoning effort")[0]?.term, "Effort");
  assert.ok(
    search("parseAsync").some((entry) => entry.term === "Hallucination")
  );
  assert.ok(search("модель token").some((entry) => entry.term === "Model"));
  assert.equal(search("qzxv-ничегонет-731").length, 0);
  assert.equal(search("  ").length, data.entries.length);
  assert.equal(normalize("СЧЁТ"), normalize("счет"));
  assert.equal(normalize("AGENTS.md"), normalize("agents md"));
});
test("Russian counts use the correct plural form", () => {
  assert.equal(termCount(1, "ru"), "1 термин");
  assert.equal(termCount(2, "ru"), "2 термина");
  assert.equal(termCount(5, "ru"), "5 терминов");
  assert.equal(termCount(11, "ru"), "11 терминов");
  assert.equal(termCount(21, "ru"), "21 термин");
  assert.equal(termCount(1, "en"), "1 term");
});
test("Markdown links resolve to English term IDs; code and tables survive rendering", () => {
  assert.match(
    renderMarkdown(
      "[окно](./Context%20window.md)",
      new Set(["Context window"])
    ),
    /href="#context-window"/
  );
  assert.match(
    data.entries.find((e) => e.term === "Hallucination")!.ru.html,
    /<code>parseAsync<\/code>/
  );
  assert.match(
    data.entries.find((e) => e.term === "Cache tokens")!.ru.html,
    /<table>/
  );
  assert.throws(
    () => renderMarkdown("[bad](./Missing.md)", new Set()),
    /Broken dictionary link/
  );
  assert.throws(
    () => renderMarkdown("[bad](javascript:alert)", new Set()),
    /Unsupported link/
  );
  assert.throws(
    () => renderMarkdown("<script>alert(1)</script>", new Set()),
    /Raw HTML/
  );
});
test("legacy upstream descriptions with colons remain readable without source edits", () => {
  const entry = parseEntry(
    "---\ndescription: A handoff: in memory.\n---\nBody",
    "legacy"
  );
  assert.equal(entry.description, "A handoff: in memory.");
});
test("source drift and missing translations stop the build instead of silently falling back", () => {
  const temporary = mkdtempSync(join(tmpdir(), "dictionary-test-"));
  try {
    for (const folder of ["dictionary", "translations", "internal"])
      cpSync(join(root, folder), join(temporary, folder), { recursive: true });
    const source = join(temporary, "dictionary/Token.md");
    writeFileSync(source, readFileSync(source, "utf8") + "\nChanged source.\n");
    assert.throws(() => loadDictionary(temporary), /English changed/);
    cpSync(join(root, "dictionary/Token.md"), source);
    rmSync(join(temporary, "translations/ru/Token.md"));
    assert.throws(() => loadDictionary(temporary), /coverage/);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});
