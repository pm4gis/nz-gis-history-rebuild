import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/styles/site.css", import.meta.url), "utf8");
const layout = readFileSync(new URL("../src/layouts/SiteLayout.astro", import.meta.url), "utf8");
const fullNetwork = readFileSync(new URL("../src/pages/network/index.astro", import.meta.url), "utf8");
const miniNetwork = readFileSync(new URL("../src/components/MiniNetwork.astro", import.meta.url), "utf8");
const names = ["dark-night", "dark-forest", "light-paper", "light-mist"];
const essential = [
  "paper", "surface", "ink", "muted", "line", "green", "green-dark", "pale-green",
  "gold", "rose", "glass", "shadow", "on-accent", "on-ink", "link-hover",
  "field-border", "glow-a", "glow-b", "hero-a", "hero-b", "hero-c",
  "hero-accent", "hero-node", "logo-a", "logo-b", "logo-mark",
  "graph-person", "graph-business", "graph-organisation", "graph-project",
  "graph-technology", "graph-story", "graph-event", "graph-theme", "graph-index",
  "graph-edge", "graph-muted", "graph-selection", "graph-highlight", "graph-edge-dim",
];

const palette = (name) => {
  const match = css.match(new RegExp('html\\[data-palette="' + name + '"\\] \\{([^}]+)\\}', "s"));
  assert.ok(match, "Missing complete palette: " + name);
  return Object.fromEntries([...match[1].matchAll(/--([\w-]+):\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()]));
};
const luminance = (hex) => {
  assert.match(hex, /^#[0-9a-f]{6}$/i);
  const [red, green, blue] = [1, 3, 5]
    .map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};
const ratio = (a, b) => {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
for (const name of names) {
  test(name + " contains every semantic colour token", () => {
    const theme = palette(name);
    for (const token of essential) assert.ok(theme[token], name + " missing --" + token);
    assert.match(css, new RegExp('html\\[data-palette="' + name + '"\\]'));
    assert.equal(theme.paper.startsWith("#"), true);
  });
  test(name + " foreground, muted text, links and buttons meet WCAG AA", () => {
    const t = palette(name);
    const pairs = [
      ["ink", "paper"], ["ink", "surface"], ["muted", "paper"], ["muted", "surface"],
      ["green-dark", "paper"], ["green-dark", "surface"],
      ["link-hover", "paper"], ["link-hover", "surface"],
      ["on-accent", "green-dark"], ["on-ink", "ink"],
    ];
    for (const [foreground, background] of pairs) {
      assert.ok(ratio(t[foreground], t[background]) >= 4.5,
        name + " " + foreground + " on " + background + " fails 4.5:1 (" +
        ratio(t[foreground], t[background]).toFixed(2) + ")");
    }
  });
  test(name + " graph nodes, connections and selection meet non-text contrast", () => {
    const t = palette(name);
    for (const kind of [
      "person", "business", "organisation", "project", "technology", "story",
      "event", "theme", "index", "edge", "selection", "highlight",
    ]) assert.ok(ratio(t["graph-" + kind], t.surface) >= 3,
      name + " graph-" + kind + " is below 3:1 against graph surface");
  });
}
test("top-right button cycles four palettes and restores stored choice before paint", () => {
  assert.match(layout, /data-palette-toggle/);
  assert.match(layout, /paletteOptions\s*=\s*\[/);
  assert.match(layout, /site:palette-changed/);
  assert.match(layout, /<script is:inline>/);
  for (const name of names) assert.ok(layout.includes(name));
  assert.doesNotMatch(layout, /data-skin-toggle/);
});
test("the full and mini Sigma networks use palette-linked node and label colours", () => {
  assert.match(fullNetwork, /graphColours\.label/);
  assert.match(fullNetwork, /site:palette-changed/);
  assert.match(fullNetwork, /graphColours\.selection/);
  assert.match(miniNetwork, /labelTint/);
  assert.match(miniNetwork, /labelBackdrop/);
  assert.match(miniNetwork, /site:palette-changed/);
  assert.doesNotMatch(fullNetwork, /#[0-9a-f]{6}/i);
  assert.doesNotMatch(miniNetwork, /#[0-9a-f]{6}/i);
});
test("search, controls, source cards and graph fallback have semantic foreground/background", () => {
  for (const expression of [
    /\.source-list\s*\{[^}]*background: var\(--pale-green\)/s,
    /\.graph-details\s*\{[^}]*background: var\(--pale-green\)/s,
    /\.network-svg-node text\s*\{[^}]*fill: var\(--ink\)/s,
    /#pagefind\s*\{[^}]*--pagefind-ui-text: var\(--ink\)/s,
    /\.palette-toggle\s*\{[^}]*color: var\(--ink\)/s,
    /input::placeholder[^}]*color: var\(--muted\)/s,
  ]) assert.match(css, expression);
});
