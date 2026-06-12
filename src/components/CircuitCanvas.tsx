import type { DragEvent, PointerEvent } from "react";
import type { GateType, Signal } from "../types";
import type { CircuitApi } from "../hooks/useCircuit";
import { GATES } from "../engine/gates";

/** Custom MIME-ish key the palette uses for HTML5 drag-and-drop. */
export const GATE_DRAG_KEY = "application/x-gw-gate";
import { portsOf, VBH, VBW, wirePath } from "../engine/geometry";
import { C, wireStyle } from "../theme";
import GateNode from "./GateNode";
import IONode from "./IONode";

export interface CircuitCanvasProps {
  circuit: CircuitApi;
}

export default function CircuitCanvas({ circuit }: CircuitCanvasProps) {
  const {
    nodes,
    wires,
    memo,
    inWireMap,
    pending,
    pendPoint,
    cursor,
    svgRef,
    viewBox,
    toSvg,
    addGateAt,
    onPointerMove,
    endDrag,
    setPending,
    onBodyDown,
    onBodyUp,
    onPort,
    onPortUp,
    maybeCancelPendingWire,
    deleteNode,
    deleteWire,
  } = circuit;

  const onSvgPointerUp = (e: PointerEvent) => {
    endDrag();
    maybeCancelPendingWire(e);
  };
  const onSvgDragOver = (e: DragEvent) => {
    if (e.dataTransfer.types.includes(GATE_DRAG_KEY)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  };
  const onSvgDrop = (e: DragEvent) => {
    const t = e.dataTransfer.getData(GATE_DRAG_KEY) as GateType;
    if (!t) return;
    e.preventDefault();
    const p = toSvg(e);
    addGateAt(t, p.x, p.y);
  };

  return (
    <div
      style={{
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        overflow: "hidden",
        background: C.canvas,
      }}
    >
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        width={VBW}
        height={VBH}
        style={{ width: "100%", height: "auto", display: "block", touchAction: "none" }}
        onPointerMove={onPointerMove}
        onPointerUp={onSvgPointerUp}
        onPointerLeave={endDrag}
        onPointerDown={() => setPending(null)}
        onDragOver={onSvgDragOver}
        onDrop={onSvgDrop}
      >
        <defs>
          <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.3" fill={C.gridDot} />
          </pattern>
        </defs>
        <rect x={0} y={0} width={VBW} height={VBH} fill={C.canvas} />
        <rect x={0} y={0} width={VBW} height={VBH} fill="url(#grid)" />

        {/* wires */}
        {wires.map((w) => {
          const fn = nodes.find((n) => n.id === w.from.node);
          const tn = nodes.find((n) => n.id === w.to.node);
          if (!fn || !tn) return null;
          const fp = portsOf(fn).output;
          const tp = portsOf(tn).inputs[w.to.port];
          if (!fp || !tp) return null;
          const v = memo[w.from.node];
          const d = wirePath(fp.x, fp.y, tp.x, tp.y);
          const ws = wireStyle(v);
          return (
            <g key={w.id}>
              <path d={d} fill="none" stroke="transparent" strokeWidth={16}
                style={{ cursor: "pointer" }}
                onPointerDown={(e) => { e.stopPropagation(); deleteWire(w.id); }} />
              <path d={d} fill="none" stroke={ws.stroke}
                strokeWidth={ws.strokeWidth} strokeLinecap="round"
                strokeDasharray={ws.strokeDasharray} opacity={ws.opacity}
                className="gw-wire-in"
                style={{ filter: ws.glow ? `drop-shadow(0 0 4px ${C.glowOnWire})` : "none", pointerEvents: "none" }} />
            </g>
          );
        })}

        {/* pending wire preview */}
        {pendPoint && (
          <path
            d={wirePath(pendPoint.x, pendPoint.y, cursor.x, cursor.y)}
            fill="none" stroke={C.accent} strokeWidth={2.2}
            strokeDasharray="6 5" style={{ pointerEvents: "none" }}
          />
        )}

        {/* nodes */}
        {nodes.map((n) => {
          const p = portsOf(n);
          const liveInputs: Record<number, Signal> = {};
          if (GATES[n.type].inputs) {
            for (let i = 0; i < GATES[n.type].inputs; i++) {
              const w = inWireMap[n.id] && inWireMap[n.id][i];
              liveInputs[i] = w ? memo[w.from.node] : null;
            }
          }
          if (n.type === "INPUT" || n.type === "OUTPUT")
            return (
              <IONode key={n.id} node={n} value={memo[n.id]} ports={p}
                onBodyDown={onBodyDown} onBodyUp={onBodyUp} onPort={onPort} onPortUp={onPortUp}
                pending={pending} />
            );
          return (
            <GateNode key={n.id} node={n} value={memo[n.id]} ports={p}
              onBodyDown={onBodyDown} onBodyUp={onBodyUp} onPort={onPort} onPortUp={onPortUp}
              onDelete={deleteNode}
              pending={pending} liveInputs={liveInputs} />
          );
        })}
      </svg>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          color: C.faint,
          padding: "6px 12px 8px",
          borderTop: `1px solid ${C.border}`,
        }}
      >
        tap a gate to pick a port (tap again to cycle) · tap another gate to connect · drag a gate to move it · tap a wire to cut · tap an input to wire it, then tap to toggle once wired
      </div>
    </div>
  );
}
