import { useEffect, useState } from "react";
import { isMuted, subscribe, toggleMuted } from "../lib/sound";

/** React reactivity wrapper around the sound module's mute state. */
export function useMuted() {
  const [muted, setMuted] = useState(isMuted);
  useEffect(() => subscribe(() => setMuted(isMuted())), []);
  return { muted, toggle: toggleMuted };
}
