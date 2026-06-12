import { describe, expect, it } from "vitest";
import type { NodeData } from "../types";
import { fitViewBox, nodeBox, portsOf, VBH, VBW } from "./geometry";
import { buildBoard } from "./board";
import { LEVELS } from "../data/levels";

const at = (type: NodeData["type"]): NodeData => ({ id: "n", type, x: 100, y: 100 });

describe("portsOf", () => {
  it("INPUT has one output and no inputs", () => {
    const p = portsOf(at("INPUT"));
    expect(p.inputs).toHaveLength(0);
    expect(p.output).not.toBeNull();
  });

  it("OUTPUT has one input and no output", () => {
    const p = portsOf(at("OUTPUT"));
    expect(p.inputs).toHaveLength(1);
    expect(p.output).toBeNull();
  });

  it("NOT has one input port", () => {
    expect(portsOf(at("NOT")).inputs).toHaveLength(1);
  });

  it("AND has two input ports at distinct heights", () => {
    const p = portsOf(at("AND"));
    expect(p.inputs).toHaveLength(2);
    expect(p.inputs[0].y).not.toBe(p.inputs[1].y);
    expect(p.output).not.toBeNull();
  });

  it("gate bodies are larger than IO nodes", () => {
    expect(nodeBox("AND").w).toBeGreaterThan(nodeBox("INPUT").w);
  });
});

describe("fitViewBox", () => {
  const aspect = VBW / VBH;

  it("keeps the board's aspect ratio", () => {
    const vb = fitViewBox(buildBoard(LEVELS[0]).nodes);
    expect(vb.w / vb.h).toBeCloseTo(aspect, 3);
  });

  it("zooms in on a sparse early level (frame well under the full board)", () => {
    const vb = fitViewBox(buildBoard(LEVELS[0]).nodes);
    expect(vb.w).toBeLessThan(VBW * 0.75);
    expect(vb.w).toBeGreaterThanOrEqual(540 - 1); // honours the min-size zoom cap
  });

  it("stays within the board bounds", () => {
    const vb = fitViewBox(buildBoard(LEVELS[0]).nodes);
    expect(vb.x).toBeGreaterThanOrEqual(0);
    expect(vb.y).toBeGreaterThanOrEqual(0);
    expect(vb.x + vb.w).toBeLessThanOrEqual(VBW + 0.5);
    expect(vb.y + vb.h).toBeLessThanOrEqual(VBH + 0.5);
  });

  it("expands toward the full board as content spreads out", () => {
    const spread: NodeData[] = [
      { id: "in0", type: "INPUT", x: 70, y: 40 },
      { id: "g0", type: "AND", x: 450, y: 480 },
      { id: "out", type: "OUTPUT", x: 860, y: 260 },
    ];
    const vb = fitViewBox(spread);
    expect(vb.w).toBe(VBW);
    expect(vb.h).toBe(VBH);
  });

  it("falls back to the full board when empty", () => {
    expect(fitViewBox([])).toEqual({ x: 0, y: 0, w: VBW, h: VBH });
  });
});

describe("buildBoard", () => {
  it("creates one INPUT per declared input plus a single OUTPUT, all inputs low", () => {
    const board = buildBoard(LEVELS[0]); // 1 input ("A")
    const inputs = board.nodes.filter((n) => n.type === "INPUT");
    const outputs = board.nodes.filter((n) => n.type === "OUTPUT");
    expect(inputs).toHaveLength(1);
    expect(outputs).toHaveLength(1);
    expect(inputs[0].label).toBe("A");
    expect(Object.values(board.inputValues)).toEqual([false]);
  });

  it("matches input count for a multi-input level", () => {
    const lvl = LEVELS.find((l) => l.inputs.length === 4)!;
    const board = buildBoard(lvl);
    expect(board.nodes.filter((n) => n.type === "INPUT")).toHaveLength(4);
    expect(Object.values(board.inputValues).every((v) => v === false)).toBe(true);
  });
});
