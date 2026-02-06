import { resolve } from "node:path";
import type { ExtensionDefinition } from "./types.js";
import type { ExtensionMeta } from "./context.js";

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

/**
 * Builds serializable metadata for all extensions.
 * Used in generated proxy code as an inline JSON literal.
 */
function buildExtensionsMeta(extensions: ExtensionDefinition[]): ExtensionMeta[] {
  return extensions.map((ext) => ({
    name: ext.name,
    capabilities: {
      routes: !!ext.routes,
      middleware: (ext.middleware ?? []).length > 0,
      routeEnhancements: Object.keys(ext.routeEnhancements ?? {}).length > 0,
      components: Object.keys(ext.components ?? {}).length > 0,
      clientEntry: !!ext.clientEntry,
    },
  }));
}

/**
 * Generates proxy code for root.tsx that injects global middleware from extensions.
 *
 * The proxy:
 * 1. Re-exports everything from the original root.tsx via ?ext-original
 * 2. Imports namespace from original to access any existing middleware
 * 3. Imports extension middleware files by absolute path
 * 4. Generates an inline SDK middleware that injects extension metadata into context
 * 5. Exports composed middleware: [SDK metadata mw, ...extension mw, ...original mw]
 */
export function generateRootProxy(
  originalPath: string,
  extensions: ExtensionDefinition[]
): string {
  const lines: string[] = [];

  // Re-export everything from original (middleware will be overridden below)
  lines.push(
    `export * from "${originalPath}?ext-original";`,
    `export { default } from "${originalPath}?ext-original";`,
    ``
  );

  // Import namespace to access original middleware if it exists
  lines.push(`import * as _original from "${originalPath}?ext-original";`);

  // Import SDK context key
  lines.push(`import { extensionsContext } from "extensibility-sdk/context";`);
  lines.push(``);

  // Import extension middleware files
  const middlewareImports: string[] = [];
  let mwIndex = 0;
  for (const ext of extensions) {
    for (const mwPath of ext.middleware ?? []) {
      const absPath = resolve(ext._resolvedDir, mwPath);
      const varName = `_mw${mwIndex}`;
      lines.push(`import ${varName} from "${absPath}";`);
      middlewareImports.push(varName);
      mwIndex++;
    }
  }

  lines.push(``);

  // Generate inline metadata middleware
  const meta = buildExtensionsMeta(extensions);
  lines.push(
    `// SDK middleware — injects extension metadata into RR7 context`,
    `function _extensionsMetadataMiddleware(args, next) {`,
    `  args.context.set(extensionsContext, ${JSON.stringify(meta)});`,
    `  return next();`,
    `}`,
    ``
  );

  // Compose middleware: SDK metadata first, then extension middleware, then original
  const allMiddleware = [
    `_extensionsMetadataMiddleware`,
    ...middlewareImports,
    `...(_original.middleware ?? [])`,
  ];

  lines.push(`export const middleware = [${allMiddleware.join(", ")}];`);

  return lines.join("\n");
}
