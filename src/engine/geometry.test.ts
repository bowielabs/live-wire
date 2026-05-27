import { describe, expect, it } from "vitest";
import type { NodeData } from "../types";
import { nodeBox, portsOf } from "./geometry";
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
