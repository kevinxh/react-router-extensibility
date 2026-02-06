# React Router Extensibility

An exploration into programmatically extending React Router v7 applications through an SDK-based approach.

## Problem

We are a framework author team that provides a commerce template built on React Router v7 as a starting point for our customers. Customers build their applications on top of this template, but they need the ability to:

- **Extend functionality** without forking or directly modifying the template source code
- **Conditionally enable features** provided by our SDKs
- **Receive future upgrades** to the template without merge conflicts or breaking changes

The typical approach — adding source code directly into the React Router project — creates tight coupling between the template and customer customizations, making upgrades painful and feature delivery fragile.

## Goal

Explore solutions that allow us to **inject and extend** a React Router v7 project programmatically. Instead of inventing parallel systems, the extensibility model is built directly on top of React Router's own primitives. The `extensibility-sdk` package serves as the composition layer, while `react-router-template` acts as the host application that consumes extensions.

## Extension Capabilities

Every capability maps to a React Router primitive. Extensions can use any combination of these:

| Capability | Description | RR7 Primitive |
|---|---|---|
| **Routes** | Inject new pages into the host application | Route config (`routes.ts`) |
| **Middleware** | Run code on every request (global) or on specific routes | Middleware (`root.tsx` / route modules) |
| **Context** | Share typed data across the request lifecycle, readable by any loader or action | React Router context (`context.set()` / `context.get()`) |
| **Actions** | Expose server-side functions that the app can call from loaders and actions | Context-based function registry |
| **Client Hooks** | Run code before or after React hydration on the client | Client entry (`entry.client.tsx`) |
| **Instrumentations** | Observe the server request/response lifecycle for logging, tracing, APM | `unstable_ServerInstrumentation` (`entry.server.tsx`) |

## Structure

```
├── packages/
│   ├── react-router-template/       # Host RR7 application (commerce template)
│   ├── extensibility-sdk/           # SDK: Vite plugin, codegen, context helpers, route helpers
│   ├── extension-about-page/        # Demo: route injection (adds /about, /privacy)
│   ├── extension-auth/              # Demo: context, middleware, actions (auth context + login/logout)
│   ├── extension-bopis/             # Demo: routes, context, actions (Buy Online Pick Up In Store)
│   ├── extension-devtools/          # Demo: route injection (devtools dashboard at /__sfnext-devtools)
│   ├── extension-google-analytics/  # Demo: client hooks (before/after hydration)
│   └── extension-logging/           # Demo: middleware, server instrumentation (request logging)
├── pnpm-workspace.yaml
└── package.json
```

## Getting Started

```bash
pnpm install
pnpm -r --filter '!react-router-template' build   # build the SDK and all extensions
pnpm dev                                           # start the template dev server
```

---

## How It Works

### For App Developers

To enable extensibility in your React Router v7 project, you need to change three files:

#### 1. `vite.config.ts` — register the SDK plugin and list your extensions

```ts
import { extensibilityPlugin } from "extensibility-sdk/vite";
import extensionAuth from "extension-auth";
import extensionBopis from "extension-bopis";

export default defineConfig({
  plugins: [
    extensibilityPlugin({ extensions: [extensionAuth, extensionBopis] }),
    reactRouter(),
  ],
});
```

#### 2. `react-router.config.ts` — enable middleware

```ts
export default { future: { v8_middleware: true } } satisfies Config;
```

#### 3. `routes.ts` — wrap your routes with extension routes

```ts
import { withExtensions } from "extensibility-sdk/routes";
import extensionAuth from "extension-auth";
import extensionBopis from "extension-bopis";

export default withExtensions(
  [index("routes/home.tsx")],
  [extensionAuth, extensionBopis]
) satisfies RouteConfig;
```

After initial setup, adding or removing an extension is a one-line change in `vite.config.ts` and `routes.ts`.

#### Reading extension context in your loaders

Extensions can inject data into the request context (e.g. the current user). Read it in any loader or action:

```ts
import { getExtensionContext } from "extensibility-sdk/context";
import type { AuthContextValue } from "extension-auth/types";

export async function loader({ context }: Route.LoaderArgs) {
  const auth = getExtensionContext<AuthContextValue>(context, "extension-auth");
  return { user: auth?.currentUser };
}
```

#### Calling extension actions

Extensions can expose server-side functions (e.g. login, logout). Call them from your loaders or actions:

```ts
import { getExtensionActions } from "extensibility-sdk/context";

export async function action({ request, context }: Route.ActionArgs) {
  const auth = getExtensionActions<AuthActions>(context, "extension-auth");
  return auth?.login({ email, password });
}
```

---

### For Extension Authors

An extension is a standard npm package that default-exports a `defineExtension()` call. Pass `import.meta.url` as the `dir` field so the SDK can resolve relative module paths from your package root.

```ts
import { defineExtension } from "extensibility-sdk";

export default defineExtension({
  name: "my-extension",
  dir: import.meta.url,
  version: "0.0.1",
  description: "What this extension does.",
  ...features
});
```

#### Routes

Add new pages to the host application. The `helpers` parameter provides React Router's `route`, `index`, `layout`, and `prefix` functions, scoped to resolve files from your package directory.

```ts
defineExtension({
  routes: ({ route, index }) => [
    route("stores", "./src/routes/stores.tsx"),
    route("stores/:storeId", "./src/routes/store-detail.tsx"),
  ],
});
```

#### Global Middleware

Run on every request. Middleware modules are added to `root.tsx`'s middleware array. Each module should default-export a middleware function `(args, next) => Response`.

