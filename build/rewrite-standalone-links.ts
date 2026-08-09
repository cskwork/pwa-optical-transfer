import type { Plugin } from "vite";

// The header brand, byte-identical to the single line in send/index.html and
// receive/index.html — the inline SVG is what lets the standalone pages keep
// the logo with no external reference. A drift here fails the build (below).
//
// The product name rides inside a <span data-i18n="meta.appName"> so the
// standalone file localises at runtime; BRAND_INNER keeps that span, so the
// exact match below still holds and the localised name survives the rewrite.
const BRAND_INNER = "<svg class=\"brand-logo\" viewBox=\"0 0 543 554.1\" fill=\"currentColor\" aria-hidden=\"true\"><g transform=\"translate(-241,789) scale(0.1,-0.1)\"><path d=\"M2410 6513 l0 -1378 103 101 c540 531 1324 986 1984 1153 402 102 850 95 1268 -21 529 -146 1300 -581 1860 -1050 175 -146 212 -184 199 -205 -37 -63 -502 -432 -754 -600 -969 -644 -1785 -844 -2590 -634 -667 174 -1376 581 -1947 1118 l-123 115 0 -1382 0 -1381 1478 4 c1291 3 1491 5 1588 20 1345 194 2240 1124 2355 2446 17 195 7 620 -19 786 -192 1236 -1030 2069 -2262 2249 -217 32 -411 36 -1772 36 l-1368 0 0 -1377z\"/><path d=\"M4945 5906 c-300 -68 -532 -287 -611 -577 -25 -89 -25 -289 0 -378 141 -513 724 -749 1179 -477 405 242 503 778 209 1148 -100 125 -258 229 -417 273 -82 22 -282 29 -360 11z\"/></g></svg><span data-i18n=\"meta.appName\">\ub370\uc2dc\uba58 \uad11\ud559 \uc804\uc1a1</span>";

/**
 * A standalone file has no siblings, so links to the other pages are dead ends.
 * Rewrites are exact-match and `required` ones throw when they miss, so editing
 * the markup breaks the build rather than silently shipping broken links.
 */
export function rewriteStandaloneLinks(page: "send" | "receive"): Plugin {
  const rules: { from: string; to: string; required: boolean }[] = [
    {
      // The Send/Receive switcher would be two dead links here; collapse it to
      // the badge naming the one mode this file is. data-i18n localises it.
      from: "<nav class=\"mode-nav\" aria-label=\"\ubaa8\ub4dc\" data-i18n-aria=\"nav.mode\"><a href=\"../send/\" data-i18n=\"nav.send\">\uc804\uc1a1</a><a href=\"../receive/\" data-i18n=\"nav.receive\">\uc218\uc2e0</a></nav>",
      to: `<span class="mode-badge" data-i18n="nav.${page}">${page === "send" ? "전송" : "수신"}</span>`,
      required: true,
    },
    {
      from: `<a class="brand" href="../">${BRAND_INNER}</a>`,
      to: `<span class="brand">${BRAND_INNER}</span>`,
      required: true,
    },
    {
      // A single file has no siblings to load a favicon from, and leaving the
      // link in would be the one external reference in a page whose whole point
      // is having none.
      from: '<link rel="icon" href="../decimen_logo.svg" type="image/svg+xml" />',
      to: "",
      required: true,
    },
    {
      // Same rule for the home-screen icon: no siblings to load it from.
      from: '<link rel="apple-touch-icon" href="../apple-touch-icon.png" />',
      to: "",
      required: true,
    },
  ];
  return {
    name: "rewrite-standalone-links",
    transformIndexHtml(html) {
      for (const { from, to, required } of rules) {
        if (!html.includes(from)) {
          if (required) throw new Error(`standalone link rewrite missed its target: ${from}`);
          continue;
        }
        html = html.replaceAll(from, to);
      }
      return html;
    },
  };
}
