import { useState, useMemo } from "react";
import {
  extensionsContext,
  extensionContextValues,
  type ExtensionMeta,
  type ExtensionContextSnapshot,
} from "extensibility-sdk/context";
import FlowDiagram from "./flow-diagram";

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

// ── Architecture Diagram Types & Constants ────────────────────────────

type HoverTarget =
  | { type: "none" }
  | { type: "extension"; name: string }
  | { type: "stage"; index: number };

interface PipelineStage {
  id: string;
  label: string;
  sublabel: string;
  colorKey: CapKey;
}

interface ExtConnection {
  stageIndex: number;
  colorKey: CapKey;
}

interface ExtPositioned {
  ext: ExtensionMeta;
  connections: ExtConnection[];
  finalY: number;
  centerY: number;
}

const PIPELINE_STAGES: PipelineStage[] = [
  { id: "entry-server", label: "entry.server", sublabel: "Server Instrumentations", colorKey: "instruments" },
  { id: "root-tsx", label: "root.tsx", sublabel: "Middleware · Context · Actions", colorKey: "middleware" },
  { id: "routes-ts", label: "routes.ts", sublabel: "Route Injection", colorKey: "routes" },
  { id: "route-modules", label: "Route Modules", sublabel: "Per-route Enhancement", colorKey: "middleware" },
  { id: "entry-client", label: "entry.client", sublabel: "Client Hydration Hooks", colorKey: "hooks" },
];

const DG = {
  viewBoxWidth: 800,
  viewBoxHeight: 460,

  pipeline: {
    x: 40,
    boxWidth: 190,
    boxHeight: 56,
    boxRadius: 10,
    startY: 24,
    spacingY: 80,
  },

  extensions: {
    x: 580,
    boxWidth: 185,
    boxHeight: 44,
    boxRadius: 8,
    minGap: 10,
  },

  connection: {
    strokeWidth: 1.8,
    strokeWidthHover: 2.8,
    dimOpacity: 0.1,
    normalOpacity: 0.55,
    hoverOpacity: 1,
    cpOffsetRatio: 0.38,
  },

  legend: { y: 430 },
} as const;

// ── Diagram helpers ──────────────────────────────────────────────────

function getExtConnections(ext: ExtensionMeta): ExtConnection[] {
  const conns: ExtConnection[] = [];
  if (ext.instrumentations?.server) conns.push({ stageIndex: 0, colorKey: "instruments" });
  if (ext.global.middleware.length > 0) conns.push({ stageIndex: 1, colorKey: "middleware" });
  if (ext.context) conns.push({ stageIndex: 1, colorKey: "context" });
  if (ext.actions.length > 0) conns.push({ stageIndex: 1, colorKey: "actions" });
  if (ext.routes.length > 0) conns.push({ stageIndex: 2, colorKey: "routes" });
  if (ext.routeEnhancements.length > 0) conns.push({ stageIndex: 3, colorKey: "middleware" });
  if (ext.clientHooks?.beforeHydration || ext.clientHooks?.afterHydration)
    conns.push({ stageIndex: 4, colorKey: "hooks" });
  return conns;
}

function stageCenterY(idx: number): number {
  return DG.pipeline.startY + idx * DG.pipeline.spacingY + DG.pipeline.boxHeight / 2;
}

function layoutExtensions(extensions: ExtensionMeta[]): ExtPositioned[] {
  const items = extensions
    .map((ext) => {
      const connections = getExtConnections(ext);
      if (connections.length === 0) return null;
      const avgY =
        connections.reduce((s, c) => s + stageCenterY(c.stageIndex), 0) / connections.length;
      return {
        ext,
        connections,
        idealY: avgY - DG.extensions.boxHeight / 2,
        finalY: 0,
        centerY: 0,
      };
    })
    .filter(Boolean) as (ExtPositioned & { idealY: number })[];

  items.sort((a, b) => a.idealY - b.idealY);

  for (let i = 0; i < items.length; i++) {
    if (i === 0) {
      items[i].finalY = Math.max(DG.pipeline.startY, items[i].idealY);
    } else {
      const prevBottom = items[i - 1].finalY + DG.extensions.boxHeight;
      items[i].finalY = Math.max(prevBottom + DG.extensions.minGap, items[i].idealY);
    }
    items[i].centerY = items[i].finalY + DG.extensions.boxHeight / 2;
  }

  return items;
}

