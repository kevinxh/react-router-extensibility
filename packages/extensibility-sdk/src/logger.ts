// ANSI helpers — kept internal so extension code stays clean
const bold = (s: string) => `\x1b[1m${s}\x1b[22m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[22m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[39m`;
const green = (s: string) => `\x1b[32m${s}\x1b[39m`;
const red = (s: string) => `\x1b[31m${s}\x1b[39m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[39m`;

function pad(s: string, width: number): string {
  return s.length >= width ? s.slice(0, width) : s + " ".repeat(width - s.length);
}

function dots(count: number): string {
  return dim("·".repeat(Math.max(1, count)));
}

function dashes(count: number): string {
  return dim("─".repeat(Math.max(1, count)));
}

export interface ExtensionLogger {
  /** General info line (indented, for use in middleware) */
  info(message: string): void;

  /** Request start boundary (for use in instrumentation handler) */
  requestStart(method: string, path: string): void;

  /** Request end boundary (for use in instrumentation handler) */
  requestEnd(method: string, path: string, durationMs: number): void;

  /** Route loader completed (for use in instrumentation route) */
  loader(routeId: string, durationMs: number): void;

  /** Route action completed (for use in instrumentation route) */
  action(routeId: string, durationMs: number): void;
}

/**
 * Create a logger for an extension. All output is prefixed with `[extensionName]`
 * and formatted with ANSI colors for terminal readability.
 */
export function createLogger(extensionName: string): ExtensionLogger {
  const tag = dim(`[${extensionName}]`);

  return {
    info(message: string) {
      console.log(`    ${tag} ${message}`);
    },

    requestStart(method: string, path: string) {
      console.log(
        `\n${cyan(bold("▶"))} ${tag} ${cyan(bold(`${method} ${path}`))}`
      );
    },

    requestEnd(method: string, path: string, durationMs: number) {
      const label = `${method} ${path}`;
      const fill = Math.max(1, 44 - extensionName.length - label.length);
      console.log(
        `${cyan(bold("◀"))} ${tag} ${cyan(bold(label))} ${dim("·")} ${green("200")} ${dashes(fill)} ${yellow(durationMs + "ms")}\n`
      );
    },

    loader(routeId: string, durationMs: number) {
      const msStr = durationMs + "ms";
      const fill = Math.max(1, 20 - msStr.length);
      console.log(
        `    ${tag} ${green("▸")} ${dim("loader")}  ${pad(routeId, 24)} ${dots(fill)} ${yellow(msStr)}`
      );
    },

    action(routeId: string, durationMs: number) {
      const msStr = durationMs + "ms";
      const fill = Math.max(1, 20 - msStr.length);
      console.log(
        `    ${tag} ${red("▸")} ${dim("action")}  ${pad(routeId, 24)} ${dots(fill)} ${yellow(msStr)}`
      );
    },
  };
}
