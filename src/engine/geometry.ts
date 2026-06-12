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

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/* ---- gate drop placement ----
   Distribute newly added gates the way inputs are laid out: spread the
   level's expected count (`par`) evenly down the canvas — par 1 drops a gate
   in the centre, par 2 at 1/3 then 2/3, par 3 at 1/4·2/4·3/4, and so on. The
   gate sits horizontally between the inputs and the output. A collision scan
   keeps the new gate off any existing node, even ones the user has moved. */
export function placeGate(nodes: NodeData[], expected: number, index: number): { x: number; y: number } {
  const { w, h } = nodeBox("AND"); // every gate shares the same box
  const inputs = nodes.filter((n) => n.type === "INPUT");
  const output = nodes.find((n) => n.type === "OUTPUT");
  const leftEdge = inputs.length ? Math.max(...inputs.map((n) => n.x + nodeBox(n.type).w)) : 120;
  const rightEdge = output ? output.x : VBW - 120;
  const x0 = clamp((leftEdge + rightEdge) / 2 - w / 2, 8, VBW - 100);

  // Slot count grows if the user adds past par, so overflow gates still fit.
  const slots = Math.max(expected, index + 1);
  const y0 = clamp(((index + 1) / (slots + 1)) * VBH - h / 2, 6, VBH - 56);

  const margin = 14;
  const hits = (px: number, py: number) =>
    nodes.some((n) => {
      const b = nodeBox(n.type);
      return px < n.x + b.w + margin && px + w + margin > n.x &&
             py < n.y + b.h + margin && py + h + margin > n.y;
    });
  if (!hits(x0, y0)) return { x: x0, y: y0 };

  // Nudge to the nearest free spot — vertical steps first (matches the layout).
  const stepX = w + margin, stepY = h + margin;
  for (let dy = 0; dy <= 5; dy++)
    for (const sy of dy === 0 ? [0] : [dy, -dy])
      for (let dx = 0; dx <= 3; dx++)
        for (const sx of dx === 0 ? [0] : [dx, -dx]) {
          const cx = clamp(x0 + sx * stepX, 8, VBW - 100);
          const cy = clamp(y0 + sy * stepY, 6, VBH - 56);
          if (!hits(cx, cy)) return { x: cx, y: cy };
        }
  return { x: x0, y: y0 };
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
