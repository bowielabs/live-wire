import type { GateType } from "../types";

/* ---- distinctive-shape (ANSI / MIL-STD-806) gate silhouettes ----
   Every shape is built inside the box [x, x+w] x [y, y+h] with its
   output tip on the right edge at (x+w, y+h/2), so the existing output
   stub + negation-bubble geometry lines up for every gate. Input ports
   live on the left edge; `leadX` is the x the input leads run out to
   where they meet the silhouette (equal to the left edge when the back
   is flat and no lead is needed).                                      */

export interface GateGeom {
  /** filled + stroked silhouette */
  body: string;
  /** extra stroke-only line — the XOR / XNOR back arc; undefined otherwise */
  back?: string;
  /** x-coordinate input leads run out to (== left edge when flat-backed) */
  leadX: number;
}

/** AND-style D: flat back, semicircular front. */
function andShape(x: number, y: number, w: number, h: number): string {
  const r = h / 2;
  return `M ${x} ${y} H ${x + w - r} A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} H ${x} Z`;
}

/** OR-style shield, tip at (x+w, y+h/2). `inset` shifts the body right so
    XOR has room for its extra back arc on the left. */
function orShape(x: number, y: number, w: number, h: number, inset = 0): string {
  const bx = x + inset;
  const bw = w - inset;
  const my = y + h / 2;
  return [
    `M ${bx} ${y}`,
    `Q ${bx + bw * 0.55} ${y} ${x + w} ${my}`,        // top edge to tip
    `Q ${bx + bw * 0.55} ${y + h} ${bx} ${y + h}`,    // tip to bottom-left
    `Q ${bx + bw * 0.3} ${my} ${bx} ${y}`,            // concave back
    "Z",
  ].join(" ");
}

/** NOT / buffer triangle, apex at (x+w, y+h/2). */
function notShape(x: number, y: number, w: number, h: number): string {
  return `M ${x} ${y} L ${x + w} ${y + h / 2} L ${x} ${y + h} Z`;
}

export function gateGeom(type: GateType, x: number, y: number, w: number, h: number): GateGeom {
  switch (type) {
    case "AND":
    case "NAND":
      return { body: andShape(x, y, w, h), leadX: x };
    case "OR":
    case "NOR":
      return { body: orShape(x, y, w, h), leadX: x + w * 0.126 };
    case "XOR":
    case "XNOR": {
      const back = `M ${x} ${y} Q ${x + w * 0.22} ${y + h / 2} ${x} ${y + h}`;
      return { body: orShape(x, y, w, h, 6), back, leadX: x + w * 0.092 };
    }
    case "NOT":
      return { body: notShape(x, y, w, h), leadX: x };
    default:
      return { body: `M ${x} ${y} h ${w} v ${h} h ${-w} Z`, leadX: x };
  }
}
