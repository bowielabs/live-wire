import { describe, expect, it } from "vitest";
import type { NodeData, Wire } from "../types";
import { buildShare, decodeShare, encodeShare } from "./share";

// btoa / atob are provided natively by Node 20+ (the project's required runtime).

describe("share encode/decode", () => {
  const nodes: NodeData[] = [
    { id: "in0", type: "INPUT", label: "A", x: 62, y: 100 },
    { id: "in1", type: "INPUT", label: "B", x: 62, y: 200 },
    { id: "out", type: "OUTPUT", label: "Q", x: 838, y: 150 },
    { id: "g0", type: "AND", x: 400, y: 150 },
    { id: "g1", type: "NOT", x: 600, y: 150 },
  ];
  const wires: Wire[] = [
    { id: "w1", from: { node: "in0" }, to: { node: "g0", port: 0 } },
    { id: "w2", from: { node: "in1" }, to: { node: "g0", port: 1 } },
    { id: "w3", from: { node: "g0" }, to: { node: "g1", port: 0 } },
    { id: "w4", from: { node: "g1" }, to: { node: "out", port: 0 } },
  ];
  const inputValues = { in0: true, in1: false };

  it("buildShare captures level, inputs, gates, wires", () => {
    const s = buildShare({ levelIdx: 4, nodes, wires, inputValues });
    expect(s.v).toBe(1);
    expect(s.l).toBe(4);
    expect(s.i).toEqual([1, 0]);
    expect(s.g).toEqual([
      ["AND", 400, 150],
      ["NOT", 600, 150],
    ]);
    expect(s.w).toEqual([
      ["in0", "g0", 0],
      ["in1", "g0", 1],
      ["g0", "g1", 0],
      ["g1", "out", 0],
    ]);
  });

  it("rounds gate positions to integers", () => {
    const s = buildShare({
      levelIdx: 0,
      nodes: [{ id: "g0", type: "NOT", x: 123.7, y: 88.4 }],
      wires: [],
      inputValues: {},
    });
    expect(s.g).toEqual([["NOT", 124, 88]]);
  });

  it("encodes 'sandbox' as 's'", () => {
    const s = buildShare({ levelIdx: "sandbox", nodes: [], wires: [], inputValues: {} });
    expect(s.l).toBe("s");
  });

  it("encode → decode is a faithful round-trip", () => {
    const url = encodeShare({ levelIdx: 4, nodes, wires, inputValues });
    expect(typeof url).toBe("string");
    expect(url).not.toContain("+");
    expect(url).not.toContain("/");
    expect(url).not.toContain("=");
    const back = decodeShare(url);
    expect(back).not.toBeNull();
    expect(back!.v).toBe(1);
    expect(back!.l).toBe(4);
    expect(back!.i).toEqual([1, 0]);
    expect(back!.g).toHaveLength(2);
    expect(back!.w).toHaveLength(4);
  });

  it("decode rejects malformed payloads", () => {
    expect(decodeShare("")).toBeNull();
    expect(decodeShare("not-base64!!!")).toBeNull();
    expect(decodeShare(btoa('{"v":2,"l":0}'))).toBeNull(); // wrong version
    expect(decodeShare(btoa('{"v":1}'))).toBeNull(); // missing fields
  });

  it("handles unicode in level data without corruption (UTF-8 safety)", () => {
    const s = buildShare({
      levelIdx: 0,
      nodes: [{ id: "g0", type: "NOT", x: 100, y: 100, label: "≥1 ⊕ ¬A" }],
      wires: [],
      inputValues: {},
    });
    const url = encodeShare({ levelIdx: 0, nodes: [{ id: "g0", type: "NOT", x: 100, y: 100 }], wires: [], inputValues: {} });
    expect(decodeShare(url)).not.toBeNull();
    expect(s.g[0]).toEqual(["NOT", 100, 100]);
  });
});
