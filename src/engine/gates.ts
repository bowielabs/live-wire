import type { GateType } from "../types";

/* ---- gate definitions (IEC 60617 rectangular notation) ---- */
export interface GateDef {
  inputs: number;
  sym?: string;
  name?: string;
  neg?: boolean;
  fam?: string;
  fn?: (...args: boolean[]) => boolean;
}

export const GATES: Record<GateType, GateDef> = {
  INPUT: { inputs: 0 },
  OUTPUT: { inputs: 1 },
  NOT: { inputs: 1, sym: "1", name: "NOT", neg: true, fam: "#f4b03f", fn: (a) => !a },
  AND: { inputs: 2, sym: "&", name: "AND", fam: "#3fd6e0", fn: (a, b) => a && b },
  OR: { inputs: 2, sym: "≥1", name: "OR", fam: "#9d8bf2", fn: (a, b) => a || b },
  XOR: { inputs: 2, sym: "=1", name: "XOR", fam: "#f278b0", fn: (a, b) => a !== b },
  NAND: { inputs: 2, sym: "&", name: "NAND", neg: true, fam: "#3fd6e0", fn: (a, b) => !(a && b) },
  NOR: { inputs: 2, sym: "≥1", name: "NOR", neg: true, fam: "#9d8bf2", fn: (a, b) => !(a || b) },
  XNOR: { inputs: 2, sym: "=1", name: "XNOR", neg: true, fam: "#f278b0", fn: (a, b) => a === b },
};

export const ALL_GATES: GateType[] = ["NOT", "AND", "OR", "XOR", "NAND", "NOR", "XNOR"];

/* count of truthy values — used by many target functions */
export const cnt = (...xs: boolean[]): number => xs.reduce((s, x) => s + (x ? 1 : 0), 0);

/* read a list of bits (MSB first) as an integer */
export const num = (...bits: boolean[]): number => bits.reduce((v, b) => v * 2 + (b ? 1 : 0), 0);
