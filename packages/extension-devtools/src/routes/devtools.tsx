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

const tag = (bg: string, fg: string, border: string): React.CSSProperties => ({
  display: "inline-block",
  padding: "1px 6px",
  borderRadius: 3,
  fontSize: "0.75rem",
  fontFamily: "monospace",
  lineHeight: "1.5",
  background: bg,
  color: fg,
  border: `1px solid ${border}`,
  marginRight: 4,
  marginBottom: 2,
});

const routeTag = tag("#eef2ff", "#4338ca", "#c7d2fe");
const mwTag = tag("#fef3c7", "#92400e", "#fcd34d");
const greenTag = tag("#e6f4ea", "#1a7f37", "#a3d9b1");
const dimTag = tag("#f5f5f5", "#999", "#e0e0e0");

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: "0.65rem",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        color: "#999",
        minWidth: 70,
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
      <Label>{label}</Label>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function Dim({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: "0.75rem", color: "#ccc", fontStyle: "italic" }}>{children}</span>;
}

function MiddlewareSection({ ext }: { ext: ExtensionMeta }) {
  const hasGlobal = ext.global.middleware.length > 0;
  const hasRouteSpecific = ext.routeEnhancements.length > 0;

  return (
    <div style={{ marginTop: 4 }}>
      <Label>Middleware</Label>
      {!hasGlobal && !hasRouteSpecific ? (
        <div style={{ paddingLeft: 2, marginTop: 2 }}><Dim>None</Dim></div>
      ) : (
        <div style={{ paddingLeft: 2, marginTop: 2 }}>
          {hasGlobal && (
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
              <span style={{ fontSize: "0.7rem", color: "#aaa", minWidth: 50 }}>global</span>
              <div>
                {ext.global.middleware.map((name) => (
                  <span key={name} style={mwTag}>{name}</span>
                ))}
              </div>
            </div>
          )}
          {ext.routeEnhancements.map((enh) => (
            <div key={enh.route} style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
              <span style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "#4338ca", minWidth: 50 }}>
                {enh.route}
              </span>
              <div>
                {enh.middleware.map((name) => (
                  <span key={name} style={mwTag}>{name}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExtensionCard({ ext }: { ext: ExtensionMeta }) {
  return (
    <div
      style={{
        border: "1px solid #e5e5e5",
        borderRadius: 8,
        padding: "10px 14px",
        marginBottom: 8,
        background: "#fff",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
        <span style={{ fontSize: "1rem", fontWeight: 600 }}>{ext.name}</span>
        {ext.version && (
          <span style={{ fontSize: "0.75rem", color: "#999", fontFamily: "monospace" }}>{ext.version}</span>
        )}
      </div>

      {ext.description && (
        <p style={{ color: "#777", fontSize: "0.8rem", margin: "0 0 4px" }}>{ext.description}</p>
      )}

      {ext.author && (
        <div style={{ marginBottom: 4 }}>
          {ext.author.url ? (
            <a href={ext.author.url} style={{ fontSize: "0.75rem", color: "#888", textDecoration: "none" }}>
              {ext.author.name}
            </a>
          ) : (
            <span style={{ fontSize: "0.75rem", color: "#888" }}>{ext.author.name}</span>
          )}
        </div>
      )}

      <Row label="Routes">
        {ext.routes.length > 0 ? (
          ext.routes.map((r) => (
            <span key={r.path} style={routeTag}>{r.path}</span>
          ))
        ) : (
          <Dim>None</Dim>
        )}
      </Row>

      <MiddlewareSection ext={ext} />

      <Row label="Components">
        {ext.components.length > 0 ? (
          ext.components.map((name) => (
            <span key={name} style={greenTag}>{name}</span>
          ))
        ) : (
          <Dim>None</Dim>
        )}
      </Row>

      <Row label="Client">
        {ext.clientEntry ? (
          <span style={greenTag}>wrapApp</span>
        ) : (
          <Dim>None</Dim>
        )}
      </Row>
    </div>
  );
}

export default function Devtools({ loaderData }: { loaderData: { extensions: ExtensionMeta[] } }) {
  const { extensions } = loaderData;

  return (
    <main style={{ padding: "1.5rem", fontFamily: "system-ui, sans-serif", maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>Extensions</h1>
        <span style={{ fontSize: "0.8rem", color: "#999" }}>
          {extensions.length} installed
        </span>
      </div>

      {extensions.length === 0 ? (
        <p style={{ color: "#999", fontSize: "0.85rem" }}>No extensions installed.</p>
      ) : (
        extensions.map((ext: ExtensionMeta) => (
          <ExtensionCard key={ext.name} ext={ext} />
        ))
      )}
    </main>
  );
}
