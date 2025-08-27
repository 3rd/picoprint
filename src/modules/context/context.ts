import { getTerminalWidth } from "../../utils/terminal";

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
  return contextStack.length > 0 ? contextStack[contextStack.length - 1]! : defaultContext;
};

export const getEffectiveWidth = (): number => {
  const current = getCurrentContext();
  return current.getWidth();
};

export const getEffectiveOffset = (): number => {
  const current = getCurrentContext();
  return current.offset;
};

const toNonNegativeInt = (n: unknown): number => {
  if (typeof n !== "number" || !Number.isFinite(n)) return 0;
  const i = Math.floor(n);
  return i > 0 ? i : 0;
};

export const increaseIndent = (amount?: number): void => {
  const step = toNonNegativeInt(amount ?? 2);
  if (step === 0) return;
  const base = getCurrentContext();
  const next = createContext(base.offset + step);
  Object.defineProperty(next, "getWidth", {
    value: () => Math.max(1, base.getWidth() - step),
    writable: false,
  });
  pushContext(next);
  globalIndentStack.push(next);
};

export const decreaseIndent = (): void => {
  const last = globalIndentStack.pop();
  if (!last) return;
  const idx = (contextStack as RenderContext[]).lastIndexOf(last);
  if (idx >= 0) contextStack.splice(idx, 1);
};
