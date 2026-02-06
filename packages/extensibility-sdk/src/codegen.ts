import { resolve } from "node:path";
import type { ExtensionDefinition } from "./types.js";

/**
 * Generates proxy code for routes.ts that merges template routes with extension routes.
 *
 * The proxy:
 * 1. Imports original routes via ?ext-original query param
 * 2. Uses RR7's relative() helper to scope extension route files to their package directory
 * 3. Calls each extension's routes() callback and spreads the results
 * 4. Exports the merged array
 */
export function generateRoutesProxy(
  originalPath: string,
  extensions: ExtensionDefinition[]
): string {
  const extensionsWithRoutes = extensions.filter((ext) => ext.routes);
  if (extensionsWithRoutes.length === 0) {
    // No route extensions — passthrough
    return `export { default } from "${originalPath}?ext-original";`;
  }

  const lines: string[] = [];

  lines.push(
    `import _originalRoutes from "${originalPath}?ext-original";`,
    `import { relative as _relative } from "@react-router/dev/routes";`,
    ``
  );

  // Import each extension's definition
  for (let i = 0; i < extensionsWithRoutes.length; i++) {
    const ext = extensionsWithRoutes[i];
    const entryPath = resolve(ext._resolvedDir, "src", "index.js");
    lines.push(`import _ext${i} from "${entryPath}?ext-original";`);
  }

  lines.push(``);

  // Build extension routes
  lines.push(`const _extensionRoutes = [];`);
  for (let i = 0; i < extensionsWithRoutes.length; i++) {
    const ext = extensionsWithRoutes[i];
    lines.push(
      `{`,
      `  const _helpers = _relative("${ext._resolvedDir}");`,
      `  if (_ext${i}.routes) {`,
      `    _extensionRoutes.push(..._ext${i}.routes(_helpers));`,
      `  }`,
      `}`
    );
  }

  lines.push(``);
  lines.push(`export default [..._originalRoutes, ..._extensionRoutes];`);

  return lines.join("\n");
}
