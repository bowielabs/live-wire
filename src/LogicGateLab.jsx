import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";

/* Persistence: prefer the artifact runtime's window.storage if present,
   otherwise fall back to localStorage. Both expose the same async
   get(key) -> { value } / set(key, value) shape the app below expects. */
const STORE =
  typeof window === "undefined"
    ? null
    : window.storage ||
      (window.localStorage
        ? {
            get: async (k) => {
              const v = window.localStorage.getItem(k);
              return v == null ? null : { value: v };
            },
            set: async (k, v) => {
              window.localStorage.setItem(k, v);
            },
          }
        : null);
const SAVE_KEY = "lglab:progress:v1";

/* ============================================================
   LOGIC GATE LAB
   A discrete-mathematics circuit puzzle. Wire IEC logic gates
   to satisfy a target Boolean function / truth table.
   ============================================================ */

const VBW = 940;
const VBH = 560;

/* ---- palette ---- */
const C = {
  bg: "#070b15",
  canvas: "#0c1322",
  panel: "#111a2e",
  panel2: "#0e1626",
  border: "#243353",
  borderHi: "#33476f",
  text: "#dde6f7",
  muted: "#8294b6",
  faint: "#5d6e92",
  accent: "#3fe0c5",
  on: "#37e08b",
  off: "#34456b",
  nul: "#5b4f78",
  warn: "#f4a64d",
  bad: "#f2607a",
};

/* ---- gate definitions (IEC 60617 rectangular notation) ---- */
const GATES = {
  INPUT: { inputs: 0 },
  OUTPUT: { inputs: 1 },
  NOT: { inputs: 1, sym: "1", name: "NOT", neg: true, fam: "#f4b03f", fn: (a) => !a },
  AND: { inputs: 2, sym: "&", name: "AND", fam: "#3fd6e0", fn: (a, b) => a && b },
  OR: { inputs: 2, sym: "\u22651", name: "OR", fam: "#9d8bf2", fn: (a, b) => a || b },
  XOR: { inputs: 2, sym: "=1", name: "XOR", fam: "#f278b0", fn: (a, b) => a !== b },
  NAND: { inputs: 2, sym: "&", name: "NAND", neg: true, fam: "#3fd6e0", fn: (a, b) => !(a && b) },
  NOR: { inputs: 2, sym: "\u22651", name: "NOR", neg: true, fam: "#9d8bf2", fn: (a, b) => !(a || b) },
  XNOR: { inputs: 2, sym: "=1", name: "XNOR", neg: true, fam: "#f278b0", fn: (a, b) => a === b },
};
const ALL_GATES = ["NOT", "AND", "OR", "XOR", "NAND", "NOR", "XNOR"];

/* count of truthy values — used by many target functions */
const cnt = (...xs) => xs.reduce((s, x) => s + (x ? 1 : 0), 0);
/* read a list of bits (MSB first) as an integer */
const num = (...bits) => bits.reduce((v, b) => v * 2 + (b ? 1 : 0), 0);

/* ---- worlds (chapters) ---- */
const WORLDS = [
  { id: 1, name: "Boot Up", tag: "Meet the seven gates", color: "#3fe0c5" },
  { id: 2, name: "Real Life Mode", tag: "Logic in everyday decisions", color: "#5fd3f0" },
  { id: 3, name: "De Morgan's Hacks", tag: "Boolean-algebra shortcuts", color: "#9d8bf2" },
  { id: 4, name: "NAND Universe", tag: "One gate to rule them all", color: "#3fd6e0" },
  { id: 5, name: "NOR Universe", tag: "The other universal gate", color: "#7e9bf5" },
  { id: 6, name: "Math Engine", tag: "How computers actually add", color: "#f4b03f" },
  { id: 7, name: "Data Router", tag: "Multiplexers & decoders", color: "#f278b0" },
  { id: 8, name: "Glitch Hunter", tag: "Error detection & parity", color: "#f2607a" },
  { id: 9, name: "Brain Melt", tag: "Four-input challenges", color: "#e08f3f" },
  { id: 10, name: "Final Boss", tag: "Optimisation & mastery", color: "#f4a64d" },
];

