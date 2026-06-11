import type { GateType } from "../types";
import { GATES } from "../engine/gates";
import { gateGeom } from "../engine/gateShapes";

/** Small textbook-shape icon of a gate, used in the palette buttons. */
export default function GateGlyph({ type, color }: { type: GateType; color: string }) {
  const x = 2.5, y = 3, w = 17, h = 13;
  const def = GATES[type];
  const geom = gateGeom(type, x, y, w, h);
  const tipX = x + w;
  const my = y + h / 2;
  const bubble = def.neg ? 2 : 0;
  const outStart = tipX + (def.neg ? 2 * bubble + 0.5 : 0);

  const leads = [];
  if (def.inputs === 1) leads.push(my);
  else if (def.inputs === 2) leads.push(y + h * 0.3, y + h * 0.7);

  return (
    <svg width={30} height={19} viewBox="0 0 30 19" style={{ flex: "0 0 auto", display: "block" }} aria-hidden>
      {leads.map((ly, i) => (
        <line key={i} x1={0} y1={ly} x2={geom.leadX} y2={ly} stroke={color} strokeWidth={1.3} />
      ))}
      <line x1={outStart} y1={my} x2={29} y2={my} stroke={color} strokeWidth={1.3} />
      {geom.back && <path d={geom.back} fill="none" stroke={color} strokeWidth={1.3} strokeLinecap="round" />}
      <path d={geom.body} fill="none" stroke={color} strokeWidth={1.3} strokeLinejoin="round" />
      {def.neg && <circle cx={tipX + bubble} cy={my} r={bubble} fill="none" stroke={color} strokeWidth={1.2} />}
    </svg>
  );
}
