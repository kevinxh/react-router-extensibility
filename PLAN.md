# Extensibility SDK — Implementation Plan

## Approach

Vite plugin + `withExtensions()` helper for route injection. Two mechanisms based on what RR7 allows (see README "Findings" section):

- **Route injection** → `withExtensions()` in `routes.ts` (RR7's vite-node uses `plugins: []`, so our Vite hooks can't intercept it)
- **Module enhancement** (root.tsx, route modules) → Vite `load` hook proxy with `?ext-original` recursion breaker

---

## Core Mechanisms

### 1. `withExtensions()` for Route Injection

Used in `routes.ts` because RR7's route discovery pipeline is an isolated vite-node with zero plugins. This is the only way to inject routes.

```ts
// Template's routes.ts
import { withExtensions } from "extensibility-sdk/routes";
import extensionA from "extension-a";

export default withExtensions([index("routes/home.tsx")], [extensionA]);
```

### 2. `load` Hook Proxy for Module Enhancement

Used for `root.tsx` (global middleware) and route modules (per-route middleware). These go through the real Vite pipeline where our hooks fire.

```
Vite loads root.tsx or a route module
  → load hook intercepts → returns proxy code
    → proxy: export * from "original?ext-original" + override middleware/loader
    → ?ext-original hits load hook → query param detected → skip → real file loaded
```

### Template Setup (one-time, three files)

```ts
// 1. vite.config.ts — add SDK plugin
extensibilityPlugin({ extensions: [extensionA] })

// 2. react-router.config.ts — enable middleware
future: { v8_middleware: true }

// 3. routes.ts — wrap routes
withExtensions([...templateRoutes], [extensionA])
```

---

## Extension Definition API

```ts
export default defineExtension({
  name: "extension-a",
  dir: import.meta.url,
  routes: ({ route }) => [route("about", "./src/routes/about.tsx")],
  middleware: ["./src/middleware/auth.ts"],
  routeEnhancements: {
    "routes/home": { middleware: ["./src/middleware/analytics.ts"] },
  },
  components: { LoyaltyBanner: "./src/components/LoyaltyBanner.tsx" },
  clientEntry: { wrapApp: "./src/client/wrap-app.tsx" },
});
```

---

## Phase 1: Vite Plugin + Route Injection — COMPLETE

**Goal:** Extension adds a route. Visit `/about` and see the extension's page.

| Package | File | Action |
|---|---|---|
| `extensibility-sdk` | `src/types.ts` | `ExtensionDefinition`, `defineExtension()` |
| `extensibility-sdk` | `src/vite-plugin.ts` | Vite plugin with config + proxy hooks |
| `extensibility-sdk` | `src/codegen.ts` | `generateRoutesProxy()` (prepared for future) |
| `extensibility-sdk` | `src/routes.ts` | `withExtensions()` |
| `extension-a` | `src/index.ts` | `defineExtension()` with route |
| `extension-a` | `src/routes/about.tsx` | Sample page |
| `react-router-template` | `vite.config.ts` | `extensibilityPlugin()` |
| `react-router-template` | `react-router.config.ts` | `v8_middleware: true` |
| `react-router-template` | `app/routes.ts` | `withExtensions()` |

---

## Phase 2: Global Middleware + Context Injection — COMPLETE

**Goal:** Extension adds global middleware to `root.tsx` via load hook proxy. SDK injects extension metadata into RR7 typed context.

**How it works:** The Vite `load` hook intercepts `root.tsx` and returns a proxy module that:
1. Re-exports everything from the original via `?ext-original` recursion breaker
2. Imports extension middleware files by absolute path
3. Generates an inline SDK middleware that sets `extensionsContext` in RR7 context
4. Overrides the `middleware` export with the composed array

| Package | File | Action |
|---|---|---|
| `extensibility-sdk` | `src/context.ts` | `extensionsContext` key, `ExtensionMeta` type |
| `extensibility-sdk` | `src/codegen.ts` | `generateRootProxy()` |
| `extensibility-sdk` | `src/vite-plugin.ts` | `load` hook proxies `root.tsx` |
| `extension-a` | `src/middleware/auth.ts` | Global middleware (logs requests) |
| `extension-a` | `src/index.ts` | Added `middleware: ["./src/middleware/auth.ts"]` |
| `react-router-template` | `app/routes/home.tsx` | Loader reads `context.get(extensionsContext)` |

---

## Phase 3: Route-Specific Enhancement

