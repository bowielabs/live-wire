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
  onPortUp: (e: PointerEvent, node: NodeData, kind: "in" | "out", port: number) => void;
  onToggle: (id: string) => void;
  pending: Pending | null;
}

/** Single-character glyph for a signal — colorblind-safe cue alongside colour. */
const sigGlyph = (v: Signal): string => (v === true ? "1" : v === false ? "0" : "—");

export default function IONode({ node, value, ports, onBodyDown, onPort, onPortUp, onToggle, pending }: IONodeProps) {
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
            fill={on ? C.inputOnBg : C.inputOffBg} stroke={on ? C.on : C.borderHi}
            strokeWidth={1.6} onPointerDown={(e) => { e.stopPropagation(); onToggle(node.id); }}
            style={{ cursor: "pointer", filter: on ? `drop-shadow(0 0 6px ${C.glowOnSoft})` : "none" }} />
          <text x={node.x + 11} y={node.y + 17} fontFamily="var(--font-mono)"
            fontSize={11} fill={C.muted} style={{ pointerEvents: "none", userSelect: "none" }}>{node.label}</text>
          <text x={node.x + w / 2} y={node.y + h - 9} textAnchor="middle"
            fontFamily="var(--font-mono)" fontSize={19} fontWeight={700}
            fill={on ? C.on : C.faint} style={{ pointerEvents: "none", userSelect: "none" }}>
            {on ? "1" : "0"}
          </text>
          <g
            onPointerDown={(e) => { e.stopPropagation(); onPort(e, node, "out", 0); }}
            onPointerUp={(e) => onPortUp(e, node, "out", 0)}
            style={{ cursor: "crosshair" }}>
            <circle cx={ports.output!.x} cy={ports.output!.y} r={10} fill="transparent" />
            <circle cx={ports.output!.x} cy={ports.output!.y} r={5.4} fill={sigColor(value)}
              stroke={pending && pending.node === node.id ? C.accent : C.portRing}
              strokeWidth={pending && pending.node === node.id ? 2.4 : 1.5} />
          </g>
        </>
      ) : (
        <>
          <rect x={node.x} y={node.y} width={w} height={h} rx={9}
            fill={C.outputBg} stroke={on ? C.on : C.borderHi} strokeWidth={1.6}
            onPointerDown={(e) => onBodyDown(e, node)} style={{ cursor: "grab" }} />
          <circle cx={node.x + w / 2} cy={node.y + h / 2 - 4} r={11}
            fill={on ? C.on : value === false ? C.outputOffFill : C.outputNullFill}
            stroke={on ? C.outputOnStroke : C.border} strokeWidth={1.4}
            style={{ filter: on ? `drop-shadow(0 0 7px ${C.glowOnStrong})` : "none", pointerEvents: "none" }} />
          {/* Colour-blind-safe glyph inside the indicator */}
          <text x={node.x + w / 2} y={node.y + h / 2}
            textAnchor="middle" fontFamily="var(--font-mono)"
            fontSize={11} fontWeight={700}
            fill={on ? C.onAccentInk : C.faint}
            style={{ pointerEvents: "none", userSelect: "none" }}>
            {sigGlyph(value)}
          </text>
          <text x={node.x + w / 2} y={node.y + h - 6} textAnchor="middle"
            fontFamily="var(--font-mono)" fontSize={9} letterSpacing={1}
            fill={C.muted} style={{ pointerEvents: "none", userSelect: "none" }}>OUT Q</text>
          <g
            onPointerDown={(e) => { e.stopPropagation(); onPort(e, node, "in", 0); }}
            onPointerUp={(e) => onPortUp(e, node, "in", 0)}
            style={{ cursor: "crosshair" }}>
            <circle cx={ports.inputs[0].x} cy={ports.inputs[0].y} r={10} fill="transparent" />
            <circle cx={ports.inputs[0].x} cy={ports.inputs[0].y} r={5.4} fill={sigColor(value)}
              stroke={pending && pending.node === node.id ? C.accent : C.portRing}
              strokeWidth={pending && pending.node === node.id ? 2.4 : 1.5} />
          </g>
        </>
      )}
    </g>
  );
}
