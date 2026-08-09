#!/usr/bin/env node
// Quick screenshot + DOM verification script using Playwright.
// Usage: node scripts/verify-pw.mjs [url] [output-dir]
// Defaults: url=http://localhost:8790, output=/tmp
//
// Every operation has an explicit timeout. The whole thing finishes in <5s.
// This replaces ego-browser for build/design verification — no login state needed.

import { chromium } from "playwright";

const url = process.argv[2] || "http://localhost:8790";
const outDir = process.argv[3] || "/tmp";
const timeout = 8000; // 8s hard cap per operation

const browser = await chromium.launch({ headless: true, channel: "chrome", timeout: 5000 });

try {
  for (const [path, name] of [
    ["/", "home"],
    ["/send/", "send"],
    ["/receive/", "receive"],
  ]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(url + path, { waitUntil: "networkidle", timeout });
    await page.waitForTimeout(300); // let JS boot i18n

    const checks = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      theme: document.documentElement.getAttribute("data-theme"),
      langSwitcher: !!document.querySelector("[data-lang-switcher]"),
      themeToggle: !!document.querySelector("[data-theme-toggle]"),
      i18nAttrs: document.querySelectorAll("[data-i18n]").length,
      tooltips: document.querySelectorAll("[data-tip]").length,
    }));

    await page.screenshot({ path: `${outDir}/pw-${name}-light.png`, fullPage: true, timeout });

    // Toggle dark mode
    await page.click("[data-theme-toggle]").catch(() => {});
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${outDir}/pw-${name}-dark.png`, fullPage: true, timeout });

    // Switch to English and screenshot
    const enBtn = page.locator(".lang-seg").nth(1);
    if (await enBtn.count()) {
      await enBtn.click();
      await page.waitForTimeout(200);
      checks.navEn = await page.locator(".mode-nav a").first().textContent().catch(() => "?");
    }

    console.log(`${name}: ${JSON.stringify(checks)}`);
    await page.close();
  }
} finally {
  await browser.close();
}
