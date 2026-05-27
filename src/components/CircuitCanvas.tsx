import type { Signal } from "../types";
import type { CircuitApi } from "../hooks/useCircuit";
import { GATES } from "../engine/gates";
import { portsOf, VBH, VBW, wirePath } from "../engine/geometry";
import { C, sigColor } from "../theme";
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
    onPointerMove,
    endDrag,
    setPending,
    onBodyDown,
    onPort,
    deleteNode,
    deleteWire,
    toggleInput,
  } = circuit;

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
        viewBox={`0 0 ${VBW} ${VBH}`}
        width={VBW}
        height={VBH}
        style={{ width: "100%", height: "auto", display: "block", touchAction: "none" }}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerDown={() => setPending(null)}
      >
        <defs>
          <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.3" fill="#172238" />
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
          return (
            <g key={w.id}>
              <path d={d} fill="none" stroke="transparent" strokeWidth={16}
                style={{ cursor: "pointer" }}
                onPointerDown={(e) => { e.stopPropagation(); deleteWire(w.id); }} />
              <path d={d} fill="none" stroke={sigColor(v)}
                strokeWidth={v === true ? 3.2 : 2.4} strokeLinecap="round"
                style={{ filter: v === true ? "drop-shadow(0 0 4px rgba(55,224,139,.55))" : "none", pointerEvents: "none" }} />
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
                onBodyDown={onBodyDown} onPort={onPort} onToggle={toggleInput} pending={pending} />
            );
          return (
            <GateNode key={n.id} node={n} value={memo[n.id]} ports={p}
              onBodyDown={onBodyDown} onPort={onPort} onDelete={deleteNode}
              pending={pending} liveInputs={liveInputs} />
          );
        })}

        <text x={14} y={VBH - 12} fontFamily="ui-monospace, monospace" fontSize={10.5} fill={C.faint}>
          click a port, then another to wire · click a wire to cut it · drag gates · click inputs to toggle
        </text>
      </svg>
    </div>
  );
}
