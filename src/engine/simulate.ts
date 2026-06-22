import type { NodeData, Signal, Wire } from "../types";
import { GATES } from "./gates";

/**
 * Evaluate a combinational circuit.
 * Returns a map of nodeId -> Signal (true | false | null when undriven).
 */
export function simulate(
  nodes: NodeData[],
  wires: Wire[],
  inputMap: Record<string, boolean>
): Record<string, Signal> {
  const byId: Record<string, NodeData> = {};
  nodes.forEach((n) => (byId[n.id] = n));
  const inWire: Record<string, Record<number, Wire>> = {};
  wires.forEach((w) => {
    inWire[w.to.node] = inWire[w.to.node] || {};
    inWire[w.to.node][w.to.port] = w;
  });
  const memo: Record<string, Signal> = {};
  const stack: Record<string, boolean> = {};
  function val(id: string): Signal {
    if (id in memo) return memo[id];
    if (stack[id]) return null;
    stack[id] = true;
    const n = byId[id];
    let r: Signal;
    if (!n) r = null;
    else if (n.type === "INPUT") r = !!inputMap[id];
    else {
      const def = GATES[n.type];
      const ins: Signal[] = [];
      for (let i = 0; i < def.inputs; i++) {
        const w = inWire[id] && inWire[id][i];
        ins.push(w ? val(w.from.node) : null);
      }
      if (ins.some((v) => v === null || v === undefined)) r = null;
      else if (n.type === "OUTPUT") r = ins[0];
      else r = def.fn ? def.fn(...(ins as boolean[])) : null;
    }
    stack[id] = false;
    memo[id] = r;
    return r;
  }
  nodes.forEach((n) => val(n.id));
  return memo;
}

/**
 * Count the gates (excluding INPUT/OUTPUT) whose output transitively feeds the
 * OUTPUT node — i.e. gates that actually contribute to Q. Gates left dangling
 * or wired off to the side don't count, so a "prove the identity" level can't
 * be satisfied by padding the board with decorative gates.
 */
export function contributingGateCount(nodes: NodeData[], wires: Wire[]): number {
  const out = nodes.find((n) => n.type === "OUTPUT");
  if (!out) return 0;
  const feeders: Record<string, string[]> = {};
  wires.forEach((w) => (feeders[w.to.node] = feeders[w.to.node] || []).push(w.from.node));
  const byId: Record<string, NodeData> = {};
  nodes.forEach((n) => (byId[n.id] = n));

  const seen = new Set<string>();
  const stack = [out.id];
  while (stack.length) {
    const id = stack.pop()!;
    for (const src of feeders[id] || [])
      if (!seen.has(src)) {
        seen.add(src);
        stack.push(src);
      }
  }

  let count = 0;
  seen.forEach((id) => {
    const n = byId[id];
    if (n && n.type !== "INPUT" && n.type !== "OUTPUT") count++;
  });
  return count;
}

/** True if adding/keeping these wires would introduce a feedback loop. */
export function makesCycle(wires: Wire[]): boolean {
  const adj: Record<string, string[]> = {};
  wires.forEach((w) => (adj[w.from.node] = adj[w.from.node] || []).push(w.to.node));
  const state: Record<string, number> = {};
  let cyc = false;
  function dfs(u: string) {
    state[u] = 1;
    (adj[u] || []).forEach((v) => {
      if (state[v] === 1) cyc = true;
      else if (!state[v]) dfs(v);
    });
    state[u] = 2;
  }
  Object.keys(adj).forEach((u) => !state[u] && dfs(u));
  return cyc;
}
