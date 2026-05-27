import { describe, expect, it } from "vitest";
import { ALL_GATES, cnt, GATES, num } from "./gates";

const T = true;
const F = false;

describe("gate truth tables", () => {
  it("NOT inverts", () => {
    expect(GATES.NOT.fn!(F)).toBe(true);
    expect(GATES.NOT.fn!(T)).toBe(false);
  });

  // [a, b, AND, OR, XOR, NAND, NOR, XNOR]
  const rows: [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean][] = [
    [F, F, F, F, F, T, T, T],
    [F, T, F, T, T, T, F, F],
    [T, F, F, T, T, T, F, F],
    [T, T, T, T, F, F, F, T],
  ];

  it.each(rows)("a=%s b=%s yields the expected outputs", (a, b, and, or, xor, nand, nor, xnor) => {
    expect(GATES.AND.fn!(a, b)).toBe(and);
    expect(GATES.OR.fn!(a, b)).toBe(or);
    expect(GATES.XOR.fn!(a, b)).toBe(xor);
    expect(GATES.NAND.fn!(a, b)).toBe(nand);
    expect(GATES.NOR.fn!(a, b)).toBe(nor);
    expect(GATES.XNOR.fn!(a, b)).toBe(xnor);
  });

  it("INPUT and OUTPUT have no fn", () => {
    expect(GATES.INPUT.fn).toBeUndefined();
    expect(GATES.OUTPUT.fn).toBeUndefined();
  });

  it("ALL_GATES lists every functional gate and no IO pseudo-gates", () => {
    expect(ALL_GATES).toEqual(["NOT", "AND", "OR", "XOR", "NAND", "NOR", "XNOR"]);
    expect(ALL_GATES).not.toContain("INPUT");
    expect(ALL_GATES).not.toContain("OUTPUT");
  });
});

describe("helpers", () => {
  it("cnt counts truthy values", () => {
    expect(cnt()).toBe(0);
    expect(cnt(F, F, F)).toBe(0);
    expect(cnt(T, F, T)).toBe(2);
    expect(cnt(T, T, T, T)).toBe(4);
  });

  it("num reads bits MSB-first as an integer", () => {
    expect(num(F, F)).toBe(0);
    expect(num(F, T)).toBe(1);
    expect(num(T, F)).toBe(2);
    expect(num(T, T)).toBe(3);
    expect(num(T, F, T)).toBe(5);
  });
});
