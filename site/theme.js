// This classic script intentionally runs before CSS and body rendering.
(() => {
  const key = "ai-coding-dictionary.theme";
  /** @param {string | null} value */
  const normalize = (value) => (value === "light" ? "light" : "dark");
  /** @param {"light" | "dark"} theme */
  function apply(theme) {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#181a1f" : "#fbfbfc");
    document
      .querySelector('meta[name="color-scheme"]')
      ?.setAttribute("content", theme);
    document.dispatchEvent(new Event("themechange"));
  }
  let initial = "dark";
  try {
    initial = normalize(localStorage.getItem(key));
  } catch {
    // Dark mode also works when storage is unavailable.
  }
  apply(normalize(initial));
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    if (!event.target.closest("#theme-toggle")) return;
    const next =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    apply(next);
    try {
      localStorage.setItem(key, next);
    } catch {
      // Keep the current-page choice even when persistence is unavailable.
    }
  });
  window.addEventListener("storage", (event) => {
    if (event.key === key || event.key === null) {
      apply(normalize(event.newValue));
    }
  });
})();
