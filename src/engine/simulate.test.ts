import { describe, expect, it } from "vitest";
import type { NodeData, Wire } from "../types";
import { contributingGateCount, makesCycle, simulate } from "./simulate";

let wid = 0;
const wire = (from: string, to: string, port: number): Wire => ({
  id: "w" + wid++,
  from: { node: from },
  to: { node: to, port },
});
const input = (id: string): NodeData => ({ id, type: "INPUT", x: 0, y: 0 });
const output = (id = "out"): NodeData => ({ id, type: "OUTPUT", x: 0, y: 0 });
const gate = (id: string, type: NodeData["type"]): NodeData => ({ id, type, x: 0, y: 0 });

describe("simulate", () => {
  it("passes an INPUT straight through the OUTPUT", () => {
    const nodes = [input("a"), output()];
    const wires = [wire("a", "out", 0)];
    expect(simulate(nodes, wires, { a: true }).out).toBe(true);
    expect(simulate(nodes, wires, { a: false }).out).toBe(false);
  });

  it("evaluates a single NOT gate", () => {
    const nodes = [input("a"), gate("g", "NOT"), output()];
    const wires = [wire("a", "g", 0), wire("g", "out", 0)];
    expect(simulate(nodes, wires, { a: false }).out).toBe(true);
    expect(simulate(nodes, wires, { a: true }).out).toBe(false);
  });

  it("evaluates a two-input AND across all combinations", () => {
    const nodes = [input("a"), input("b"), gate("g", "AND"), output()];
    const wires = [wire("a", "g", 0), wire("b", "g", 1), wire("g", "out", 0)];
    const at = (a: boolean, b: boolean) => simulate(nodes, wires, { a, b }).out;
    expect(at(false, false)).toBe(false);
    expect(at(true, false)).toBe(false);
    expect(at(false, true)).toBe(false);
    expect(at(true, true)).toBe(true);
  });

  it("supports fan-out: one signal driving both inputs (A AND A = A)", () => {
    const nodes = [input("a"), gate("g", "AND"), output()];
    const wires = [wire("a", "g", 0), wire("a", "g", 1), wire("g", "out", 0)];
    expect(simulate(nodes, wires, { a: true }).out).toBe(true);
    expect(simulate(nodes, wires, { a: false }).out).toBe(false);
  });

  it("chains two NOTs back to identity", () => {
    const nodes = [input("a"), gate("g1", "NOT"), gate("g2", "NOT"), output()];
    const wires = [wire("a", "g1", 0), wire("g1", "g2", 0), wire("g2", "out", 0)];
    expect(simulate(nodes, wires, { a: true }).out).toBe(true);
    expect(simulate(nodes, wires, { a: false }).out).toBe(false);
  });

  it("returns null for a gate with an unconnected input (tri-state)", () => {
    const nodes = [input("a"), gate("g", "AND"), output()];
    const wires = [wire("a", "g", 0), wire("g", "out", 0)]; // port 1 left open
    const memo = simulate(nodes, wires, { a: true });
    expect(memo.g).toBeNull();
    expect(memo.out).toBeNull();
  });

  it("returns null for an OUTPUT with nothing wired to it", () => {
    const nodes = [input("a"), output()];
    expect(simulate(nodes, [], { a: true }).out).toBeNull();
  });
});

describe("contributingGateCount", () => {
  it("counts zero when the input is wired straight to Q (the shortcut)", () => {
    const nodes = [input("a"), output()];
    expect(contributingGateCount(nodes, [wire("a", "out", 0)])).toBe(0);
  });

  it("counts the two NOTs of an honest ¬¬A = A proof", () => {
    const nodes = [input("a"), gate("g1", "NOT"), gate("g2", "NOT"), output()];
    const wires = [wire("a", "g1", 0), wire("g1", "g2", 0), wire("g2", "out", 0)];
    expect(contributingGateCount(nodes, wires)).toBe(2);
  });

  it("ignores dangling gates not wired into Q (can't be gamed)", () => {
    const nodes = [input("a"), gate("g1", "NOT"), gate("dead", "NOT"), output()];
    // g1 feeds Q; 'dead' is placed but wired to nothing on the output side.
    const wires = [wire("a", "g1", 0), wire("g1", "out", 0), wire("a", "dead", 0)];
    expect(contributingGateCount(nodes, wires)).toBe(1);
  });

  it("counts every gate along the feeding path", () => {
    const nodes = [input("a"), input("b"), gate("or", "OR"), gate("and", "AND"), output()];
    const wires = [
      wire("a", "or", 0), wire("b", "or", 1),
      wire("a", "and", 0), wire("or", "and", 1),
      wire("and", "out", 0),
    ];
    expect(contributingGateCount(nodes, wires)).toBe(2);
  });

  it("returns 0 when there is no output node", () => {
    expect(contributingGateCount([input("a"), gate("g", "NOT")], [wire("a", "g", 0)])).toBe(0);
  });
});

describe("makesCycle", () => {
  it("accepts an acyclic chain", () => {
    expect(makesCycle([wire("a", "g1", 0), wire("g1", "g2", 0), wire("g2", "out", 0)])).toBe(false);
  });

  it("detects a direct two-node cycle", () => {
    expect(makesCycle([wire("g1", "g2", 0), wire("g2", "g1", 0)])).toBe(true);
  });

  it("detects a self-loop", () => {
    expect(makesCycle([wire("g1", "g1", 0)])).toBe(true);
  });

  it("detects a longer indirect cycle", () => {
    expect(
      makesCycle([wire("g1", "g2", 0), wire("g2", "g3", 0), wire("g3", "g1", 0)])
    ).toBe(true);
  });
});
