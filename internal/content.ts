import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { Marked } from "marked";
import { sectionTitles } from "../site/i18n.js";
import type { Dictionary, LocalizedEntry, Section } from "../site/types.js";

export const root = new URL("../", import.meta.url).pathname;
export const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N} -]/gu, "")
    .replaceAll(" ", "-");
export const hash = (text: string) =>
  createHash("sha256").update(text).digest("hex");

export function parseEntry(
  source: string,
  file: string
): Omit<LocalizedEntry, "html"> {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`${file}: missing frontmatter`);
  // Upstream has unquoted one-line descriptions containing colons.
  // Quote these legacy scalars without changing the canonical Markdown.
  const frontmatter = match[1]!.replace(
    /^(description|title): (.*)$/gm,
    (_, key: string, value: string) =>
      key + ": " + (/^["']/.test(value) ? value : JSON.stringify(value))
  );
  const metadata = parse(frontmatter) as Record<string, unknown>;
  if (
    typeof metadata.description !== "string" ||
    !metadata.description.trim() ||
    metadata.description.length >= 140
  ) {
    throw new Error(`${file}: description must be 1–139 characters`);
  }
  const aliases = metadata.aliases ?? [];
  if (
    !Array.isArray(aliases) ||
    aliases.some((value) => typeof value !== "string")
  ) {
    throw new Error(`${file}: aliases must be strings`);
  }
  const body = match[2]!.trim();
  if (!body) throw new Error(`${file}: empty article`);
  return {
    title: typeof metadata.title === "string" ? metadata.title : "",
    description: metadata.description,
    aliases,
    body,
  };
}

export function readSources(base = root) {
  const curriculum = readFileSync(join(base, "internal/Curriculum.md"), "utf8");
  const sections: Section[] = [];
  for (const line of curriculum.split("\n").filter(Boolean)) {
    const heading = line.match(/^## Section (\d+) — (.+)$/);
    if (heading) {
      const id = Number(heading[1]);
      const ru = sectionTitles[id - 1];
      if (!ru) throw new Error(`Missing Russian section title: ${id}`);
      sections.push({ id, en: heading[2]!, ru, terms: [] });
    } else if (line.startsWith("- ") && sections.length) {
      sections.at(-1)!.terms.push(line.slice(2).trim());
    } else throw new Error(`Invalid curriculum line: ${line}`);
  }
  if (sections.length !== sectionTitles.length)
    throw new Error("Section translation coverage mismatch");
  const terms = sections.flatMap((section) => section.terms);
  if (new Set(terms).size !== terms.length)
    throw new Error("Duplicate curriculum term");
  if (new Set(terms.map(slug)).size !== terms.length)
    throw new Error("Duplicate term URL");
  for (const folder of ["dictionary", "translations/ru"]) {
    const files = readdirSync(join(base, folder)).filter((f) =>
      f.endsWith(".md")
    );
    const expected = new Set(terms.map((term) => term + ".md"));
    if (
      files.length !== terms.length ||
      files.some((file) => !expected.has(file))
    ) {
      throw new Error(
        `${folder}: translation/source coverage must exactly match the curriculum`
      );
    }
  }
  return { sections, terms };
}

export function renderMarkdown(body: string, terms: Set<string>): string {
  const renderer = new Marked({
    gfm: true,
    renderer: {
      html() {
        throw new Error("Raw HTML is not allowed in dictionary entries");
      },
      link({ href, tokens }) {
        if (href.startsWith("./")) {
          const term = decodeURIComponent(href.slice(2).replace(/\.md$/, ""));
          if (!terms.has(term))
            throw new Error(`Broken dictionary link: ${href}`);
          href = "#" + slug(term);
        } else if (!/^https:\/\//.test(href)) {
          throw new Error(`Unsupported link: ${href}`);
        }
        const safeHref = href
          .replaceAll("&", "&amp;")
          .replaceAll('"', "&quot;")
          .replaceAll("<", "&lt;");
        return `<a href="${safeHref}">${this.parser.parseInline(tokens)}</a>`;
      },
    },
  });
  return renderer.parse(body, { async: false });
}

export function loadDictionary(base = root): Dictionary {
  const { sections, terms } = readSources(base);
  const manifest = JSON.parse(
    readFileSync(join(base, "translations/ru/source-hashes.json"), "utf8")
  ) as Record<string, string>;
  if (
    Object.keys(manifest).length !== terms.length ||
    Object.keys(manifest).some((term) => !terms.includes(term))
  ) {
    throw new Error(
      "Translation review manifest must match all source entries"
    );
  }
  const known = new Set(terms);
  const entries = sections.flatMap((section) =>
    section.terms.map((term) => {
      const source = readFileSync(
        join(base, "dictionary", term + ".md"),
        "utf8"
      );
      const translated = readFileSync(
        join(base, "translations/ru", term + ".md"),
        "utf8"
      );
      if (manifest[term] !== hash(source))
        throw new Error(
          `${term}: English changed; review the Russian translation and update its source hash`
        );
      const en = parseEntry(source, term);
      const ru = parseEntry(translated, "ru/" + term);
      if (
        !/[А-Яа-яЁё]/.test(ru.title) ||
        !/[А-Яа-яЁё]/.test(ru.description) ||
        !/[А-Яа-яЁё]/.test(ru.body)
      ) {
        throw new Error(
          `${term}: Russian title, summary and article are required`
        );
      }
      if (!ru.body.includes("_Пример:_"))
        throw new Error(`${term}: translated usage example is required`);
      const code = [...en.body.matchAll(/`([^`\n]+)`/g)].map((m) => m[1]!);
      for (const literal of code) {
        if (!ru.body.includes("`" + literal + "`"))
          throw new Error(`${term}: missing code identifier ${literal}`);
      }
      const enHtml = renderMarkdown(en.body, known);
      const ruHtml = renderMarkdown(ru.body, known);
      const translatedLinks = new Set(
        [...ruHtml.matchAll(/<a href="(#[^"]+)"/g)].map((match) => match[1]!)
      );
      for (const [, target] of enHtml.matchAll(/<a href="(#[^"]+)"/g)) {
        if (!translatedLinks.has(target!))
          throw new Error(`${term}: missing canonical internal link ${target}`);
      }
      return {
        id: slug(term),
        term,
        section: section.id,
        en: { ...en, title: term, html: enHtml },
        ru: { ...ru, html: ruHtml },
      };
    })
  );
  return { sections, entries };
}
