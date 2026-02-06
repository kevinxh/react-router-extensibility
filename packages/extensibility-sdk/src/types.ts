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
   * Declares that this extension provides context values.
   * Set to `true` to indicate the extension's middleware will call
   * `setExtensionContext()` to inject data into the RR7 context.
   * The SDK captures these values for devtools inspection.
   */
  context?: boolean;

  /**
   * Server-side actions provided by this extension.
   * Each key is the action name, the value specifies a handler module path
   * (relative to extension directory) whose default export is the action function.
   * Actions are injected into the RR7 context and callable via `getExtensionActions()`.
   */
  actions?: Record<
    string,
    {
      description?: string;
      handler: string;
    }
  >;

  /**
   * Client-side hooks that run around React hydration.
   * Module paths are relative to the extension directory.
   * Each module should export a default function (sync or async).
   *
   * - `beforeHydration` — runs before `hydrateRoot()` is called
   * - `afterHydration` — runs after `hydrateRoot()` is called
   *   (note: React hydration itself is async via `startTransition`)
   */
  clientHooks?: {
    beforeHydration?: string;
    afterHydration?: string;
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
