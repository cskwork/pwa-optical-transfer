// A dismissible first-visit banner that explains what this app does in plain
// language. Hidden permanently after the user dismisses it (localStorage).
// Shown on every page type with page-appropriate copy via the data-i18n key.

import { t } from "./i18n";

const STORAGE_KEY = "decimen-beginner-dismissed";

export function showBeginnerBanner(key: string): void {
  try {
    if (localStorage.getItem(STORAGE_KEY) === "1") return;
  } catch {
    // localStorage unavailable — show the banner anyway.
  }

  const main = document.querySelector("main");
  if (!main) return;

  const banner = document.createElement("div");
  banner.className = "beginner-banner";
  banner.innerHTML =
    "<p>" + t(key) + "</p>" +
    '<button class="beginner-banner-close" type="button" aria-label="' +
    t("beginner.close") + '">×</button>';

  banner.querySelector(".beginner-banner-close")!.addEventListener("click", () => {
    banner.hidden = true;
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Best-effort.
    }
  });

  main.prepend(banner);
}
