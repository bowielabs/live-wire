import type { PointerEvent } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import type { GateType, LevelDef, NodeData, Pending, Wire } from "../types";
import type { ShareV1 } from "../lib/share";
import { buildBoard } from "../engine/board";
import { portsOf, VBH, VBW } from "../engine/geometry";
import { makesCycle, simulate } from "../engine/simulate";
import { play } from "../lib/sound";

interface Drag {
  id: string;
  dx: number;
  dy: number;
}

/** Squared distance threshold (px²) for distinguishing a click from a drag. */
const DRAG_THRESHOLD_SQ = 64; // 8px

/** Anything with clientX/clientY coordinates — pointer, drag, mouse. */
interface Coords {
  clientX: number;
  clientY: number;
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
  /** Where (in svg coords) the user last started a port press — used to tell
      a click-to-wire from a drag-to-wire, and to cancel pending after a real
      drag that didn't land on another port. */
  const dragWireStartRef = useRef<{ x: number; y: number } | null>(null);

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

  /* ---- svg coordinate helper (works for pointer, drag, or mouse events) ---- */
  const toSvg = useCallback((e: Coords) => {
    const r = svgRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * VBW,
      y: ((e.clientY - r.top) / r.height) * VBH,
    };
  }, []);

  /** Shared wire-creation step used by both click-to-wire and drag-to-wire. */
  const connectPorts = useCallback(
    (
      src: { node: string },
      dst: { node: string; port: number },
      curWires: Wire[]
    ): boolean => {
      if (src.node === dst.node) return false; // no self-loops
      const next = curWires.filter((w) => !(w.to.node === dst.node && w.to.port === dst.port));
      next.push({
        id: "w" + Math.random().toString(36).slice(2),
        from: { node: src.node },
        to: { node: dst.node, port: dst.port },
      });
      if (makesCycle(next)) {
        notify("That wire would create a feedback loop — not allowed in a combinational circuit.");
        return false;
      }
      setWires(next);
      play("wire-connect");
      return true;
    },
    [notify]
  );

  /* ---- node interactions ---- */
  const onBodyDown = (e: PointerEvent, node: NodeData) => {
    e.stopPropagation();
    const p = toSvg(e);
    setDrag({ id: node.id, dx: p.x - node.x, dy: p.y - node.y });
    setPending(null);
    dragWireStartRef.current = null;
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

  /** PointerDown on a port — starts (or completes) a wire via the click flow. */
  const onPort = (e: PointerEvent, node: NodeData, kind: "in" | "out", port: number) => {
    const p = toSvg(e);
    if (!pending) {
      setPending({ node: node.id, kind, port });
      setCursor(p);
      dragWireStartRef.current = p;
      return;
    }
    if (pending.node === node.id) {
      setPending(null);
      dragWireStartRef.current = null;
      return;
    }
    if (pending.kind === "out" && kind === "in") {
      connectPorts(pending, { node: node.id, port }, wires);
    } else if (pending.kind === "in" && kind === "out") {
      connectPorts({ node: node.id }, pending, wires);
    } else {
      // same-kind on a different node: re-anchor the pending wire here
      setPending({ node: node.id, kind, port });
      dragWireStartRef.current = p;
      return;
    }
    setPending(null);
    dragWireStartRef.current = null;
  };

  /** PointerUp on a port — completes a wire via the drag flow. Silent for the
      same node or mismatched-kind pairings so the click flow keeps working. */
  const onPortUp = (e: PointerEvent, node: NodeData, kind: "in" | "out", port: number) => {
    if (!pending) return;
    if (pending.node === node.id) return;
    let connected = false;
    if (pending.kind === "out" && kind === "in") {
      connected = connectPorts(pending, { node: node.id, port }, wires);
    } else if (pending.kind === "in" && kind === "out") {
      connected = connectPorts({ node: node.id }, pending, wires);
    } else {
      return; // mismatched kinds; let click flow handle it on the next press
    }
    if (connected) {
      setPending(null);
      dragWireStartRef.current = null;
      e.stopPropagation();
    }
  };

  /** PointerUp on the SVG background — cancel a pending wire if the user
      clearly dragged (otherwise leave it set so the click flow can continue). */
  const maybeCancelPendingWire = (e: PointerEvent) => {
    if (!pending || !dragWireStartRef.current) return;
    const p = toSvg(e);
    const dx = p.x - dragWireStartRef.current.x;
    const dy = p.y - dragWireStartRef.current.y;
    if (dx * dx + dy * dy > DRAG_THRESHOLD_SQ) {
      setPending(null);
      dragWireStartRef.current = null;
    }
  };

  const deleteNode = (id: string) => {
    setNodes((ns) => ns.filter((n) => n.id !== id));
    setWires((ws) => ws.filter((w) => w.from.node !== id && w.to.node !== id));
    setPending(null);
  };
  const deleteWire = (id: string) => setWires((ws) => ws.filter((w) => w.id !== id));
  const toggleInput = (id: string) => setInputValues((v) => ({ ...v, [id]: !v[id] }));

  /** Click-to-place: add a gate at the conventional spawn coords. */
  const addGate = (type: GateType) => {
    const k = gateSeq.current++;
    const id = "g" + k;
    setNodes((ns) => [...ns, { id, type, x: 312 + (k % 3) * 40, y: 70 + (k % 4) * 88 }]);
    play("gate-place");
  };

  /** Drag-from-palette: add a gate at the given svg coordinates (clamped). */
  const addGateAt = (type: GateType, x: number, y: number) => {
    gateSeq.current++;
    const id = "g" + gateSeq.current;
    const cx = Math.max(8, Math.min(VBW - 100, x - 38));
    const cy = Math.max(6, Math.min(VBH - 56, y - 25));
    setNodes((ns) => [...ns, { id, type, x: cx, y: cy }]);
    play("gate-place");
  };

  /** Reset the board to just the inputs + output (keeps the current level). */
  const clearBoard = () => {
    setNodes((ns) => ns.filter((n) => n.type === "INPUT" || n.type === "OUTPUT"));
    setWires([]);
    setPending(null);
    dragWireStartRef.current = null;
  };

  /** Rebuild a fresh board for a (possibly different) level definition. */
  const loadBoard = useCallback((d: LevelDef) => {
    const b = buildBoard(d);
    gateSeq.current = 0;
    setNodes(b.nodes);
    setWires([]);
    setInputValues(b.inputValues);
    setPending(null);
    dragWireStartRef.current = null;
  }, []);

  /** Restore a shared circuit on top of a fresh board for the level. */
  const loadFromShare = useCallback((def: LevelDef, share: ShareV1) => {
    const b = buildBoard(def);

    /* Apply input toggles in declared order. */
    const newInputValues: Record<string, boolean> = { ...b.inputValues };
    def.inputs.forEach((_, idx) => {
      newInputValues["in" + idx] = share.i[idx] === 1;
    });

    /* Place gates with deterministic ids (g0..gN-1). */
    const gateNodes: NodeData[] = share.g.map(([type, x, y], idx) => ({
      id: "g" + idx,
      type: type as GateType,
      x: Math.max(8, Math.min(VBW - 100, x)),
      y: Math.max(6, Math.min(VBH - 56, y)),
    }));
    const newNodes = [...b.nodes, ...gateNodes];
    const nodeIds = new Set(newNodes.map((n) => n.id));

    /* Wires — skip any that reference unknown nodes or would create a cycle. */
    const acceptedWires: Wire[] = [];
    for (const [from, to, port] of share.w) {
      if (!nodeIds.has(from) || !nodeIds.has(to)) continue;
      const candidate: Wire = {
        id: "w" + Math.random().toString(36).slice(2),
        from: { node: from },
        to: { node: to, port },
      };
      if (!makesCycle([...acceptedWires, candidate])) acceptedWires.push(candidate);
    }

    gateSeq.current = gateNodes.length;
    setNodes(newNodes);
    setWires(acceptedWires);
    setInputValues(newInputValues);
    setPending(null);
    dragWireStartRef.current = null;
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
    toSvg,
    setPending,
    onBodyDown,
    onPointerMove,
    endDrag,
    onPort,
    onPortUp,
    maybeCancelPendingWire,
    deleteNode,
    deleteWire,
    toggleInput,
    addGate,
    addGateAt,
    clearBoard,
    loadBoard,
    loadFromShare,
  };
}

export type CircuitApi = ReturnType<typeof useCircuit>;
