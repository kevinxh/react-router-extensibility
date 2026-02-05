# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A pnpm monorepo exploring how to programmatically extend React Router v7 applications via an SDK. We are a framework author team providing a commerce template to customers who need to extend it without forking — leveraging React Router's context, loaders, middlewares, and routes as extension points.

## Commands

```bash
# Install all dependencies
pnpm install

# Build the SDK (must be done before template can consume it)
pnpm --filter extensibility-sdk build

# Start the template dev server
pnpm dev

# Typecheck all packages
pnpm typecheck

# SDK-specific
pnpm --filter extensibility-sdk dev        # watch mode
pnpm --filter extensibility-sdk typecheck  # typecheck SDK only

# Template-specific
pnpm --filter react-router-template dev    # dev server
pnpm --filter react-router-template build  # production build
pnpm --filter react-router-template typecheck
```

No test runner or linter is configured yet.

## Architecture

**Monorepo layout** (pnpm workspaces):
- `packages/react-router-template` — the host React Router v7 app (SSR enabled, Vite + Tailwind)
- `packages/extensibility-sdk` — zero-dependency TypeScript SDK consumed by the template via `"extensibility-sdk": "workspace:*"`

**SDK build**: Plain `tsc` compiling `src/` to `dist/` with declarations, source maps, and ES2022 modules. The template resolves it through the `exports` field.

**Template stack**: React 19, React Router 7.12 (framework mode with SSR), Vite 7, Tailwind CSS 4. Path alias `~/` maps to `app/`. Routes are defined in `app/routes.ts` using React Router's `RouteConfig`. Auto-generated types live in `.react-router/types/`.

**Key integration point**: The template imports from `extensibility-sdk` — currently used in `packages/react-router-template/app/welcome/welcome.tsx`. When adding new SDK exports, rebuild the SDK or run it in watch mode.

## References

- [React Router Documentation](https://reactrouter.com/home) — source of truth for React Router APIs
