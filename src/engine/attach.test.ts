import { describe, expect, it } from "vitest";
import type { NodeData } from "../types";
import {
  bodyTargetPoint,
  cyclePorts,
  nextCyclePort,
  nextFreeInput,
  smartStartPort,
  type InWireMap,
} from "./attach";

const at = (type: NodeData["type"]): NodeData => ({ id: "n", type, x: 100, y: 100 });
const NONE: InWireMap = {};

describe("nextFreeInput", () => {
  it("returns the lowest unconnected input", () => {
    expect(nextFreeInput(at("AND"), NONE)).toBe(0);
    expect(nextFreeInput(at("AND"), { n: { 0: true } })).toBe(1);
  });
  it("falls back to 0 when all inputs are taken", () => {
    expect(nextFreeInput(at("AND"), { n: { 0: true, 1: true } })).toBe(0);
  });
});

describe("cyclePorts", () => {
  it("lists output then inputs top-to-bottom", () => {
    expect(cyclePorts(at("AND"))).toEqual([
      { kind: "out", port: 0 },
      { kind: "in", port: 0 },
      { kind: "in", port: 1 },
    ]);
  });
  it("INPUT has only its output, OUTPUT only its input", () => {
    expect(cyclePorts(at("INPUT"))).toEqual([{ kind: "out", port: 0 }]);
    expect(cyclePorts(at("OUTPUT"))).toEqual([{ kind: "in", port: 0 }]);
  });
});

describe("smartStartPort", () => {
  it("arms the output first when it isn't driving anything", () => {
    expect(smartStartPort(at("AND"), NONE, false)).toEqual({ kind: "out", port: 0 });
  });
  it("arms the first free input once the output is already driving a wire", () => {
    expect(smartStartPort(at("AND"), NONE, true)).toEqual({ kind: "in", port: 0 });
    expect(smartStartPort(at("AND"), { n: { 0: true } }, true)).toEqual({ kind: "in", port: 1 });
  });
  it("OUTPUT always starts on its single input", () => {
    expect(smartStartPort(at("OUTPUT"), NONE, false)).toEqual({ kind: "in", port: 0 });
  });
});

describe("nextCyclePort", () => {
  it("walks output -> in0 -> in1 -> output", () => {
    const n = at("AND");
    expect(nextCyclePort(n, { kind: "out", port: 0 })).toEqual({ kind: "in", port: 0 });
    expect(nextCyclePort(n, { kind: "in", port: 0 })).toEqual({ kind: "in", port: 1 });
    expect(nextCyclePort(n, { kind: "in", port: 1 })).toEqual({ kind: "out", port: 0 });
  });
});

describe("bodyTargetPoint", () => {
  it("lands an incoming wire on the next free input", () => {
    expect(bodyTargetPoint(at("AND"), "in", NONE)).toEqual({ kind: "in", port: 0 });
    expect(bodyTargetPoint(at("AND"), "in", { n: { 0: true } })).toEqual({ kind: "in", port: 1 });
  });
  it("lands an outgoing-source request on the output", () => {
    expect(bodyTargetPoint(at("AND"), "out", NONE)).toEqual({ kind: "out", port: 0 });
  });
  it("rejects an input drop on a node with no inputs (INPUT)", () => {
    expect(bodyTargetPoint(at("INPUT"), "in", NONE)).toBeNull();
  });
  it("rejects an output drop on a node with no output (OUTPUT)", () => {
    expect(bodyTargetPoint(at("OUTPUT"), "out", NONE)).toBeNull();
  });
});
