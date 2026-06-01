import { useEffect, useRef, useState } from "react";
import type { NodeData, Wire } from "../types";
import { btn, C } from "../theme";
import { encodeShare, shareUrl } from "../lib/share";

export interface ShareCircuitProps {
  levelIdx: number | "sandbox";
  nodes: NodeData[];
  wires: Wire[];
  inputValues: Record<string, boolean>;
}

type CopyState = "idle" | "copied" | "shown";

export default function ShareCircuit({ levelIdx, nodes, wires, inputValues }: ShareCircuitProps) {
  const [state, setState] = useState<CopyState>("idle");
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const onCopy = async () => {
    const payload = encodeShare({ levelIdx, nodes, wires, inputValues });
    const url = shareUrl(payload);
    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
      setFallbackUrl(null);
    } catch {
      /* clipboard blocked — show the URL inline so the user can copy it. */
      setState("shown");
      setFallbackUrl(url);
    }
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 2400);
  };

  return (
    <div
      style={{
        background: C.panel2,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 12,
        fontSize: 12.5,
        color: C.muted,
        lineHeight: 1.5,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={onCopy}
          style={btn({ borderColor: C.accent, color: C.text, display: "flex", alignItems: "center", gap: 6 })}
        >
          🔗 Share this circuit
        </button>
        {state === "copied" && <span style={{ color: C.on, fontFamily: "ui-monospace, monospace" }}>Link copied ✓</span>}
        {state === "shown" && <span style={{ color: C.warn, fontFamily: "ui-monospace, monospace" }}>Copy this link:</span>}
      </div>
      {state === "shown" && fallbackUrl && (
        <input
          readOnly
          value={fallbackUrl}
          onFocus={(e) => e.currentTarget.select()}
          style={{
            marginTop: 8,
            width: "100%",
            background: C.panel,
            color: C.text,
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            padding: "6px 8px",
            fontSize: 11.5,
            fontFamily: "ui-monospace, monospace",
            boxSizing: "border-box",
          }}
        />
      )}
      <div style={{ marginTop: 8, color: C.faint, fontSize: 11.5 }}>
        The link encodes this exact board — gates, wires, and input toggles.
      </div>
    </div>
  );
}
