/**
 * Logs every HTTP request: method, path, status, duration (ms).
 */

/**
 * @param {import("express").Express} app
 */
export function attachRequestLogger(app) {
  app.use((req, res, next) => {
    const started = process.hrtime.bigint();

    res.on("finish", () => {
      const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
      console.log(
        `[http] ${req.method} ${req.originalUrl || req.url} ${res.statusCode} ${elapsedMs.toFixed(1)}ms`
      );
    });

    next();
  });
}
