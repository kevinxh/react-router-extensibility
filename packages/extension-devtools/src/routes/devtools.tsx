import { extensionsContext, type ExtensionMeta } from "extensibility-sdk/context";

export function meta() {
  return [
    { title: "Extensions Devtools" },
    { name: "description", content: "Inspect installed extensions." },
  ];
}

export async function loader({ context }: { context: Map<unknown, unknown> }) {
  const extensions = context.get(extensionsContext) as ExtensionMeta[];
  return { extensions };
}

const styles = {
  page: {
    padding: "2rem",
    fontFamily: "system-ui, sans-serif",
    maxWidth: 720,
    margin: "0 auto",
  },
  card: {
    border: "1px solid #e0e0e0",
    borderRadius: 12,
    padding: "1.5rem",
    marginBottom: "1.5rem",
    background: "#fff",
  },
  extName: {
    margin: "0 0 1.25rem",
    fontSize: "1.4rem",
    fontWeight: 600 as const,
  },
  section: {
    marginBottom: "1rem",
  },
  sectionTitle: {
    fontSize: "0.75rem",
    fontWeight: 600 as const,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    color: "#888",
    margin: "0 0 0.4rem",
  },
  tag: (active: boolean) => ({
    display: "inline-block",
    padding: "0.2rem 0.6rem",
    borderRadius: 4,
    fontSize: "0.8rem",
    fontFamily: "monospace",
    background: active ? "#e6f4ea" : "#f5f5f5",
    color: active ? "#1a7f37" : "#999",
    border: `1px solid ${active ? "#a3d9b1" : "#e0e0e0"}`,
    marginRight: "0.4rem",
    marginBottom: "0.3rem",
  }),
  routeTag: {
    display: "inline-block",
    padding: "0.2rem 0.6rem",
    borderRadius: 4,
    fontSize: "0.8rem",
    fontFamily: "monospace",
    background: "#eef2ff",
    color: "#4338ca",
    border: "1px solid #c7d2fe",
    marginRight: "0.4rem",
    marginBottom: "0.3rem",
  },
  mwTag: {
    display: "inline-block",
    padding: "0.2rem 0.6rem",
    borderRadius: 4,
    fontSize: "0.8rem",
    fontFamily: "monospace",
    background: "#fef3c7",
    color: "#92400e",
    border: "1px solid #fcd34d",
    marginRight: "0.4rem",
    marginBottom: "0.3rem",
  },
  enhancementRow: {
    display: "flex",
    alignItems: "center" as const,
    gap: "0.5rem",
    marginBottom: "0.3rem",
    fontSize: "0.8rem",
  },
  enhancementRoute: {
    fontFamily: "monospace",
    color: "#4338ca",
    fontWeight: 500 as const,
  },
  empty: {
    fontSize: "0.8rem",
    color: "#bbb",
    fontStyle: "italic" as const,
  },
} as const;

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionTitle}>{title}</div>
      {children}
    </div>
  );
}

function Empty() {
  return <span style={styles.empty}>none</span>;
}

function ExtensionCard({ ext }: { ext: ExtensionMeta }) {
  return (
    <div style={styles.card}>
      <h2 style={styles.extName}>{ext.name}</h2>

      <Section title="Routes">
        {ext.routes.length > 0 ? (
          <div>
            {ext.routes.map((r) => (
              <span key={r.path} style={styles.routeTag}>
                {r.path}
              </span>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </Section>

      <Section title="Global Middleware">
        {ext.global.middleware.length > 0 ? (
          <div>
            {ext.global.middleware.map((name) => (
              <span key={name} style={styles.mwTag}>
                {name}
              </span>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </Section>

      <Section title="Route Enhancements">
        {ext.routeEnhancements.length > 0 ? (
          <div>
            {ext.routeEnhancements.map((enh) => (
              <div key={enh.route} style={styles.enhancementRow}>
                <span style={styles.enhancementRoute}>{enh.route}</span>
                <span style={{ color: "#bbb" }}>&rarr;</span>
                {enh.middleware.map((name) => (
                  <span key={name} style={styles.mwTag}>
                    {name}
                  </span>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </Section>

      <Section title="Components">
        {ext.components.length > 0 ? (
          <div>
            {ext.components.map((name) => (
              <span key={name} style={styles.tag(true)}>
                {name}
              </span>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </Section>

      <Section title="Client Entry">
        {ext.clientEntry ? (
          <span style={styles.tag(true)}>wrapApp</span>
        ) : (
          <Empty />
        )}
      </Section>
    </div>
  );
}

export default function Devtools({ loaderData }: { loaderData: { extensions: ExtensionMeta[] } }) {
  const { extensions } = loaderData;

  return (
    <main style={styles.page}>
      <h1 style={{ marginBottom: "0.25rem" }}>Extensions Devtools</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        {extensions.length} extension{extensions.length !== 1 ? "s" : ""}{" "}
        installed
      </p>

      {extensions.length === 0 ? (
        <p style={{ color: "#999" }}>No extensions installed.</p>
      ) : (
        extensions.map((ext: ExtensionMeta) => (
          <ExtensionCard key={ext.name} ext={ext} />
        ))
      )}
    </main>
  );
}
