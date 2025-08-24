/* eslint-disable no-control-regex */
import type { ColorFunction } from "./colors";

// make background persistent across SGR resets in the string
export const makePersistentBg = (bgFn: (s: string) => string) => {
  const sample = bgFn(" ");
  const match = /\[48;[^m]*m/.exec(sample);
  const open = match?.[0] ?? "";
  const close = "[49m";
  if (!open) return bgFn;
  const sgr = /\[([\d;]*)m/g;
  return (s: string) => {
    let out = "";
    let lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = sgr.exec(s))) {
      out += s.slice(lastIndex, m.index);
      const seq = m[0];
      const params = m[1] ?? "";
      const parts = params ? params.split(";") : [];
      const isBareReset = params === ""; // ESC[m]
      const isReset = isBareReset || parts.includes("0") || parts.includes("49");
      const hasBgSet = parts.some((p) => p === "48" || p.startsWith("48;"));
      out += seq + (isReset && !hasBgSet ? open : "");
      lastIndex = m.index + seq.length;
    }
    out += s.slice(lastIndex);
    return open + out + close;
  };
};

export const getBackgroundOrIdentity = (fn?: ColorFunction): ((s: string) => string) => {
  if (!fn) return (s: string) => s;
  return makePersistentBg(fn);
};

// apply background only to printable segments between SGR codes
export const applyBgToSegments = (s: string, bgFn: (x: string) => string) => {
  const sgr = /\[[\d;]*m/g;
  let out = "";
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = sgr.exec(s))) {
    const seg = s.slice(lastIndex, m.index);
    if (seg) out += bgFn(seg);
    out += m[0];
    lastIndex = m.index + m[0].length;
  }
  const tail = s.slice(lastIndex);
  if (tail) out += bgFn(tail);
  return out;
};
