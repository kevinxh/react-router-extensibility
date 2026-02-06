import type { Plugin } from "vite";
import { resolve } from "node:path";
import type { ExtensionDefinition } from "./types.js";

export interface ExtensibilityPluginOptions {
  extensions: ExtensionDefinition[];
}

const EXT_ORIGINAL_QUERY = "?ext-original";

export function extensibilityPlugin(
  options: ExtensibilityPluginOptions
): Plugin[] {
  const { extensions } = options;
  let appDirectory: string;

  return [
    {
      name: "extensibility-sdk:config",
      enforce: "pre",

      config(userConfig) {
        const root = userConfig.root ?? process.cwd();
        appDirectory = resolve(root, "app");

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

        // Phase 2+: root.tsx and route module proxying will be added here

        return null;
      },
    },
  ];
}