/* ---- 100 levels ---- */
const L = (w, name, goal, par, inputs, palette, concept, target, irl) => ({
  w, name, goal, par, inputs, palette, concept, target, irl,
});
const LEVELS = [
  /* ===== WORLD 1 — Boot Up ===== */
  L(1, "Plot Twist", "Q = ¬A", 1, ["A"], ["NOT"],
    "Every signal that walks in walks out backwards. Meet the inverter — the most basic move in all of logic. One input, one gate: flip it.",
    (a) => !a,
    "Burglar alarms run on inverters: 'door NOT closed' is what trips the siren."),
  L(1, "Squad Goals", "Q = A ∧ B", 1, ["A", "B"], ["AND"],
    "The party only happens if BOTH friends are in. One flake and it's cancelled. That's AND — true only when everything is true.",
    (a, b) => a && b,
    "A microwave runs only if the door is shut AND the timer is set."),
  L(1, "Backup Plan", "Q = A ∨ B", 1, ["A", "B"], ["OR"],
    "Pizza or tacos — you're happy either way, and thrilled if both show up. OR just needs one yes.",
    (a, b) => a || b,
    "A car alarm trips if a door OR a window is forced open."),
  L(1, "Can't Have Both", "Q = A ⊕ B", 1, ["A", "B"], ["XOR"],
    "Window seat or aisle seat — pick exactly one. XOR is true only when the two inputs disagree.",
    (a, b) => a !== b,
    "A hallway light wired to two switches: flip either one and it toggles."),
  L(1, "The Buzzkill", "Q = ¬(A ∧ B)", 1, ["A", "B"], ["NAND"],
    "NAND is AND's grumpy twin: it says NO only when everything says YES. Looks useless... it secretly runs every computer on Earth.",
    (a, b) => !(a && b),
    "NAND flash — the memory chip in your phone and SSD — is literally named after this gate."),
  L(1, "Total Silence", "Q = ¬(A ∨ B)", 1, ["A", "B"], ["NOR"],
    "NOR lights up only when absolutely nothing is happening. The peace-and-quiet gate.",
    (a, b) => !(a || b),
    "A 'system idle' light: on only when no process is running."),
  L(1, "Perfect Match", "Q = A ≡ B", 1, ["A", "B"], ["XNOR"],
    "XNOR is the agreement detector — it glows when both inputs are the same. The soulmate gate.",
    (a, b) => a === b,
    "Checking that two copies of a password digit are identical."),
  L(1, "Double Negative", "Q = A", 2, ["A"], ["NOT"],
    "Flip it, then flip it back. Two NOT gates cancel out — living proof that ¬¬A = A.",
    (a) => a,
    "Signal buffers in long cables invert twice to clean the signal up."),
  L(1, "DIY NAND", "Q = ¬(A ∧ B)", 2, ["A", "B"], ["AND", "NOT"],
    "You've met NAND — now build it yourself: an AND gate with a NOT stuck on the end. Congrats, you're an engineer.",
    (a, b) => !(a && b)),
  L(1, "DIY NOR", "Q = ¬(A ∨ B)", 2, ["A", "B"], ["OR", "NOT"],
    "Same energy: OR plus NOT equals NOR. See the pattern — a NOT on the output negates anything.",
    (a, b) => !(a || b)),

  /* ===== WORLD 2 — Real Life Mode ===== */
  L(2, "House Rules", "Q = HW ∧ ¬SN", 2, ["HW", "SN"], ["AND", "NOT"],
    "Phone time is granted only if HomeWork is done AND it's NOT a School Night. Turn the house rule into a circuit.",
    (hw, sn) => hw && !sn,
    "This is exactly how parental-control screen timers decide access."),
  L(2, "All Systems Go", "Q = A ∧ B ∧ C", 2, ["A", "B", "C"], ["AND"],
    "Sleepover approved only if it's the weekend AND your room's clean AND chores are done. Everything has to line up.",
    (a, b, c) => a && b && c,
    "A rocket launch hold-check: every system must report 'go'."),
  L(2, "Any Excuse", "Q = A ∨ B ∨ C", 2, ["A", "B", "C"], ["OR"],
    "Skip practice if you're Sick OR there's a Family thing OR a storm's Coming. Any one excuse works.",
    (a, b, c) => a || b || c),
  L(2, "The Deal", "Q = P → Z", 2, ["P", "Z"], ["NOT", "OR"],
    "'If I Pass the test, you owe me piZZa.' The promise is kept unless you passed and got nothing. This is implication: P → Z equals ¬P ∨ Z.",
    (p, z) => !p || z,
    "Warranties: 'if it breaks, we replace it' — broken only if it failed AND wasn't replaced."),
  L(2, "Curfew", "Q = ¬(O ∧ L)", 2, ["O", "L"], ["AND", "NOT"],
    "You're fine UNLESS you're Out AND it's Late. Build the 'busted' detector, then invert it for 'all clear'.",
    (o, l) => !(o && l)),
  L(2, "Group Vote", "Q = majority(A,B,C)", 4, ["A", "B", "C"], ["AND", "OR"],
    "Three friends pick the movie. Majority rules — at least two have to agree.",
    (a, b, c) => cnt(a, b, c) >= 2,
    "Online polls and jury verdicts both run on majority logic."),
  L(2, "Veto Power", "Q = A ∧ ¬B", 2, ["A", "B"], ["AND", "NOT"],
    "The plan goes ahead if A wants it AND B doesn't veto it. A single objection kills it.",
    (a, b) => a && !b),
  L(2, "Mixed Signals", "Q = A ⊕ B", 5, ["A", "B"], ["AND", "OR", "NOT"],
    "Build XOR from scratch with only AND, OR and NOT. XOR means 'they disagree' — it's hiding inside (A∧¬B) ∨ (¬A∧B).",
    (a, b) => a !== b),
  L(2, "Smart Light", "Q = D ∧ (M ∨ S)", 2, ["D", "M", "S"], ["AND", "OR"],
    "A motion light turns on when it's Dark AND (there's Motion OR the Switch is on).",
    (d, m, s) => d && (m || s),
    "Literally how motion-sensor porch lights are wired."),
  L(2, "Air Conditioner", "Q = H ∧ P ∧ ¬W", 3, ["H", "P", "W"], ["AND", "NOT"],
    "The AC runs only if it's Hot AND the Power's on AND a Window is NOT open.",
    (h, p, w) => h && p && !w,
    "Smart thermostats refuse to cool a room with an open window."),

  /* ===== WORLD 3 — De Morgan's Hacks ===== */
  L(3, "De Morgan #1", "Q = ¬A ∨ ¬B", 3, ["A", "B"], ["NOT", "OR"],
    "Secret identity: ¬(A∧B) equals ¬A∨¬B. Build the right-hand side and watch it behave exactly like NAND.",
    (a, b) => !(a && b),
    "Compilers use De Morgan's laws to optimise the 'if' statements in your code."),
  L(3, "De Morgan #2", "Q = ¬A ∧ ¬B", 3, ["A", "B"], ["NOT", "AND"],
    "The mirror image: ¬(A∨B) = ¬A∧¬B. Negate the inputs, swap the operator. That's the whole trick.",
    (a, b) => !(a || b)),
  L(3, "Absorption", "Q = A ∨ (A ∧ B)", 2, ["A", "B"], ["AND", "OR"],
    "Boolean algebra says A∨(A∧B) = A — the B gets absorbed and never matters. Build it and prove B is dead weight.",
    (a) => a),
  L(3, "Idempotence", "Q = A ∧ A", 1, ["A"], ["AND"],
    "Feed a signal into an AND gate with itself: A∧A = A. Identical twins change nothing.",
    (a) => a),
  L(3, "Distribution", "Q = A ∧ (B ∨ C)", 3, ["A", "B", "C"], ["AND", "OR"],
    "The distributive law: A∧(B∨C) = (A∧B)∨(A∧C). Build either side — same truth table, your choice.",
    (a, b, c) => a && (b || c)),
  L(3, "XOR, Rebuilt", "Q = A ⊕ B", 4, ["A", "B"], ["AND", "OR", "NOT"],
    "Another road to XOR: (A∨B) ∧ ¬(A∧B) — 'at least one, but not both'. Four gates if you're slick.",
    (a, b) => a !== b),
  L(3, "XNOR Express", "Q = A ≡ B", 2, ["A", "B"], ["XOR", "NOT"],
    "XNOR is just XOR wearing a NOT. Two gates. Boolean algebra rewards the lazy.",
    (a, b) => a === b),
  L(3, "Triple Flip", "Q = ¬A", 3, ["A"], ["NOT"],
    "Three NOT gates in a row. ¬¬¬A = ¬A. It's the parity of the flips that matters, not the count.",
    (a) => !a),
  L(3, "Parity Trio", "Q = A ⊕ B ⊕ C", 2, ["A", "B", "C"], ["XOR"],
    "Chain XORs together: the output is 1 when an ODD number of inputs are 1. This is 'parity' — remember it.",
    (a, b, c) => cnt(a, b, c) % 2 === 1,
    "Parity is the simplest error-check in data storage."),
  L(3, "Logic Gym: Finals", "Q = majority(A,B,C)", 4, ["A", "B", "C"], ["AND", "OR", "NOT"],
    "World 3 boss. Rebuild the majority voter and try to beat par. You've got every basic tool — show off.",
    (a, b, c) => cnt(a, b, c) >= 2),

  /* ===== WORLD 4 — NAND Universe ===== */
  L(4, "NAND = NOT", "Q = ¬A", 1, ["A"], ["NAND"],
    "Tie both inputs of a NAND together. ¬(A∧A) = ¬A. You just built an inverter from a NAND.",
    (a) => !a),
  L(4, "NAND = AND", "Q = A ∧ B", 2, ["A", "B"], ["NAND"],
    "NAND, then NAND-as-NOT. Negate a negative and you're back to AND. Two gates.",
    (a, b) => a && b),
  L(4, "NAND = OR", "Q = A ∨ B", 3, ["A", "B"], ["NAND"],
    "De Morgan strikes: A∨B = ¬(¬A∧¬B). Invert both inputs with NANDs, then NAND them together.",
    (a, b) => a || b),
  L(4, "NAND = NOR", "Q = ¬(A ∨ B)", 4, ["A", "B"], ["NAND"],
    "Build OR from NANDs, then flip it. Four NANDs make one NOR. The universe bows.",
    (a, b) => !(a || b)),
  L(4, "NAND = XOR", "Q = A ⊕ B", 4, ["A", "B"], ["NAND"],
    "The legendary four-NAND XOR — a rite of passage for every logic student. Wire it and join the club.",
    (a, b) => a !== b),
  L(4, "NAND = XNOR", "Q = A ≡ B", 5, ["A", "B"], ["NAND"],
    "XOR from four NANDs, plus one more as an inverter. Five gates to detect agreement.",
    (a, b) => a === b),
  L(4, "NAND If-Then", "Q = A → B", 2, ["A", "B"], ["NAND"],
    "A→B equals ¬(A∧¬B), which is literally NAND(A, ¬B). Two NANDs build 'if-then'.",
    (a, b) => !a || b),
  L(4, "NAND Voter", "Q = majority(A,B,C)", 6, ["A", "B", "C"], ["NAND"],
    "Majority rule, NANDs only. This is how real chip designers think — one gate type, infinite functions.",
    (a, b, c) => cnt(a, b, c) >= 2),
  L(4, "NAND Switch", "Q = S ? B : A", 4, ["A", "B", "S"], ["NAND"],
    "A 2-to-1 multiplexer from four NANDs: S=0 passes A, S=1 passes B.",
    (a, b, s) => (s ? b : a),
    "Multiplexers route data inside every CPU, billions of times a second."),
  L(4, "NAND Boss", "Q = A ⊕ B ⊕ C", 9, ["A", "B", "C"], ["NAND"],
    "World 4 boss: 3-input parity, NANDs only — the sum bit of a full adder. Survive this and NAND is yours.",
    (a, b, c) => cnt(a, b, c) % 2 === 1),

  /* ===== WORLD 5 — NOR Universe ===== */
  L(5, "NOR = NOT", "Q = ¬A", 1, ["A"], ["NOR"],
    "Same trick, other gate. Tie a NOR's inputs together: ¬(A∨A) = ¬A.",
    (a) => !a),
  L(5, "NOR = OR", "Q = A ∨ B", 2, ["A", "B"], ["NOR"],
    "NOR, then invert. Double negation rebuilds OR. Two gates.",
    (a, b) => a || b),
  L(5, "NOR = AND", "Q = A ∧ B", 3, ["A", "B"], ["NOR"],
    "De Morgan again: A∧B = ¬(¬A∨¬B). Invert both, then NOR. Three gates.",
    (a, b) => a && b),
  L(5, "NOR = NAND", "Q = ¬(A ∧ B)", 4, ["A", "B"], ["NOR"],
    "Build AND from NORs, then flip it. NOR is every bit as universal as NAND.",
    (a, b) => !(a && b)),
  L(5, "NOR = XOR", "Q = A ⊕ B", 5, ["A", "B"], ["NOR"],
    "The five-NOR XOR — NOR's answer to the famous four-NAND classic.",
    (a, b) => a !== b),
  L(5, "NOR = XNOR", "Q = A ≡ B", 4, ["A", "B"], ["NOR"],
    "The agreement detector, NORs only.",
    (a, b) => a === b),
  L(5, "NOR If-Then", "Q = A → B", 3, ["A", "B"], ["NOR"],
    "'If-then' from NOR gates alone. A→B, no other gate allowed.",
    (a, b) => !a || b),
  L(5, "NOR Voter", "Q = majority(A,B,C)", 6, ["A", "B", "C"], ["NOR"],
    "Majority rule, NOR edition.",
    (a, b, c) => cnt(a, b, c) >= 2),
  L(5, "NOR Switch", "Q = S ? B : A", 5, ["A", "B", "S"], ["NOR"],
    "The multiplexer returns — built entirely from NORs this time.",
    (a, b, s) => (s ? b : a)),
  L(5, "NOR Boss", "Q = 1 if A = B = C", 7, ["A", "B", "C"], ["NOR"],
    "World 5 boss: output 1 only when all three inputs match (all 0s or all 1s). NORs only.",
    (a, b, c) => a === b && b === c,
    "Triple-redundant flight computers check that all three copies agree."),

  /* ===== WORLD 6 — Math Engine ===== */
  L(6, "Half Adder: Sum", "Q = A ⊕ B", 1, ["A", "B"], ["XOR"],
    "Add two single bits. 0+0=0, 1+0=1, 1+1=10 — the SUM bit is XOR. You are now building arithmetic.",
    (a, b) => a !== b,
    "Every addition your computer performs begins right here."),
  L(6, "Half Adder: Carry", "Q = A ∧ B", 1, ["A", "B"], ["AND"],
    "1+1 = 10 in binary, and that leading 1 is the CARRY. It appears only when both bits are 1 — pure AND.",
    (a, b) => a && b,
    "'Carry the one' — but rendered in silicon."),
  L(6, "Full Adder: Sum", "Q = A ⊕ B ⊕ Ci", 2, ["A", "B", "Ci"], ["XOR"],
    "Now add three bits: two digits plus a Carry-in. The sum bit is the parity of all three.",
    (a, b, c) => cnt(a, b, c) % 2 === 1),
  L(6, "Full Adder: Carry", "Q = majority(A,B,Ci)", 4, ["A", "B", "Ci"], ["AND", "OR"],
    "The carry-OUT is 1 when at least two of the three bits are 1. Majority logic, doing real math.",
    (a, b, c) => cnt(a, b, c) >= 2,
    "Chain these full adders and you can add numbers of any size."),
  L(6, "Same Number?", "Q = A ≡ B", 1, ["A", "B"], ["XNOR"],
    "The 1-bit equality test: are these two numbers identical? XNOR says yes.",
    (a, b) => a === b),
  L(6, "Who's Higher?", "Q = A > B", 2, ["A", "B"], ["AND", "NOT"],
    "1-bit 'greater than': A beats B only when A=1 and B=0.",
    (a, b) => a && !b,
    "High-score comparisons start exactly like this."),
  L(6, "Number Match", "Q = (A1≡B1) ∧ (A0≡B0)", 3, ["A1", "A0", "B1", "B0"], ["XNOR", "AND"],
    "Two 2-bit numbers are equal only if BOTH bit-pairs match.",
    (a1, a0, b1, b0) => a1 === b1 && a0 === b0,
    "A digital comparator — used to check IDs, PINs and serial numbers."),
  L(6, "Bigger Number", "Q = 1 if A > B (2-bit)", 6, ["A1", "A0", "B1", "B0"], ["AND", "OR", "NOT", "XNOR"],
    "Compare two 2-bit numbers (0–3). Output 1 when A is strictly bigger: check the high bit, then break ties with the low bit.",
    (a1, a0, b1, b0) => num(a1, a0) > num(b1, b0)),
  L(6, "Parity Generator", "Q = A⊕B⊕C⊕D", 3, ["A", "B", "C", "D"], ["XOR"],
    "Before sending 4 data bits you compute one parity bit so the receiver can catch errors. It's the XOR of everything.",
    (a, b, c, d) => cnt(a, b, c, d) % 2 === 1,
    "RAID hard drives and network packets ship parity bits constantly."),
  L(6, "Adder Boss: Overflow", "Q = carry-out of A+B", 6, ["A1", "A0", "B1", "B0"], ["AND", "OR", "XOR"],
    "Add two 2-bit numbers. If the result needs a 3rd bit, that's OVERFLOW — output the final carry.",
    (a1, a0, b1, b0) => {
      const c0 = a0 && b0;
      return (a1 && b1) || ((a1 !== b1) && c0);
    },
    "An unchecked overflow bug destroyed the Ariane 5 rocket in 1996."),

  /* ===== WORLD 7 — Data Router ===== */
  L(7, "The Switch", "Q = S ? B : A", 4, ["A", "B", "S"], ["AND", "OR", "NOT"],
    "A 2-to-1 multiplexer: the Select line picks which input reaches the output. The remote control of logic.",
    (a, b, s) => (s ? b : a),
    "Streaming apps mux between video feeds with exactly this circuit."),
  L(7, "Enable Gate", "Q = A ∧ EN", 1, ["A", "EN"], ["AND"],
    "Data A passes through only when ENable is on — otherwise it's blocked. The literal meaning of a 'gate'.",
    (a, en) => a && en,
    "Chip-enable pins on real hardware work precisely this way."),
  L(7, "Address 0", "Q = ¬A1 ∧ ¬A0", 3, ["A1", "A0"], ["NOT", "AND"],
    "A decoder lights up one line per address. This output fires only for address 00.",
    (a1, a0) => !a1 && !a0,
    "This is how your CPU locates the right byte in memory."),
  L(7, "Address 3", "Q = A1 ∧ A0", 1, ["A1", "A0"], ["AND"],
    "Same decoder, the 11 line — fires only at the highest address.",
    (a1, a0) => a1 && a0),
  L(7, "Address 1", "Q = ¬A1 ∧ A0", 2, ["A1", "A0"], ["NOT", "AND"],
    "The 01 line. Each decoder output is a unique AND of the address bits, some of them inverted.",
    (a1, a0) => !a1 && a0),
  L(7, "Gated Switch", "Q = EN ∧ (S ? B : A)", 5, ["A", "B", "S", "EN"], ["AND", "OR", "NOT"],
    "A multiplexer with an enable: route A or B, but only when ENable is on. Otherwise the output is dead.",
    (a, b, s, en) => en && (s ? b : a)),
  L(7, "Thermostat", "Q = (C ∧ EN) ∨ OV", 2, ["C", "EN", "OV"], ["AND", "OR"],
    "The heater runs when it's Cold AND the system's ENabled — OR whenever someone hits the OVerride.",
    (c, en, ov) => (c && en) || ov,
    "Smart thermostats are basically this exact circuit."),
  L(7, "Elevator Doors", "Q = AF ∧ ¬MV ∧ (CB ∨ OB)", 4, ["AF", "MV", "CB", "OB"], ["AND", "OR", "NOT"],
    "Doors open if the car is At a Floor, NOT MoVing, and someone pressed the Call or Open Button.",
    (af, mv, cb, ob) => af && !mv && (cb || ob),
    "Real elevator controllers run safety logic just like this."),
  L(7, "Traffic Sensor", "Q = W ∧ (MC ∨ T)", 2, ["W", "MC", "T"], ["AND", "OR"],
    "The side road gets a green light when a car is Waiting AND (the Main road is Clear OR the Timer expired).",
    (w, mc, t) => w && (mc || t),
    "Smart intersections sense and prioritise traffic exactly like this."),
  L(7, "Router Boss", "Q = S ? B : A (NAND only)", 4, ["A", "B", "S"], ["NAND"],
    "World 7 boss: build the multiplexer again — NANDs only. Four gates, pure routing.",
    (a, b, s) => (s ? b : a)),

  /* ===== WORLD 8 — Glitch Hunter ===== */
  L(8, "Parity Check", "Q = A ⊕ B ⊕ C", 2, ["A", "B", "C"], ["XOR"],
    "Output 1 when an ODD number of bits are set. If a stored parity bit ever disagrees with this, you've caught a glitch.",
    (a, b, c) => cnt(a, b, c) % 2 === 1,
    "The original error-detection trick — still inside your RAM today."),
  L(8, "Mismatch!", "Q = A ⊕ B", 1, ["A", "B"], ["XOR"],
    "Compare two copies of a bit. If they differ, something corrupted one of them. XOR = 'they don't match'.",
    (a, b) => a !== b),
  L(8, "Glitch Alarm", "Q = A⊕B⊕C⊕D", 3, ["A", "B", "C", "D"], ["XOR"],
    "Four-bit parity. The alarm sounds when an odd number of bits have flipped.",
    (a, b, c, d) => cnt(a, b, c, d) % 2 === 1),
  L(8, "Sensor Voting", "Q = majority(A,B,C)", 4, ["A", "B", "C"], ["AND", "OR"],
    "Three sensors, one might be lying. Trust the majority — output whatever 2-of-3 agree on.",
    (a, b, c) => cnt(a, b, c) >= 2,
    "Spacecraft use triple-redundant sensors and vote on the result."),
  L(8, "Fault Found", "Q = exactly one of A,B,C", 4, ["A", "B", "C"], ["XOR", "AND", "NOT"],
    "Output 1 when EXACTLY one input is high — a single isolated fault. Hint: parity fires for 1 or 3, so subtract the all-three case.",
    (a, b, c) => cnt(a, b, c) === 1),
  L(8, "Double Fault", "Q = exactly two of A,B,C", 6, ["A", "B", "C"], ["AND", "OR", "NOT"],
    "Now detect EXACTLY two faults — not one, not three. That's majority minus the all-three case.",
    (a, b, c) => cnt(a, b, c) === 2),
  L(8, "All Clear", "Q = 1 if A = B = C = D", 7, ["A", "B", "C", "D"], ["AND", "OR", "NOT"],
    "Four backup systems should read identically. Output 1 only when all four agree (all on or all off).",
    (a, b, c, d) => a === b && b === c && c === d),
  L(8, "Checksum Mismatch", "Q = 1 if A ≠ B (2-bit)", 3, ["A1", "A0", "B1", "B0"], ["XOR", "OR"],
    "Two 2-bit values arrive. Raise the flag if they DON'T match — a sign of corrupted transmission.",
    (a1, a0, b1, b0) => a1 !== b1 || a0 !== b0),
  L(8, "Stuck Bit", "Q = 1 if A,B,C differ", 3, ["A", "B", "C"], ["XOR", "OR"],
    "Three lines that should all be identical. Flag it the moment even one is stuck at the wrong value.",
    (a, b, c) => !(a === b && b === c)),
  L(8, "Glitch Boss", "Q = A⊕B⊕C (NAND only)", 8, ["A", "B", "C"], ["NAND"],
    "World 8 boss: build a 3-bit parity checker using NANDs only. Error detection, the hard way.",
    (a, b, c) => cnt(a, b, c) % 2 === 1),

  /* ===== WORLD 9 — Brain Melt ===== */
  L(9, "The Full House", "Q = A∧B∧C∧D", 3, ["A", "B", "C", "D"], ["AND"],
    "Four inputs, every single one must be 1. Chain your AND gates.",
    (a, b, c, d) => a && b && c && d),
  L(9, "Any Spark", "Q = A∨B∨C∨D", 3, ["A", "B", "C", "D"], ["OR"],
    "Four inputs — a single 1 anywhere lights it up.",
    (a, b, c, d) => a || b || c || d),
  L(9, "Three's Enough", "Q = 1 if ≥ 3 of 4", 7, ["A", "B", "C", "D"], ["AND", "OR"],
    "Output 1 when at least three of the four inputs are high. Sum up every trio of ANDs.",
    (a, b, c, d) => cnt(a, b, c, d) >= 3),
  L(9, "Odd Squad", "Q = A⊕B⊕C⊕D", 3, ["A", "B", "C", "D"], ["XOR"],
    "4-bit parity: true whenever an odd count of inputs is 1.",
    (a, b, c, d) => cnt(a, b, c, d) % 2 === 1),
  L(9, "Even Steven", "Q = 1 if even # of 1s", 4, ["A", "B", "C", "D"], ["XOR", "NOT"],
    "Flip the parity: output 1 when an EVEN number of inputs are high (zero counts as even).",
    (a, b, c, d) => cnt(a, b, c, d) % 2 === 0),
  L(9, "At Least Equal", "Q = 1 if A ≥ B (2-bit)", 6, ["A1", "A0", "B1", "B0"], ["AND", "OR", "NOT", "XNOR"],
    "Compare two 2-bit numbers; output 1 when A is greater than OR equal to B.",
    (a1, a0, b1, b0) => num(a1, a0) >= num(b1, b0)),
  L(9, "Bad Code", "Q = 1 if BCD invalid", 2, ["B3", "B2", "B1", "B0"], ["AND", "OR"],
    "A 4-bit code should only represent digits 0–9. Codes 10–15 are illegal — detect them.",
    (b3, b2, b1, b0) => b3 && (b2 || b1),
    "BCD validity checks guard digital clocks and calculators."),
  L(9, "Display Driver", "Q = top segment of digit", 6, ["B3", "B2", "B1", "B0"], ["AND", "OR", "NOT"],
    "A 7-segment display shows digits 0–9. The top bar lights for every digit EXCEPT 1 and 4. Build that one segment.",
    (b3, b2, b1, b0) => {
      const n = num(b3, b2, b1, b0);
      return n <= 9 && n !== 1 && n !== 4;
    },
    "Real hardware — this logic drives digital clock and microwave displays."),
  L(9, "Keypad Lock", "Q = 1 only for code 1011", 4, ["K3", "K2", "K1", "K0"], ["AND", "NOT"],
    "The door unlocks for exactly one 4-bit combination: 1011. Every other code stays locked.",
    (k3, k2, k1, k0) => k3 && !k2 && k1 && k0,
    "Digital keypad locks decode your PIN with circuits like this."),
  L(9, "Brain Melt Boss", "Q = bit 1 of A × B", 3, ["A1", "A0", "B1", "B0"], ["AND", "XOR"],
    "You've built an adder — now a multiplier. Output bit 1 of the product A×B: (A1∧B0) ⊕ (A0∧B1).",
    (a1, a0, b1, b0) => (a1 && b0) !== (a0 && b1)),

  /* ===== WORLD 10 — Final Boss ===== */
  L(10, "Speedrun: XOR", "Q = A⊕B in ≤ 4 gates", 4, ["A", "B"], ["AND", "OR", "NOT"],
    "You know XOR. Now build it in four gates flat — (A∨B) ∧ ¬(A∧B). Optimisation is the real game.",
    (a, b) => a !== b),
  L(10, "Speedrun: NAND-AND", "Q = A∧B (NAND only)", 2, ["A", "B"], ["NAND"],
    "Two NANDs make an AND. No wasted moves.",
    (a, b) => a && b),
  L(10, "Speedrun: NAND-XOR", "Q = A⊕B (NAND only)", 4, ["A", "B"], ["NAND"],
    "The four-NAND XOR — hit par exactly. This is the benchmark every logic designer memorises.",
    (a, b) => a !== b),
  L(10, "Voter, NAND Edition", "Q = majority (NAND only)", 6, ["A", "B", "C"], ["NAND"],
    "Majority logic, NANDs only, tight par. The carry circuit of every processor.",
    (a, b, c) => cnt(a, b, c) >= 2),
  L(10, "Mux Master", "Q = S?B:A (NAND only)", 4, ["A", "B", "S"], ["NAND"],
    "The definitive four-NAND multiplexer. Build it clean.",
    (a, b, s) => (s ? b : a)),
  L(10, "Adder, NAND Only", "Q = A⊕B⊕Ci (NAND)", 9, ["A", "B", "Ci"], ["NAND"],
    "The full-adder sum bit, NANDs only. Real CPUs are vast oceans of exactly this.",
    (a, b, c) => cnt(a, b, c) % 2 === 1),
  L(10, "Carry, NOR Only", "Q = majority (NOR only)", 6, ["A", "B", "Ci"], ["NOR"],
    "The full-adder carry, NORs only. Both universal gates — mastered.",
    (a, b, c) => cnt(a, b, c) >= 2),
  L(10, "Parity Engine", "Q = A⊕B⊕C⊕D", 9, ["A", "B", "C", "D"], ["AND", "OR", "NOT"],
    "4-bit parity using only AND, OR and NOT — no XOR allowed. You'll build XOR three times over.",
    (a, b, c, d) => cnt(a, b, c, d) % 2 === 1),
  L(10, "The Comparator", "Q = A=B, 2-bit (NAND only)", 10, ["A1", "A0", "B1", "B0"], ["NAND"],
    "Equality of two 2-bit numbers — NANDs only. A genuine endurance test.",
    (a1, a0, b1, b0) => a1 === b1 && a0 === b0),
  L(10, "Grand Finale", "Q = overflow of A+B (NAND)", 12, ["A1", "A0", "B1", "B0"], ["NAND"],
    "The summit. Detect carry-out when adding two 2-bit numbers — NANDs only. Build an adder from the universal gate and take your crown.",
    (a1, a0, b1, b0) => {
      const c0 = a0 && b0;
      return (a1 && b1) || ((a1 !== b1) && c0);
    },
    "From a single gate type to working arithmetic — this is the foundation of every computer."),
];

