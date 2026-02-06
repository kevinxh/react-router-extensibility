import { useState } from "react";
import {
  extensionsContext,
  extensionContextValues,
  type ExtensionMeta,
  type ExtensionContextSnapshot,
} from "extensibility-sdk/context";

export function meta() {
  return [
    { title: "Extensions Devtools" },
    { name: "description", content: "Inspect installed extensions." },
  ];
}

export async function loader({ context }: { context: Map<unknown, unknown> }) {
  const extensions = context.get(extensionsContext) as ExtensionMeta[];
  const contextValues = context.get(
    extensionContextValues
  ) as ExtensionContextSnapshot[];
  return { extensions, contextValues };
}

// ── Palette ──────────────────────────────────────────────────────────
const C = {
  pageBg: "#f5f6fa",
  cardBg: "#fff",
  cardBorder: "#e8eaef",
  shadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
  text: "#1a1a2e",
  secondary: "#6b7280",
  muted: "#9ca3af",
  divider: "#f0f1f5",

  routes: { bg: "#eef2ff", fg: "#4338ca", border: "#c7d2fe", dot: "#6366f1" },
  middleware: {
    bg: "#fef3c7",
    fg: "#92400e",
    border: "#fcd34d",
    dot: "#f59e0b",
  },
  context: {
    bg: "#fce7f3",
    fg: "#9d174d",
    border: "#f9a8d4",
    dot: "#ec4899",
  },
  actions: {
    bg: "#ede9fe",
    fg: "#6d28d9",
    border: "#c4b5fd",
    dot: "#8b5cf6",
  },
  hooks: { bg: "#dbeafe", fg: "#1e40af", border: "#93c5fd", dot: "#3b82f6" },
  instruments: {
    bg: "#fee2e2",
    fg: "#991b1b",
    border: "#fca5a5",
    dot: "#ef4444",
  },
} as const;

type CapKey =
  | "routes"
  | "middleware"
  | "context"
  | "actions"
  | "hooks"
  | "instruments";

const capColor = (key: CapKey) => C[key] as { bg: string; fg: string; border: string; dot: string };

const tagStyle = (key: CapKey): React.CSSProperties => {
  const c = capColor(key);
  return {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 4,
    fontSize: "0.72rem",
    fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace",
    lineHeight: "1.6",
    background: c.bg,
    color: c.fg,
    border: `1px solid ${c.border}`,
    marginRight: 4,
    marginBottom: 3,
  };
};

// ── Icons (simple inline SVGs) ───────────────────────────────────────
const svgBase: React.CSSProperties = {
  display: "inline-block",
  verticalAlign: "middle",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function IconRoutes({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ ...svgBase, ...style }}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10" />
    </svg>
  );
}

function IconMiddleware({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ ...svgBase, ...style }}>
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

function IconContext({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ ...svgBase, ...style }}>
      <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function IconActions({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ ...svgBase, ...style }}>
      <polygon points="5,3 19,12 5,21" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconHooks({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ ...svgBase, ...style }}>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function IconInstruments({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ ...svgBase, ...style }}>
      <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
      <path d="M7.8 16.2a6 6 0 0 1 0-8.4" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      <path d="M16.2 7.8a6 6 0 0 1 0 8.4" />
      <path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1" />
    </svg>
  );
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      style={{
        ...svgBase,
        color: C.muted,
        transition: "transform 0.15s",
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function IconPuzzle({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ ...svgBase, color: C.muted, strokeWidth: 1.5 }}>
      <path d="M19.439 13.44a1.5 1.5 0 0 0 0-2.88A1.5 1.5 0 0 1 18 9.14V7a2 2 0 0 0-2-2h-2.14a1.5 1.5 0 0 1-1.44-1.94 1.5 1.5 0 0 0-2.88 0A1.5 1.5 0 0 1 8.14 5H6a2 2 0 0 0-2 2v2.14a1.5 1.5 0 0 1-1.94 1.44 1.5 1.5 0 0 0 0 2.88A1.5 1.5 0 0 1 4 14.86V17a2 2 0 0 0 2 2h2.14a1.5 1.5 0 0 1 1.44 1.94 1.5 1.5 0 0 0 2.88 0A1.5 1.5 0 0 1 13.86 19H16a2 2 0 0 0 2-2v-2.14a1.5 1.5 0 0 1 1.44-1.42z" />
    </svg>
  );
}

function IconPerson({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ ...svgBase, ...style }}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

