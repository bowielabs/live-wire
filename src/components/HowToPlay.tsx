import { C } from "../theme";

export interface HowToPlayProps {
  onReplayTutorial?: () => void;
}

export default function HowToPlay({ onReplayTutorial }: HowToPlayProps) {
  return (
    <div style={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, fontSize: 12.5, color: C.muted, lineHeight: 1.65 }}>
      <strong style={{ color: C.text }}>How to play.</strong> Add gates from the toolbar — click them, or drag onto the canvas. Click an{" "}
      <span style={{ color: C.accent }}>output port</span> then an <span style={{ color: C.accent }}>input port</span> to draw a
      wire (or drag from one to the other). Click a wire to cut it, the × to delete a gate, and an input box to flip its bit. Signals light up{" "}
      <span style={{ color: C.on }}>green</span> for 1. Gate symbols use IEC 60617 notation (&nbsp;
      <span style={{ fontFamily: "var(--font-mono)" }}>&amp;</span> = AND, <span style={{ fontFamily: "var(--font-mono)" }}>≥1</span> = OR,{" "}
      <span style={{ fontFamily: "var(--font-mono)" }}>=1</span> = XOR ); a bubble means the output is negated. Hit{" "}
      <span style={{ color: C.accent }}>Verify</span> to test every row of the truth table.
      {onReplayTutorial && (
        <div style={{ marginTop: 10 }}>
          <button
            type="button"
            onClick={onReplayTutorial}
            style={{
              background: "transparent",
              border: `1px solid ${C.border}`,
              color: C.accent,
              borderRadius: 8,
              padding: "5px 10px",
              cursor: "pointer",
              fontSize: 12,
              fontFamily: "inherit",
            }}
          >
            ▶ Replay the tutorial
          </button>
        </div>
      )}
    </div>
  );
}
