// Runtime internationalisation — no dependencies, no network, works inside
// the standalone build's strict CSP (default-src 'none'). Korean is the
// default; the choice persists in localStorage and is re-applied on load.
//
// Two surfaces:
//   • Static HTML: <el data-i18n="key"> sets textContent.
//                   <el data-i18n-html="key"> sets innerHTML (for the <br/> hero).
//                   <el data-i18n-placeholder="key"> sets placeholder.
//                   <el data-i18n-aria="key"> sets aria-label.
//   • Dynamic TS:   t("send.pickerAny", { max: "64 MB" }) interpolates {param}.
//
// Build-time values that used to be %TOKENS% (max file size, version, build id)
// are injected once via initI18n() so locale strings with {maxFile} etc. resolve.

import { ko } from "./locales/ko";
import { en } from "./locales/en";
import { ja } from "./locales/ja";
import { zhCN } from "./locales/zh-CN";

export type Lang = "ko" | "en" | "ja" | "zh-CN";

interface LangInfo {
  code: Lang;
  /** Native name shown in the switcher. */
  label: string;
  /** Compact 2-letter tag for the switcher button. */
  tag: string;
}

export const LANGUAGES: readonly LangInfo[] = [
  { code: "ko", label: "한국어", tag: "KO" },
  { code: "en", label: "English", tag: "EN" },
  { code: "ja", label: "日本語", tag: "JA" },
  { code: "zh-CN", label: "简体中文", tag: "中" },
];

export const DEFAULT_LANG: Lang = "ko";

const TABLES: Record<Lang, Record<string, string>> = { ko, en, ja, "zh-CN": zhCN };

const STORAGE_KEY = "decimen-lang";

let currentLang: Lang = DEFAULT_LANG;
/** Build-time values interpolated into {param} placeholders. */
let params: Record<string, string> = {};

/** Pick the closest supported language, falling back to Korean. */
export function normalizeLang(tag: string | null | undefined): Lang {
  if (!tag) return DEFAULT_LANG;
  const lower = tag.toLowerCase();
  if (lower.startsWith("ko")) return "ko";
  if (lower.startsWith("ja")) return "ja";
  if (lower.startsWith("zh")) return "zh-CN";
  if (lower.startsWith("en")) return "en";
  return DEFAULT_LANG;
}

export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved && saved in TABLES) return saved;
  } catch {
    // localStorage may be unavailable (private mode); fall through to UA sniff.
  }
  // navigator.languages is the honest signal — [navigator.language] is a
  // single-entry fallback for very old engines.
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const l of langs) {
    const norm = normalizeLang(l);
    if (norm in TABLES) return norm;
  }
  return DEFAULT_LANG;
}

export function getLang(): Lang {
  return currentLang;
}

export function setLang(lang: Lang): void {
  currentLang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Persisting is best-effort; the runtime choice still applies this session.
  }
  document.documentElement.lang = lang === "zh-CN" ? "zh-CN" : lang;
  applyTranslations();
  updateSwitchers();
  window.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
}

/** Register the build-time {param} values (max file label, version, etc). */
export function initI18n(p: Record<string, string>): void {
  params = p;
  currentLang = detectLang();
  document.documentElement.lang = currentLang === "zh-CN" ? "zh-CN" : currentLang;
}

/** Translate a key, interpolating {param} from the runtime params map plus any
 *  call-site overrides. A missing key falls back to the literal key so a typo
 *  is loud in QA rather than silently blank. */
export function t(key: string, overrides?: Record<string, string>): string {
  const table = TABLES[currentLang] ?? ko;
  let value = table[key] ?? ko[key] ?? key;
  const all = { ...params, ...overrides };
  if (all) {
    for (const [k, v] of Object.entries(all)) {
      value = value.replaceAll(`{${k}}`, v);
    }
  }
  return value;
}

const ROOT = () => document;

/** Apply translations to every [data-i18n*] element under root (default: the
 *  whole document). Re-runnable: setLang() and the initial boot both call it. */
export function applyTranslations(scope: ParentNode = ROOT()): void {
  scope.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n!);
  });
  scope.querySelectorAll<HTMLElement>("[data-i18n-html]").forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml!);
  });
  scope.querySelectorAll<HTMLElement>("[data-i18n-placeholder]").forEach((el) => {
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      el.placeholder = t(el.dataset.i18nPlaceholder!);
    }
  });
  scope.querySelectorAll<HTMLElement>("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", t(el.dataset.i18nAria!));
  });
  // meta tags and other non-label attributes.
  scope.querySelectorAll<HTMLElement>("[data-i18n-content]").forEach((el) => {
    el.setAttribute("content", t(el.dataset.i18nContent!));
  });
  // document.title lives outside [data-i18n]; handle the opt-in page title.
  const titleEl = document.documentElement.querySelector<HTMLTitleElement>("title[data-i18n-title]");
  if (titleEl) document.title = t(titleEl.dataset.i18nTitle!);
}

function updateSwitchers(): void {
  document.querySelectorAll<HTMLElement>("[data-lang-switcher]").forEach(buildSwitcher);
}

/**
 * Render the language switcher into an element marked [data-lang-switcher].
 *
 * A compact button that cycles is the wrong affordance for an offline business
 * tool: the user wants to SEE which language is active and pick deliberately.
 * So the host element becomes a segmented control with a segment per language,
 * kept small enough to sit in the header beside the mode nav. Built into the
 * element rather than the DOM so re-rendering on language change is idempotent.
 */
export function buildSwitcher(host: HTMLElement): void {
  const current = currentLang;
  host.setAttribute("role", "group");
  host.setAttribute("aria-label", t("nav.lang"));
  host.className = "lang-switcher";
  host.replaceChildren(
    ...LANGUAGES.map((info) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lang-seg";
      btn.textContent = info.tag;
      btn.title = info.label;
      btn.setAttribute("aria-label", info.label);
      btn.setAttribute("aria-pressed", String(info.code === current));
      if (info.code === current) btn.classList.add("active");
      btn.addEventListener("click", () => setLang(info.code));
      return btn;
    }),
  );
}

/** Wire every [data-lang-switcher] on the page and apply the current language.
 *  Call once at the bottom of each page's main(). */
export function bootI18n(): void {
  applyTranslations();
  updateSwitchers();
}
