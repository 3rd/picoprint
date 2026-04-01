import { renderALS } from "@/utils/render-als";
import { getTerminalWidth } from "@/utils/terminal";

export interface RenderContext {
  readonly offset: number;
  getWidth: () => number;
  indent: (amount?: number) => RenderContext;
  withOffset: (additionalOffset: number) => RenderContext;
}

export const createContext = (offset = 0): RenderContext => {
  if (offset < 0) {
    throw new Error("RenderContext offset cannot be negative");
  }

  return {
    offset,
    getWidth: () => Math.max(1, getTerminalWidth() - offset),
    indent: (amount = 2) => createContext(offset + amount),
    withOffset: (additionalOffset: number) => createContext(offset + additionalOffset),
  };
};

export const defaultContext = createContext(0);

// global contexts
const contextStack: RenderContext[] = [];
const globalIndentStack: RenderContext[] = [];

export const pushContext = (context: RenderContext) => {
  contextStack.push(context);
};

export const popContext = () => {
  contextStack.pop();
};

export const getCurrentContext = (): RenderContext => {
  const store = renderALS.getStore();
  if (store) return store.renderContext;
  if (contextStack.length > 0) return contextStack[contextStack.length - 1]!;
  if (globalIndentStack.length > 0) return globalIndentStack[globalIndentStack.length - 1]!;
  return defaultContext;
};

export const getEffectiveWidth = () => {
  const current = getCurrentContext();
  return current.getWidth();
};

export const getEffectiveOffset = () => {
  const current = getCurrentContext();
  return current.offset;
};

const toNonNegativeInt = (n: unknown) => {
  if (typeof n !== "number" || !Number.isFinite(n)) return 0;
  const i = Math.floor(n);
  return i > 0 ? i : 0;
};

export const increaseIndent = (amount?: number) => {
  const step = toNonNegativeInt(amount ?? 2);
  if (step === 0) return;
  const base = getCurrentContext();
  const next = createContext(base.offset + step);
  Object.defineProperty(next, "getWidth", {
    value: () => Math.max(1, base.getWidth() - step),
    writable: false,
  });
  globalIndentStack.push(next);
};

export const decreaseIndent = () => {
  globalIndentStack.pop();
};