// ── Summary helpers ──────────────────────────────────────────────────
function countCapabilities(ext: ExtensionMeta) {
  return {
    routes: ext.routes.length,
    middleware:
      ext.global.middleware.length +
      ext.routeEnhancements.reduce((s, e) => s + e.middleware.length, 0),
    context: ext.context ? 1 : 0,
    actions: ext.actions.length,
    hooks:
      (ext.clientHooks?.beforeHydration ? 1 : 0) +
      (ext.clientHooks?.afterHydration ? 1 : 0),
    instruments:
      (ext.instrumentations?.server ? 1 : 0) +
      (ext.instrumentations?.client ? 1 : 0),
  };
}

function hasCapability(ext: ExtensionMeta, key: CapKey): boolean {
  const c = countCapabilities(ext);
  return c[key] > 0;
}

// ── Summary stat card ────────────────────────────────────────────────
function StatCard({
  icon,
  count,
  label,
  color,
}: {
  icon: React.ReactNode;
  count: number;
  label: string;
  color: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        padding: "14px 8px",
        background: C.cardBg,
        borderRadius: 10,
        border: `1px solid ${C.cardBorder}`,
      }}
    >
      <span style={{ color }}>{icon}</span>
      <span style={{ fontSize: "1.25rem", fontWeight: 700, color: C.text }}>
        {count}
      </span>
      <span
        style={{
          fontSize: "0.65rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: C.muted,
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ── Capability dots shown in card header ─────────────────────────────
function CapDots({ ext }: { ext: ExtensionMeta }) {
  const caps: { key: CapKey; label: string; Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }> }[] = [
    { key: "routes", label: "Routes", Icon: IconRoutes },
    { key: "middleware", label: "Middleware", Icon: IconMiddleware },
    { key: "context", label: "Context", Icon: IconContext },
    { key: "actions", label: "Actions", Icon: IconActions },
    { key: "hooks", label: "Hooks", Icon: IconHooks },
    { key: "instruments", label: "Instruments", Icon: IconInstruments },
  ];

  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {caps
        .filter((c) => hasCapability(ext, c.key))
        .map((c) => (
          <span key={c.key} title={c.label} style={{ color: capColor(c.key).dot, display: "flex" }}>
            <c.Icon size={15} />
          </span>
        ))}
    </span>
  );
}

// ── Section components ───────────────────────────────────────────────
function SectionRow({
  icon,
  iconColor,
  label,
  count,
  children,
  last,
}: {
  icon: React.ReactNode;
  iconColor: string;
  label: string;
  count?: number;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 10,
        padding: "8px 0",
        borderBottom: last ? "none" : `1px solid ${C.divider}`,
      }}
    >
      <span style={{ color: iconColor, flexShrink: 0, position: "relative", top: 1 }}>
        {icon}
      </span>
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          minWidth: 140,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: "0.68rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: C.muted,
          }}
        >
          {label}
        </span>
        {count !== undefined && count > 0 && (
          <span
            style={{
              fontSize: "0.6rem",
              fontWeight: 600,
              background: C.divider,
              color: C.secondary,
              borderRadius: 10,
              padding: "0 6px",
              lineHeight: "1.7",
            }}
          >
            {count}
          </span>
        )}
      </span>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function Dim({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{ fontSize: "0.75rem", color: C.muted, fontStyle: "italic" }}
    >
      {children}
    </span>
  );
}

