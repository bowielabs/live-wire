import type { PointerEvent } from "react";
import type { NodeData, Pending, Ports, Signal } from "../types";
import { GATES } from "../engine/gates";
import { nodeBox } from "../engine/geometry";
import { C, sigColor } from "../theme";

export interface GateNodeProps {
  node: NodeData;
  value: Signal;
  ports: Ports;
  onBodyDown: (e: PointerEvent, node: NodeData) => void;
  onPort: (e: PointerEvent, node: NodeData, kind: "in" | "out", port: number) => void;
  onPortUp: (e: PointerEvent, node: NodeData, kind: "in" | "out", port: number) => void;
  onDelete: (id: string) => void;
  pending: Pending | null;
  liveInputs: Record<number, Signal>;
}

export default function GateNode({
  node,
  value,
  ports,
  onBodyDown,
  onPort,
  onPortUp,
  onDelete,
  pending,
  liveInputs,
}: GateNodeProps) {
  const def = GATES[node.type];
  const { w, h } = nodeBox(node.type);
  const fam = def.fam!;
  const lit = value === true;

  return (
    <g className="gw-pop-in">
      {/* output stub + negation bubble */}
      <line x1={node.x + w} y1={node.y + h / 2} x2={node.x + w + 11} y2={node.y + h / 2}
        stroke={sigColor(value)} strokeWidth={2.4} />
      {def.neg && (
        <circle cx={node.x + w + 4} cy={node.y + h / 2} r={5}
          fill={C.canvas} stroke={fam} strokeWidth={1.8} />
      )}
      {/* body */}
      <rect
        x={node.x} y={node.y} width={w} height={h} rx={9}
        fill={C.gateBody} stroke={lit ? C.on : fam}
        strokeWidth={lit ? 2.2 : 1.5}
        onPointerDown={(e) => onBodyDown(e, node)}
        style={{ cursor: "grab", filter: lit ? `drop-shadow(0 0 5px ${C.glowOn})` : "none" }}
      />
      <rect x={node.x} y={node.y} width={w} height={7} rx={3.5} fill={fam} opacity={0.85}
        style={{ pointerEvents: "none" }} />
      <text x={node.x + w / 2} y={node.y + h * 0.56} textAnchor="middle"
        fontFamily="var(--font-mono)" fontSize={20} fontWeight={700}
        fill={fam} style={{ pointerEvents: "none", userSelect: "none" }}>
        {def.sym}
      </text>
      <text x={node.x + w / 2} y={node.y + h - 7} textAnchor="middle"
        fontFamily="var(--font-mono)" fontSize={9} letterSpacing={1}
        fill={C.muted} style={{ pointerEvents: "none", userSelect: "none" }}>
        {def.name}
      </text>
      {/* delete */}
      <g onPointerDown={(e) => { e.stopPropagation(); onDelete(node.id); }} style={{ cursor: "pointer" }}>
        <circle cx={node.x + w - 4} cy={node.y + 4} r={8} fill={C.panel} stroke={C.border} />
        <text x={node.x + w - 4} y={node.y + 7.5} textAnchor="middle" fontSize={11}
          fill={C.muted} style={{ pointerEvents: "none" }}>×</text>
      </g>
      {/* input ports */}
      {ports.inputs.map((p) => {
        const iv = liveInputs[p.idx];
        const sel = pending && pending.node === node.id && pending.kind === "in" && pending.port === p.idx;
        return (
          <g key={"i" + p.idx}
            onPointerDown={(e) => { e.stopPropagation(); onPort(e, node, "in", p.idx); }}
            onPointerUp={(e) => onPortUp(e, node, "in", p.idx)}
            style={{ cursor: "crosshair" }}>
            <circle cx={p.x} cy={p.y} r={10} fill="transparent" />
            <circle cx={p.x} cy={p.y} r={5.2} fill={sigColor(iv)}
              stroke={sel ? C.accent : C.portRing} strokeWidth={sel ? 2.4 : 1.5} />
          </g>
        );
      })}
      {/* output port */}
      {ports.output && (
        <g
          onPointerDown={(e) => { e.stopPropagation(); onPort(e, node, "out", 0); }}
          onPointerUp={(e) => onPortUp(e, node, "out", 0)}
          style={{ cursor: "crosshair" }}>
          <circle cx={ports.output.x} cy={ports.output.y} r={10} fill="transparent" />
          <circle cx={ports.output.x} cy={ports.output.y} r={5.2} fill={sigColor(value)}
            stroke={pending && pending.node === node.id && pending.kind === "out" ? C.accent : C.portRing}
            strokeWidth={pending && pending.node === node.id && pending.kind === "out" ? 2.4 : 1.5} />
        </g>
      )}
    </g>
  );
}
