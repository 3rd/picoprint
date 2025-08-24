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

// global context for automatic nesting
const contextStack: RenderContext[] = [];

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
