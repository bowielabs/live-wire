import { describe, expect, it } from "vitest";
import type { NodeData, Wire } from "../types";
import { makesCycle, simulate } from "./simulate";

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
