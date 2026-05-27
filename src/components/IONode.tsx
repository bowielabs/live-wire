import type { PointerEvent } from "react";
import type { NodeData, Pending, Ports, Signal } from "../types";
import { nodeBox } from "../engine/geometry";
import { C, sigColor } from "../theme";

export interface IONodeProps {
  node: NodeData;
  value: Signal;
  ports: Ports;
  onBodyDown: (e: PointerEvent, node: NodeData) => void;
  onPort: (e: PointerEvent, node: NodeData, kind: "in" | "out", port: number) => void;
  onToggle: (id: string) => void;
  pending: Pending | null;
}

export default function IONode({ node, value, ports, onBodyDown, onPort, onToggle, pending }: IONodeProps) {
  const { w, h } = nodeBox(node.type);
  const isIn = node.type === "INPUT";
  const on = value === true;
  return (
    <g>
      {isIn ? (
        <>
          <line x1={node.x + w} y1={node.y + h / 2} x2={node.x + w + 11} y2={node.y + h / 2}
            stroke={sigColor(value)} strokeWidth={2.4} />
          <rect x={node.x} y={node.y} width={w} height={h} rx={9}
            fill={on ? "#10301f" : "#141d33"} stroke={on ? C.on : C.borderHi}
            strokeWidth={1.6} onPointerDown={(e) => { e.stopPropagation(); onToggle(node.id); }}
            style={{ cursor: "pointer", filter: on ? "drop-shadow(0 0 6px rgba(55,224,139,.4))" : "none" }} />
          <text x={node.x + 11} y={node.y + 17} fontFamily="ui-monospace, monospace"
            fontSize={11} fill={C.muted} style={{ pointerEvents: "none", userSelect: "none" }}>{node.label}</text>
          <text x={node.x + w / 2} y={node.y + h - 9} textAnchor="middle"
            fontFamily="ui-monospace, monospace" fontSize={19} fontWeight={700}
            fill={on ? C.on : C.faint} style={{ pointerEvents: "none", userSelect: "none" }}>
            {on ? "1" : "0"}
          </text>
          <g onPointerDown={(e) => { e.stopPropagation(); onPort(e, node, "out", 0); }} style={{ cursor: "crosshair" }}>
            <circle cx={ports.output!.x} cy={ports.output!.y} r={10} fill="transparent" />
            <circle cx={ports.output!.x} cy={ports.output!.y} r={5.4} fill={sigColor(value)}
              stroke={pending && pending.node === node.id ? C.accent : "#0b1322"}
              strokeWidth={pending && pending.node === node.id ? 2.4 : 1.5} />
          </g>
        </>
      ) : (
        <>
          <rect x={node.x} y={node.y} width={w} height={h} rx={9}
            fill="#141d33" stroke={on ? C.on : C.borderHi} strokeWidth={1.6}
            onPointerDown={(e) => onBodyDown(e, node)} style={{ cursor: "grab" }} />
          <circle cx={node.x + w / 2} cy={node.y + h / 2 - 2} r={11}
            fill={on ? C.on : value === false ? "#22304e" : "#33294a"}
            stroke={on ? "#7af2b4" : C.border} strokeWidth={1.4}
            style={{ filter: on ? "drop-shadow(0 0 7px rgba(55,224,139,.7))" : "none", pointerEvents: "none" }} />
          <text x={node.x + w / 2} y={node.y + h - 6} textAnchor="middle"
            fontFamily="ui-monospace, monospace" fontSize={9} letterSpacing={1}
            fill={C.muted} style={{ pointerEvents: "none", userSelect: "none" }}>OUT Q</text>
          <g onPointerDown={(e) => { e.stopPropagation(); onPort(e, node, "in", 0); }} style={{ cursor: "crosshair" }}>
            <circle cx={ports.inputs[0].x} cy={ports.inputs[0].y} r={10} fill="transparent" />
            <circle cx={ports.inputs[0].x} cy={ports.inputs[0].y} r={5.4} fill={sigColor(value)}
              stroke={pending && pending.node === node.id ? C.accent : "#0b1322"}
              strokeWidth={pending && pending.node === node.id ? 2.4 : 1.5} />
          </g>
        </>
      )}
    </g>
  );
}
