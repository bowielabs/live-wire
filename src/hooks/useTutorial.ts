import { useEffect, useState } from "react";
import type { NodeData, VerifyResult, Wire } from "../types";

export type TutorialStep =
  | "welcome"
  | "add-gate"
  | "wire-in"
  | "wire-out"
  | "verify"
  | "done"
  | "dismissed";

const STORAGE_KEY = "gw:tutorial:v1";

function loadInitial(): TutorialStep {
  if (typeof window === "undefined") return "dismissed";
  try {
    if (window.localStorage.getItem(STORAGE_KEY) === "dismissed") return "dismissed";
  } catch {
    /* ignore */
  }
  return "welcome";
}

interface UseTutorialInput {
  levelIdx: number | "sandbox";
  nodes: NodeData[];
  wires: Wire[];
  results: VerifyResult | null;
}

/**
 * First-run guided tutorial. Lives only on Level 1 — once dismissed (skip or
 * finish), it never reappears. Detects each step by observing board state.
 */
export function useTutorial({ levelIdx, nodes, wires, results }: UseTutorialInput) {
  const [step, setStep] = useState<TutorialStep>(loadInitial);

  /* Persist when dismissed. */
  useEffect(() => {
    if (step === "dismissed") {
      try {
        window.localStorage.setItem(STORAGE_KEY, "dismissed");
      } catch {
        /* ignore */
      }
    }
  }, [step]);

  const active = step !== "dismissed" && levelIdx === 0;

  /* Auto-advance by observing the board. */
  useEffect(() => {
    if (!active) return;
    if (step === "add-gate" && nodes.some((n) => n.type === "NOT")) {
      setStep("wire-in");
      return;
    }
    if (step === "wire-in") {
      const found = wires.some((w) => {
        const from = nodes.find((n) => n.id === w.from.node);
        const to = nodes.find((n) => n.id === w.to.node);
        return from?.type === "INPUT" && to?.type === "NOT";
      });
      if (found) setStep("wire-out");
      return;
    }
    if (step === "wire-out") {
      const found = wires.some((w) => {
        const from = nodes.find((n) => n.id === w.from.node);
        const to = nodes.find((n) => n.id === w.to.node);
        return from?.type === "NOT" && to?.type === "OUTPUT";
      });
      if (found) setStep("verify");
      return;
    }
    if (step === "verify" && results?.allPass) {
      setStep("done");
    }
  }, [active, step, nodes, wires, results]);

  const next = () => {
    if (step === "welcome") setStep("add-gate");
    else if (step === "done") setStep("dismissed");
  };
  const skip = () => setStep("dismissed");
  const replay = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setStep("welcome");
  };

  return { step, active, next, skip, replay };
}
