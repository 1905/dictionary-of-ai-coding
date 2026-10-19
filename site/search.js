/** @param {string} value */
export function normalize(value) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("ru")
    .replaceAll("ё", "е")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** @param {import("./types").Entry[]} entries */
export function createSearch(entries) {
  const index = entries.map((entry) => ({
    entry,
    names: [
      entry.term,
      entry.ru.title,
      ...entry.en.aliases,
      ...entry.ru.aliases,
    ].map(normalize),
    text: normalize(
      [entry.term, ...Object.values(entry.en), ...Object.values(entry.ru)].join(
        " "
      )
    ),
  }));
  /** @param {string} query */
  return (query) => {
    const normalized = normalize(query);
    if (!normalized) return entries;
    const words = normalized.split(/\s+/);
    return index
      .filter(({ text }) => words.every((word) => text.includes(word)))
      .sort((a, b) => score(b.names, normalized) - score(a.names, normalized))
      .map(({ entry }) => entry);
  };
}
/** @param {string[]} names @param {string} query */
function score(names, query) {
  return names.some((name) => name === query)
    ? 2
    : names.some((name) => name.startsWith(query))
      ? 1
      : 0;
}