const SANDBOX = {
  w: 0,
  name: "Sandbox",
  goal: "Free experimentation",
  concept:
    "No objective here — every gate is unlocked. Wire things up, toggle the inputs, and watch the signals propagate live.",
  inputs: ["A", "B", "C"],
  palette: ALL_GATES,
  par: 0,
  target: null,
};

/* ---- geometry ---- */
function nodeBox(t) {
  return t === "INPUT" || t === "OUTPUT" ? { w: 58, h: 44 } : { w: 76, h: 50 };
}
function portsOf(n) {
  const { w, h } = nodeBox(n.type);
  const def = GATES[n.type];
  let inputs = [];
  if (n.type === "OUTPUT") inputs = [{ x: n.x, y: n.y + h / 2, idx: 0 }];
  else if (def.inputs === 1) inputs = [{ x: n.x, y: n.y + h / 2, idx: 0 }];
  else if (def.inputs === 2)
    inputs = [
      { x: n.x, y: n.y + h * 0.3, idx: 0 },
      { x: n.x, y: n.y + h * 0.7, idx: 1 },
    ];
  const output = n.type === "OUTPUT" ? null : { x: n.x + w + 11, y: n.y + h / 2 };
  return { inputs, output, w, h };
}

/* ---- simulation: returns {nodeId -> bool|null} ---- */
function simulate(nodes, wires, inputMap) {
  const byId = {};
  nodes.forEach((n) => (byId[n.id] = n));
  const inWire = {};
  wires.forEach((w) => {
    inWire[w.to.node] = inWire[w.to.node] || {};
    inWire[w.to.node][w.to.port] = w;
  });
  const memo = {};
  const stack = {};
  function val(id) {
    if (id in memo) return memo[id];
    if (stack[id]) return null;
    stack[id] = true;
    const n = byId[id];
    let r;
    if (!n) r = null;
    else if (n.type === "INPUT") r = !!inputMap[id];
    else {
      const def = GATES[n.type];
      const ins = [];
      for (let i = 0; i < def.inputs; i++) {
        const w = inWire[id] && inWire[id][i];
        ins.push(w ? val(w.from.node) : null);
      }
      if (ins.some((v) => v === null || v === undefined)) r = null;
      else if (n.type === "OUTPUT") r = ins[0];
      else r = def.fn(...ins);
    }
    stack[id] = false;
    memo[id] = r;
    return r;
  }
  nodes.forEach((n) => val(n.id));
  return memo;
}
function makesCycle(wires) {
  const adj = {};
  wires.forEach((w) => (adj[w.from.node] = adj[w.from.node] || []).push(w.to.node));
  const state = {};
  let cyc = false;
  function dfs(u) {
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

/* ---- build a fresh board for a level ---- */
function buildBoard(def) {
  const ins = def.inputs;
  const n = ins.length;
  const nodes = [];
  ins.forEach((label, i) => {
    nodes.push({ id: "in" + i, type: "INPUT", label, x: 62, y: (VBH / (n + 1)) * (i + 1) - 22 });
  });
  nodes.push({ id: "out", type: "OUTPUT", label: "Q", x: 838, y: VBH / 2 - 22 });
  const inputValues = {};
  nodes.filter((nd) => nd.type === "INPUT").forEach((nd) => (inputValues[nd.id] = false));
  return { nodes, inputValues };
}

/* ---- wire path ---- */
function wirePath(x1, y1, x2, y2) {
  const dx = Math.max(38, Math.abs(x2 - x1) * 0.5);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}
const sigColor = (v) => (v === true ? C.on : v === false ? C.off : C.nul);

/* ============================================================
   GATE / NODE RENDER
   ============================================================ */
function GateNode({ node, value, ports, onBodyDown, onPort, onDelete, pending, liveInputs }) {
  const def = GATES[node.type];
  const { w, h } = nodeBox(node.type);
  const fam = def.fam;
  const lit = value === true;

  return (
    <g>
      {/* output stub + negation bubble */}
      <line x1={node.x + w} y1={node.y + h / 2} x2={node.x + w + 11} y2={node.y + h / 2}
        stroke={sigColor(value)} strokeWidth={2.4} />
      {def.neg && (
        <circle cx={node.x + w + 4} cy={node.y + h / 2} r={5}
          fill={C.canvas} stroke={fam} strokeWidth={1.8} />
      )}
      {/* body */}
      <rect
        x={node.x} y={node.y} width={w} height={h} rx={9}
        fill="#16223c" stroke={lit ? C.on : fam}
        strokeWidth={lit ? 2.2 : 1.5}
        onPointerDown={(e) => onBodyDown(e, node)}
        style={{ cursor: "grab", filter: lit ? "drop-shadow(0 0 5px rgba(55,224,139,.45))" : "none" }}
      />
      <rect x={node.x} y={node.y} width={w} height={7} rx={3.5} fill={fam} opacity={0.85}
        style={{ pointerEvents: "none" }} />
      <text x={node.x + w / 2} y={node.y + h * 0.56} textAnchor="middle"
        fontFamily="ui-monospace, Menlo, monospace" fontSize={20} fontWeight={700}
        fill={fam} style={{ pointerEvents: "none", userSelect: "none" }}>
        {def.sym}
      </text>
      <text x={node.x + w / 2} y={node.y + h - 7} textAnchor="middle"
        fontFamily="ui-monospace, Menlo, monospace" fontSize={9} letterSpacing={1}
        fill={C.muted} style={{ pointerEvents: "none", userSelect: "none" }}>
        {def.name}
      </text>
      {/* delete */}
      <g onPointerDown={(e) => { e.stopPropagation(); onDelete(node.id); }} style={{ cursor: "pointer" }}>
        <circle cx={node.x + w - 4} cy={node.y + 4} r={8} fill={C.panel} stroke={C.border} />
        <text x={node.x + w - 4} y={node.y + 7.5} textAnchor="middle" fontSize={11}
          fill={C.muted} style={{ pointerEvents: "none" }}>×</text>
      </g>
      {/* input ports */}
      {ports.inputs.map((p) => {
        const iv = liveInputs[p.idx];
        const sel = pending && pending.node === node.id && pending.kind === "in" && pending.port === p.idx;
        return (
          <g key={"i" + p.idx} onPointerDown={(e) => { e.stopPropagation(); onPort(e, node, "in", p.idx); }}
            style={{ cursor: "crosshair" }}>
            <circle cx={p.x} cy={p.y} r={10} fill="transparent" />
            <circle cx={p.x} cy={p.y} r={5.2} fill={sigColor(iv)}
              stroke={sel ? C.accent : "#0b1322"} strokeWidth={sel ? 2.4 : 1.5} />
          </g>
        );
      })}
      {/* output port */}
      {ports.output && (
        <g onPointerDown={(e) => { e.stopPropagation(); onPort(e, node, "out", 0); }}
          style={{ cursor: "crosshair" }}>
          <circle cx={ports.output.x} cy={ports.output.y} r={10} fill="transparent" />
          <circle cx={ports.output.x} cy={ports.output.y} r={5.2} fill={sigColor(value)}
            stroke={pending && pending.node === node.id && pending.kind === "out" ? C.accent : "#0b1322"}
            strokeWidth={pending && pending.node === node.id && pending.kind === "out" ? 2.4 : 1.5} />
        </g>
      )}
    </g>
  );
}

function IONode({ node, value, ports, onBodyDown, onPort, onToggle, pending }) {
  const { w, h } = nodeBox(node.type);
  const isIn = node.type === "INPUT";
  const on = value === true;
  return (
    <g>
      {isIn ? (
        <>
          <line x1={node.x + w} y1={node.y + h / 2} x2={node.x + w + 11} y2={node.y + h / 2}
            stroke={sigColor(value)} strokeWidth={2.4} />
          <rect x={node.x} y={node.y} width={w} height={h} rx={9}
            fill={on ? "#10301f" : "#141d33"} stroke={on ? C.on : C.borderHi}
            strokeWidth={1.6} onPointerDown={(e) => { e.stopPropagation(); onToggle(node.id); }}
            style={{ cursor: "pointer", filter: on ? "drop-shadow(0 0 6px rgba(55,224,139,.4))" : "none" }} />
          <text x={node.x + 11} y={node.y + 17} fontFamily="ui-monospace, monospace"
            fontSize={11} fill={C.muted} style={{ pointerEvents: "none", userSelect: "none" }}>{node.label}</text>
          <text x={node.x + w / 2} y={node.y + h - 9} textAnchor="middle"
            fontFamily="ui-monospace, monospace" fontSize={19} fontWeight={700}
            fill={on ? C.on : C.faint} style={{ pointerEvents: "none", userSelect: "none" }}>
            {on ? "1" : "0"}
          </text>
          <g onPointerDown={(e) => { e.stopPropagation(); onPort(e, node, "out", 0); }} style={{ cursor: "crosshair" }}>
            <circle cx={ports.output.x} cy={ports.output.y} r={10} fill="transparent" />
            <circle cx={ports.output.x} cy={ports.output.y} r={5.4} fill={sigColor(value)}
              stroke={pending && pending.node === node.id ? C.accent : "#0b1322"}
              strokeWidth={pending && pending.node === node.id ? 2.4 : 1.5} />
          </g>
        </>
      ) : (
        <>
          <rect x={node.x} y={node.y} width={w} height={h} rx={9}
            fill="#141d33" stroke={on ? C.on : C.borderHi} strokeWidth={1.6}
            onPointerDown={(e) => onBodyDown(e, node)} style={{ cursor: "grab" }} />
          <circle cx={node.x + w / 2} cy={node.y + h / 2 - 2} r={11}
            fill={on ? C.on : value === false ? "#22304e" : "#33294a"}
            stroke={on ? "#7af2b4" : C.border} strokeWidth={1.4}
            style={{ filter: on ? "drop-shadow(0 0 7px rgba(55,224,139,.7))" : "none", pointerEvents: "none" }} />
          <text x={node.x + w / 2} y={node.y + h - 6} textAnchor="middle"
            fontFamily="ui-monospace, monospace" fontSize={9} letterSpacing={1}
            fill={C.muted} style={{ pointerEvents: "none", userSelect: "none" }}>OUT Q</text>
          <g onPointerDown={(e) => { e.stopPropagation(); onPort(e, node, "in", 0); }} style={{ cursor: "crosshair" }}>
            <circle cx={ports.inputs[0].x} cy={ports.inputs[0].y} r={10} fill="transparent" />
            <circle cx={ports.inputs[0].x} cy={ports.inputs[0].y} r={5.4} fill={sigColor(value)}
              stroke={pending && pending.node === node.id ? C.accent : "#0b1322"}
              strokeWidth={pending && pending.node === node.id ? 2.4 : 1.5} />
          </g>
        </>
      )}
    </g>
  );
}

/* ============================================================
   APP
   ============================================================ */
export default function App() {
  const [levelIdx, setLevelIdx] = useState(0); // number | "sandbox"
  const def = levelIdx === "sandbox" ? SANDBOX : LEVELS[levelIdx];

  const [nodes, setNodes] = useState(() => buildBoard(LEVELS[0]).nodes);
  const [wires, setWires] = useState([]);
  const [inputValues, setInputValues] = useState(() => buildBoard(LEVELS[0]).inputValues);
  const [pending, setPending] = useState(null);
  const [drag, setDrag] = useState(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [results, setResults] = useState(null);
  const [message, setMessage] = useState("Wire input A through a NOT gate to Q.");
  const [solved, setSolved] = useState({}); // {idx: gateCount}
  const [loaded, setLoaded] = useState(false); // saved progress has been read
  const gateSeq = useRef(0);
  const svgRef = useRef(null);
  const activeLevelRef = useRef(null);

  /* keep the active level visible in the (long) level list */
  useEffect(() => {
    if (activeLevelRef.current) {
      activeLevelRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [levelIdx]);

  /* ---- load a level ---- */
  const loadLevel = useCallback((idx) => {
    const d = idx === "sandbox" ? SANDBOX : LEVELS[idx];
    const b = buildBoard(d);
    gateSeq.current = 0;
    setLevelIdx(idx);
    setNodes(b.nodes);
    setWires([]);
    setInputValues(b.inputValues);
    setPending(null);
    setResults(null);
    setMessage(
      idx === "sandbox"
        ? "Sandbox mode \u2014 build anything."
        : "Goal: " + d.goal + ". Add gates and wire the circuit."
    );
  }, []);

  /* ---- persistence: load saved progress once on mount ---- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (STORE) {
        try {
          const r = await STORE.get(SAVE_KEY);
          if (!cancelled && r && r.value) {
            const parsed = JSON.parse(r.value);
            if (parsed && typeof parsed === "object") setSolved(parsed);
          }
        } catch (e) {
          /* no saved progress yet — first run */
        }
      }
      if (!cancelled) setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---- persistence: save whenever progress changes (after initial load) ---- */
  useEffect(() => {
    if (!loaded || !STORE) return;
    (async () => {
      try {
        await STORE.set(SAVE_KEY, JSON.stringify(solved));
      } catch (e) {
        console.error("Logic Gate Lab: could not save progress", e);
      }
    })();
  }, [solved, loaded]);

  const resetProgress = () => setSolved({}); // save effect persists the cleared state

  /* ---- svg coordinate helper ---- */
  const toSvg = useCallback((e) => {
    const r = svgRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * VBW,
      y: ((e.clientY - r.top) / r.height) * VBH,
    };
  }, []);

  /* ---- live simulation ---- */
  const memo = useMemo(() => simulate(nodes, wires, inputValues), [nodes, wires, inputValues]);
  const inWireMap = useMemo(() => {
    const m = {};
    wires.forEach((w) => {
      m[w.to.node] = m[w.to.node] || {};
      m[w.to.node][w.to.port] = w;
    });
    return m;
  }, [wires]);

  const gateCount = nodes.filter((n) => n.type !== "INPUT" && n.type !== "OUTPUT").length;

  /* ---- node interactions ---- */
  const onBodyDown = (e, node) => {
    e.stopPropagation();
    const p = toSvg(e);
    setDrag({ id: node.id, dx: p.x - node.x, dy: p.y - node.y });
    setPending(null);
  };
  const onPointerMove = (e) => {
    if (drag) {
      const p = toSvg(e);
      setNodes((ns) =>
        ns.map((n) =>
          n.id === drag.id
            ? {
                ...n,
                x: Math.max(8, Math.min(VBW - 100, p.x - drag.dx)),
                y: Math.max(6, Math.min(VBH - 56, p.y - drag.dy)),
              }
            : n
        )
      );
    } else if (pending) {
      setCursor(toSvg(e));
    }
  };
  const endDrag = () => setDrag(null);

  const onPort = (e, node, kind, port) => {
    if (!pending) {
      setPending({ node: node.id, kind, port });
      setCursor(toSvg(e));
      return;
    }
    if (pending.node === node.id) {
      setPending(null);
      return;
    }
    let src, dst;
    if (pending.kind === "out" && kind === "in") {
      src = pending;
      dst = { node: node.id, port };
    } else if (pending.kind === "in" && kind === "out") {
      src = { node: node.id, port: 0 };
      dst = pending;
    } else {
      setPending({ node: node.id, kind, port });
      return;
    }
    const next = wires.filter((w) => !(w.to.node === dst.node && w.to.port === dst.port));
    next.push({ id: "w" + Math.random().toString(36).slice(2), from: { node: src.node }, to: { node: dst.node, port: dst.port } });
    if (makesCycle(next)) {
      setMessage("That wire would create a feedback loop \u2014 not allowed in a combinational circuit.");
    } else {
      setWires(next);
    }
    setPending(null);
  };

  const deleteNode = (id) => {
    setNodes((ns) => ns.filter((n) => n.id !== id));
    setWires((ws) => ws.filter((w) => w.from.node !== id && w.to.node !== id));
    setPending(null);
  };
  const deleteWire = (id) => setWires((ws) => ws.filter((w) => w.id !== id));
  const toggleInput = (id) => setInputValues((v) => ({ ...v, [id]: !v[id] }));

  const addGate = (type) => {
    const k = gateSeq.current++;
    const id = "g" + k;
    setNodes((ns) => [
      ...ns,
      { id, type, x: 312 + (k % 3) * 40, y: 70 + (k % 4) * 88 },
    ]);
  };

  const clearBoard = () => {
    setNodes((ns) => ns.filter((n) => n.type === "INPUT" || n.type === "OUTPUT"));
    setWires([]);
    setPending(null);
    setResults(null);
  };

  /* ---- truth table for current level ---- */
  const truth = useMemo(() => {
    if (!def.target) return null;
    const n = def.inputs.length;
    const rows = [];
    for (let m = 0; m < 1 << n; m++) {
      const bits = [];
      for (let i = 0; i < n; i++) bits.push((m >> (n - 1 - i)) & 1);
      rows.push({ bits, exp: !!def.target(...bits.map(Boolean)) });
    }
    return rows;
  }, [def]);

  const inputNodes = nodes.filter((n) => n.type === "INPUT");
  const currentRow = useMemo(() => {
    let m = 0;
    inputNodes.forEach((nd) => (m = (m << 1) | (inputValues[nd.id] ? 1 : 0)));
    return m;
  }, [inputNodes, inputValues]);

  /* ---- verify ---- */
  const runVerify = () => {
    if (!def.target) return;
    const outNode = nodes.find((n) => n.type === "OUTPUT");
    if (!wires.some((w) => w.to.node === outNode.id)) {
      setMessage("Output Q is not connected to anything yet.");
      setResults(null);
      return;
    }
    const n = inputNodes.length;
    const rows = [];
    let allPass = true;
    for (let m = 0; m < 1 << n; m++) {
      const im = {};
      const bits = [];
      inputNodes.forEach((nd, i) => {
        const bit = (m >> (n - 1 - i)) & 1;
        im[nd.id] = !!bit;
        bits.push(bit);
      });
      const mm = simulate(nodes, wires, im);
      const out = mm[outNode.id];
      const exp = !!def.target(...bits.map(Boolean));
      const pass = out !== null && out !== undefined && !!out === exp;
      if (!pass) allPass = false;
      rows.push({ bits, out, exp, pass });
    }
    setResults({ rows, allPass });
    if (allPass) {
      setSolved((s) => ({ ...s, [levelIdx]: gateCount }));
      setMessage(
        gateCount <= def.par
          ? "Solved \u2014 and at or below par. A clean, optimal circuit."
          : "Solved! The circuit matches every row of the truth table."
      );
    } else {
      setMessage("Not quite \u2014 the highlighted rows do not match. Keep going.");
    }
  };

  /* ---- pending wire preview source ---- */
  const pendPoint = useMemo(() => {
    if (!pending) return null;
    const n = nodes.find((x) => x.id === pending.node);
    if (!n) return null;
    const p = portsOf(n);
    return pending.kind === "out" ? p.output : p.inputs[pending.port];
  }, [pending, nodes]);

  const unlocked = (i) =>
    i === "sandbox" || i === 0 || i in solved || i - 1 in solved;
  const starsFor = (i) =>
    !(i in solved) ? 0 : solved[i] <= LEVELS[i].par ? 2 : 1;

  /* ============================================================
     UI
     ============================================================ */
  const btn = (extra) => ({
    background: C.panel,
    color: C.text,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: "7px 12px",
    fontSize: 12.5,
    fontFamily: "ui-monospace, Menlo, monospace",
    cursor: "pointer",
    ...extra,
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(900px 500px at 18% -10%, #142036 0%, ${C.bg} 60%)`,
        color: C.text,
        fontFamily: "'Georgia', 'Times New Roman', serif",
        padding: "18px 16px 40px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap", marginBottom: 4 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 30,
              letterSpacing: 0.5,
              fontWeight: 700,
              background: `linear-gradient(90deg, ${C.accent}, #9d8bf2)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Logic Gate Lab
          </h1>
          <span style={{ color: C.muted, fontSize: 13, fontFamily: "ui-monospace, monospace" }}>
            100 levels · discrete maths · combinational circuits
          </span>
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {/* ---------- LEFT: canvas + toolbar ---------- */}
          <div style={{ flex: "1 1 600px", minWidth: 320 }}>
            {/* toolbar */}
            <div
              style={{
                display: "flex",
                gap: 7,
                flexWrap: "wrap",
                alignItems: "center",
                background: C.panel2,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: 9,
                marginBottom: 10,
              }}
            >
              <span style={{ color: C.faint, fontSize: 11, fontFamily: "ui-monospace, monospace", marginRight: 2 }}>
                GATES
              </span>
              {def.palette.map((t) => {
                const g = GATES[t];
                return (
                  <button
                    key={t}
                    onClick={() => addGate(t)}
                    style={btn({
                      borderColor: g.fam,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    })}
                  >
                    <span style={{ color: g.fam, fontWeight: 700, fontSize: 14 }}>{g.sym}</span>
                    <span>{g.name}</span>
                  </button>
                );
              })}
              <div style={{ flex: 1 }} />
              <button onClick={clearBoard} style={btn({})}>
                Clear
              </button>
              <button onClick={() => loadLevel(levelIdx)} style={btn({})}>
                Reset
              </button>
              {def.target && (
                <button
                  onClick={runVerify}
                  style={btn({
                    background: `linear-gradient(90deg, ${C.accent}, #2bb9d6)`,
                    color: "#04241f",
                    fontWeight: 700,
                    borderColor: C.accent,
                  })}
                >
                  ▶ Verify
                </button>
              )}
            </div>

            {/* canvas */}
            <div
              style={{
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                overflow: "hidden",
                background: C.canvas,
              }}
            >
              <svg
                ref={svgRef}
                viewBox={`0 0 ${VBW} ${VBH}`}
                width={VBW}
                height={VBH}
                style={{ width: "100%", height: "auto", display: "block", touchAction: "none" }}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerLeave={endDrag}
                onPointerDown={() => setPending(null)}
              >
                <defs>
                  <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
                    <circle cx="1.5" cy="1.5" r="1.3" fill="#172238" />
                  </pattern>
                </defs>
                <rect x={0} y={0} width={VBW} height={VBH} fill={C.canvas} />
                <rect x={0} y={0} width={VBW} height={VBH} fill="url(#grid)" />

                {/* wires */}
                {wires.map((w) => {
                  const fn = nodes.find((n) => n.id === w.from.node);
                  const tn = nodes.find((n) => n.id === w.to.node);
                  if (!fn || !tn) return null;
                  const fp = portsOf(fn).output;
                  const tp = portsOf(tn).inputs[w.to.port];
                  if (!fp || !tp) return null;
                  const v = memo[w.from.node];
                  const d = wirePath(fp.x, fp.y, tp.x, tp.y);
                  return (
                    <g key={w.id}>
                      <path d={d} fill="none" stroke="transparent" strokeWidth={16}
                        style={{ cursor: "pointer" }}
                        onPointerDown={(e) => { e.stopPropagation(); deleteWire(w.id); }} />
                      <path d={d} fill="none" stroke={sigColor(v)}
                        strokeWidth={v === true ? 3.2 : 2.4} strokeLinecap="round"
                        style={{ filter: v === true ? "drop-shadow(0 0 4px rgba(55,224,139,.55))" : "none", pointerEvents: "none" }} />
                    </g>
                  );
                })}

                {/* pending wire preview */}
                {pendPoint && (
                  <path
                    d={wirePath(pendPoint.x, pendPoint.y, cursor.x, cursor.y)}
                    fill="none" stroke={C.accent} strokeWidth={2.2}
                    strokeDasharray="6 5" style={{ pointerEvents: "none" }}
                  />
                )}

                {/* nodes */}
                {nodes.map((n) => {
                  const p = portsOf(n);
                  const liveInputs = {};
                  if (GATES[n.type].inputs) {
                    for (let i = 0; i < GATES[n.type].inputs; i++) {
                      const w = inWireMap[n.id] && inWireMap[n.id][i];
                      liveInputs[i] = w ? memo[w.from.node] : null;
                    }
                  }
                  if (n.type === "INPUT" || n.type === "OUTPUT")
                    return (
                      <IONode key={n.id} node={n} value={memo[n.id]} ports={p}
                        onBodyDown={onBodyDown} onPort={onPort} onToggle={toggleInput} pending={pending} />
                    );
                  return (
                    <GateNode key={n.id} node={n} value={memo[n.id]} ports={p}
                      onBodyDown={onBodyDown} onPort={onPort} onDelete={deleteNode}
                      pending={pending} liveInputs={liveInputs} />
                  );
                })}

                <text x={14} y={VBH - 12} fontFamily="ui-monospace, monospace" fontSize={10.5} fill={C.faint}>
                  click a port, then another to wire · click a wire to cut it · drag gates · click inputs to toggle
                </text>
              </svg>
            </div>

            {/* status bar */}
            <div
              style={{
                marginTop: 10,
                display: "flex",
                gap: 12,
                alignItems: "center",
                background: results
                  ? results.allPass
                    ? "#10301f"
                    : "#301a22"
                  : C.panel2,
                border: `1px solid ${results ? (results.allPass ? C.on : C.bad) : C.border}`,
                borderRadius: 10,
                padding: "10px 13px",
                fontSize: 13.5,
                flexWrap: "wrap",
              }}
            >
              <span style={{ color: results ? (results.allPass ? C.on : C.bad) : C.text }}>
                {message}
              </span>
              <div style={{ flex: 1 }} />
              <span style={{ color: C.muted, fontFamily: "ui-monospace, monospace", fontSize: 12 }}>
                gates: {gateCount}
                {def.target ? ` · par ${def.par}` : ""}
              </span>
              {results && results.allPass && typeof levelIdx === "number" && levelIdx < LEVELS.length - 1 && (
                <button
                  onClick={() => loadLevel(levelIdx + 1)}
                  style={btn({ background: C.on, color: "#04241f", fontWeight: 700, borderColor: C.on })}
                >
                  Next level →
                </button>
              )}
            </div>
          </div>

          {/* ---------- RIGHT: info panel ---------- */}
          <div style={{ flex: "1 1 300px", minWidth: 280, display: "flex", flexDirection: "column", gap: 14 }}>
            {/* level info */}
            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 15 }}>
              {(() => {
                const world = WORLDS.find((x) => x.id === def.w);
                return world ? (
                  <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10.5, letterSpacing: 1, color: world.color, marginBottom: 4 }}>
                    WORLD {world.id} · {world.name.toUpperCase()}
                  </div>
                ) : (
                  <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10.5, letterSpacing: 1, color: C.faint, marginBottom: 4 }}>
                    FREE PLAY
                  </div>
                );
              })()}
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: 19 }}>{def.name}</h2>
                <span style={{ color: C.accent, fontFamily: "ui-monospace, monospace", fontSize: 12 }}>
                  {typeof levelIdx === "number" ? `LV ${levelIdx + 1}/100` : "SANDBOX"}
                </span>
              </div>
              <div
                style={{
                  marginTop: 7,
                  fontFamily: "ui-monospace, monospace",
                  fontSize: 13,
                  color: C.accent,
                  background: C.panel2,
                  border: `1px solid ${C.border}`,
                  borderRadius: 7,
                  padding: "6px 9px",
                  display: "inline-block",
                }}
              >
                {def.goal}
              </div>
              <p style={{ color: C.muted, fontSize: 13.5, lineHeight: 1.6, marginBottom: 0 }}>
                {def.concept}
              </p>
              {def.irl && (
                <div
                  style={{
                    marginTop: 10,
                    background: "#161f0f",
                    border: `1px solid #3c4a22`,
                    borderRadius: 8,
                    padding: "8px 10px",
                    fontSize: 12.5,
                    color: "#cfe08a",
                    lineHeight: 1.55,
                  }}
                >
                  <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 10.5, letterSpacing: 1, color: "#9bb24f" }}>
                    ⚡ IN THE REAL WORLD
                  </span>
                  <div style={{ marginTop: 3 }}>{def.irl}</div>
                </div>
              )}
            </div>

            {/* truth table */}
            {truth && (
              <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 15 }}>
                <h3 style={{ margin: "0 0 9px", fontSize: 14, color: C.text }}>Truth Table</h3>
                <div style={{ maxHeight: 270, overflowY: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontFamily: "ui-monospace, monospace",
                    fontSize: 13,
                  }}
                >
                  <thead>
                    <tr style={{ color: C.faint }}>
                      {def.inputs.map((l) => (
                        <th key={l} style={{ padding: "4px 6px", textAlign: "center", fontWeight: 400 }}>{l}</th>
                      ))}
                      <th style={{ padding: "4px 6px", color: C.accent }}>Q*</th>
                      {results && <th style={{ padding: "4px 6px" }}>You</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {truth.map((r, i) => {
                      const here = i === currentRow;
                      const res = results && results.rows[i];
                      return (
                        <tr
                          key={i}
                          style={{
                            background: here ? "#1b2740" : "transparent",
                            outline: here ? `1px solid ${C.accent}` : "none",
                          }}
                        >
                          {r.bits.map((b, j) => (
                            <td
                              key={j}
                              style={{
                                padding: "4px 6px",
                                textAlign: "center",
                                color: b ? C.on : C.faint,
                                borderTop: `1px solid ${C.panel2}`,
                              }}
                            >
                              {b}
                            </td>
                          ))}
                          <td style={{ padding: "4px 6px", textAlign: "center", color: r.exp ? C.on : C.faint, borderTop: `1px solid ${C.panel2}` }}>
                            {r.exp ? 1 : 0}
                          </td>
                          {results && (
                            <td
                              style={{
                                padding: "4px 6px",
                                textAlign: "center",
                                borderTop: `1px solid ${C.panel2}`,
                                color: res.pass ? C.on : C.bad,
                                fontWeight: 700,
                              }}
                            >
                              {res.out === null || res.out === undefined ? "—" : res.out ? 1 : 0}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
                <div style={{ color: C.faint, fontSize: 11, marginTop: 7 }}>
                  Highlighted row = current input toggles. Q* is the target.
                </div>
              </div>
            )}

            {/* level select */}
            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 15 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 9 }}>
                <h3 style={{ margin: 0, fontSize: 14 }}>
                  Levels{" "}
                  <span style={{ color: C.faint, fontFamily: "ui-monospace, monospace", fontSize: 11 }}>
                    {Object.keys(solved).length}/{LEVELS.length} solved
                  </span>
                </h3>
                {Object.keys(solved).length > 0 && (
                  <button
                    onClick={resetProgress}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: C.faint,
                      fontSize: 11,
                      cursor: "pointer",
                      fontFamily: "ui-monospace, monospace",
                      textDecoration: "underline",
                    }}
                  >
                    reset progress
                  </button>
                )}
              </div>
              <div
                style={{
                  maxHeight: 440,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  paddingRight: 4,
                }}
              >
                {WORLDS.map((world) => {
                  const items = LEVELS.map((lvl, i) => ({ lvl, i })).filter(
                    (x) => x.lvl.w === world.id
                  );
                  const done = items.filter((x) => x.i in solved).length;
                  return (
                    <div key={world.id} style={{ marginBottom: 2 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: 6,
                          padding: "7px 4px 4px",
                          position: "sticky",
                          top: 0,
                          background: C.panel,
                          zIndex: 1,
                        }}
                      >
                        <span style={{ color: world.color, fontWeight: 700, fontSize: 12.5 }}>
                          {world.id}. {world.name}
                        </span>
                        <span style={{ color: C.faint, fontSize: 10.5, fontFamily: "ui-monospace, monospace" }}>
                          {done}/10
                        </span>
                        <span style={{ flex: 1 }} />
                        <span style={{ color: C.faint, fontSize: 10, fontStyle: "italic" }}>
                          {world.tag}
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {items.map(({ lvl, i }) => {
                          const open = unlocked(i);
                          const st = starsFor(i);
                          const active = levelIdx === i;
                          const isDone = i in solved;
                          return (
                            <button
                              key={i}
                              ref={active ? activeLevelRef : null}
                              disabled={!open}
                              onClick={() => loadLevel(i)}
                              style={{
                                textAlign: "left",
                                background: active ? "#1a2c44" : C.panel2,
                                color: open ? C.text : C.faint,
                                border: `1px solid ${active ? C.accent : isDone ? "#2c4a38" : C.border}`,
                                borderRadius: 8,
                                padding: "7px 9px",
                                cursor: open ? "pointer" : "not-allowed",
                                fontFamily: "inherit",
                                fontSize: 12.5,
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                opacity: open ? 1 : 0.55,
                              }}
                            >
                              <span style={{ fontFamily: "ui-monospace, monospace", color: world.color, fontSize: 10.5, width: 22 }}>
                                {String(i + 1).padStart(3, "0")}
                              </span>
                              <span style={{ flex: 1 }}>
                                {open ? lvl.name : "🔒 Locked"}
                              </span>
                              {isDone && st === 0 && (
                                <span style={{ color: C.on, fontSize: 11 }}>✓</span>
                              )}
                              <span style={{ color: C.warn, letterSpacing: 1, fontSize: 11 }}>
                                {st === 2 ? "★★" : st === 1 ? "★" : ""}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => loadLevel("sandbox")}
                style={{
                  marginTop: 8,
                  width: "100%",
                  textAlign: "left",
                  background: levelIdx === "sandbox" ? "#1a2c44" : C.panel2,
                  color: C.text,
                  border: `1px solid ${levelIdx === "sandbox" ? C.accent : C.border}`,
                  borderRadius: 8,
                  padding: "8px 10px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 13,
                }}
              >
                ⚙ Sandbox — all gates, free play
              </button>
            </div>

            {/* how to play */}
            <div style={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, fontSize: 12.5, color: C.muted, lineHeight: 1.65 }}>
              <strong style={{ color: C.text }}>How to play.</strong> Add gates from the toolbar.
              Click an <span style={{ color: C.accent }}>output port</span> then an{" "}
              <span style={{ color: C.accent }}>input port</span> to draw a wire. Click a wire to
              cut it, the × to delete a gate, and an input box to flip its bit. Signals light up{" "}
              <span style={{ color: C.on }}>green</span> for 1. Gate symbols use IEC 60617 notation
              (&nbsp;<span style={{ fontFamily: "ui-monospace" }}>&amp;</span> = AND,{" "}
              <span style={{ fontFamily: "ui-monospace" }}>≥1</span> = OR,{" "}
              <span style={{ fontFamily: "ui-monospace" }}>=1</span> = XOR ); a bubble means the
              output is negated. Hit <span style={{ color: C.accent }}>Verify</span> to test every
              row of the truth table.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
