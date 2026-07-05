/**
 * Process-level diagnostics for Railway / production runtime.
 */

/**
 * @param {{ onShutdown?: (signal: string) => void | Promise<void> }} [options]
 */
export function attachProcessHandlers(options = {}) {
  const { onShutdown } = options;

  process.on("uncaughtException", (error) => {
    console.error("[process] uncaughtException", error);
  });

  process.on("unhandledRejection", (reason) => {
    console.error("[process] unhandledRejection", reason);
  });

  process.on("SIGTERM", () => {
    console.log("[process] SIGTERM received");
    if (onShutdown) {
      Promise.resolve(onShutdown("SIGTERM")).catch((error) => {
        console.error("[process] shutdown failed after SIGTERM", error);
        process.exit(1);
      });
    }
  });

  process.on("SIGINT", () => {
    console.log("[process] SIGINT received");
    if (onShutdown) {
      Promise.resolve(onShutdown("SIGINT")).catch((error) => {
        console.error("[process] shutdown failed after SIGINT", error);
        process.exit(1);
      });
    }
  });
}
