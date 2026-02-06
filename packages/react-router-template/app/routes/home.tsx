import type { Route } from "./+types/home";
import extensionA from "extension-a";

const extensions = [extensionA];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader() {
  // TODO: This is temporary. In Phase 2, the SDK will inject extension metadata
  // into React Router context via global middleware, so the template can access it
  // via context.get(extensionsContext) without importing extension packages directly.
  return {
    extensions: extensions.map((ext) => ({
      name: ext.name,
      dir: ext._resolvedDir,
      capabilities: {
        routes: !!ext.routes,
        middleware: (ext.middleware ?? []).length > 0,
        routeEnhancements: Object.keys(ext.routeEnhancements ?? {}).length > 0,
        components: Object.keys(ext.components ?? {}).length > 0,
        clientEntry: !!ext.clientEntry,
      },
    })),
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { extensions } = loaderData;

  return (
    <main
      style={{
        padding: "2rem",
        fontFamily: "system-ui, sans-serif",
        maxWidth: 640,
        margin: "0 auto",
      }}
    >
      <h1 style={{ marginBottom: "0.5rem" }}>React Router Extensibility</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        Installed extensions and their capabilities
      </p>

      {extensions.length === 0 ? (
        <p>No extensions installed.</p>
      ) : (
        extensions.map(
          (ext: {
            name: string;
            dir: string;
            capabilities: Record<string, boolean>;
          }) => (
            <div
              key={ext.name}
              style={{
                border: "1px solid #e0e0e0",
                borderRadius: 8,
                padding: "1rem 1.5rem",
                marginBottom: "1rem",
              }}
            >
              <h2 style={{ margin: "0 0 0.25rem" }}>{ext.name}</h2>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#999",
                  margin: "0 0 0.75rem",
                  fontFamily: "monospace",
                }}
              >
                {ext.dir}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {Object.entries(ext.capabilities).map(([cap, enabled]) => (
                  <span
                    key={cap}
                    style={{
                      display: "inline-block",
                      padding: "0.2rem 0.6rem",
                      borderRadius: 4,
                      fontSize: "0.8rem",
                      background: enabled ? "#e6f4ea" : "#f5f5f5",
                      color: enabled ? "#1a7f37" : "#999",
                      border: `1px solid ${enabled ? "#a3d9b1" : "#e0e0e0"}`,
                    }}
                  >
                    {enabled ? "\u2713" : "\u2717"} {cap}
                  </span>
                ))}
              </div>
            </div>
          )
        )
      )}
    </main>
  );
}
