/**
 * Serve Vite production build (dist/) from the Express root in production.
 * API remains mounted at /v1 on the parent app before this is attached.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function resolveDistPath() {
  return path.resolve(__dirname, "../../dist");
}

/**
 * @param {import("express").Express} root
 * @param {string} [distPath]
 * @returns {boolean} true when dist/index.html exists and routes were attached
 */
export function attachProductionFrontend(root, distPath = resolveDistPath()) {
  const indexFile = path.join(distPath, "index.html");
  if (!fs.existsSync(indexFile)) {
    root.get("/", (_req, res) => {
      res.status(200).json({
        success: true,
        data: {
          service: "austria-path-api",
          mode: "api-only",
          message:
            "Frontend not built. Run npm run build before deploy, or use a separate Vercel frontend.",
          health: "/v1/health",
        },
      });
    });
    return false;
  }

  root.use(
    express.static(distPath, {
      index: false,
      setHeaders(res, filePath) {
        if (filePath.endsWith("index.html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    })
  );

  root.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return next();
    }
    if (req.path.startsWith("/v1")) {
      return next();
    }
    res.sendFile(indexFile, (err) => {
      if (err) next(err);
    });
  });

  return true;
}
