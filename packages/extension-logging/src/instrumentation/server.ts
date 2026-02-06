/**
 * Server-side instrumentation for the logging extension.
 *
 * Instruments request handling and per-route loader/action execution.
 * Middleware is NOT instrumented here — it's too noisy since each middleware
 * function in the chain gets wrapped individually by React Router.
 */

// ANSI color helpers
const bold = (s: string) => `\x1b[1m${s}\x1b[22m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[22m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[39m`;
const green = (s: string) => `\x1b[32m${s}\x1b[39m`;
const red = (s: string) => `\x1b[31m${s}\x1b[39m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[39m`;

/** Pad/truncate string to fixed width */
function pad(s: string, width: number): string {
  return s.length >= width ? s.slice(0, width) : s + " ".repeat(width - s.length);
}

/**
 * Clean up route IDs for display.
 * File-system routes: "routes/home" → "routes/home"
 * Extension routes (absolute paths): "/Users/.../src/routes/devtools" → "devtools"
 */
function cleanRouteId(id: string): string {
  if (id.startsWith("/")) {
    // Absolute path — extract last meaningful segment
    const parts = id.split("/");
    return parts[parts.length - 1];
  }
  return id;
}

export default {
  handler(handler: any) {
    handler.instrument({
      request(
        handleRequest: () => Promise<any>,
        { request }: { request: { method: string; url: string } }
      ) {
        const url = new URL(request.url);
        const label = `${request.method} ${url.pathname}`;

        console.log(
          `\n${cyan(bold("▶"))} ${cyan(bold(label))}`
        );

        const start = Date.now();
        return handleRequest().then((result: any) => {
          const ms = Date.now() - start;
          console.log(
            `${cyan(bold("◀"))} ${cyan(bold(label))} ${dim("·")} ${green("200")} ${dim("─".repeat(Math.max(1, 44 - label.length)))} ${yellow(ms + "ms")}\n`
          );
          return result;
        });
      },
    });
  },

  route(route: any) {
    const id = cleanRouteId(route.id);

    route.instrument({
      loader(
        callLoader: () => Promise<any>,
        { unstable_pattern }: { unstable_pattern: string }
      ) {
        const start = Date.now();
        return callLoader().then((result: any) => {
          const ms = Date.now() - start;
          const label = `${pad(id, 24)}`;
          console.log(
            `    ${green("▸")} ${dim("loader")}  ${label} ${dim("·".repeat(Math.max(1, 20 - ms.toString().length)))} ${yellow(ms + "ms")}`
          );
          return result;
        });
      },

      action(
        callAction: () => Promise<any>,
        { unstable_pattern }: { unstable_pattern: string }
      ) {
        const start = Date.now();
        return callAction().then((result: any) => {
          const ms = Date.now() - start;
          const label = `${pad(id, 24)}`;
          console.log(
            `    ${red("▸")} ${dim("action")}  ${label} ${dim("·".repeat(Math.max(1, 20 - ms.toString().length)))} ${yellow(ms + "ms")}`
          );
          return result;
        });
      },
    });
  },
};
