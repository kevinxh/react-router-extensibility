import { resolve, basename, extname } from "node:path";
import type { ExtensionDefinition } from "./types.js";
import type { ExtensionMeta } from "./context.js";
import { relative } from "@react-router/dev/routes";
import type { RouteConfigEntry } from "@react-router/dev/routes";

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
 * Recursively extracts URL paths from route config entries.
 */
function extractRoutePaths(
  entries: RouteConfigEntry[],
  parentPath = ""
): string[] {
  const paths: string[] = [];
  for (const entry of entries) {
    if (entry.index) {
      paths.push(parentPath || "/");
    } else if (entry.path !== undefined) {
      const full = parentPath
        ? `${parentPath}/${entry.path}`
        : `/${entry.path}`;
      paths.push(full);
    }
    if (entry.children) {
      const childPrefix = entry.path
        ? parentPath
          ? `${parentPath}/${entry.path}`
          : `/${entry.path}`
        : parentPath;
      paths.push(...extractRoutePaths(entry.children, childPrefix));
    }
  }
  return paths;
}

/**
 * Extracts a clean display name from a middleware file path.
 * e.g. "./src/middleware/auth.ts" → "auth"
 */
function middlewareName(filePath: string): string {
  return basename(filePath, extname(filePath));
}

/**
 * Builds serializable metadata for all extensions.
 * Calls ext.routes() at build time to extract actual route paths.
 * Used in generated proxy code as an inline JSON literal.
 */
function buildExtensionsMeta(extensions: ExtensionDefinition[]): ExtensionMeta[] {
  return extensions.map((ext) => {
    // Extract actual route paths
    let routes: { path: string }[] = [];
    if (ext.routes) {
      const helpers = relative(ext._resolvedDir);
      const entries = ext.routes(helpers);
      routes = extractRoutePaths(entries).map((p) => ({ path: p }));
    }

    // Extract global middleware names
    const globalMiddleware = (ext.middleware ?? []).map(middlewareName);

    // Extract per-route enhancement details
    const routeEnhancements = Object.entries(ext.routeEnhancements ?? {}).map(
      ([route, enhancements]) => ({
        route,
        middleware: (enhancements.middleware ?? []).map(middlewareName),
      })
    );

    // Extract component names
    const components = Object.keys(ext.components ?? {});

    return {
      name: ext.name,
      version: ext.version,
      description: ext.description,
      author: ext.author,
      routes,
      global: { middleware: globalMiddleware },
      routeEnhancements,
      components,
      clientEntry: !!ext.clientEntry,
      context: !!ext.context,
    };
  });
}

/**
 * Generates proxy code for a route module that injects per-route middleware from extensions.
 *
 * Uses explicit re-exports instead of `export *` because RR7's es-module-lexer
 * cannot resolve `export *` to concrete names — causing `hasLoader: false` etc.
 *
 * @param originalExports - named exports detected in the original source file
 */
export function generateRouteProxy(
  originalPath: string,
  middlewarePaths: string[],
  originalExports: string[]
): string {
  const lines: string[] = [];

  // Explicitly re-export original's named exports (except middleware, which we override)
  const reexports = originalExports.filter((name) => name !== "middleware");
  if (reexports.length > 0) {
    lines.push(
      `export { ${reexports.join(", ")} } from "${originalPath}?ext-original";`
    );
  }

  // Use `export default` declaration instead of `export { default } from "..."`
  // because RR7's vite plugin has a transform (decorateComponentExportsWithProps)
  // that wraps ExportDefaultDeclaration nodes with withComponentProps(). A re-export
  // like `export { default }` doesn't produce an ExportDefaultDeclaration AST node,
  // so the transform would skip it and loaderData/params props would be undefined.
  lines.push(
    `import _Default from "${originalPath}?ext-original";`,
    `export default _Default;`
  );
  lines.push(``);

  // Import namespace to access original middleware if it exists
  lines.push(`import * as _original from "${originalPath}?ext-original";`);
  lines.push(``);

  // Import extension middleware files
  const mwVars: string[] = [];
  for (let i = 0; i < middlewarePaths.length; i++) {
    const varName = `_mw${i}`;
    lines.push(`import ${varName} from "${middlewarePaths[i]}";`);
    mwVars.push(varName);
  }

  lines.push(``);

  // Compose middleware: extension middleware first, then original
  const all = [...mwVars, `...(_original.middleware ?? [])`];
  lines.push(`export const middleware = [${all.join(", ")}];`);

  return lines.join("\n");
}

/**
 * Generates proxy code for root.tsx that injects global middleware from extensions.
 *
 * The proxy:
 * 1. Re-exports everything from the original root.tsx via ?ext-original
 * 2. Imports namespace from original to access any existing middleware
 * 3. Imports extension middleware files by absolute path
 * 4. Generates an inline SDK middleware that injects extension metadata into context
 * 5. Generates an inline snapshot middleware that captures per-extension context values
 * 6. Exports composed middleware: [SDK metadata mw, ...extension mw, snapshot mw, ...original mw]
 */
export function generateRootProxy(
  originalPath: string,
  extensions: ExtensionDefinition[]
): string {
  const lines: string[] = [];

  // Re-export everything from original (middleware will be overridden below).
  // We use `export *` here because root.tsx has non-standard exports like `Layout`
  // that aren't in the known route exports list. This is safe because root.tsx
  // typically doesn't export `loader`, so the es-module-lexer issue doesn't apply.
  lines.push(
    `export * from "${originalPath}?ext-original";`,
    `export { default } from "${originalPath}?ext-original";`,
    ``
  );

  // Import namespace to access original middleware if it exists
  lines.push(`import * as _original from "${originalPath}?ext-original";`);

  // Import SDK context keys
  lines.push(
    `import { extensionsContext, extensionContextStore, extensionContextValues } from "extensibility-sdk/context";`
  );
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

  // Generate inline metadata middleware — sets extension metadata + initializes context store
  const meta = buildExtensionsMeta(extensions);
  lines.push(
    `// SDK middleware — injects extension metadata and initializes context store`,
    `function _extensionsMetadataMiddleware(args, next) {`,
    `  args.context.set(extensionsContext, ${JSON.stringify(meta)});`,
    `  args.context.set(extensionContextStore, new Map());`,
    `  return next();`,
    `}`,
    ``
  );

  // Generate snapshot middleware — captures per-extension context values after extension MW runs
  lines.push(
    `// SDK middleware — captures per-extension context values for devtools`,
    `function _contextSnapshotMiddleware(args, next) {`,
    `  const _store = args.context.get(extensionContextStore);`,
    `  const _snapshot = [];`,
    `  for (const [name, value] of _store) {`,
    `    try {`,
    `      _snapshot.push({ extension: name, value: JSON.parse(JSON.stringify(value)) });`,
    `    } catch(e) {`,
    `      _snapshot.push({ extension: name, value: "[unserializable]" });`,
    `    }`,
    `  }`,
    `  args.context.set(extensionContextValues, _snapshot);`,
    `  return next();`,
    `}`,
    ``
  );

  // Compose middleware: SDK metadata first, then extension middleware, then snapshot, then original
  const allMiddleware = [
    `_extensionsMetadataMiddleware`,
    ...middlewareImports,
    `_contextSnapshotMiddleware`,
    `...(_original.middleware ?? [])`,
  ];

  lines.push(`export const middleware = [${allMiddleware.join(", ")}];`);

  return lines.join("\n");
}
