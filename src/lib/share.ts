/* ============================================================
   Shareable circuit URLs.

   Encode { levelIdx, gates, wires, input toggles } into a compact
   base64url payload tucked into the URL fragment, e.g.
       https://gatewright.pages.dev/#share=eyJ2IjoxLC4uLn0
   so anyone with the link gets the exact same board state on load.
   ============================================================ */

import type { NodeData, Wire } from "../types";

export type ShareLevel = number | "s"; // "s" === sandbox

export interface ShareV1 {
  /** Format version. Bumped if the shape ever changes. */
  v: 1;
  /** Level index (0-99) or "s" for sandbox. */
  l: ShareLevel;
  /** Input toggles in declaration order, as 0/1. */
  i: number[];
  /** Gates: [type, x, y]. Position rounded to whole pixels. */
  g: [string, number, number][];
  /** Wires: [fromId, toId, toPort] using the same id naming the runtime
      uses (e.g. "in0", "out", "g3"). */
  w: [string, string, number][];
}

export interface EncodeInput {
  levelIdx: number | "sandbox";
  nodes: NodeData[];
  wires: Wire[];
  inputValues: Record<string, boolean>;
}

/* ---- base64url helpers (browser-only) ---- */
function b64urlEncode(s: string): string {
  return btoa(unescape(encodeURIComponent(s)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
function b64urlDecode(s: string): string {
  let t = s.replace(/-/g, "+").replace(/_/g, "/");
  while (t.length % 4) t += "=";
  return decodeURIComponent(escape(atob(t)));
}

/** Build a ShareV1 payload for the current board. */
export function buildShare(input: EncodeInput): ShareV1 {
  const gates = input.nodes.filter((n) => n.type !== "INPUT" && n.type !== "OUTPUT");
  const gateIdxById = new Map<string, number>();
  gates.forEach((g, i) => gateIdxById.set(g.id, i));
  const remap = (id: string): string => {
    const idx = gateIdxById.get(id);
    return idx === undefined ? id : "g" + idx;
  };

  const inputs = input.nodes.filter((n) => n.type === "INPUT");
  const i = inputs.map((n) => (input.inputValues[n.id] ? 1 : 0));
  const g = gates.map(
    (n) => [n.type, Math.round(n.x), Math.round(n.y)] as [string, number, number]
  );
  const w = input.wires.map(
    (wr) => [remap(wr.from.node), remap(wr.to.node), wr.to.port] as [string, string, number]
  );

  return {
    v: 1,
    l: input.levelIdx === "sandbox" ? "s" : input.levelIdx,
    i,
    g,
    w,
  };
}

/** Encode a payload as a base64url string suitable for `#share=`. */
export function encodeShare(input: EncodeInput): string {
  return b64urlEncode(JSON.stringify(buildShare(input)));
}

/** Decode a base64url payload; returns null on any malformed input. */
export function decodeShare(s: string): ShareV1 | null {
  try {
    const obj = JSON.parse(b64urlDecode(s));
    if (
      obj &&
      obj.v === 1 &&
      (typeof obj.l === "number" || obj.l === "s") &&
      Array.isArray(obj.i) &&
      Array.isArray(obj.g) &&
      Array.isArray(obj.w)
    ) {
      return obj as ShareV1;
    }
  } catch {
    /* fall through */
  }
  return null;
}

/** Build a full shareable URL for the current page + payload. */
export function shareUrl(payload: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${window.location.pathname}#share=${payload}`;
}

/** Pull a `#share=…` payload out of the current URL hash, if present. */
export function readShareFromUrl(): ShareV1 | null {
  if (typeof window === "undefined") return null;
  const m = window.location.hash.match(/[#&]share=([^&]+)/);
  if (!m) return null;
  return decodeShare(m[1]);
}
