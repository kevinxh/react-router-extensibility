# React Router Extensibility

An exploration into programmatically extending React Router v7 applications through an SDK-based approach.

## Problem

We are a framework author team that provides a commerce template built on React Router v7 as a starting point for our customers. Customers build their applications on top of this template, but they need the ability to:

- **Extend functionality** without forking or directly modifying the template source code
- **Conditionally enable features** provided by our SDKs
- **Receive future upgrades** to the template without merge conflicts or breaking changes

The typical approach — adding source code directly into the React Router project — creates tight coupling between the template and customer customizations, making upgrades painful and feature delivery fragile.

## Goal

Explore solutions that allow us to **inject and extend** a React Router v7 project programmatically, specifically by leveraging the APIs that React Router provides:

- **Context** — sharing data and services across the application
- **Loaders** — extending data loading with SDK-provided logic
- **Middlewares** — intercepting and augmenting request/response handling
- **Routes** — programmatic route injection and modification

The `extensibility-sdk` package serves as the vehicle for these extension points, while `react-router-template` acts as the host application that consumes them.

## Checklist

- [ ] **Route injection** — The SDK should allow extensions to add new routes to the React Router project.
- [ ] **Global middlewares and loaders** — The SDK should allow extensions to add global middlewares and loaders.
- [ ] **Context injection** — The SDK should allow extensions to add and inject business logic into the React Router context with functions, utilities, and data.
- [ ] **Route-specific enhancement** — The SDK should allow extensions to enhance a specific route by injecting middlewares or loaders to that route.
- [ ] **Client entry customization** — The SDK should allow extensions to customize the client-side entry files.
- [ ] **Component provision** — The SDK should allow extensions to provide React components that can be consumed in the template.

## Constraints

- The extensibility mechanism must not cause performance degradations.

## Structure

```
├── packages/
│   ├── react-router-template/   # The host React Router v7 application (commerce template)
│   ├── extensibility-sdk/       # SDK that provides extension points
│   └── extension-a/             # Sample extension package
├── pnpm-workspace.yaml
└── package.json
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Build the SDK
pnpm --filter extensibility-sdk build

# Start the template dev server
pnpm dev
```

## Findings: React Router v7 Internals

Key discoveries about RR7 v7.12.0 internals that inform our extensibility approach. These are based on reading `@react-router/dev/dist/vite.js` source code.

### Route Discovery Pipeline

RR7 discovers routes by executing `routes.ts` through its own **isolated vite-node runner** — a separate Vite server created with **`plugins: []`** (no plugins at all). This means:

- **Vite plugin `load`/`resolveId`/`transform` hooks cannot intercept `routes.ts`.**
- The vite-node context is created at `vite.js:132-188`, with `plugins: []` at line 170.
- Routes are executed at `vite.js:519-520` via `viteNodeContext.runner.executeFile()`.

**Implication:** Route injection must happen inside `routes.ts` itself (e.g., via `withExtensions()`). There is no way to inject routes purely from a Vite plugin.

### Root and Route Module Pipeline

Unlike `routes.ts`, actual route modules (`root.tsx`, `routes/home.tsx`, etc.) are loaded through the **normal Vite dev server pipeline** during request handling. Our Vite plugin hooks **do fire** for these modules.

Verified by logging — the `load` hook is called for:
- `app/root.tsx` ✅
- `app/routes/home.tsx` ✅
- All other app files ✅
- `app/routes.ts` ❌

**Implication:** We can use Vite `load` hook proxying to enhance `root.tsx` (global middleware/loaders) and individual route modules (per-route middleware/loaders).

### Child Compiler

RR7 creates a "child compiler" (`vite.js:3391-3426`) during `configResolved`. This child compiler **does include** user plugins (it re-reads the Vite config file and only filters out `react-router*` named plugins). However, the child compiler is used for route module analysis (exports, code splitting), not for route discovery.

### Middleware API (v8_middleware future flag)

Middleware is behind the `v8_middleware` future flag (`vite.js:566`). When enabled:

- Route modules can export `middleware: MiddlewareFunction[]`
- `MiddlewareFunction = (args, next) => Result`
- `args.context` is a `RouterContextProvider` with `.get(key)` and `.set(key, value)`
- `createContext<T>(defaultValue?)` creates typed context keys
- Middleware is a server-only export (stripped from client bundles)

### Route File Resolution

Route config entries have a `file` field. RR7 handles:

- **Relative paths** — resolved from `appDirectory` (`vite.js:261`)
- **Absolute paths** — converted to relative via `Path.relative(appDirectory, file)`, then resolved back. Files outside the Vite root are served via `/@fs/` URLs (`vite.js:1344`).

**Implication:** Extension route files in `node_modules` work via absolute paths. RR7's `relative()` helper from `@react-router/dev/routes` produces absolute paths scoped to a given directory.

### Entry File Discovery

`root.tsx` is discovered via `findEntry(appDirectory, "root")` — separate from `routes.ts`. It is NOT part of the route config array. It is prepended as a wrapper around all routes at `vite.js:529-535`.

### Preset API

Presets (`react-router.config.ts` `presets` field) can modify config fields (`ssr`, `future`, `basename`, etc.) but **cannot inject routes**. Route config comes exclusively from `routes.ts`.

### Summary: What Can/Cannot Be Done From a Vite Plugin

| Capability | Via Vite Plugin? | Mechanism |
|---|---|---|
| Inject routes | No | Must use `withExtensions()` in `routes.ts` |
| Enhance `root.tsx` (global middleware/loaders) | Yes | `load` hook proxy |
| Enhance route modules (per-route middleware/loaders) | Yes | `load` hook proxy |
| Provide virtual modules (components, client entry) | Yes | `resolveId` + `load` hooks |
| Enable `v8_middleware` flag | No | Must set in `react-router.config.ts` directly |

## References

- [React Router Documentation](https://reactrouter.com/home) — the source of truth for how React Router works
