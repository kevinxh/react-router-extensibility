import type { Plugin } from "vite";
import { resolve, dirname } from "node:path";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import type { ExtensionDefinition } from "./types.js";
import {
  generateRootProxy,
  generateRouteProxy,
  generateEntryClientProxy,
} from "./codegen.js";

/**
 * Known RR7 route module exports. We detect these in the original source
 * so the proxy can explicitly re-export them (es-module-lexer used by RR7
 * cannot resolve `export *` to concrete names).
 */
const ROUTE_EXPORT_NAMES = [
  "loader",
  "clientLoader",
  "action",
  "clientAction",
  "meta",
  "links",
  "headers",
  "handle",
  "shouldRevalidate",
  "ErrorBoundary",
  "HydrateFallback",
  "middleware",
  "clientMiddleware",
];

/**
 * Detects which known route exports are present in a source file.
 * Uses regex matching — sufficient for RR7 route modules which use
 * direct `export function/const/let` declarations.
 */
function detectRouteExports(source: string): string[] {
  return ROUTE_EXPORT_NAMES.filter((name) => {
    // export function name / export async function name / export const name
    const declPattern = new RegExp(
      `export\\s+(?:async\\s+)?(?:function|const|let|var)\\s+${name}\\b`
    );
    if (declPattern.test(source)) return true;
    // export { name } or export { ..., name, ... }
    const namedPattern = new RegExp(
      `export\\s*\\{[^}]*\\b${name}\\b[^}]*\\}`
    );
    return namedPattern.test(source);
  });
}

export interface ExtensibilityPluginOptions {
  extensions: ExtensionDefinition[];
}

const EXT_ORIGINAL_QUERY = "?ext-original";

/**
 * Finds the entry.client file path, replicating RR7's resolution logic.
 * Returns the user's file if it exists, otherwise the RR7 default.
 */
function findEntryClientPath(appDirectory: string): {
  path: string;
  isDefault: boolean;
} {
  const exts = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".mts"];
  for (const ext of exts) {
    const p = resolve(appDirectory, `entry.client${ext}`);
    if (existsSync(p)) return { path: p, isDefault: false };
  }
  // Fall back to RR7's default entry.client
  const require = createRequire(import.meta.url);
  const rrDevPkgPath = require.resolve("@react-router/dev/package.json");
  const defaultPath = resolve(
    dirname(rrDevPkgPath),
    "dist",
    "config",
    "defaults",
    "entry.client.tsx"
  );
  return { path: defaultPath, isDefault: true };
}

export function extensibilityPlugin(
  options: ExtensibilityPluginOptions
): Plugin[] {
  const { extensions } = options;
  let appDirectory: string;
  let entryClientInfo: { path: string; isDefault: boolean };
  const hasClientHooks = extensions.some(
    (ext) => ext.clientHooks?.beforeHydration || ext.clientHooks?.afterHydration
  );

  return [
    {
      name: "extensibility-sdk:config",
      enforce: "pre",

      config(userConfig) {
        const root = userConfig.root ?? process.cwd();
        appDirectory = resolve(root, "app");
        entryClientInfo = findEntryClientPath(appDirectory);

        return {
          ssr: {
            // Ensure extension packages are processed by Vite (not externalized)
            noExternal: extensions.map((ext) => ext.name),
          },
        };
      },
    },

    {
      name: "extensibility-sdk:proxy",
      enforce: "pre",

      resolveId(source) {
        // Handle ?ext-original imports — resolve to the actual file
        if (source.includes(EXT_ORIGINAL_QUERY)) {
          const cleanPath = source.replace(EXT_ORIGINAL_QUERY, "");
          return { id: cleanPath + EXT_ORIGINAL_QUERY, external: false };
        }
        return null;
      },

      load(id) {
        // Skip ?ext-original — let Vite load the real file
        if (id.includes(EXT_ORIGINAL_QUERY)) {
          return null;
        }

        // Proxy entry.client — wrap hydration with extension before/after hooks
        if (hasClientHooks && id === entryClientInfo.path) {
          return generateEntryClientProxy(
            entryClientInfo.path,
            entryClientInfo.isDefault,
            extensions
          );
        }

        // Proxy root.tsx — inject extension metadata context + global middleware
        const rootPath = resolve(appDirectory, "root.tsx");
        if (id === rootPath) {
          return generateRootProxy(rootPath, extensions);
        }

        // Proxy enhanced route modules — inject per-route middleware
        if (id.startsWith(appDirectory + "/")) {
          const relPath = id.slice(appDirectory.length + 1); // e.g. "routes/home.tsx"
          const relWithoutExt = relPath.replace(/\.[^.]+$/, ""); // e.g. "routes/home"

          // Collect middleware from all extensions that enhance this route
          const middlewarePaths: string[] = [];
          for (const ext of extensions) {
            const enhancement = ext.routeEnhancements?.[relWithoutExt];
            if (enhancement?.middleware) {
              for (const mw of enhancement.middleware) {
                middlewarePaths.push(resolve(ext._resolvedDir, mw));
              }
            }
          }

          if (middlewarePaths.length > 0) {
            const source = readFileSync(id, "utf-8");
            const originalExports = detectRouteExports(source);
            return generateRouteProxy(id, middlewarePaths, originalExports);
          }
        }

        return null;
      },
    },
  ];
}
