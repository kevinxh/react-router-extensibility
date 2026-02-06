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
export default defineExtension(packageRoot, {
  name: "extension-a",
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

## Phase 1: Vite Plugin + Route Injection

**Goal:** Extension adds a route. Visit `/about` and see the extension's page.

**Status: In progress.** SDK core built. Extension-a built. Template integration in progress.

| Package | File | Action | Status |
|---|---|---|---|
| `extensibility-sdk` | `src/types.ts` | `ExtensionDefinition`, `defineExtension()` | Done |
| `extensibility-sdk` | `src/vite-plugin.ts` | Vite plugin skeleton | Done |
| `extensibility-sdk` | `src/codegen.ts` | `generateRoutesProxy()` | Done (unused for Phase 1) |
| `extensibility-sdk` | `src/routes.ts` | `withExtensions()` | Done |
| `extensibility-sdk` | `package.json` | Peer deps, exports map | Done |
| `extension-a` | `src/index.ts` | `defineExtension()` with route | Done |
| `extension-a` | `src/routes/about.tsx` | Sample page | Done |
| `react-router-template` | `vite.config.ts` | Add `extensibilityPlugin()` | Done |
| `react-router-template` | `react-router.config.ts` | `v8_middleware: true` | Done |
| `react-router-template` | `package.json` | Add `extension-a` dep | Done |
| `react-router-template` | `app/routes.ts` | Use `withExtensions()` | **TODO** |

### Verify

```bash
pnpm --filter extensibility-sdk build && pnpm --filter extension-a build
pnpm --filter react-router-template dev
# Visit localhost:5173/about → extension-a's about page renders
```

---

## Phase 2: Global Middleware + Context Injection

**Goal:** Extension adds global middleware to `root.tsx` via load hook proxy. Extension injects typed context.

| Package | File | Action |
|---|---|---|
| `extensibility-sdk` | `src/codegen.ts` | Add `generateRootProxy()` |
| `extensibility-sdk` | `src/vite-plugin.ts` | Proxy `root.tsx` via `load` hook |
| `extensibility-sdk` | `src/context.ts` | `createContextMiddleware()`, re-export `createContext` |
| `extension-a` | `src/middleware/auth.ts` | Global middleware (logs requests) |
| `extension-a` | `src/middleware/context.ts` | Context middleware (injects typed value) |
| `react-router-template` | `app/routes/home.tsx` | Loader reads context, renders value |

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

## Phase 4: Component Provision

**Goal:** Extension provides React components via virtual module.

| Package | File | Action |
|---|---|---|
| `extensibility-sdk` | `src/vite-plugin.ts` | `virtual:extensibility-sdk/components` |
| `extension-a` | `src/components/LoyaltyBanner.tsx` | Sample component |

---

## Phase 5: Client Entry Customization

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
5. **`defineExtension(dir, def)`** — explicit directory for resolving relative paths.
