import type { NodeData } from "../types";
import { GATES } from "./gates";

/* ---- body-touch attachment-point selection ----
   The whole gate body is a wire target on touch devices. These pure helpers
   decide which port a body press should grab, using the "next free input"
   rule the design settled on: the left half of a gate grabs the lowest-index
   unconnected input, the right half grabs the output. Single-point nodes
   (INPUT, OUTPUT) collapse to their one port regardless of where you touch. */

/** Map of node id -> set of input ports that already have an incoming wire. */
export type InWireMap = Record<string, Record<number, unknown>>;

export interface AttachPoint {
  kind: "in" | "out";
  port: number;
}

export function inputCount(n: NodeData): number {
  return n.type === "OUTPUT" ? 1 : GATES[n.type].inputs;
}

export function hasOutput(n: NodeData): boolean {
  return n.type !== "OUTPUT";
}

/** Lowest-index input with no wire yet; falls back to 0 when all are taken
    (so a body press can still re-target a full gate to rewire it). */
export function nextFreeInput(n: NodeData, inWire: InWireMap): number {
  const k = inputCount(n);
  const used = inWire[n.id] || {};
  for (let i = 0; i < k; i++) if (!used[i]) return i;
  return 0;
}

/** The ports a repeated tap walks through, in order: output first, then
    inputs top-to-bottom. Only includes ports the node actually has. */
export function cyclePorts(n: NodeData): AttachPoint[] {
  const arr: AttachPoint[] = [];
  if (hasOutput(n)) arr.push({ kind: "out", port: 0 });
  for (let i = 0; i < inputCount(n); i++) arr.push({ kind: "in", port: i });
  return arr;
}

/** Which port the *first* tap on a node arms. Prefer the output (you wire
    output -> input); if it's already driving something, prefer the first free
    input; otherwise fall back to the first port. `outDriving` = the node's
    output already feeds at least one wire. */
export function smartStartPort(n: NodeData, inWire: InWireMap, outDriving: boolean): AttachPoint {
  if (hasOutput(n) && !outDriving) return { kind: "out", port: 0 };
  const used = inWire[n.id] || {};
  for (let i = 0; i < inputCount(n); i++) if (!used[i]) return { kind: "in", port: i };
  return cyclePorts(n)[0];
}

/** The next port after `cur` in the cycle (wraps around). */
export function nextCyclePort(n: NodeData, cur: AttachPoint): AttachPoint {
  const ports = cyclePorts(n);
  const i = ports.findIndex((p) => p.kind === cur.kind && p.port === cur.port);
  return ports[(i + 1) % ports.length];
}

/** Where a pending wire should *land* when dropped onto this body. `need` is
    the kind required to complete the pending wire (opposite of its source). */
export function bodyTargetPoint(n: NodeData, need: "in" | "out", inWire: InWireMap): AttachPoint | null {
  if (need === "in") return inputCount(n) > 0 ? { kind: "in", port: nextFreeInput(n, inWire) } : null;
  return hasOutput(n) ? { kind: "out", port: 0 } : null;
}