function MiddlewareContent({ ext }: { ext: ExtensionMeta }) {
  const hasGlobal = ext.global.middleware.length > 0;
  const hasRoute = ext.routeEnhancements.length > 0;
  if (!hasGlobal && !hasRoute) return <Dim>None</Dim>;

  const scopeLabel: React.CSSProperties = {
    fontSize: "0.62rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: C.muted,
    minWidth: 50,
    flexShrink: 0,
  };

  return (
    <div>
      {hasGlobal && (
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
          <span style={scopeLabel}>global</span>
          <div>
            {ext.global.middleware.map((name) => (
              <span key={name} style={tagStyle("middleware")}>{name}</span>
            ))}
          </div>
        </div>
      )}
      {ext.routeEnhancements.map((enh) => (
        <div key={enh.route} style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
          <span style={{ ...scopeLabel, fontFamily: "ui-monospace, monospace", color: C.routes.fg }}>{enh.route}</span>
          <div>
            {enh.middleware.map((name) => (
              <span key={name} style={tagStyle("middleware")}>{name}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ContextContent({
  ext,
  contextValues,
}: {
  ext: ExtensionMeta;
  contextValues: ExtensionContextSnapshot[];
}) {
  const snapshot = contextValues.find((cv) => cv.extension === ext.name);
  if (!snapshot) return <Dim>None</Dim>;

  return (
    <div
      style={{
        background: C.context.bg,
        border: `1px solid ${C.context.border}`,
        borderRadius: 6,
        padding: "8px 12px",
        fontSize: "0.72rem",
        fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace",
        whiteSpace: "pre-wrap",
        wordBreak: "break-all",
        color: C.context.fg,
        maxHeight: 200,
        overflow: "auto",
      }}
    >
      {typeof snapshot.value === "string"
        ? snapshot.value
        : JSON.stringify(snapshot.value, null, 2)}
    </div>
  );
}

// ── Extension card ───────────────────────────────────────────────────
function ExtensionCard({
  ext,
  contextValues,
}: {
  ext: ExtensionMeta;
  contextValues: ExtensionContextSnapshot[];
}) {
  const [open, setOpen] = useState(false);
  const caps = countCapabilities(ext);
  const mwCount = caps.middleware;

  return (
    <div
      style={{
        border: `1px solid ${C.cardBorder}`,
        borderRadius: 10,
        background: C.cardBg,
        boxShadow: C.shadow,
        marginBottom: 10,
        overflow: "hidden",
      }}
    >
      {/* Header — always visible */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        {/* Puzzle icon */}
        <span
          style={{
            flexShrink: 0,
            width: 40,
            height: 40,
            borderRadius: 10,
            background: C.divider,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconPuzzle size={22} />
        </span>

        {/* Name + description */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "0.95rem", fontWeight: 600, color: C.text }}>
              {ext.name}
            </span>
            {ext.version && (
              <span
                style={{
                  fontSize: "0.62rem",
                  fontWeight: 600,
                  fontFamily: "ui-monospace, monospace",
                  background: "#f0f1f5",
                  color: C.secondary,
                  borderRadius: 4,
                  padding: "1px 6px",
                }}
              >
                v{ext.version}
              </span>
            )}
          </div>
          {ext.description && (
            <p
              style={{
                margin: "2px 0 0",
                fontSize: "0.78rem",
                color: C.secondary,
                lineHeight: 1.3,
              }}
            >
              {ext.description}
            </p>
          )}
        </div>

        {/* Capability dots + feature count + chevron */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <CapDots ext={ext} />
          <IconChevron open={open} />
        </div>
      </div>

      {/* Expanded detail */}
      {open && (
        <div
          style={{
            padding: "0 16px 12px 68px", // 16 + 40 icon + 12 gap = 68
            borderTop: `1px solid ${C.divider}`,
          }}
        >
          <SectionRow
            icon={<IconPerson size={14} />}
            iconColor={C.muted}
            label="Author"
          >
            {ext.author ? (
              ext.author.url ? (
                <a
                  href={ext.author.url}
                  style={{
                    fontSize: "0.78rem",
                    color: C.secondary,
                    textDecoration: "none",
                  }}
                >
                  {ext.author.name}
                </a>
              ) : (
                <span style={{ fontSize: "0.78rem", color: C.secondary }}>
                  {ext.author.name}
                </span>
              )
            ) : (
              <Dim>None</Dim>
            )}
          </SectionRow>

          <SectionRow
            icon={<IconRoutes size={14} />}
            iconColor={C.routes.dot}
            label="Routes"
            count={ext.routes.length || undefined}
          >
            {ext.routes.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {ext.routes.map((r) => (
                  <a
                    key={r.path}
                    href={r.path}
                    style={{ ...tagStyle("routes"), textDecoration: "none", width: "fit-content" }}
                  >
                    {r.path}
                  </a>
                ))}
              </div>
            ) : (
              <Dim>None</Dim>
            )}
          </SectionRow>

          <SectionRow
            icon={<IconMiddleware size={14} />}
            iconColor={C.middleware.dot}
            label="Middleware"
            count={mwCount}
          >
            <MiddlewareContent ext={ext} />
          </SectionRow>

          <SectionRow
            icon={<IconContext size={14} />}
            iconColor={C.context.dot}
            label="Context"
          >
            <ContextContent ext={ext} contextValues={contextValues} />
          </SectionRow>

          <SectionRow
            icon={<IconActions size={14} />}
            iconColor={C.actions.dot}
            label="Actions"
            count={ext.actions.length || undefined}
          >
            {ext.actions.length > 0 ? (
              ext.actions.map((a) => (
                <span key={a.name} style={tagStyle("actions")} title={a.description}>
                  {a.name}
                </span>
              ))
            ) : (
              <Dim>None</Dim>
            )}
          </SectionRow>

          <SectionRow
            icon={<IconHooks size={14} />}
            iconColor={C.hooks.dot}
            label="Hooks"
            count={caps.hooks || undefined}
          >
            {caps.hooks > 0 ? (
              <>
                {ext.clientHooks?.beforeHydration && (
                  <span style={tagStyle("hooks")}>beforeHydration</span>
                )}
                {ext.clientHooks?.afterHydration && (
                  <span style={tagStyle("hooks")}>afterHydration</span>
                )}
              </>
            ) : (
              <Dim>None</Dim>
            )}
          </SectionRow>

          <SectionRow
            icon={<IconInstruments size={14} />}
            iconColor={C.instruments.dot}
            label="Instruments"
            count={caps.instruments || undefined}
            last
          >
            {caps.instruments > 0 ? (
              <>
                {ext.instrumentations?.server && (
                  <span style={tagStyle("instruments")}>server</span>
                )}
                {ext.instrumentations?.client && (
                  <span style={tagStyle("hooks")}>client</span>
                )}
              </>
            ) : (
              <Dim>None</Dim>
            )}
          </SectionRow>

          {/* Capabilities bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 10,
              paddingTop: 8,
              borderTop: `1px solid ${C.divider}`,
            }}
          >
            <span style={{ fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: C.muted }}>
              Capabilities
            </span>
            {(["routes", "middleware", "context", "actions", "hooks", "instruments"] as CapKey[])
              .filter((k) => hasCapability(ext, k))
              .map((k) => (
                <span
                  key={k}
                  title={k}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: capColor(k).dot,
                    display: "inline-block",
                  }}
                />
              ))}
            <span style={{ marginLeft: "auto", fontSize: "0.65rem", color: C.muted }}>
              {(["routes", "middleware", "context", "actions", "hooks", "instruments"] as CapKey[]).filter(
                (k) => hasCapability(ext, k)
              ).length}{" "}
              of 6 active
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────
export default function Devtools({
  loaderData,
}: {
  loaderData: {
    extensions: ExtensionMeta[];
    contextValues: ExtensionContextSnapshot[];
  };
}) {
  const { extensions, contextValues } = loaderData;

  // Aggregate stats
  const totals = extensions.reduce(
    (acc, ext) => {
      const c = countCapabilities(ext);
      acc.routes += c.routes;
      acc.middleware += c.middleware;
      acc.context += c.context;
      acc.actions += c.actions;
      acc.hooks += c.hooks;
      acc.instruments += c.instruments;
      return acc;
    },
    { routes: 0, middleware: 0, context: 0, actions: 0, hooks: 0, instruments: 0 }
  );

  return (
    <main
      style={{
        padding: "2rem",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        maxWidth: 900,
        margin: "0 auto",
        minHeight: "100vh",
        background: C.pageBg,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            margin: 0,
            color: C.text,
          }}
        >
          Extensions
        </h1>
        <span
          style={{
            fontSize: "0.78rem",
            color: C.muted,
            background: C.cardBg,
            border: `1px solid ${C.cardBorder}`,
            borderRadius: 6,
            padding: "3px 10px",
          }}
        >
          {extensions.length} of {extensions.length} shown
        </span>
      </div>
      <p
        style={{
          fontSize: "0.85rem",
          color: C.secondary,
          margin: "0 0 20px",
        }}
      >
        Inspect and manage installed extensions for your application.
      </p>

      {/* Summary stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <StatCard
          icon={<IconRoutes size={20} />}
          count={totals.routes}
          label="Routes"
          color={C.routes.dot}
        />
        <StatCard
          icon={<IconMiddleware size={20} />}
          count={totals.middleware}
          label="Middleware"
          color={C.middleware.dot}
        />
        <StatCard
          icon={<IconContext size={20} />}
          count={totals.context}
          label="Contexts"
          color={C.context.dot}
        />
        <StatCard
          icon={<IconActions size={20} />}
          count={totals.actions}
          label="Actions"
          color={C.actions.dot}
        />
        <StatCard
          icon={<IconHooks size={20} />}
          count={totals.hooks}
          label="Hooks"
          color={C.hooks.dot}
        />
        <StatCard
          icon={<IconInstruments size={20} />}
          count={totals.instruments}
          label="Instruments"
          color={C.instruments.dot}
        />
      </div>

      {/* Extension cards */}
      {extensions.length === 0 ? (
        <p style={{ color: C.muted, fontSize: "0.85rem" }}>
          No extensions installed.
        </p>
      ) : (
        extensions.map((ext: ExtensionMeta) => (
          <ExtensionCard
            key={ext.name}
            ext={ext}
            contextValues={contextValues}
          />
        ))
      )}
    </main>
  );
}
