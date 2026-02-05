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

## Structure

```
├── packages/
│   ├── react-router-template/   # The host React Router v7 application (commerce template)
│   └── extensibility-sdk/       # SDK that provides extension points
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

## References

- [React Router Documentation](https://reactrouter.com/home) — the source of truth for how React Router works
