/**
 * Fail the Vercel/Vite build if dist/ is not a production bundle.
 * Prevents deploying source index.html that references /src/main.jsx (blank page + 404).
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const distDir = "dist";
const indexPath = join(distDir, "index.html");

if (!existsSync(indexPath)) {
  console.error("verify-dist: dist/index.html missing — run vite build first.");
  process.exit(1);
}

const html = readFileSync(indexPath, "utf8");

if (html.includes("/src/main.jsx") || html.includes("/src/main.tsx")) {
  console.error(
    "verify-dist: dist/index.html still references dev entry /src/main.* — Vite build did not run."
  );
  process.exit(1);
}

const scriptMatch = html.match(/src="(\/assets\/[^"]+\.js)"/);
if (!scriptMatch) {
  console.error("verify-dist: no hashed /assets/*.js script tag in dist/index.html.");
  process.exit(1);
}

const bundlePath = join(distDir, scriptMatch[1].replace(/^\//, "").replace(/\//g, "\\"));
const bundlePathPosix = join(distDir, scriptMatch[1].slice(1));
const bundleFile = existsSync(bundlePath) ? bundlePath : bundlePathPosix;

if (!existsSync(bundleFile)) {
  console.error(`verify-dist: index.html references missing bundle ${scriptMatch[1]}`);
  process.exit(1);
}

const assetsDir = join(distDir, "assets");
const assetCount = existsSync(assetsDir) ? readdirSync(assetsDir).length : 0;
if (assetCount < 1) {
  console.error("verify-dist: dist/assets is empty.");
  process.exit(1);
}

console.log(`verify-dist OK — ${scriptMatch[1]} (${assetCount} assets)`);
