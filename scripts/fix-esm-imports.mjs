/**
 * Add .js extensions to relative ESM import/export specifiers (Node production).
 * Usage: node scripts/fix-esm-imports.mjs [--check]
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOTS = ["src", "server"];
const EXT_OK = new Set([".js", ".mjs", ".json", ".node", ".wasm", ".css"]);
const checkOnly = process.argv.includes("--check");

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === "dist") continue;
      walk(p, out);
    } else if (/\.(js|mjs)$/.test(name)) out.push(p);
  }
  return out;
}

const importRe =
  /\b(?:import|export)\s+(?:type\s+)?(?:[^"';\n]*?\sfrom\s+)?['"](\.\.?\/[^'"]+)['"]/g;

function resolveImport(fromFile, spec) {
  const base = join(dirname(fromFile), spec);
  const candidates = [base + ".js", base + ".mjs", join(base, "index.js"), base];
  for (const c of candidates) {
    try {
      statSync(c);
      if (c.endsWith(".mjs")) return spec + ".mjs";
      if (c.endsWith(".js") || c.endsWith(join("index.js"))) {
        return spec.endsWith(".js") ? spec : spec + ".js";
      }
      return spec + ".js";
    } catch {
      /* try next */
    }
  }
  return null;
}

let fixes = 0;
const missing = [];

for (const root of ROOTS) {
  for (const file of walk(root)) {
    const text = readFileSync(file, "utf8");
    let changed = false;
    const newText = text.replace(importRe, (full, spec) => {
      const ext = extname(spec);
      if (EXT_OK.has(ext)) return full;
      const resolved = resolveImport(file, spec);
      if (!resolved) {
        missing.push({ file, spec });
        return full;
      }
      fixes++;
      changed = true;
      return full.replace(spec, resolved);
    });
    if (changed && !checkOnly) writeFileSync(file, newText);
  }
}

console.log(checkOnly ? "would fix" : "fixed", fixes, "imports");
if (missing.length) {
  console.log("unresolved", missing.length);
  for (const m of missing) console.log(`${m.file} -> ${m.spec}`);
  process.exit(1);
}
