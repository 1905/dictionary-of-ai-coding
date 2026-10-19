# Maintaining Russian translations

English files remain canonical. Keep each original filename, term, URL ID and
code/API identifier unchanged. Russian is a complete companion edition: do not
fall back to English paragraphs when an article is missing.

## Edit an entry

1. Edit the English source in `dictionary/<English term>.md` when needed.
2. Read the full source. Update `translations/ru/<English term>.md`, including its
   `title`, `description`, explanation, tables, examples and qualifications.
3. Keep the description under 140 characters. Use the same English filenames in
   cross-links, such as `[контекст](./Context.md)`. Link the first occurrence only.
   Optional `aliases` in frontmatter add searchable Russian synonyms.
4. After comparing the translation with the changed source, record that review:

   ```sh
   npm run translations:review -- "Context window"
   ```

5. Run `npm run check`. Read the changed article in both modes and at a small width.
   Commit the source, translation and review fingerprint together.

The review command records a hash; it does not translate or certify quality.
Do not update hashes just to silence a failure. The build deliberately fails when
English has changed since the Russian review. It also rejects missing or extra
entries, missing Russian titles/summaries/examples, invalid links, raw HTML and
lost inline code identifiers.

For a new term, add both Markdown files and its curriculum position, then record
its review. Add a new section's Russian name in `site/i18n.js`. Translate new UI
labels in both dictionaries there. Existing tests check UI key parity.
No translation is generated at runtime or sent to an external translation API.

## Plain Russian, informed by ASD-STE100

The requested plain-language approach is adapted from
[ASD-STE100, Issue 9](https://www.asd-ste100.org/assets/files/ASD-STE100_ISSUE9.pdf)
and the [official STE FAQ](https://www.asd-ste100.org/STE_faq.html).
The relevant references are rules 3.6 (active voice), 6.3 (short descriptions),
6.5 (one paragraph topic) and 6.6 (paragraph length). STE governs English. This Russian edition uses its clarity principles as
editorial guidance; it does **not** claim formal STE compliance.

- Use short sentences, a clear actor and direct verbs.
- Keep one subject per paragraph. Split long explanations into logical steps.
- Give a concept a consistent Russian name; do not rotate synonyms for variety.
- Explain necessary jargon. Keep canonical English headings, product names and
  literal code identifiers so readers can recognise them in tools and docs.
- Preserve facts, examples, conditions and uncertainty. Simpler must not mean
  stronger, less accurate or incomplete.
- Use lists and tables when they make relationships easier to understand.
- Keep natural Russian grammar. Do not apply the English approved-word dictionary
  or English-only verb rules to Russian.

Our local readability targets are at most 25 words per descriptive sentence and
six sentences per paragraph. For instructions, aim for one action and at most
20 words. `npm run lint:ru` flags long descriptive sentences and paragraphs using
Russian sentence segmentation; it excludes tables and treats code spans as units.
It is a review aid, not a terminology, fidelity or STE certification tool.

Use the translated title as the preferred term. Examples: Model → модель;
Harness → обвязка модели (обвязка after introduction); Context → контекст;
Context window → контекстное окно; Tool → инструмент; Tool call → вызов
инструмента; Session → сессия; Turn → ход. Preserve distinctions such as
context versus session, checks versus review, and factuality versus faithfulness.
Review the meaning against English even when a length check passes.

A local Russian style checker can flag product names such as Claude or Codex.
Retain these when they identify the products used in an original example.
Do not delete source facts merely to remove a style warning.
