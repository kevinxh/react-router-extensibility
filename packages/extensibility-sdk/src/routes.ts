import { relative } from "@react-router/dev/routes";
import type { RouteConfigEntry } from "@react-router/dev/routes";
import type { ExtensionDefinition } from "./types.js";

/**
 * Merges template routes with extension routes.
 * Used in the template's routes.ts because RR7's vite-node runner
 * for route discovery uses `plugins: []` — our Vite load hook can't intercept it.
 */
export function withExtensions(
  templateRoutes: RouteConfigEntry[],
  extensions: ExtensionDefinition[]
): RouteConfigEntry[] {
  const extensionRoutes: RouteConfigEntry[] = [];

  for (const ext of extensions) {
    if (ext.routes) {
      const helpers = relative(ext._resolvedDir);
      extensionRoutes.push(...ext.routes(helpers));
    }
  }

  return [...templateRoutes, ...extensionRoutes];
}
