import type { RouteConfigEntry } from "@react-router/dev/routes";

export interface RouteHelpers {
  route: typeof import("@react-router/dev/routes").route;
  index: typeof import("@react-router/dev/routes").index;
  layout: typeof import("@react-router/dev/routes").layout;
  prefix: typeof import("@react-router/dev/routes").prefix;
}

export interface ExtensionAuthor {
  name: string;
  url?: string;
}

export interface ExtensionDefinition {
  /** Unique name for the extension */
  name: string;

  /** Semver version string */
  version?: string;

  /** Short description of what this extension does */
  description?: string;

  /** Author of this extension */
  author?: ExtensionAuthor;

  /** Resolved directory for this extension (set by defineExtension) */
  _resolvedDir: string;

  /**
   * Route config entries to inject.
   * The helpers parameter provides route/index/layout/prefix
   * scoped to resolve files relative to this extension's package.
   */
  routes?: (helpers: RouteHelpers) => RouteConfigEntry[];

  /**
   * Global middleware — module paths relative to the extension directory.
   * These are injected into root.tsx's middleware array.
   */
  middleware?: string[];

  /**
   * Route-specific enhancements — keyed by route file path (relative to appDirectory).
   * Module paths are relative to the extension directory.
   */
  routeEnhancements?: Record<
    string,
    {
      middleware?: string[];
    }
  >;

  /**
   * React components provided by this extension.
   * Map of component name to module path (relative to extension directory).
   */
  components?: Record<string, string>;

  /**
   * Client entry customization.
   * Module path (relative to extension directory) that exports a wrapApp function.
   */
  clientEntry?: {
    wrapApp?: string;
  };
}

/**
 * Define an extension. The `dir` parameter is the extension's package root directory.
 * All relative paths in the definition are resolved against this directory.
 */
export function defineExtension(
  dir: string,
  definition: Omit<ExtensionDefinition, "_resolvedDir">
): ExtensionDefinition {
  return {
    ...definition,
    _resolvedDir: dir,
  };
}