```ts
defineExtension({
  middleware: ["./src/middleware/auth.ts"],
});
```

```ts
// src/middleware/auth.ts
export default async function authMiddleware(args, next) {
  // validate session, set context, etc.
  return next();
}
```

#### Route-Specific Middleware

Target a specific route by its file path (relative to the app's `app/` directory, without extension). The middleware is prepended to that route's middleware array.

```ts
defineExtension({
  routeEnhancements: {
    "routes/checkout": {
      middleware: ["./src/middleware/requireAuth.ts"],
    },
  },
});
```

#### Context

Extensions inject typed data into the request context using `setExtensionContext()`. Declare `context: true` so the SDK captures values for devtools.

```ts
defineExtension({
  context: true,
  middleware: ["./src/middleware/auth.ts"],
});
```

```ts
// src/middleware/auth.ts
import { setExtensionContext } from "extensibility-sdk/context";

export default async function authMiddleware(args, next) {
  const user = await validateSession(args.request);
  setExtensionContext(args, "my-extension", { currentUser: user });
  return next();
}
```

The app (or other extensions) reads the value with `getExtensionContext<T>(context, "my-extension")`.

#### Actions

Expose server-side functions for the app to call. Each action module should default-export a function.

```ts
defineExtension({
  actions: {
    login:  { handler: "./src/actions/login.ts", description: "Authenticate user" },
    logout: { handler: "./src/actions/logout.ts", description: "End session" },
  },
});
```

The app retrieves actions via `getExtensionActions(context, "my-extension")`.

#### Client Hooks

Run code before or after React hydration on the client. Each module should default-export a function (sync or async).

```ts
defineExtension({
  clientHooks: {
    beforeHydration: "./src/client/beforeHydration.ts",
    afterHydration:  "./src/client/afterHydration.ts",
  },
});
```

```ts
// src/client/beforeHydration.ts
export default function beforeHydration() {
  // initialize analytics, polyfills, etc.
}
```

Hooks run in extension array order. `afterHydration` fires after `hydrateRoot()` is called (React hydration itself is async).

#### Server Instrumentations

Observe server request/response lifecycle using React Router's `unstable_ServerInstrumentation` API. Provides `handler.instrument()` for request-level wrapping and `route.instrument()` for per-route loader/action observation.

```ts
defineExtension({
  instrumentations: {
    server: "./src/instrumentation/server.ts",
  },
});
```

```ts
// src/instrumentation/server.ts
export default {
  handler(handler) {
    handler.instrument({
      request(handleRequest, { request }) {
        const start = Date.now();
        return handleRequest().then((result) => {
          console.log(`${request.method} ${new URL(request.url).pathname} — ${Date.now() - start}ms`);
          return result;
        });
      },
    });
  },
  route(route) {
    route.instrument({
      loader(callLoader) {
        const start = Date.now();
        return callLoader().then((result) => {
          console.log(`loader ${route.id} — ${Date.now() - start}ms`);
          return result;
        });
      },
    });
  },
};
```

---

### Under the Hood

The SDK works by leveraging React Router's fundamental design: **behavior is defined through module exports**. Route modules export `loader`, `middleware`, `action`, `default` (component), etc. Entry files export hydration logic and instrumentations. The SDK intercepts these modules at the Vite level and composes extension code into them — without modifying any source files.

#### Module Proxying

The SDK's Vite plugin intercepts core React Router modules (`root.tsx`, route modules, `entry.client`, `entry.server`) at load time. Instead of returning the original file, it returns a **generated proxy module** that:

1. Re-exports everything from the original file (preserving the app's existing code)
2. Overrides specific exports with composed versions that include extension code

For example, when Vite loads `root.tsx`, the SDK returns a proxy that re-exports the app's component, links, and layout — but replaces the `middleware` export with a composed array containing both extension middleware and the app's original middleware.

The same pattern applies to individual route modules (for per-route middleware), `entry.client` (for hydration hooks), and `entry.server` (for instrumentations).

#### Route Merging

Route injection uses a different mechanism because React Router's route discovery pipeline does not go through the standard Vite plugin pipeline. Instead, the `withExtensions()` helper is called directly in `routes.ts` — it takes the app's route config array and each extension's route definitions, and returns a merged array.

### SDK Exports

| Import path | Purpose |
|---|---|
| `extensibility-sdk` | `defineExtension()`, type exports |
| `extensibility-sdk/vite` | `extensibilityPlugin()` — Vite plugin for the host app |
| `extensibility-sdk/routes` | `withExtensions()` — route merging for `routes.ts` |
| `extensibility-sdk/context` | `setExtensionContext()`, `getExtensionContext()`, `getExtensionActions()` |
| `extensibility-sdk/logger` | `createLogger()` — formatted terminal logging for extensions |

### Example Extensions

| Extension | Features Used | Description |
|---|---|---|
| `extension-about-page` | Routes | Adds `/about` and `/privacy` pages |
| `extension-auth` | Context, middleware, actions | Injects auth context, provides login/logout/getSession actions |
| `extension-bopis` | Routes, context, middleware, actions | Store finder with inventory checking |
| `extension-devtools` | Routes | Dashboard at `/__sfnext-devtools` showing all installed extensions |
| `extension-google-analytics` | Client hooks | Runs GA initialization before/after hydration |
| `extension-logging` | Middleware, server instrumentations | Request logging with timing for loaders/actions |

## References

- [React Router Documentation](https://reactrouter.com/home) — the source of truth for how React Router works
