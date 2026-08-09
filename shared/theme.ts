// Theme management — light is the default, dark is opt-in.
//
// No flash of wrong theme: an inline script in each page's <head> (injected by
// shared/theme.ts's applyEarly) reads localStorage and sets data-theme before
// the first paint. This module then owns the toggle and the persistence.
//
// The choice survives in localStorage; a first visit with no saved preference
// defaults to light (the business default). prefers-color-scheme is consulted
// only when nothing is saved.

export type Theme = "light" | "dark";

const STORAGE_KEY = "decimen-theme";

const THEME_COLORS: Record<Theme, string> = {
  light: "#f7f9fc",
  dark: "#070a11",
};

/** Inline script that runs synchronously in <head> to prevent FOUC.
 *  Must be injected verbatim into the HTML before the body renders. */
export const earlyThemeScript = `
<script>(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");if(!t){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-theme",t);var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",t==="dark"?"#070a11":"#f7f9fc");}catch(e){document.documentElement.setAttribute("data-theme","light");}})();</script>`;

export function detectTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // localStorage unavailable — fall through.
  }
  // Default to light for a professional business look.
  return "light";
}

export function getTheme(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "dark" ? "dark" : "light";
}

export function setTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Best-effort persistence.
  }
  // Update the theme-color meta so the browser chrome matches.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_COLORS[theme]);
  updateToggles();
  window.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
}

export function toggleTheme(): void {
  setTheme(getTheme() === "dark" ? "light" : "dark");
}

/** Sun icon (light mode active → click for dark). */
const SUN_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';

/** Moon icon (dark mode active → click for light). */
const MOON_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

function updateToggles(): void {
  const isDark = getTheme() === "dark";
  document.querySelectorAll<HTMLElement>("[data-theme-toggle]").forEach((btn) => {
    btn.innerHTML = isDark ? SUN_ICON : MOON_ICON;
    btn.setAttribute("aria-pressed", String(isDark));
    btn.title = isDark ? "Light mode" : "Dark mode";
  });
}

/** Build the toggle button into every [data-theme-toggle] element. */
export function buildThemeToggle(host: HTMLElement): void {
  host.className = "theme-toggle";
  if (host instanceof HTMLButtonElement) host.type = "button";
  host.setAttribute("aria-label", "Toggle dark mode");
  host.addEventListener("click", () => toggleTheme());
}

/** Wire all toggles on the page. Call once at boot. */
export function bootTheme(): void {
  // Ensure color-scheme is set (the early script sets data-theme; this syncs
  // the CSS color-scheme property for native controls).
  document.documentElement.style.colorScheme = getTheme();
  document.querySelectorAll<HTMLElement>("[data-theme-toggle]").forEach(buildThemeToggle);
  updateToggles();
}
