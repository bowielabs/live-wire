import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { VerifyResult, VerifyRow } from "./types";
import { LEVELS, SANDBOX } from "./data/levels";
import { contributingGateCount, simulate } from "./engine/simulate";
import { btn, C } from "./theme";
import { useCircuit } from "./hooks/useCircuit";
import { useProgress } from "./hooks/useProgress";
import { useTheme } from "./hooks/useTheme";
import { useTutorial } from "./hooks/useTutorial";
import { useMuted } from "./hooks/useMuted";
import { usePinned } from "./hooks/usePinned";
import { play } from "./lib/sound";
import { readShareFromUrl } from "./lib/share";
import AppBar from "./components/AppBar";
import Toolbar from "./components/Toolbar";
import CircuitCanvas from "./components/CircuitCanvas";
import BottomBar from "./components/BottomBar";
import Drawer from "./components/Drawer";
import LevelInfo from "./components/LevelInfo";
import TruthTable from "./components/TruthTable";
import LevelSelect from "./components/LevelSelect";
import HowToPlay from "./components/HowToPlay";
import Tutorial from "./components/Tutorial";
import Confetti from "./components/Confetti";
import ShareCircuit from "./components/ShareCircuit";

type DrawerId = "levels" | "info" | null;

export default function App() {
  /* If the URL contains a #share=… payload, decode it once on mount so we
     can initialise levelIdx and the circuit to the shared state directly
     (rather than rendering Level 1 briefly and then jumping). */
  const initialShare = useMemo(() => readShareFromUrl(), []);
  const initialLevelIdx: number | "sandbox" = useMemo(() => {
    if (!initialShare) return 0;
    if (initialShare.l === "s") return "sandbox";
    if (
      typeof initialShare.l === "number" &&
      initialShare.l >= 0 &&
      initialShare.l < LEVELS.length
    ) {
      return initialShare.l;
    }
    return 0;
  }, [initialShare]);
  const initialDef =
    initialLevelIdx === "sandbox" ? SANDBOX : LEVELS[initialLevelIdx];

  const [levelIdx, setLevelIdx] = useState<number | "sandbox">(initialLevelIdx);
  const def = levelIdx === "sandbox" ? SANDBOX : LEVELS[levelIdx];

  const [message, setMessage] = useState(
    initialShare ? "Shared circuit loaded — toggle inputs and verify." : "Wire input A through a NOT gate to Q."
  );
  const [results, setResults] = useState<VerifyResult | null>(null);
  const [drawer, setDrawer] = useState<DrawerId>(null);
  const closeDrawer = useCallback(() => setDrawer(null), []);

  const { solved, setSolved, resetProgress } = useProgress();
  const { theme, toggle: toggleTheme } = useTheme();
  const { muted, toggle: toggleMute } = useMuted();
  const { pinned: pinnedTruth, toggle: togglePinTruth } = usePinned("gw:pin-truth");
  const { pinned: pinnedInfo, toggle: togglePinInfo } = usePinned("gw:pin-info");
  const circuit = useCircuit(initialDef, setMessage);
  const [solveToken, setSolveToken] = useState(0);

  /* Apply the shared payload (gates + wires + input toggles) once. */
  useEffect(() => {
    if (!initialShare) return;
    circuit.loadFromShare(initialDef, initialShare);
    try {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const tutorial = useTutorial({
    levelIdx,
    nodes: circuit.nodes,
    wires: circuit.wires,
    results,
  });

  const activeLevelRef = useRef<HTMLButtonElement>(null);

  /* keep the active level visible whenever the level drawer opens */
  useEffect(() => {
    if (drawer === "levels" && activeLevelRef.current) {
      activeLevelRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [drawer, levelIdx]);

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

  const selectLevelAndClose = useCallback(
    (idx: number | "sandbox") => {
      loadLevel(idx);
      closeDrawer();
    },
    [loadLevel, closeDrawer]
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
    // "Prove the identity" levels demand the construction, not a truth-table
    // shortcut: the right rows aren't enough if too few gates actually feed Q.
    const need = def.minGates ?? 0;
    const used = need ? contributingGateCount(circuit.nodes, circuit.wires) : 0;
    const shortcut = allPass && used < need;
    const accepted = allPass && !shortcut;
    setResults({ rows, allPass: accepted });

    if (accepted) {
      setSolved((s) => ({ ...s, [levelIdx as number]: circuit.gateCount }));
      setMessage(
        circuit.gateCount <= def.par
          ? "Solved — and at or below par. A clean, optimal circuit."
          : "Solved! The circuit matches every row of the truth table."
      );
      play("success");
      setSolveToken((t) => t + 1);
    } else if (shortcut) {
      setMessage(
        `Right truth table — but that's the shortcut. This level is about proving it: ` +
          `build the full circuit with at least ${need} gate${need > 1 ? "s" : ""} wired into Q.`
      );
      play("fail");
    } else {
      setMessage("Not quite — the highlighted rows do not match. Keep going.");
      play("fail");
    }
  };

  const handleClear = () => {
    circuit.clearBoard();
    setResults(null);
  };

  const showNext =
    !!results && results.allPass && typeof levelIdx === "number" && levelIdx < LEVELS.length - 1;

  const levelLabel =
    typeof levelIdx === "number" ? `LV ${levelIdx + 1}/100 · ${def.name}` : "SANDBOX";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(900px 500px at 18% -10%, ${C.appGradStart} 0%, ${C.bg} 60%)`,
        color: C.text,
        fontFamily: "var(--font-body)",
        padding: "12px 12px 24px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <AppBar
          levelLabel={levelLabel}
          theme={theme}
          muted={muted}
          onToggleTheme={toggleTheme}
          onToggleMute={toggleMute}
          onOpenLevels={() => setDrawer("levels")}
          onOpenInfo={() => setDrawer("info")}
        />

        <Toolbar
          palette={def.palette}
          onAddGate={circuit.addGate}
          onClear={handleClear}
          onReset={() => loadLevel(levelIdx)}
        />

        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 520px", minWidth: 0 }}>
            <CircuitCanvas circuit={circuit} />

            <BottomBar
              message={message}
              results={results}
              gateCount={circuit.gateCount}
              par={def.par}
              minGates={def.minGates}
              hasTarget={!!def.target}
              pinnedTruth={pinnedTruth}
              showNext={showNext}
              onToggleTruth={() => setDrawer("info")}
              onTogglePinTruth={togglePinTruth}
              onVerify={runVerify}
              onNext={() => loadLevel((levelIdx as number) + 1)}
            />
          </div>

          {(pinnedInfo || (!!def.target && pinnedTruth)) && (
            <div
              style={{
                flex: "1 1 260px",
                minWidth: 240,
                maxWidth: 340,
                position: "sticky",
                top: 12,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {pinnedInfo && (
                <LevelInfo def={def} levelIdx={levelIdx} onTogglePin={togglePinInfo} pinned />
              )}
              {!!def.target && pinnedTruth && (
                <TruthTable
                  def={def}
                  results={results}
                  currentRow={currentRow}
                  onTogglePin={togglePinTruth}
                  pinned
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* ---- left drawer: levels + how to play ---- */}
      <Drawer side="left" open={drawer === "levels"} onClose={closeDrawer} title="Levels">
        <LevelSelect
          solved={solved}
          levelIdx={levelIdx}
          activeRef={activeLevelRef}
          onSelect={selectLevelAndClose}
          onResetProgress={resetProgress}
        />
        <div style={{ marginTop: 12 }}>
          <HowToPlay
            onReplayTutorial={() => {
              tutorial.replay();
              loadLevel(0);
              closeDrawer();
            }}
          />
        </div>
      </Drawer>

      {/* ---- right drawer: level info + truth table + share ---- */}
      <Drawer side="right" open={drawer === "info"} onClose={closeDrawer} title="Level details">
        {pinnedInfo ? (
          <PinnedNote label="Problem description is pinned beside the board." onUnpin={togglePinInfo} />
        ) : (
          <LevelInfo def={def} levelIdx={levelIdx} onTogglePin={togglePinInfo} pinned={false} />
        )}
        <div style={{ marginTop: 12 }}>
          {!!def.target && pinnedTruth ? (
            <PinnedNote label="Truth table is pinned beside the board." onUnpin={togglePinTruth} />
          ) : (
            <TruthTable
              def={def}
              results={results}
              currentRow={currentRow}
              onTogglePin={togglePinTruth}
              pinned={false}
            />
          )}
        </div>
        <div style={{ marginTop: 12 }}>
          <ShareCircuit
            levelIdx={levelIdx}
            nodes={circuit.nodes}
            wires={circuit.wires}
            inputValues={circuit.inputValues}
          />
        </div>
      </Drawer>

      {/* ---- first-run interactive tutorial (Level 1 only) ---- */}
      {tutorial.active && (
        <Tutorial step={tutorial.step} onNext={tutorial.next} onSkip={tutorial.skip} />
      )}

      {/* ---- solve celebration ---- */}
      <Confetti token={solveToken} />
    </div>
  );
}

/** Drawer stand-in shown when a panel has been pinned out to the board. */
function PinnedNote({ label, onUnpin }: { label: string; onUnpin: () => void }) {
  return (
    <div
      style={{
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 15,
        fontSize: 12.5,
        color: C.muted,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}
    >
      <span>📌 {label}</span>
      <button onClick={onUnpin} style={btn({ padding: "3px 8px", fontSize: 11.5 })}>
        Unpin
      </button>
    </div>
  );
}