function bezierPath(
  stageIdx: number,
  extCenterY: number,
  srcYOffset: number,
): string {
  const srcX = DG.pipeline.x + DG.pipeline.boxWidth;
  const srcY = stageCenterY(stageIdx) + srcYOffset;
  const tgtX = DG.extensions.x;
  const tgtY = extCenterY;
  const gap = tgtX - srcX;
  const cpOff = gap * DG.connection.cpOffsetRatio;
  return `M${srcX},${srcY} C${srcX + cpOff},${srcY} ${tgtX - cpOff},${tgtY} ${tgtX},${tgtY}`;
}

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

// ── Architecture Diagram Component ───────────────────────────────────

function ArchitectureDiagram({ extensions }: { extensions: ExtensionMeta[] }) {
  const [hover, setHover] = useState<HoverTarget>({ type: "none" });
  const positioned = useMemo(() => layoutExtensions(extensions), [extensions]);

  // Pre-compute how many connections land on each stage (for vertical spread)
  const stageConnCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const p of positioned) {
      for (const c of p.connections) {
        counts.set(c.stageIndex, (counts.get(c.stageIndex) || 0) + 1);
      }
    }
    return counts;
  }, [positioned]);

  // Dynamic viewBox height
  const vbHeight = useMemo(() => {
    if (positioned.length === 0) return DG.viewBoxHeight;
    const lastBottom = positioned[positioned.length - 1].finalY + DG.extensions.boxHeight;
    return Math.max(DG.viewBoxHeight, lastBottom + 60);
  }, [positioned]);

  // Build all connection paths with offset tracking
  const allConnections = useMemo(() => {
    const stageOffsetCounters = new Map<number, number>();
    const result: {
      extName: string;
      stageIndex: number;
      colorKey: CapKey;
      path: string;
      extCenterY: number;
    }[] = [];

    for (const p of positioned) {
      for (const conn of p.connections) {
        const total = stageConnCounts.get(conn.stageIndex) || 1;
        const idx = stageOffsetCounters.get(conn.stageIndex) || 0;
        stageOffsetCounters.set(conn.stageIndex, idx + 1);

        const maxSpread = Math.min(20, DG.pipeline.boxHeight / 2 - 4);
        let srcYOffset = 0;
        if (total > 1) {
          srcYOffset = -maxSpread / 2 + (maxSpread / (total - 1)) * idx;
        }

        result.push({
          extName: p.ext.name,
          stageIndex: conn.stageIndex,
          colorKey: conn.colorKey,
          path: bezierPath(conn.stageIndex, p.centerY, srcYOffset),
          extCenterY: p.centerY,
        });
      }
    }
    return result;
  }, [positioned, stageConnCounts]);

  // Opacity helpers
  function connOpacity(extName: string, stageIdx: number): number {
    if (hover.type === "none") return DG.connection.normalOpacity;
    if (hover.type === "extension" && hover.name === extName) return DG.connection.hoverOpacity;
    if (hover.type === "stage" && hover.index === stageIdx) return DG.connection.hoverOpacity;
    return DG.connection.dimOpacity;
  }

  function stageOpacity(idx: number): number {
    if (hover.type === "none") return 1;
    if (hover.type === "stage" && hover.index === idx) return 1;
    if (hover.type === "extension") {
      const p = positioned.find((p) => p.ext.name === hover.name);
      if (p && p.connections.some((c) => c.stageIndex === idx)) return 1;
    }
    return 0.35;
  }

  function extOpacity(name: string): number {
    if (hover.type === "none") return 1;
    if (hover.type === "extension" && hover.name === name) return 1;
    if (hover.type === "stage") {
      const p = positioned.find((p) => p.ext.name === name);
      if (p && p.connections.some((c) => c.stageIndex === hover.index)) return 1;
    }
    return 0.25;
  }

  const legendY = vbHeight - 26;

  return (
    <svg
      viewBox={`0 0 ${DG.viewBoxWidth} ${vbHeight}`}
      width="100%"
      style={{ display: "block" }}
      role="img"
      aria-label="Architecture diagram showing how extensions connect to the React Router pipeline"
      onMouseLeave={() => setHover({ type: "none" })}
    >
      {/* Defs: shadow filter + animation */}
      <defs>
        <filter id="diag-shadow" x="-4%" y="-4%" width="108%" height="112%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.07" />
        </filter>
        <style>{`
          @keyframes dash-march { to { stroke-dashoffset: -20; } }
          .conn-active { stroke-dasharray: 8 4; animation: dash-march 0.6s linear infinite; }
        `}</style>
      </defs>

      {/* Layer 1: Connection bezier curves (behind boxes) */}
      {allConnections.map((conn, i) => {
        const opacity = connOpacity(conn.extName, conn.stageIndex);
        const isActive = opacity === DG.connection.hoverOpacity;
        return (
          <path
            key={i}
            d={conn.path}
            fill="none"
            stroke={capColor(conn.colorKey).dot}
            strokeWidth={isActive ? DG.connection.strokeWidthHover : DG.connection.strokeWidth}
            opacity={opacity}
            className={isActive ? "conn-active" : undefined}
            style={{ transition: "opacity 0.2s, stroke-width 0.2s" }}
          />
        );
      })}

      {/* Layer 2: Down-arrows between pipeline stages */}
      {[0, 1, 2, 3].map((i) => {
        const fromBottom = DG.pipeline.startY + i * DG.pipeline.spacingY + DG.pipeline.boxHeight;
        const toTop = DG.pipeline.startY + (i + 1) * DG.pipeline.spacingY;
        const cx = DG.pipeline.x + DG.pipeline.boxWidth / 2;
        const y1 = fromBottom + 3;
        const y2 = toTop - 3;
        return (
          <g key={`arrow-${i}`} opacity={0.25}>
            <line x1={cx} y1={y1} x2={cx} y2={y2} stroke={C.muted} strokeWidth={1.5} />
            <polygon points={`${cx - 4},${y2 - 6} ${cx},${y2} ${cx + 4},${y2 - 6}`} fill={C.muted} />
          </g>
        );
      })}

      {/* Layer 3: Pipeline stage boxes */}
      {PIPELINE_STAGES.map((stage, i) => {
        const topY = DG.pipeline.startY + i * DG.pipeline.spacingY;
        const col = capColor(stage.colorKey);
        return (
          <g
            key={stage.id}
            onMouseEnter={() => setHover({ type: "stage", index: i })}
            onMouseLeave={() => setHover({ type: "none" })}
            style={{ cursor: "pointer" }}
            opacity={stageOpacity(i)}
          >
            <rect
              x={DG.pipeline.x}
              y={topY}
              width={DG.pipeline.boxWidth}
              height={DG.pipeline.boxHeight}
              rx={DG.pipeline.boxRadius}
              fill={C.cardBg}
              stroke={col.border}
              strokeWidth={1.5}
              filter="url(#diag-shadow)"
            />
            {/* Left accent bar */}
            <rect
              x={DG.pipeline.x}
              y={topY + 8}
              width={4}
              height={DG.pipeline.boxHeight - 16}
              rx={2}
              fill={col.dot}
            />
            <text
              x={DG.pipeline.x + 16}
              y={topY + 23}
              fontSize={12.5}
              fontWeight={600}
              fontFamily="ui-monospace, 'SF Mono', 'Cascadia Code', monospace"
              fill={C.text}
            >
              {stage.label}
            </text>
            <text
              x={DG.pipeline.x + 16}
              y={topY + 40}
              fontSize={10}
              fill={C.secondary}
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {stage.sublabel}
            </text>
          </g>
        );
      })}

      {/* Layer 4: Extension boxes */}
      {positioned.map((p) => {
        const displayName = p.ext.name.replace(/^extension-/, "");
        // Deduplicate connection colors for capability dots
        const uniqueColors = [...new Set(p.connections.map((c) => c.colorKey))];
        return (
          <g
            key={p.ext.name}
            onMouseEnter={() => setHover({ type: "extension", name: p.ext.name })}
            onMouseLeave={() => setHover({ type: "none" })}
            style={{ cursor: "pointer" }}
            opacity={extOpacity(p.ext.name)}
          >
            <rect
              x={DG.extensions.x}
              y={p.finalY}
              width={DG.extensions.boxWidth}
              height={DG.extensions.boxHeight}
              rx={DG.extensions.boxRadius}
              fill={C.cardBg}
              stroke={C.cardBorder}
              strokeWidth={1}
              filter="url(#diag-shadow)"
            />
            {/* Capability dots top-right */}
            {uniqueColors.map((key, ci) => (
              <circle
                key={key}
                cx={DG.extensions.x + DG.extensions.boxWidth - 14 - ci * 14}
                cy={p.finalY + 13}
                r={4}
                fill={capColor(key).dot}
              />
            ))}
            <text
              x={DG.extensions.x + 12}
              y={p.finalY + 28}
              fontSize={11.5}
              fontWeight={600}
              fill={C.text}
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {displayName}
            </text>
          </g>
        );
      })}

      {/* No extensions fallback */}
      {positioned.length === 0 && (
        <text
          x={DG.extensions.x + DG.extensions.boxWidth / 2}
          y={stageCenterY(2)}
          textAnchor="middle"
          fontSize={12}
          fill={C.muted}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontStyle="italic"
        >
          No extensions installed
        </text>
      )}

      {/* Layer 5: Legend */}
      <g transform={`translate(${DG.pipeline.x}, ${legendY})`}>
        {(
          [
            ["routes", "Routes"],
            ["middleware", "Middleware"],
            ["context", "Context"],
            ["actions", "Actions"],
            ["hooks", "Hooks"],
            ["instruments", "Instruments"],
          ] as [CapKey, string][]
        ).map(([key, label], i) => (
          <g key={key} transform={`translate(${i * 120}, 0)`}>
            <circle cx={6} cy={6} r={4.5} fill={capColor(key).dot} />
            <text
              x={16}
              y={10}
              fontSize={10}
              fill={C.secondary}
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {label}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

// ── Module Architecture Diagram ──────────────────────────────────────

interface InternalPrimitive {
  id: string;
  label: string;
  colorKey: CapKey;
  x: number;
  y: number;
  w: number;
  h: number;
}

const MG = {
  viewBoxWidth: 860,
  viewBoxHeight: 400,

  app: {
    x: 20,
    y: 20,
    width: 500,
    height: 350,
    radius: 14,
    headerY: 40,
    pad: 30,
  },

  ext: {
    x: 580,
    boxWidth: 175,
    boxHeight: 44,
    boxRadius: 8,
    minGap: 10,
  },

  connection: {
    strokeWidth: 1.6,
    strokeWidthHover: 2.6,
    dimOpacity: 0.08,
    normalOpacity: 0.5,
    hoverOpacity: 1,
  },
} as const;

// Primitive box positions inside the app container
const TOP_Y = 62;
const CTX_Y = 148;
const BOT_Y = 230;
const BOX_H = 44;
const BOX_W_TOP = 130;
const BOX_W_BOT = 100;

const PRIMITIVES: InternalPrimitive[] = [
  // Top row: server-side pipeline
  { id: "server-entry", label: "entry.server", colorKey: "instruments", x: 50,  y: TOP_Y, w: BOX_W_TOP, h: BOX_H },
  { id: "middleware",    label: "middleware",   colorKey: "middleware",  x: 195, y: TOP_Y, w: BOX_W_TOP, h: BOX_H },
  { id: "loader",       label: "loader",       colorKey: "middleware",  x: 340, y: TOP_Y, w: BOX_W_TOP, h: BOX_H },
  // Center: context
  { id: "context",      label: "context",      colorKey: "context",    x: 165, y: CTX_Y, w: 200, h: 40 },
  // Bottom row: other capabilities
  { id: "routes",       label: "routes",       colorKey: "routes",     x: 50,  y: BOT_Y, w: BOX_W_BOT, h: BOX_H },
  { id: "actions",      label: "actions",      colorKey: "actions",    x: 163, y: BOT_Y, w: BOX_W_BOT, h: BOX_H },
  { id: "client-entry", label: "entry.client", colorKey: "hooks",      x: 276, y: BOT_Y, w: BOX_W_BOT, h: BOX_H },
  { id: "instruments",  label: "instruments",  colorKey: "instruments", x: 389, y: BOT_Y, w: BOX_W_BOT, h: BOX_H },
];

const PRIM_MAP = new Map(PRIMITIVES.map((p) => [p.id, p]));

// Which primitives can access context (shown with internal dotted lines)
const CONTEXT_ACCESSORS = ["server-entry", "middleware", "loader"];

interface ModuleConnection {
  primitiveId: string;
  colorKey: CapKey;
  details: string[]; // specific items provided (action names, route paths, etc.)
}

function getModuleConnections(
  ext: ExtensionMeta,
  contextValues: ExtensionContextSnapshot[],
): ModuleConnection[] {
  const conns: ModuleConnection[] = [];
  if (ext.instrumentations?.server)
    conns.push({ primitiveId: "server-entry", colorKey: "instruments", details: ["server"] });
  if (ext.global.middleware.length > 0)
    conns.push({ primitiveId: "middleware", colorKey: "middleware", details: ext.global.middleware });
  if (ext.context) {
    // Extract top-level keys from the runtime context snapshot
    const snap = contextValues.find((cv) => cv.extension === ext.name);
    let keys: string[] = [];
    if (snap && typeof snap.value === "object" && snap.value !== null) {
      keys = Object.keys(snap.value as Record<string, unknown>);
    }
    conns.push({ primitiveId: "context", colorKey: "context", details: keys.length > 0 ? keys : ["(context)"] });
  }
  if (ext.actions.length > 0)
    conns.push({ primitiveId: "actions", colorKey: "actions", details: ext.actions.map((a) => a.name) });
  if (ext.routes.length > 0)
    conns.push({ primitiveId: "routes", colorKey: "routes", details: ext.routes.map((r) => r.path) });
  if (ext.routeEnhancements.length > 0) {
    const names = ext.routeEnhancements.flatMap((e) => e.middleware);
    conns.push({ primitiveId: "middleware", colorKey: "middleware", details: names.length > 0 ? names : ["(route MW)"] });
  }
  if (ext.clientHooks?.beforeHydration || ext.clientHooks?.afterHydration) {
    const hooks: string[] = [];
    if (ext.clientHooks.beforeHydration) hooks.push("beforeHydration");
    if (ext.clientHooks.afterHydration) hooks.push("afterHydration");
    conns.push({ primitiveId: "client-entry", colorKey: "hooks", details: hooks });
  }
  if (ext.instrumentations?.client)
    conns.push({ primitiveId: "instruments", colorKey: "instruments", details: ["client"] });
  return conns;
}

// Compute the midpoint of a cubic bezier at t=0.5
function bezierMidpoint(path: string): { x: number; y: number } {
  // Parse "Mx0,y0 Cx1,y1 x2,y2 x3,y3"
  const nums = path.match(/-?[\d.]+/g)?.map(Number) || [];
  const [x0, y0, x1, y1, x2, y2, x3, y3] = nums;
  // Cubic bezier at t=0.5: B(0.5) = 0.125*P0 + 0.375*P1 + 0.375*P2 + 0.125*P3
  return {
    x: 0.125 * x0 + 0.375 * x1 + 0.375 * x2 + 0.125 * x3,
    y: 0.125 * y0 + 0.375 * y1 + 0.375 * y2 + 0.125 * y3,
  };
}

interface ModExtPositioned {
  ext: ExtensionMeta;
  connections: ModuleConnection[];
  finalY: number;
  centerY: number;
}

function layoutModuleExtensions(extensions: ExtensionMeta[], contextValues: ExtensionContextSnapshot[]): ModExtPositioned[] {
  const items = extensions
    .map((ext) => {
      const connections = getModuleConnections(ext, contextValues);
      if (connections.length === 0) return null;
      // Compute ideal Y from average Y of connected primitive boxes
      const avgY =
        connections.reduce((s, c) => {
          const p = PRIM_MAP.get(c.primitiveId);
          return s + (p ? p.y + p.h / 2 : MG.viewBoxHeight / 2);
        }, 0) / connections.length;
      return {
        ext,
        connections,
        idealY: avgY - MG.ext.boxHeight / 2,
        finalY: 0,
        centerY: 0,
      };
    })
    .filter(Boolean) as (ModExtPositioned & { idealY: number })[];

  items.sort((a, b) => a.idealY - b.idealY);

  for (let i = 0; i < items.length; i++) {
    if (i === 0) {
      items[i].finalY = Math.max(MG.app.y + 10, items[i].idealY);
    } else {
      const prevBottom = items[i - 1].finalY + MG.ext.boxHeight;
      items[i].finalY = Math.max(prevBottom + MG.ext.minGap, items[i].idealY);
    }
    items[i].centerY = items[i].finalY + MG.ext.boxHeight / 2;
  }

  return items;
}

function moduleBezier(prim: InternalPrimitive, extCenterY: number, srcYOffset: number): string {
  // From app box right edge → extension box left edge
  const srcX = MG.app.x + MG.app.width;
  const srcY = prim.y + prim.h / 2 + srcYOffset;
  const tgtX = MG.ext.x;
  const tgtY = extCenterY;
  const gap = tgtX - srcX;
  const cpOff = gap * 0.4;
  return `M${srcX},${srcY} C${srcX + cpOff},${srcY} ${tgtX - cpOff},${tgtY} ${tgtX},${tgtY}`;
}

function ModuleArchitectureDiagram({
  extensions,
  contextValues,
}: {
  extensions: ExtensionMeta[];
  contextValues: ExtensionContextSnapshot[];
}) {
  const [hover, setHover] = useState<HoverTarget>({ type: "none" });
  const positioned = useMemo(() => layoutModuleExtensions(extensions, contextValues), [extensions, contextValues]);

  // Pre-compute connections per primitive for vertical spread
  const primConnCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of positioned) {
      for (const c of p.connections) {
        counts.set(c.primitiveId, (counts.get(c.primitiveId) || 0) + 1);
      }
    }
    return counts;
  }, [positioned]);

  // Dynamic viewBox height
  const vbHeight = useMemo(() => {
    if (positioned.length === 0) return MG.viewBoxHeight;
    const lastBottom = positioned[positioned.length - 1].finalY + MG.ext.boxHeight;
    return Math.max(MG.viewBoxHeight, lastBottom + 40);
  }, [positioned]);

  // Build all connection paths
  const allConns = useMemo(() => {
    const primOffsets = new Map<string, number>();
    const result: {
      extName: string;
      primitiveId: string;
      colorKey: CapKey;
      path: string;
      details: string[];
    }[] = [];

    for (const p of positioned) {
      for (const conn of p.connections) {
        const prim = PRIM_MAP.get(conn.primitiveId);
        if (!prim) continue;
        const total = primConnCounts.get(conn.primitiveId) || 1;
        const idx = primOffsets.get(conn.primitiveId) || 0;
        primOffsets.set(conn.primitiveId, idx + 1);

        const maxSpread = Math.min(16, prim.h / 2 - 4);
        let srcYOffset = 0;
        if (total > 1) {
          srcYOffset = -maxSpread / 2 + (maxSpread / (total - 1)) * idx;
        }

        result.push({
          extName: p.ext.name,
          primitiveId: conn.primitiveId,
          colorKey: conn.colorKey,
          path: moduleBezier(prim, p.centerY, srcYOffset),
          details: conn.details,
        });
      }
    }
    return result;
  }, [positioned, primConnCounts]);

  // Opacity helpers
  function connOp(extName: string, primId: string): number {
    if (hover.type === "none") return MG.connection.normalOpacity;
    if (hover.type === "extension" && hover.name === extName) return MG.connection.hoverOpacity;
    if (hover.type === "stage") {
      // "stage" reused for primitive hover — index is the index in PRIMITIVES
      const prim = PRIMITIVES[hover.index];
      if (prim && prim.id === primId) return MG.connection.hoverOpacity;
    }
    return MG.connection.dimOpacity;
  }

  function primOp(primIdx: number): number {
    if (hover.type === "none") return 1;
    if (hover.type === "stage" && hover.index === primIdx) return 1;
    if (hover.type === "extension") {
      const p = positioned.find((p) => p.ext.name === hover.name);
      if (p && p.connections.some((c) => c.primitiveId === PRIMITIVES[primIdx].id)) return 1;
    }
    return 0.35;
  }

  function modExtOp(name: string): number {
    if (hover.type === "none") return 1;
    if (hover.type === "extension" && hover.name === name) return 1;
    if (hover.type === "stage") {
      const prim = PRIMITIVES[hover.index];
      if (prim) {
        const p = positioned.find((p) => p.ext.name === name);
        if (p && p.connections.some((c) => c.primitiveId === prim.id)) return 1;
      }
    }
    return 0.25;
  }

  return (
    <svg
      viewBox={`0 0 ${MG.viewBoxWidth} ${vbHeight}`}
      width="100%"
      style={{ display: "block" }}
      role="img"
      aria-label="Module architecture diagram showing extension-to-application relationships"
      onMouseLeave={() => setHover({ type: "none" })}
    >
      <defs>
        <filter id="mod-shadow" x="-4%" y="-4%" width="108%" height="112%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.07" />
        </filter>
        <style>{`
          .mod-conn-active { stroke-dasharray: 8 4; animation: dash-march 0.6s linear infinite; }
        `}</style>
      </defs>

      {/* Layer 1: Connection bezier curves */}
      {allConns.map((conn, i) => {
        const opacity = connOp(conn.extName, conn.primitiveId);
        const isActive = opacity === MG.connection.hoverOpacity;
        return (
          <path
            key={i}
            d={conn.path}
            fill="none"
            stroke={capColor(conn.colorKey).dot}
            strokeWidth={isActive ? MG.connection.strokeWidthHover : MG.connection.strokeWidth}
            opacity={opacity}
            className={isActive ? "mod-conn-active" : undefined}
            style={{ transition: "opacity 0.2s, stroke-width 0.2s" }}
          />
        );
      })}

      {/* Layer 2: App container box */}
      <rect
        x={MG.app.x}
        y={MG.app.y}
        width={MG.app.width}
        height={MG.app.height}
        rx={MG.app.radius}
        fill="#fafbfe"
        stroke={C.cardBorder}
        strokeWidth={1.5}
        strokeDasharray="6 3"
      />
      <text
        x={MG.app.x + 16}
        y={MG.app.headerY}
        fontSize={11}
        fontWeight={600}
        fontFamily="system-ui, -apple-system, sans-serif"
        fill={C.secondary}
        letterSpacing={0.5}
        style={{ textTransform: "uppercase" }}
      >
        Your React Router Application
      </text>

      {/* Layer 3: Internal "context access" dotted lines */}
      {CONTEXT_ACCESSORS.map((accId) => {
        const acc = PRIM_MAP.get(accId);
        const ctx = PRIM_MAP.get("context");
        if (!acc || !ctx) return null;
        const fromX = acc.x + acc.w / 2;
        const fromY = acc.y + acc.h;
        const toX = ctx.x + ctx.w / 2;
        const toY = ctx.y;
        // Subtle path down then curve to context center
        const midY = fromY + (toY - fromY) * 0.5;
        return (
          <path
            key={accId}
            d={`M${fromX},${fromY} C${fromX},${midY} ${toX},${midY} ${toX},${toY}`}
            fill="none"
            stroke={C.context.border}
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.5}
          />
        );
      })}

      {/* Layer 4: Internal primitive boxes */}
      {PRIMITIVES.map((prim, idx) => {
        const col = capColor(prim.colorKey);
        const isCtx = prim.id === "context";
        return (
          <g
            key={prim.id}
            onMouseEnter={() => setHover({ type: "stage", index: idx })}
            onMouseLeave={() => setHover({ type: "none" })}
            style={{ cursor: "pointer" }}
            opacity={primOp(idx)}
          >
            <rect
              x={prim.x}
              y={prim.y}
              width={prim.w}
              height={prim.h}
              rx={8}
              fill={isCtx ? col.bg : C.cardBg}
              stroke={col.border}
              strokeWidth={isCtx ? 1.5 : 1}
              filter="url(#mod-shadow)"
            />
            {/* Left accent */}
            {!isCtx && (
              <rect
                x={prim.x}
                y={prim.y + 6}
                width={3}
                height={prim.h - 12}
                rx={1.5}
                fill={col.dot}
              />
            )}
            <text
              x={isCtx ? prim.x + prim.w / 2 : prim.x + 14}
              y={prim.y + prim.h / 2 + 4}
              fontSize={isCtx ? 11.5 : 11}
              fontWeight={isCtx ? 700 : 600}
              fontFamily="ui-monospace, 'SF Mono', 'Cascadia Code', monospace"
              fill={isCtx ? col.fg : C.text}
              textAnchor={isCtx ? "middle" : "start"}
            >
              {prim.label}
            </text>
          </g>
        );
      })}

      {/* "accesses context" label */}
      <text
        x={PRIM_MAP.get("context")!.x + PRIM_MAP.get("context")!.w / 2}
        y={CTX_Y - 8}
        textAnchor="middle"
        fontSize={8.5}
        fill={C.muted}
        fontFamily="system-ui, -apple-system, sans-serif"
        fontStyle="italic"
      >
        accessed by server entry, middleware, loader
      </text>

      {/* Layer 5: Extension boxes */}
      {positioned.map((p) => {
        const displayName = p.ext.name.replace(/^extension-/, "");
        const uniqueColors = [...new Set(p.connections.map((c) => c.colorKey))];
        return (
          <g
            key={p.ext.name}
            onMouseEnter={() => setHover({ type: "extension", name: p.ext.name })}
            onMouseLeave={() => setHover({ type: "none" })}
            style={{ cursor: "pointer" }}
            opacity={modExtOp(p.ext.name)}
          >
            <rect
              x={MG.ext.x}
              y={p.finalY}
              width={MG.ext.boxWidth}
              height={MG.ext.boxHeight}
              rx={MG.ext.boxRadius}
              fill={C.cardBg}
              stroke={C.cardBorder}
              strokeWidth={1}
              filter="url(#mod-shadow)"
            />
            {uniqueColors.map((key, ci) => (
              <circle
                key={key}
                cx={MG.ext.x + MG.ext.boxWidth - 14 - ci * 14}
                cy={p.finalY + 13}
                r={4}
                fill={capColor(key).dot}
              />
            ))}
            <text
              x={MG.ext.x + 12}
              y={p.finalY + 28}
              fontSize={11.5}
              fontWeight={600}
              fill={C.text}
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {displayName}
            </text>
          </g>
        );
      })}

      {/* No extensions fallback */}
      {positioned.length === 0 && (
        <text
          x={MG.ext.x + MG.ext.boxWidth / 2}
          y={MG.viewBoxHeight / 2}
          textAnchor="middle"
          fontSize={12}
          fill={C.muted}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontStyle="italic"
        >
          No extensions installed
        </text>
      )}

      {/* Layer 6: Connection detail annotations (shown on hover) */}
      {allConns.map((conn, i) => {
        const opacity = connOp(conn.extName, conn.primitiveId);
        const isActive = opacity === MG.connection.hoverOpacity;
        if (!isActive || conn.details.length === 0) return null;

        const mid = bezierMidpoint(conn.path);
        const col = capColor(conn.colorKey);
        // Compact label: join details, truncate if too long
        const label = conn.details.length <= 3
          ? conn.details.join(", ")
          : conn.details.slice(0, 3).join(", ") + ` +${conn.details.length - 3}`;
        const labelWidth = Math.min(label.length * 5.5 + 14, 160);

        return (
          <g key={`ann-${i}`}>
            <rect
              x={mid.x - labelWidth / 2}
              y={mid.y - 10}
              width={labelWidth}
              height={18}
              rx={4}
              fill={col.bg}
              stroke={col.border}
              strokeWidth={0.8}
            />
            <text
              x={mid.x}
              y={mid.y + 3}
              textAnchor="middle"
              fontSize={8.5}
              fontWeight={600}
              fontFamily="ui-monospace, 'SF Mono', 'Cascadia Code', monospace"
              fill={col.fg}
            >
              {label}
            </text>
          </g>
        );
      })}

      {/* Layer 7: Legend */}
      <g transform={`translate(${MG.app.x + 16}, ${MG.app.y + MG.app.height - 24})`}>
        <text
          x={0}
          y={10}
          fontSize={8.5}
          fill={C.muted}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontStyle="italic"
        >
          Dashed border = application boundary
        </text>
      </g>
    </svg>
  );
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

      {/* Architecture Diagram */}
      <div
        style={{
          marginBottom: 20,
          background: C.cardBg,
          border: `1px solid ${C.cardBorder}`,
          borderRadius: 12,
          boxShadow: C.shadow,
          padding: "16px 12px 12px",
        }}
      >
        <h2
          style={{
            fontSize: "0.72rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: C.muted,
            margin: "0 0 8px 4px",
          }}
        >
          Architecture
        </h2>
        <ArchitectureDiagram extensions={extensions} />
      </div>

      {/* Module Architecture Diagram */}
      <div
        style={{
          marginBottom: 20,
          background: C.cardBg,
          border: `1px solid ${C.cardBorder}`,
          borderRadius: 12,
          boxShadow: C.shadow,
          padding: "16px 12px 12px",
        }}
      >
        <h2
          style={{
            fontSize: "0.72rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: C.muted,
            margin: "0 0 8px 4px",
          }}
        >
          Module Architecture
        </h2>
        <ModuleArchitectureDiagram extensions={extensions} contextValues={contextValues} />
      </div>

      {/* Interactive Flow Diagram */}
      <div
        style={{
          marginBottom: 20,
          background: C.cardBg,
          border: `1px solid ${C.cardBorder}`,
          borderRadius: 12,
          boxShadow: C.shadow,
          padding: "16px 12px 12px",
        }}
      >
        <h2
          style={{
            fontSize: "0.72rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: C.muted,
            margin: "0 0 8px 4px",
          }}
        >
          Extension Graph
        </h2>
        <FlowDiagram extensions={extensions} contextValues={contextValues} />
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
