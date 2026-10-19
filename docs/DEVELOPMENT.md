# English / Russian reader

This fork adds a static bilingual reader to Matt Pocock's
[AI Coding Dictionary](https://github.com/mattpocock/dictionary-of-ai-coding).
The upstream repository contains the dictionary content and README generator,
not the AI Hero website source. The reader keeps the original site's search/sidebar structure, term grid and
readable article layout. It opens in dark mode and retains the original light
palette as an optional theme.

The canonical English entries in `dictionary/`, curriculum, upstream workflows
and existing attribution are preserved. The upstream snapshot did not contain a
LICENSE file; this fork does not add a license over the original author's work.
The bundled fonts retain their OFL license notices in `dist/fonts/`.

## Run locally

Use Node.js 22 or newer:

```sh
npm ci
npm run check
npm run preview
```

Open `http://127.0.0.1:4173`. The preview binds only to loopback.
Set `PORT` if that port is already in use. Stop the process with Ctrl-C.
No API keys, backend, external font requests or paid services are needed.
The build writes `dist/`; it does not publish or deploy anything.
GitHub Actions are disabled on this fork. No hosted CI is needed.

## Architecture

- `dictionary/*.md`: original English source, unchanged by the reader.
- `translations/ru/*.md`: full Russian articles, with a Russian title and summary.
- `translations/ru/source-hashes.json`: reviewed English source fingerprints.
- `internal/Curriculum.md`: canonical grouping and order.
- `internal/content.ts`: validates coverage and links; renders Markdown at build time.
- `site/i18n.js`: Russian section names and all interface labels in both languages.
- `site/app.js`: dependency-free browser UI. English term IDs are stable URL fragments.
- `site/search.js`: shared bilingual index for names, aliases, summaries and article text.
- `site/theme.js`: small blocking script that applies the saved theme before rendering.
- `internal/serve.ts`: local preview server, with a same-origin content policy.

The UI uses self-hosted DM Sans for Latin and Noto Sans for Cyrillic.
Tables scroll inside articles instead of widening a small screen.
The language buttons expose their selected state, keep keyboard focus, and update
the document language. Preference is stored under `ai-coding-dictionary.language`.
A valid `?lang=en` or `?lang=ru` overrides the saved choice. A fresh visit defaults
to English. If browser storage is blocked, switching and URL-based selection
still work. Switching language preserves the current article and search text.
Search is local and always indexes both languages, including aliases; it ignores
case, punctuation and the difference between Russian е and ё.

The sun/moon button switches themes without changing the language, article or
search. First visits use dark mode, regardless of the operating system setting.
An explicit light or dark choice is saved under `ai-coding-dictionary.theme`.
Blocked storage still allows switching for the current page. Invalid or cleared
preferences fall back to dark mode; open tabs follow saved preference changes.

Keep `site/theme.js` as a classic script before the stylesheet in the document
head. Making it a module, async or deferred would allow the wrong theme to paint
before a stored preference is applied. The script updates the document theme and
browser color-scheme metadata without inline JavaScript or styles. Keep both
theme palettes in the CSS custom properties at the start of `site/styles.css`;
check body text, smaller translations, control borders and focus rings whenever
changing those colors. Theme button labels belong in `site/i18n.js`.

## Validation

`npm run check` runs TypeScript checks (including browser JavaScript), formatting,
the Russian readability check, Node regression tests and a full build.
There is no ESLint configuration in the upstream; `npm run lint` checks formatting.
The tests cover content parity, stale translations, broken links, preserved code
identifiers, search and Russian plural forms. Browser QA uses the local preview.

`npm run generate` continues to regenerate the upstream-style English README.
Edit `internal/README.template.md`, never the generated README directly.

See [TRANSLATING.md](./TRANSLATING.md) for translation maintenance.
