import type { PointerEvent } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import type { GateType, LevelDef, NodeData, Pending, Wire } from "../types";
import { buildBoard } from "../engine/board";
import { portsOf, VBH, VBW } from "../engine/geometry";
import { makesCycle, simulate } from "../engine/simulate";

interface Drag {
  id: string;
  dx: number;
  dy: number;
}

/**
 * Owns the editable board state (nodes, wires, input values) and all the
 * pointer interactions that mutate it. `notify` surfaces transient messages
 * (e.g. the feedback-loop warning) to the host component.
 */
export function useCircuit(initialDef: LevelDef, notify: (m: string) => void) {
  const [nodes, setNodes] = useState<NodeData[]>(() => buildBoard(initialDef).nodes);
  const [wires, setWires] = useState<Wire[]>([]);
  const [inputValues, setInputValues] = useState<Record<string, boolean>>(
    () => buildBoard(initialDef).inputValues
  );
  const [pending, setPending] = useState<Pending | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const gateSeq = useRef(0);
  const svgRef = useRef<SVGSVGElement | null>(null);

  /* ---- live simulation ---- */
  const memo = useMemo(() => simulate(nodes, wires, inputValues), [nodes, wires, inputValues]);
  const inWireMap = useMemo(() => {
    const m: Record<string, Record<number, Wire>> = {};
    wires.forEach((w) => {
      m[w.to.node] = m[w.to.node] || {};
      m[w.to.node][w.to.port] = w;
    });
    return m;
  }, [wires]);

  const gateCount = nodes.filter((n) => n.type !== "INPUT" && n.type !== "OUTPUT").length;

  /* ---- svg coordinate helper ---- */
  const toSvg = useCallback((e: PointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * VBW,
      y: ((e.clientY - r.top) / r.height) * VBH,
    };
  }, []);

  /* ---- node interactions ---- */
  const onBodyDown = (e: PointerEvent, node: NodeData) => {
    e.stopPropagation();
    const p = toSvg(e);
    setDrag({ id: node.id, dx: p.x - node.x, dy: p.y - node.y });
    setPending(null);
  };

  const onPointerMove = (e: PointerEvent) => {
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

  const onPort = (e: PointerEvent, node: NodeData, kind: "in" | "out", port: number) => {
    if (!pending) {
      setPending({ node: node.id, kind, port });
      setCursor(toSvg(e));
      return;
    }
    if (pending.node === node.id) {
      setPending(null);
      return;
    }
    let src: { node: string };
    let dst: { node: string; port: number };
    if (pending.kind === "out" && kind === "in") {
      src = pending;
      dst = { node: node.id, port };
    } else if (pending.kind === "in" && kind === "out") {
      src = { node: node.id };
      dst = pending;
    } else {
      setPending({ node: node.id, kind, port });
      return;
    }
    const next = wires.filter((w) => !(w.to.node === dst.node && w.to.port === dst.port));
    next.push({
      id: "w" + Math.random().toString(36).slice(2),
      from: { node: src.node },
      to: { node: dst.node, port: dst.port },
    });
    if (makesCycle(next)) {
      notify("That wire would create a feedback loop — not allowed in a combinational circuit.");
    } else {
      setWires(next);
    }
    setPending(null);
  };

  const deleteNode = (id: string) => {
    setNodes((ns) => ns.filter((n) => n.id !== id));
    setWires((ws) => ws.filter((w) => w.from.node !== id && w.to.node !== id));
    setPending(null);
  };
  const deleteWire = (id: string) => setWires((ws) => ws.filter((w) => w.id !== id));
  const toggleInput = (id: string) => setInputValues((v) => ({ ...v, [id]: !v[id] }));

  const addGate = (type: GateType) => {
    const k = gateSeq.current++;
    const id = "g" + k;
    setNodes((ns) => [...ns, { id, type, x: 312 + (k % 3) * 40, y: 70 + (k % 4) * 88 }]);
  };

  /** Reset the board to just the inputs + output (keeps the current level). */
  const clearBoard = () => {
    setNodes((ns) => ns.filter((n) => n.type === "INPUT" || n.type === "OUTPUT"));
    setWires([]);
    setPending(null);
  };

  /** Rebuild a fresh board for a (possibly different) level definition. */
  const loadBoard = useCallback((d: LevelDef) => {
    const b = buildBoard(d);
    gateSeq.current = 0;
    setNodes(b.nodes);
    setWires([]);
    setInputValues(b.inputValues);
    setPending(null);
  }, []);

  /* ---- pending wire preview source ---- */
  const pendPoint = useMemo(() => {
    if (!pending) return null;
    const n = nodes.find((x) => x.id === pending.node);
    if (!n) return null;
    const p = portsOf(n);
    return pending.kind === "out" ? p.output : p.inputs[pending.port];
  }, [pending, nodes]);

  return {
    nodes,
    wires,
    inputValues,
    pending,
    cursor,
    svgRef,
    memo,
    inWireMap,
    gateCount,
    pendPoint,
    setPending,
    onBodyDown,
    onPointerMove,
    endDrag,
    onPort,
    deleteNode,
    deleteWire,
    toggleInput,
    addGate,
    clearBoard,
    loadBoard,
  };
}

export type CircuitApi = ReturnType<typeof useCircuit>;
