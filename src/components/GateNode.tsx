import type { PointerEvent } from "react";
import type { NodeData, Pending, Ports, Signal } from "../types";
import { GATES } from "../engine/gates";
import { nodeBox } from "../engine/geometry";
import { gateGeom } from "../engine/gateShapes";
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
  const geom = gateGeom(node.type, node.x, node.y, w, h);
  const stroke = lit ? C.on : fam;
  const sw = lit ? 2.2 : 1.5;

  return (
    <g className="gw-pop-in">
      {/* input leads — run from each port out to the silhouette; light up
          with their own signal so the gate reads like a textbook diagram */}
      {ports.inputs.map((p) =>
        geom.leadX > p.x ? (
          <line key={"l" + p.idx} x1={p.x} y1={p.y} x2={geom.leadX} y2={p.y}
            stroke={sigColor(liveInputs[p.idx])} strokeWidth={2.4}
            style={{ pointerEvents: "none" }} />
        ) : null,
      )}
      {/* output stub */}
      <line x1={node.x + w} y1={node.y + h / 2} x2={node.x + w + 11} y2={node.y + h / 2}
        stroke={sigColor(value)} strokeWidth={2.4} />
      {/* XOR / XNOR extra back arc */}
      {geom.back && (
        <path d={geom.back} fill="none" stroke={stroke} strokeWidth={sw}
          strokeLinecap="round" style={{ pointerEvents: "none" }} />
      )}
      {/* body silhouette */}
      <path d={geom.body} fill={C.gateBody} stroke={stroke} strokeWidth={sw}
        strokeLinejoin="round"
        onPointerDown={(e) => onBodyDown(e, node)}
        style={{ cursor: "grab", filter: lit ? `drop-shadow(0 0 5px ${C.glowOn})` : "none" }} />
      {/* negation bubble (NOT / NAND / NOR / XNOR) */}
      {def.neg && (
        <circle cx={node.x + w + 4} cy={node.y + h / 2} r={5}
          fill={C.canvas} stroke={stroke} strokeWidth={sw} />
      )}
      {/* name label — subtle, the shape carries the identity */}
      <text x={node.x + w * 0.44} y={node.y + h * 0.5 + 3.2} textAnchor="middle"
        fontFamily="var(--font-mono)" fontSize={8.5} fontWeight={600} letterSpacing={0.5}
        fill={C.muted} opacity={0.8} style={{ pointerEvents: "none", userSelect: "none" }}>
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
