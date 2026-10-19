export const sectionTitles = [
  "Модель",
  "Сессии, контекстные окна и ходы",
  "Инструменты и окружение",
  "Сбои и ошибки",
  "Передача работы",
  "Память и управление",
  "Подходы к работе",
];
export const ui = {
  en: {
    title: "AI Coding Dictionary",
    hero: "The vocabulary of AI coding, in plain English.",
    intro:
      "Clear explanations for the terms that make agentic coding click. Search in English or Russian, or explore a section.",
    subtitle: "",
    language: "Language",
    skip: "Skip to dictionary",
    search: "Search the dictionary",
    placeholder: "Search in English or Russian…",
    clear: "Clear search",
    sections: "Sections",
    all: "All terms",
    back: "Back to dictionary",
    results: "Search results",
    empty: "No matching terms",
    emptyHelp:
      "Try an English term, a Russian translation, or a shorter phrase.",
    reset: "Show all terms",
    previous: "Previous term",
    next: "Next term",
    source: "Source on GitHub",
    original: "Original dictionary",
    attribution: "Dictionary by Matt Pocock · AI Hero",
    translationCredit: "English / Russian edition",
    notFound: "This term could not be found",
    notFoundHelp: "Return to the dictionary to find a term.",
    table: "Scrollable table",
  },
  ru: {
    title: "Словарь разработки с AI",
    hero: "Термины разработки с AI простыми словами.",
    intro:
      "Понятные объяснения для работы с агентами. Ищите на русском или английском либо выберите раздел.",
    subtitle: "Английские термины — с переводом и объяснениями на русском.",
    language: "Язык",
    skip: "Перейти к словарю",
    search: "Поиск по словарю",
    placeholder: "Термин на русском или английском…",
    clear: "Очистить поиск",
    sections: "Разделы",
    all: "Все термины",
    back: "К словарю",
    results: "Результаты поиска",
    empty: "Ничего не найдено",
    emptyHelp:
      "Попробуйте английский термин, русский перевод или более короткий запрос.",
    reset: "Показать все термины",
    previous: "Предыдущий термин",
    next: "Следующий термин",
    source: "Исходный код на GitHub",
    original: "Оригинальный словарь",
    attribution: "Автор словаря — Matt Pocock · AI Hero",
    translationCredit: "Английская и русская версии",
    notFound: "Такой термин не найден",
    notFoundHelp: "Вернитесь в словарь и выберите нужный термин.",
    table: "Таблица с горизонтальной прокруткой",
  },
};
/** @param {number} count @param {import("./types").Language} lang */
export function termCount(count, lang) {
  if (lang === "en") return `${count} ${count === 1 ? "term" : "terms"}`;
  const form = new Intl.PluralRules("ru").select(count);
  return `${count} ${form === "one" ? "термин" : form === "few" ? "термина" : "терминов"}`;
}
