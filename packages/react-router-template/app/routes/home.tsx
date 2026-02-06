import type { Route } from "./+types/home";
import { extensionsContext } from "extensibility-sdk/context";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  const extensions = context.get(extensionsContext);
  return { extensions };
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
              <h2 style={{ margin: "0 0 0.5rem" }}>{ext.name}</h2>
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
