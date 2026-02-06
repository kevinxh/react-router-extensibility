import { createContext } from "react-router";

/**
 * Serializable metadata about an installed extension.
 * Injected into RR7 context by the SDK's root.tsx proxy middleware.
 */
export interface ExtensionMeta {
  name: string;
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
  components: string[];
  clientEntry: boolean;
}

/**
 * RR7 context key for extension metadata.
 * Set by the SDK's generated root.tsx middleware.
 * Read by loaders via `args.context.get(extensionsContext)`.
 */
export const extensionsContext = createContext<ExtensionMeta[]>([]);
