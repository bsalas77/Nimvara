import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
const appJs = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
const tauriConfig = JSON.parse(
  await readFile(new URL("../src-tauri/tauri.conf.json", import.meta.url), "utf8"),
);
const css = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");
const js = await readFile(new URL("../public/app.js", import.meta.url), "utf8");

function luminance(hex) {
  const channels = [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground, background) {
  const values = [luminance(foreground), luminance(background)];
  return (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05);
}

test("core document landmarks, live regions, labels, and keyboard save are present", () => {
  assert.match(html, /<html lang="en">/);
  assert.match(html, /class="skip-link" href="#content"/);
  assert.ok((html.match(/role="status" aria-live="polite"/g) || []).length >= 2);
  assert.match(html, /aria-label="Markdown editor"/);
  for (const id of ["workspacePath", "query", "newPath", "calendarDate", "folderPath", "propertyKey", "propertyValue", "propertyQuery", "propertyViewMode", "mapBranch", "pdfPath", "pdfAnnotation", "dailyFolderSetting", "folderNoteSetting", "fontSizeSetting", "canvasPath", "commandQuery", "indexMeter", "captureUrl", "importPath", "destinationFolder", "destinationName", "backupPath", "restorePath"]) {
    assert.ok(html.includes(`for="${id}"`), `missing label for ${id}`);
  }
  assert.match(js, /event\.ctrlKey && key === "s"/);
  assert.match(html, /id="cancelIndex"/);
  assert.match(html, /id="mindMapView"[^>]+aria-pressed="false"/);
  assert.match(html, /id="mindMapCanvas" role="img" aria-labelledby="mindMapTitle"/);
  assert.match(html, /id="commandPalette" aria-labelledby="commandTitle"/);
  assert.match(html, /id="markdownPreview"[^>]+aria-label="Rendered Markdown preview"/);
  assert.match(js, /group\.onkeydown/);
  assert.match(js, /native_cancel_search_index/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});

test("representative text and control colors meet WCAG AA normal-text contrast", () => {
  const pairs = [
    ["dfe7ef", "0d1117"],
    ["8295a5", "161d25"],
    ["8194a5", "11171e"],
    ["15191e", "d89b45"],
    ["9fb0c0", "111820"],
  ];
  for (const [foreground, background] of pairs) {
    assert.ok(contrast(foreground, background) >= 4.5, `${foreground} on ${background}`);
  }
});

test("production CSP blocks inline code, plugins, framing, forms, and remote defaults", () => {
  const csp = tauriConfig.app.security.csp;
  for (const directive of [
    "default-src 'none'",
    "style-src 'self'",
    "script-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ]) {
    assert.ok(csp.includes(directive), `missing CSP directive: ${directive}`);
  }
  assert.ok(!csp.includes("'unsafe-inline'"));
  assert.ok(!csp.includes("'unsafe-eval'"));
  assert.ok(!/\sstyle\s*=/i.test(html));
  assert.ok(!/\sstyle\s*=/.test(appJs));
});
