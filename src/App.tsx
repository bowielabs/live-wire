import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { VerifyResult, VerifyRow } from "./types";
import { LEVELS, SANDBOX } from "./data/levels";
import { simulate } from "./engine/simulate";
import { C } from "./theme";
import { useCircuit } from "./hooks/useCircuit";
import { useProgress } from "./hooks/useProgress";
import Toolbar from "./components/Toolbar";
import CircuitCanvas from "./components/CircuitCanvas";
import StatusBar from "./components/StatusBar";
import LevelInfo from "./components/LevelInfo";
import TruthTable from "./components/TruthTable";
import LevelSelect from "./components/LevelSelect";
import HowToPlay from "./components/HowToPlay";

export default function App() {
  const [levelIdx, setLevelIdx] = useState<number | "sandbox">(0);
  const def = levelIdx === "sandbox" ? SANDBOX : LEVELS[levelIdx];

  const [message, setMessage] = useState("Wire input A through a NOT gate to Q.");
  const [results, setResults] = useState<VerifyResult | null>(null);

  const { solved, setSolved, resetProgress } = useProgress();
  const circuit = useCircuit(LEVELS[0], setMessage);

  const activeLevelRef = useRef<HTMLButtonElement>(null);

  /* keep the active level visible in the (long) level list */
  useEffect(() => {
    if (activeLevelRef.current) activeLevelRef.current.scrollIntoView({ block: "nearest" });
  }, [levelIdx]);

  /* ---- load a level ---- */
  const loadLevel = useCallback(
    (idx: number | "sandbox") => {
      const d = idx === "sandbox" ? SANDBOX : LEVELS[idx];
      circuit.loadBoard(d);
      setLevelIdx(idx);
      setResults(null);
      setMessage(
        idx === "sandbox"
          ? "Sandbox — build anything."
          : "Goal: " + d.goal + ". Add gates and wire the circuit."
      );
    },
    [circuit.loadBoard]
  );

  /* ---- current input row (for truth-table highlight) ---- */
  const inputNodes = circuit.nodes.filter((n) => n.type === "INPUT");
  const currentRow = useMemo(() => {
    let m = 0;
    inputNodes.forEach((nd) => (m = (m << 1) | (circuit.inputValues[nd.id] ? 1 : 0)));
    return m;
  }, [inputNodes, circuit.inputValues]);

  /* ---- verify against the full truth table ---- */
  const runVerify = () => {
    const target = def.target;
    if (!target) return;
    const outNode = circuit.nodes.find((n) => n.type === "OUTPUT")!;
    if (!circuit.wires.some((w) => w.to.node === outNode.id)) {
      setMessage("Output Q is not connected to anything yet.");
      setResults(null);
      return;
    }
    const n = inputNodes.length;
    const rows: VerifyRow[] = [];
    let allPass = true;
    for (let m = 0; m < 1 << n; m++) {
      const im: Record<string, boolean> = {};
      const bits: number[] = [];
      inputNodes.forEach((nd, i) => {
        const bit = (m >> (n - 1 - i)) & 1;
        im[nd.id] = !!bit;
        bits.push(bit);
      });
      const mm = simulate(circuit.nodes, circuit.wires, im);
      const out = mm[outNode.id];
      const exp = !!target(...bits.map(Boolean));
      const pass = out !== null && out !== undefined && !!out === exp;
      if (!pass) allPass = false;
      rows.push({ bits, out, exp, pass });
    }
    setResults({ rows, allPass });
    if (allPass) {
      setSolved((s) => ({ ...s, [levelIdx as number]: circuit.gateCount }));
      setMessage(
        circuit.gateCount <= def.par
          ? "Solved — and at or below par. A clean, optimal circuit."
          : "Solved! The circuit matches every row of the truth table."
      );
    } else {
      setMessage("Not quite — the highlighted rows do not match. Keep going.");
    }
  };

  const handleClear = () => {
    circuit.clearBoard();
    setResults(null);
  };

  const showNext =
    !!results && results.allPass && typeof levelIdx === "number" && levelIdx < LEVELS.length - 1;

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
            <Toolbar
              palette={def.palette}
              showVerify={!!def.target}
              onAddGate={circuit.addGate}
              onClear={handleClear}
              onReset={() => loadLevel(levelIdx)}
              onVerify={runVerify}
            />
            <CircuitCanvas circuit={circuit} />
            <StatusBar
              message={message}
              results={results}
              gateCount={circuit.gateCount}
              par={def.par}
              hasTarget={!!def.target}
              showNext={showNext}
              onNext={() => loadLevel((levelIdx as number) + 1)}
            />
          </div>

          {/* ---------- RIGHT: info panel ---------- */}
          <div style={{ flex: "1 1 300px", minWidth: 280, display: "flex", flexDirection: "column", gap: 14 }}>
            <LevelInfo def={def} levelIdx={levelIdx} />
            <TruthTable def={def} results={results} currentRow={currentRow} />
            <LevelSelect
              solved={solved}
              levelIdx={levelIdx}
              activeRef={activeLevelRef}
              onSelect={loadLevel}
              onResetProgress={resetProgress}
            />
            <HowToPlay />
          </div>
        </div>
      </div>
    </div>
  );
}
