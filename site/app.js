import { createSearch } from "./search.js";
import { ui, termCount } from "./i18n.js";

/** @template {HTMLElement} T @param {string} selector @returns {T} */
function get(selector) {
  const element = document.querySelector(selector);
  if (!(element instanceof HTMLElement))
    throw new Error("Missing element: " + selector);
  return /** @type {T} */ (element);
}
/** @type {import("./types").Dictionary} */
const dictionary = JSON.parse(get("#dictionary-data").textContent || "{}");
const search = createSearch(dictionary.entries);
const storageKey = "ai-coding-dictionary.language";
/** @returns {import("./types").Language} */
function preferredLanguage() {
  const requested = new URLSearchParams(location.search).get("lang");
  if (requested === "ru" || requested === "en") return requested;
  try {
    return localStorage.getItem(storageKey) === "ru" ? "ru" : "en";
  } catch {
    return "en";
  }
}
let language = preferredLanguage();
let query = "";
let selectedSection = 0;
let returnHash = "";
let listScroll = 0;
const input = /** @type {HTMLInputElement} */ (get("#search"));
const content = get("#content");
const main = get("#main");

/** @param {string} value */
function escape(value) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ] || char
  );
}
/** @param {import("./types").Entry} entry */
function termTitle(entry) {
  return `<span lang="en">${escape(entry.term)}</span>${language === "ru" ? `<span class="translation" lang="ru">${escape(entry.ru.title)}</span>` : ""}`;
}
/** @param {import("./types").Entry} entry */
function card(entry) {
  return `<a class="term-card" href="#${entry.id}"><h3>${termTitle(entry)}</h3><p>${escape(entry[language].description)}</p><span class="card-arrow" aria-hidden="true">↗</span></a>`;
}
function renderNavigation() {
  get("#section-nav").innerHTML =
    `<a href="#" ${!selectedSection ? 'aria-current="page"' : ""}>${ui[language].all}<span>${dictionary.entries.length}</span></a>` +
    dictionary.sections
      .map(
        (section) =>
          `<a href="#section-${section.id}" ${selectedSection === section.id ? 'aria-current="page"' : ""}><span>${escape(section[language])}</span><span>${section.terms.length}</span></a>`
      )
      .join("");
}
function renderList() {
  const copy = ui[language];
  const matches = search(query).filter(
    (entry) => !selectedSection || entry.section === selectedSection
  );
  get("#result-status").textContent = termCount(matches.length, language);
  get("#clear-search").hidden = !query;
  if (!matches.length) {
    content.innerHTML = `<div class="empty"><h2>${copy.empty}</h2><p>${copy.emptyHelp}</p><button type="button" id="reset-filter">${copy.reset}</button></div>`;
    get("#reset-filter").onclick = reset;
    return;
  }
  if (query.trim()) {
    content.innerHTML = `<section><div class="section-heading"><h2>${copy.results}</h2><span>${termCount(matches.length, language)}</span></div><div class="term-grid">${matches.map(card).join("")}</div></section>`;
    return;
  }
  content.innerHTML = dictionary.sections
    .filter((section) => !selectedSection || section.id === selectedSection)
    .map((section) => {
      const entries = matches.filter((entry) => entry.section === section.id);
      return `<section><div class="section-heading"><h2>${escape(section[language])}</h2><span>${termCount(entries.length, language)}</span></div><div class="term-grid">${entries.map(card).join("")}</div></section>`;
    })
    .join("");
}
function currentTerm() {
  return dictionary.entries.find((entry) => "#" + entry.id === location.hash);
}
function renderArticle() {
  const entry = currentTerm();
  const copy = ui[language];
  if (!entry) {
    content.innerHTML = `<div class="empty"><h1>${copy.notFound}</h1><p>${copy.notFoundHelp}</p><a href="#">${copy.back}</a></div>`;
    document.title = copy.notFound + " · " + copy.title;
    return;
  }
  const section = dictionary.sections.find((s) => s.id === entry.section);
  const index = dictionary.entries.indexOf(entry);
  const previous = dictionary.entries[index - 1];
  const next = dictionary.entries[index + 1];
  document.title =
    (language === "ru" ? entry.term + " — " + entry.ru.title : entry.term) +
    " · " +
    copy.title;
  content.innerHTML = `<article class="article">
    <a class="back-link" id="back-to-list" href="${returnHash || "#"}">← ${copy.back}</a>
    <a class="article-section" href="#section-${entry.section}">${escape(section?.[language] || "")}</a>
    <h1>${termTitle(entry)}</h1>
    <p class="article-description">${escape(entry[language].description)}</p>
    <div class="prose" lang="${language}">${entry[language].html}</div>
    <nav class="article-pagination" aria-label="${copy.sections}">
      ${previous ? `<a href="#${previous.id}"><small>← ${copy.previous}</small>${termTitle(previous)}</a>` : "<span></span>"}
      ${next ? `<a href="#${next.id}"><small>${copy.next} →</small>${termTitle(next)}</a>` : ""}
    </nav>
  </article>`;
  content.querySelectorAll("table").forEach((table) => {
    const wrapper = document.createElement("div");
    wrapper.className = "table-scroll";
    wrapper.tabIndex = 0;
    wrapper.setAttribute("role", "region");
    wrapper.setAttribute("aria-label", copy.table);
    table.replaceWith(wrapper);
    wrapper.append(table);
  });
}
function render() {
  const hash = location.hash;
  const sectionMatch = hash.match(/^#section-(\d+)$/);
  const isList = !hash || hash === "#" || hash === "#main" || !!sectionMatch;
  if (sectionMatch)
    selectedSection = dictionary.sections.some(
      (s) => s.id === Number(sectionMatch[1])
    )
      ? Number(sectionMatch[1])
      : 0;
  document.body.classList.toggle("reading", !isList);
  get(".hero").hidden = !isList;
  renderNavigation();
  if (isList) {
    document.title = ui[language].title;
    renderList();
  } else {
    get("#result-status").textContent = "";
    renderArticle();
  }
}
function translateShell() {
  const copy = ui[language];
  document.documentElement.lang = language;
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute("content", copy.intro);
  document.querySelectorAll("[data-ui]").forEach((element) => {
    const key = element.getAttribute("data-ui");
    if (key && key in copy)
      element.textContent = copy[/** @type {keyof typeof copy} */ (key)];
  });
  get("#hero-title").textContent = copy.hero;
  get("#hero-intro").textContent = copy.intro;
  get("#brand-subtitle").textContent =
    language === "ru" ? "Словарь разработки с AI" : "";
  get("#brand-subtitle").lang = "ru";
  get(".languages").setAttribute("aria-label", copy.language);
  get("#section-nav").setAttribute("aria-label", copy.sections);
  get(".taxonomy").setAttribute("aria-label", copy.sections);
  input.placeholder = copy.placeholder;
  get("#clear-search").setAttribute("aria-label", copy.clear);
  document
    .querySelectorAll("[data-language]")
    .forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.getAttribute("data-language") === language)
      )
    );
  get(".taxonomy").innerHTML = dictionary.sections
    .map(
      (section) =>
        `<a href="#section-${section.id}"><span aria-hidden="true"># </span>${escape(section[language])}</a>`
    )
    .join("");
}
/** @param {import("./types").Language} next */
function setLanguage(next) {
  language = next;
  try {
    localStorage.setItem(storageKey, language);
  } catch {
    /* Private/storage-restricted browsing still works. */
  }
  const url = new URL(location.href);
  url.searchParams.set("lang", language);
  history.replaceState(null, "", url);
  translateShell();
  render();
}
function reset() {
  query = "";
  input.value = "";
  selectedSection = 0;
  history.replaceState(null, "", location.pathname + location.search);
  translateShell();
  render();
  input.focus();
}
document.querySelectorAll("[data-language]").forEach((button) =>
  button.addEventListener("click", () => {
    const next = button.getAttribute("data-language");
    if (next === "en" || next === "ru") setLanguage(next);
  })
);
input.addEventListener("input", () => {
  query = input.value;
  // A new query searches every section, including while reading an article.
  selectedSection = 0;
  history.replaceState(null, "", location.pathname + location.search);
  get(".hero").hidden = false;
  render();
});
input.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    reset();
  }
});
get("#clear-search").onclick = reset;
document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  const destination = link.getAttribute("href") || "#";
  if (destination === "#main") {
    event.preventDefault();
    main.scrollIntoView({ block: "start" });
    main.focus({ preventScroll: true });
    return;
  }
  event.preventDefault();
  const isArticle = dictionary.entries.some(
    (entry) => destination === "#" + entry.id
  );
  if (isArticle && !document.body.classList.contains("reading")) {
    returnHash = selectedSection ? "#section-" + selectedSection : "";
    listScroll = window.scrollY;
  }
  if (destination === "#" && link.id !== "back-to-list") {
    selectedSection = 0;
    query = "";
    input.value = "";
  }
  if (destination.startsWith("#section-")) {
    query = "";
    input.value = "";
  }
  if (location.hash !== destination) history.pushState(null, "", destination);
  render();
  if (link.id === "back-to-list") window.scrollTo(0, listScroll);
  else main.scrollIntoView({ block: "start" });
  main.focus({ preventScroll: true });
});
window.addEventListener("popstate", () => {
  language = preferredLanguage();
  if (!location.hash) selectedSection = 0;
  translateShell();
  render();
});
window.addEventListener("hashchange", render);
translateShell();
render();
