import type { TutorialStep } from "../hooks/useTutorial";
import { btn, C } from "../theme";

export interface TutorialProps {
  step: TutorialStep;
  onNext: () => void;
  onSkip: () => void;
}

interface StepCopy {
  title: string;
  body: string;
  nextLabel?: string;
  step?: string;
}

const COPY: Record<TutorialStep, StepCopy | null> = {
  welcome: {
    title: "Welcome to Wirecraft",
    body: "Level 1 asks you to build Q = ¬A — the inverter. I'll walk you through it. Four short steps.",
    nextLabel: "Start",
  },
  "add-gate": {
    step: "Step 1 / 4",
    title: "Add a NOT gate",
    body: "Click the NOT button in the toolbar above — or drag it onto the canvas to place it where you like.",
  },
  "wire-in": {
    step: "Step 2 / 4",
    title: "Wire A into the NOT gate",
    body: "Drag from input A's port to the NOT gate's input port. (Click-then-click works too.)",
  },
  "wire-out": {
    step: "Step 3 / 4",
    title: "Wire the NOT gate to Q",
    body: "Now connect the NOT gate's output to Q on the right.",
  },
  verify: {
    step: "Step 4 / 4",
    title: "Verify the circuit",
    body: "Hit ▶ Verify at the bottom — it'll check your circuit against every row of the truth table.",
  },
  done: {
    title: "Solved!",
    body: "That's the inverter. Hit 'Next level →' to continue, or use ☰ to browse all 100 levels.",
    nextLabel: "Finish",
  },
  dismissed: null,
};

export default function Tutorial({ step, onNext, onSkip }: TutorialProps) {
  const copy = COPY[step];
  if (!copy) return null;

  return (
    <div
      role="dialog"
      aria-label="Tutorial"
      style={{
        position: "fixed",
        bottom: 90,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 25,
        width: "min(380px, 88vw)",
        background: C.panel,
        color: C.text,
        border: `1px solid ${C.accent}`,
        borderRadius: 12,
        padding: 14,
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        fontSize: 13.5,
        lineHeight: 1.5,
      }}
    >
      {copy.step && (
        <div style={{ color: C.accent, fontFamily: "ui-monospace, monospace", fontSize: 10.5, letterSpacing: 1, marginBottom: 4 }}>
          {copy.step.toUpperCase()}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <strong style={{ fontSize: 14.5 }}>{copy.title}</strong>
        <button
          type="button"
          onClick={onSkip}
          aria-label="Close tutorial"
          title="Close tutorial"
          style={{
            background: "transparent",
            border: "none",
            color: C.muted,
            cursor: "pointer",
            fontSize: 18,
            lineHeight: 1,
            padding: 2,
            fontFamily: "inherit",
          }}
        >
          ×
        </button>
      </div>
      <p style={{ margin: "6px 0 10px", color: C.muted }}>{copy.body}</p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <button
          type="button"
          onClick={onSkip}
          style={{
            background: "transparent",
            border: "none",
            color: C.faint,
            cursor: "pointer",
            fontSize: 12,
            fontFamily: "ui-monospace, monospace",
            textDecoration: "underline",
            padding: 0,
          }}
        >
          Skip tutorial
        </button>
        {copy.nextLabel ? (
          <button
            type="button"
            onClick={onNext}
            style={btn({ background: C.accent, color: C.onAccentInk, fontWeight: 700, borderColor: C.accent })}
          >
            {copy.nextLabel}
          </button>
        ) : (
          <span style={{ color: C.faint, fontFamily: "ui-monospace, monospace", fontSize: 11 }}>
            advances automatically
          </span>
        )}
      </div>
    </div>
  );
}
