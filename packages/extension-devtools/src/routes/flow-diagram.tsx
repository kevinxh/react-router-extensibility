import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
  Position,
  BaseEdge,
  getBezierPath,
  EdgeLabelRenderer,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type {
  ExtensionMeta,
  ExtensionContextSnapshot,
} from "extensibility-sdk/context";

// ── Palette (matches devtools.tsx) ──────────────────────────────────

const C = {
  pageBg: "#f5f6fa",
  cardBg: "#fff",
  cardBorder: "#e8eaef",
  text: "#1a1a2e",
  secondary: "#6b7280",
  muted: "#9ca3af",
  divider: "#f0f1f5",

  routes: { bg: "#eef2ff", fg: "#4338ca", border: "#c7d2fe", dot: "#6366f1" },
  middleware: { bg: "#fef3c7", fg: "#92400e", border: "#fcd34d", dot: "#f59e0b" },
  context: { bg: "#fce7f3", fg: "#9d174d", border: "#f9a8d4", dot: "#ec4899" },
  actions: { bg: "#ede9fe", fg: "#6d28d9", border: "#c4b5fd", dot: "#8b5cf6" },
  hooks: { bg: "#dbeafe", fg: "#1e40af", border: "#93c5fd", dot: "#3b82f6" },
  instruments: { bg: "#fee2e2", fg: "#991b1b", border: "#fca5a5", dot: "#ef4444" },
} as const;

type CapKey = "routes" | "middleware" | "context" | "actions" | "hooks" | "instruments";
const capColor = (key: CapKey) => C[key] as { bg: string; fg: string; border: string; dot: string };

// ── Custom Nodes ────────────────────────────────────────────────────

function AppGroupNode({ data }: { data: { label: string } }) {
  return (
    <div
      style={{
        padding: 16,
        border: `2px dashed ${C.cardBorder}`,
        borderRadius: 16,
        background: "#fafbfe",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: C.secondary,
        }}
      >
        {data.label}
      </div>
    </div>
  );
}