**Goal:** Extension adds middleware/loaders to a specific route via load hook proxy.

| Package | File | Action |
|---|---|---|
| `extensibility-sdk` | `src/codegen.ts` | Add `generateRouteProxy()` |
| `extensibility-sdk` | `src/vite-plugin.ts` | Proxy enhanced route modules via `load` hook |
| `extensibility-sdk` | `src/runtime.ts` | `mergeLoaders()` |
| `extension-a` | `src/middleware/analytics.ts` | Route-specific middleware |

---

## Phase 4: Extension Context — SDK-Mediated Context API

**Goal:** Extensions inject typed business logic into RR7 context via SDK helpers. The SDK captures all context values per-extension for devtools inspection and separation of concerns.

**Design:** SDK-mediated approach — extensions call `setExtensionContext()` / `getExtensionContext()` instead of raw `context.set()` / `context.get()`. This gives the SDK full control: it intercepts every write, namespaces by extension name, and captures values for devtools.

**How it works:**
1. Extension middleware calls `setExtensionContext(args, "extension-auth", value)` — SDK stores the value in a single RR7 context Map keyed by extension name
2. App or other extensions call `getExtensionContext<T>(context, "extension-auth")` to read typed values
3. SDK's generated metadata middleware initializes the context store; a snapshot middleware placed after extension MW captures all values into `extensionContextValues` for devtools
4. Devtools reads `extensionContextValues` and displays per-extension context

**Middleware order:**
```
[metadataMW, ext_mw_0, ext_mw_1, snapshotMW, ...appMW]
```

**SDK API:**
```ts
// Extension middleware sets context
import { setExtensionContext } from "extensibility-sdk/context";
setExtensionContext(args, "extension-auth", { currentUser: { id: "1", name: "Alice" } });

// App or another extension reads context
import { getExtensionContext } from "extensibility-sdk/context";
const auth = getExtensionContext<AuthContextValue>(context, "extension-auth");
```

| Package | File | Action |
|---|---|---|
| `extensibility-sdk` | `src/context.ts` | Add `extensionContextStore`, `extensionContextValues`, `setExtensionContext()`, `getExtensionContext()` |
| `extensibility-sdk` | `src/codegen.ts` | Generate snapshot middleware in `generateRootProxy()` |
| `extensibility-sdk` | `src/types.ts` | Add `context?: string` to `ExtensionDefinition` |
| `extensibility-sdk` | `src/index.ts` | Export new context helpers |
| `extension-auth` | `src/index.ts` | `defineExtension()` with context + middleware |
| `extension-auth` | `src/middleware/auth.ts` | Middleware that calls `setExtensionContext()` |
| `extension-auth` | `src/types.ts` | Exported `AuthContextValue` type for consumers |
| `extension-devtools` | `src/routes/devtools.tsx` | Read + display per-extension context values |
| `react-router-template` | `vite.config.ts`, `routes.ts` | Wire in `extension-auth` |
| `react-router-template` | `app/routes/home.tsx` | Read auth context, display user info |

---

## Phase 5: Component Provision

**Goal:** Extension provides React components via virtual module.

| Package | File | Action |
|---|---|---|
| `extensibility-sdk` | `src/vite-plugin.ts` | `virtual:extensibility-sdk/components` |
| `extension-a` | `src/components/LoyaltyBanner.tsx` | Sample component |

---

## Phase 6: Client Entry Customization

**Goal:** Extension wraps app with providers at client entry.

| Package | File | Action |
|---|---|---|
| `extensibility-sdk` | `src/vite-plugin.ts` | `virtual:extensibility-sdk/client-entry` |
| `extension-a` | `src/client/wrap-app.tsx` | Wraps app in provider |
| `react-router-template` | `app/entry.client.tsx` | Uses virtual module |

---

## Key Design Decisions

1. **Two mechanisms, one reason** — `withExtensions()` for routes (forced by RR7's `plugins: []`), `load` hook for everything else. Not by choice but by constraint.
2. **`?ext-original` query param** — standard Vite pattern for load hook recursion breaking.
3. **Three template files** — `vite.config.ts`, `react-router.config.ts`, `routes.ts`. After setup, extensions are added/removed in `vite.config.ts` and `routes.ts`.
4. **Absolute paths** — extension files referenced by absolute path in proxy code. Vite resolves via `/@fs/`.
5. **`defineExtension({ dir: import.meta.url, ... })`** — `dir` field resolves relative paths from the package root.
