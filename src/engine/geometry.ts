import type { GateType, NodeData, Ports } from "../types";
import { GATES } from "./gates";

/* ---- canvas viewBox dimensions ---- */
export const VBW = 940;
export const VBH = 560;

/* ---- geometry ---- */
export function nodeBox(t: GateType): { w: number; h: number } {
  return t === "INPUT" || t === "OUTPUT" ? { w: 58, h: 44 } : { w: 76, h: 50 };
}

export function portsOf(n: NodeData): Ports {
  const { w, h } = nodeBox(n.type);
  const def = GATES[n.type];
  let inputs: Ports["inputs"] = [];
  if (n.type === "OUTPUT") inputs = [{ x: n.x, y: n.y + h / 2, idx: 0 }];
  else if (def.inputs === 1) inputs = [{ x: n.x, y: n.y + h / 2, idx: 0 }];
  else if (def.inputs === 2)
    inputs = [
      { x: n.x, y: n.y + h * 0.3, idx: 0 },
      { x: n.x, y: n.y + h * 0.7, idx: 1 },
    ];
  const output = n.type === "OUTPUT" ? null : { x: n.x + w + 11, y: n.y + h / 2 };
  return { inputs, output, w, h };
}

/* ---- wire path (cubic bezier) ---- */
export function wirePath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = Math.max(38, Math.abs(x2 - x1) * 0.5);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}