function PrimitiveNode({
  data,
}: {
  data: { label: string; sublabel?: string; colorKey: CapKey; highlighted: boolean };
}) {
  const col = capColor(data.colorKey);
  return (
    <div
      style={{
        padding: "8px 14px",
        borderRadius: 8,
        background: data.highlighted ? col.bg : C.cardBg,
        border: `1.5px solid ${col.border}`,
        boxShadow: data.highlighted
          ? `0 0 0 2px ${col.dot}33`
          : "0 1px 3px rgba(0,0,0,0.05)",
        minWidth: 110,
        transition: "all 0.15s ease",
        opacity: data.highlighted === false ? 0.35 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 4,
            height: 24,
            borderRadius: 2,
            background: col.dot,
            flexShrink: 0,
          }}
        />
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace",
              color: C.text,
            }}
          >
            {data.label}
          </div>
          {data.sublabel && (
            <div style={{ fontSize: 9.5, color: C.muted, marginTop: 1 }}>
              {data.sublabel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ExtensionNode({
  data,
}: {
  data: {
    label: string;
    version?: string;
    capabilities: { colorKey: CapKey; label: string; items: string[] }[];
    highlighted: boolean;
  };
}) {
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        background: C.cardBg,
        border: `1px solid ${C.cardBorder}`,
        boxShadow: data.highlighted
          ? "0 2px 8px rgba(0,0,0,0.1)"
          : "0 1px 3px rgba(0,0,0,0.05)",
        width: 170,
        transition: "all 0.15s ease",
        opacity: data.highlighted === false ? 0.25 : 1,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>
          {data.label}
        </div>
        {data.version && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              fontFamily: "ui-monospace, monospace",
              background: C.divider,
              color: C.secondary,
              borderRadius: 3,
              padding: "0 5px",
            }}
          >
            v{data.version}
          </span>
        )}
      </div>

      {/* Capability list */}
      {data.capabilities.map((cap) => {
        const col = capColor(cap.colorKey);
        return (
          <div key={`${cap.label}-${cap.colorKey}`} style={{ marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: col.dot,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 600,
                  color: col.fg,
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                {cap.label}
              </span>
            </div>
            <div
              style={{
                marginLeft: 12,
                fontSize: 9.5,
                fontFamily: "ui-monospace, 'SF Mono', monospace",
                color: C.secondary,
                lineHeight: 1.5,
              }}
            >
              {cap.items.map((item, i) => (
                <div key={i}>{item}</div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Custom Edge with label ──────────────────────────────────────────

function DetailEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
}: {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  data?: { label?: string; colorKey?: CapKey; highlighted?: boolean };
  style?: React.CSSProperties;
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const col = data?.colorKey ? capColor(data.colorKey) : null;
  const isHighlighted = data?.highlighted ?? true;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke: col?.dot ?? C.muted,
          strokeWidth: isHighlighted ? 2.2 : 1.5,
          opacity: isHighlighted === false ? 0.08 : isHighlighted ? 0.9 : 0.45,
          transition: "all 0.15s ease",
          ...(isHighlighted
            ? { strokeDasharray: "8 4", animation: "dash-march 0.6s linear infinite" }
            : {}),
        }}
      />
      {data?.label && isHighlighted && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "none",
              padding: "2px 7px",
              borderRadius: 4,
              fontSize: 8.5,
              fontWeight: 600,
              fontFamily: "ui-monospace, 'SF Mono', monospace",
              background: col?.bg ?? "#fff",
              color: col?.fg ?? C.text,
              border: `1px solid ${col?.border ?? C.cardBorder}`,
              whiteSpace: "nowrap",
              maxWidth: 160,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

// ── Node & Edge type registrations ──────────────────────────────────

const nodeTypes: NodeTypes = {
  appGroup: AppGroupNode,
  primitive: PrimitiveNode,
  extension: ExtensionNode,
};

const edgeTypes: EdgeTypes = {
  detail: DetailEdge,
};

// ── Layout constants ────────────────────────────────────────────────

// App group: wide rectangle at top
const APP_GROUP_W = 700;
const APP_GROUP_H = 300;

// Primitive positions inside the app group (relative to group)
const PRIM_PAD_X = 25;
const PRIM_PAD_Y = 45;

const PRIMITIVE_LAYOUT: {
  id: string;
  label: string;
  sublabel?: string;
  colorKey: CapKey;
  x: number;
  y: number;
}[] = [
  // Top row: server-side pipeline
  { id: "server-entry", label: "entry.server", sublabel: "Instrumentations", colorKey: "instruments", x: PRIM_PAD_X, y: PRIM_PAD_Y },
  { id: "middleware", label: "middleware", sublabel: "Global MW", colorKey: "middleware", x: PRIM_PAD_X + 170, y: PRIM_PAD_Y },
  { id: "loader", label: "loader", sublabel: "Data Loading", colorKey: "middleware", x: PRIM_PAD_X + 340, y: PRIM_PAD_Y },
  // Middle row: context
  { id: "context", label: "context", sublabel: "Shared State", colorKey: "context", x: PRIM_PAD_X + 510, y: PRIM_PAD_Y },
  // Bottom row: other capabilities
  { id: "routes", label: "routes", sublabel: "Route Injection", colorKey: "routes", x: PRIM_PAD_X, y: PRIM_PAD_Y + 100 },
  { id: "actions", label: "actions", sublabel: "Server Actions", colorKey: "actions", x: PRIM_PAD_X + 170, y: PRIM_PAD_Y + 100 },
  { id: "client-entry", label: "entry.client", sublabel: "Hydration", colorKey: "hooks", x: PRIM_PAD_X + 340, y: PRIM_PAD_Y + 100 },
  { id: "instruments", label: "instruments", sublabel: "Observability", colorKey: "instruments", x: PRIM_PAD_X + 510, y: PRIM_PAD_Y + 100 },
];

// Extensions row: horizontal, below app group
const EXT_ROW_Y = APP_GROUP_H + 80;
const EXT_WIDTH = 170;
const EXT_GAP = 20;

// ── Build graph from extension data ─────────────────────────────────

interface ExtCapability {
  colorKey: CapKey;
  label: string;
  items: string[];
  primitiveId: string;
}

function getExtCapabilities(
  ext: ExtensionMeta,
  contextValues: ExtensionContextSnapshot[],
): ExtCapability[] {
  const caps: ExtCapability[] = [];

  if (ext.instrumentations?.server)
    caps.push({ colorKey: "instruments", label: "Instrumentation", items: ["server"], primitiveId: "server-entry" });

  if (ext.global.middleware.length > 0)
    caps.push({ colorKey: "middleware", label: "Middleware", items: ext.global.middleware, primitiveId: "middleware" });

  if (ext.context) {
    const snap = contextValues.find((cv) => cv.extension === ext.name);
    let keys: string[] = ["(provides context)"];
    if (snap && typeof snap.value === "object" && snap.value !== null) {
      keys = Object.keys(snap.value as Record<string, unknown>);
    }
    caps.push({ colorKey: "context", label: "Context", items: keys, primitiveId: "context" });
  }

  if (ext.actions.length > 0)
    caps.push({ colorKey: "actions", label: "Actions", items: ext.actions.map((a) => a.name), primitiveId: "actions" });

  if (ext.routes.length > 0)
    caps.push({ colorKey: "routes", label: "Routes", items: ext.routes.map((r) => r.path), primitiveId: "routes" });

  if (ext.routeEnhancements.length > 0) {
    const names = ext.routeEnhancements.flatMap((e) => e.middleware);
    caps.push({ colorKey: "middleware", label: "Route MW", items: names.length > 0 ? names : ["(enhancement)"], primitiveId: "middleware" });
  }

  if (ext.clientHooks?.beforeHydration || ext.clientHooks?.afterHydration) {
    const hooks: string[] = [];
    if (ext.clientHooks.beforeHydration) hooks.push("beforeHydration");
    if (ext.clientHooks.afterHydration) hooks.push("afterHydration");
    caps.push({ colorKey: "hooks", label: "Client Hooks", items: hooks, primitiveId: "client-entry" });
  }

  if (ext.instrumentations?.client)
    caps.push({ colorKey: "instruments", label: "Instrumentation", items: ["client"], primitiveId: "instruments" });

  return caps;
}

function buildGraph(
  extensions: ExtensionMeta[],
  contextValues: ExtensionContextSnapshot[],
  hoveredNode: string | null,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Pre-compute extension capabilities for hover logic
  const extCapsMap = new Map<string, ExtCapability[]>();
  const activeExts: { ext: ExtensionMeta; caps: ExtCapability[] }[] = [];
  for (const ext of extensions) {
    const caps = getExtCapabilities(ext, contextValues);
    extCapsMap.set(ext.name, caps);
    if (caps.length > 0) activeExts.push({ ext, caps });
  }

  // Hover state
  const connectedPrimitives = new Set<string>();
  const connectedExtensions = new Set<string>();

  if (hoveredNode) {
    const hoveredCaps = extCapsMap.get(hoveredNode);
    if (hoveredCaps) {
      for (const cap of hoveredCaps) connectedPrimitives.add(cap.primitiveId);
    }
    for (const { ext, caps } of activeExts) {
      if (caps.some((c) => c.primitiveId === hoveredNode)) {
        connectedExtensions.add(ext.name);
      }
    }
  }

  const isExtHovered = hoveredNode ? extCapsMap.has(hoveredNode) : false;
  const isPrimHovered = hoveredNode ? PRIMITIVE_LAYOUT.some((p) => p.id === hoveredNode) : false;

  // App group node
  nodes.push({
    id: "app-group",
    type: "appGroup",
    position: { x: 0, y: 0 },
    data: { label: "Your React Router Application" },
    draggable: false,
    selectable: false,
    style: { width: APP_GROUP_W, height: APP_GROUP_H },
  });

  // Primitive nodes (inside app group)
  for (const prim of PRIMITIVE_LAYOUT) {
    let highlighted: boolean = true;
    if (hoveredNode) {
      if (isExtHovered) highlighted = connectedPrimitives.has(prim.id);
      else if (isPrimHovered) highlighted = prim.id === hoveredNode;
    }

    nodes.push({
      id: prim.id,
      type: "primitive",
      position: { x: prim.x, y: prim.y },
      parentId: "app-group",
      extent: "parent" as const,
      data: {
        label: prim.label,
        sublabel: prim.sublabel,
        colorKey: prim.colorKey,
        highlighted,
      },
      draggable: false,
      selectable: false,
      sourcePosition: Position.Bottom,
      targetPosition: Position.Bottom,
    });
  }

  // Extension nodes — horizontal row below the app
  const totalExtWidth = activeExts.length * EXT_WIDTH + (activeExts.length - 1) * EXT_GAP;
  const extStartX = (APP_GROUP_W - totalExtWidth) / 2; // center under app

  for (let i = 0; i < activeExts.length; i++) {
    const { ext, caps } = activeExts[i];
    const extX = extStartX + i * (EXT_WIDTH + EXT_GAP);

    let highlighted: boolean = true;
    if (hoveredNode) {
      if (isExtHovered) highlighted = ext.name === hoveredNode;
      else if (isPrimHovered) highlighted = connectedExtensions.has(ext.name);
    }

    const displayName = ext.name.replace(/^extension-/, "");
    nodes.push({
      id: ext.name,
      type: "extension",
      position: { x: extX, y: EXT_ROW_Y },
      data: {
        label: displayName,
        version: ext.version,
        capabilities: caps.map((c) => ({
          colorKey: c.colorKey,
          label: c.label,
          items: c.items,
        })),
        highlighted,
      },
      draggable: false,
      selectable: false,
      sourcePosition: Position.Top,
      targetPosition: Position.Top,
    });

    // Edges: extension → each connected primitive
    for (const cap of caps) {
      const label = cap.items.length <= 3
        ? cap.items.join(", ")
        : cap.items.slice(0, 2).join(", ") + ` +${cap.items.length - 2}`;

      let edgeHighlighted: boolean = true;
      if (hoveredNode) {
        if (isExtHovered) edgeHighlighted = ext.name === hoveredNode;
        else if (isPrimHovered) edgeHighlighted = cap.primitiveId === hoveredNode;
      }

      edges.push({
        id: `${ext.name}->${cap.primitiveId}-${cap.colorKey}`,
        source: ext.name,
        target: cap.primitiveId,
        type: "detail",
        data: {
          label,
          colorKey: cap.colorKey,
          highlighted: edgeHighlighted,
        },
      });
    }
  }

  // Internal "accesses context" edges (dotted lines within app)
  for (const accId of ["server-entry", "middleware", "loader"]) {
    edges.push({
      id: `${accId}->context`,
      source: accId,
      target: "context",
      type: "default",
      animated: false,
      style: {
        stroke: C.context.border,
        strokeWidth: 1,
        strokeDasharray: "4 3",
        opacity: 0.4,
      },
    });
  }

  return { nodes, edges };
}

// ── Main Flow Diagram Component ─────────────────────────────────────

function FlowDiagramInner({
  extensions,
  contextValues,
}: {
  extensions: ExtensionMeta[];
  contextValues: ExtensionContextSnapshot[];
}) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const { nodes, edges } = useMemo(
    () => buildGraph(extensions, contextValues, hoveredNode),
    [extensions, contextValues, hoveredNode],
  );

  const onNodeMouseEnter = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === "extension" || node.type === "primitive") {
        setHoveredNode(node.id);
      }
    },
    [],
  );

  const onNodeMouseLeave = useCallback(() => {
    setHoveredNode(null);
  }, []);

  return (
    <div style={{ width: "100%", height: 600, borderRadius: 8, overflow: "hidden" }}>
      <style>{`
        @keyframes dash-march { to { stroke-dashoffset: -20; } }
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        fitView
        fitViewOptions={{ padding: 0.12 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color={C.divider} gap={20} />
      </ReactFlow>
    </div>
  );
}

export default function FlowDiagram({
  extensions,
  contextValues,
}: {
  extensions: ExtensionMeta[];
  contextValues: ExtensionContextSnapshot[];
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        style={{
          width: "100%",
          height: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: C.muted,
          fontSize: 13,
        }}
      >
        Loading diagram...
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <FlowDiagramInner extensions={extensions} contextValues={contextValues} />
    </ReactFlowProvider>
  );
}
