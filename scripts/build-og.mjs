/**
 * Render scripts/og-source.svg into public/og-image.png (1200x630).
 *
 * Run once (or whenever the source changes):
 *     npm run build:og
 *
 * The PNG is committed so neither CI nor end users rebuild it.
 * @resvg/resvg-js is a small WASM rasterizer — no native deps.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const here = dirname(fileURLToPath(import.meta.url));
const srcPath = resolve(here, "og-source.svg");
const outPath = resolve(here, "..", "public", "og-image.png");

const svg = readFileSync(srcPath, "utf8");
const resvg = new Resvg(svg, {
  fitTo: { mode: "width", value: 1200 },
  background: "#070b15",
  font: {
    // System fonts already on the rendering machine. Space Grotesk and
    // JetBrains Mono are listed in the SVG font-family stacks so they get
    // picked up if installed; otherwise the system sans-serif fallback
    // (SF Pro / Helvetica on macOS, Liberation Sans on Linux) renders.
    loadSystemFonts: true,
  },
});
const png = resvg.render().asPng();
writeFileSync(outPath, png);
console.log(`wrote ${outPath}  (${png.length.toLocaleString()} bytes)`);
