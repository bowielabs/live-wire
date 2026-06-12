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

/* ---- adaptive viewBox ----
   Frame the actual node content (plus their port stubs and some breathing
   room) instead of always showing the full 940×560 board. Sparse early
   levels zoom in so nodes are big and tappable on a phone; as a circuit
   grows the frame expands back out toward the full board. MIN_VB_W caps how
   far we zoom in, and the frame keeps the board's aspect ratio so the SVG
   neither distorts nor letterboxes. */
export interface ViewBox { x: number; y: number; w: number; h: number; }

/** How much padding to leave around the content, and the tightest (most
    zoomed-in) frame width we allow. */
const VB_PAD = 48;
const MIN_VB_W = 540;

export function fitViewBox(nodes: NodeData[]): ViewBox {
  if (nodes.length === 0) return { x: 0, y: 0, w: VBW, h: VBH };

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of nodes) {
    const { w, h } = nodeBox(n.type);
    minX = Math.min(minX, n.x - 12);       // left input port / stub
    maxX = Math.max(maxX, n.x + w + 13);   // right output stub
    minY = Math.min(minY, n.y - 4);
    maxY = Math.max(maxY, n.y + h + 4);
  }
  minX -= VB_PAD; minY -= VB_PAD; maxX += VB_PAD; maxY += VB_PAD;

  const aspect = VBW / VBH;
  let w = Math.max(maxX - minX, MIN_VB_W);
  let h = Math.max(maxY - minY, MIN_VB_W / aspect);
  // Grow the smaller axis so the frame matches the board's aspect ratio.
  if (w / h < aspect) w = h * aspect;
  else h = w / aspect;
  // Never frame larger than the board itself.
  if (w > VBW) { w = VBW; h = VBH; }

  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const x = w >= VBW ? 0 : Math.max(0, Math.min(VBW - w, cx - w / 2));
  const y = h >= VBH ? 0 : Math.max(0, Math.min(VBH - h, cy - h / 2));
  return { x, y, w, h };
}
