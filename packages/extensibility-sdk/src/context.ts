import { createContext } from "react-router";

/**
 * Serializable metadata about an installed extension.
 * Injected into RR7 context by the SDK's root.tsx proxy middleware.
 */
export interface ExtensionMeta {
  name: string;
  version?: string;
  description?: string;
  author?: { name: string; url?: string };
  routes: { path: string }[];
  global: {
    middleware: string[];
  };
  routeEnhancements: {
    route: string;
    middleware: string[];
  }[];
  actions: { name: string; description?: string }[];
  components: string[];
  clientEntry: boolean;
  context: boolean;
}

/**
 * RR7 context key for extension metadata.
 * Set by the SDK's generated root.tsx middleware.
 * Read by loaders via `args.context.get(extensionsContext)`.
 */
export const extensionsContext = createContext<ExtensionMeta[]>([]);

/**
 * Internal RR7 context key — holds a Map<extensionName, value> of all
 * context values set by extensions via `setExtensionContext()`.
 * Not intended for direct use by extensions or the app.
 */
export const extensionContextStore = createContext<
  Map<string, unknown>
>(new Map());

/**
 * Snapshot of per-extension context values, captured by the SDK's generated
 * snapshot middleware. Read by devtools.
 */
export interface ExtensionContextSnapshot {
  extension: string;
  value: unknown;
}

export const extensionContextValues = createContext<
  ExtensionContextSnapshot[]
>([]);

/**
 * Internal RR7 context key — holds a Map<extensionName, Record<actionName, handler>>
 * of action functions registered by extensions. Populated by SDK codegen.
 */
export const extensionActionsStore = createContext<
  Map<string, Record<string, Function>>
>(new Map());

/**
 * Retrieve the action functions registered by an extension.
 * Called by the app or other extensions in loaders/actions/middleware.
 *
 * @param context - The RR7 context object
 * @param extensionName - The extension's unique name
 * @returns A record of action functions, or `undefined` if the extension has no actions
 */
export function getExtensionActions<T = Record<string, Function>>(
  context: { get: Function },
  extensionName: string
): T | undefined {
  const store = context.get(extensionActionsStore) as Map<
    string,
    Record<string, Function>
  >;
  return store.get(extensionName) as T | undefined;
}

/**
 * Set a context value for an extension.
 * Called by extension middleware to inject business logic into the RR7 context.
 * The SDK captures these values for devtools inspection.
 *
 * @param args - The middleware `args` object (must have `args.context`)
 * @param extensionName - The extension's unique name
 * @param value - The value to store (should be JSON-serializable for devtools)
 */
export function setExtensionContext<T>(
  args: { context: { get: Function; set: Function } },
  extensionName: string,
  value: T
): void {
  const store = args.context.get(extensionContextStore) as Map<
    string,
    unknown
  >;
  store.set(extensionName, value);
}

/**
 * Read a context value set by an extension.
 * Called by the app or other extensions in loaders/actions/middleware.
 *
 * @param context - The RR7 context object
 * @param extensionName - The extension's unique name
 * @returns The stored value, or `undefined` if not set
 */
export function getExtensionContext<T = unknown>(
  context: { get: Function },
  extensionName: string
): T | undefined {
  const store = context.get(extensionContextStore) as Map<string, unknown>;
  return store.get(extensionName) as T | undefined;
}
