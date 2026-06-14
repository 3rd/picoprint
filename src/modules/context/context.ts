import { renderALS } from "../../utils/render-als";
import { getTerminalWidth } from "../../utils/terminal";

export interface RenderContext {
  readonly offset: number;
  getWidth: () => number;
  indent: (amount?: number) => RenderContext;
  withOffset: (additionalOffset: number) => RenderContext;
}

export interface RenderOptions {
  offset?: number;
  renderContext?: RenderContext;
}

function assertNonNegativeFiniteNumber(value: unknown, optionName: string): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new RangeError(`picoprint ${optionName} must be a non-negative finite number`);
  }
}

function assertRenderContext(value: unknown): asserts value is RenderContext {
  if (
    !value ||
    typeof value !== "object" ||
    typeof (value as Partial<RenderContext>).getWidth !== "function" ||
    typeof (value as Partial<RenderContext>).indent !== "function" ||
    typeof (value as Partial<RenderContext>).withOffset !== "function"
  ) {
    throw new TypeError("picoprint renderContext must be a RenderContext");
  }
  assertNonNegativeFiniteNumber((value as Partial<RenderContext>).offset, "renderContext.offset");
}

const normalizeOffset = (value: number) => Math.floor(value);

export const createContext = (offset = 0): RenderContext => {
  assertNonNegativeFiniteNumber(offset, "offset");
  const normalizedOffset = normalizeOffset(offset);

  return {
    offset: normalizedOffset,
    getWidth: () => Math.max(1, getTerminalWidth() - normalizedOffset),
    indent: (amount = 2) => {
      assertNonNegativeFiniteNumber(amount, "indent amount");
      return createContext(normalizedOffset + normalizeOffset(amount));
    },
    withOffset: (additionalOffset: number) => {
      assertNonNegativeFiniteNumber(additionalOffset, "offset");
      return createContext(normalizedOffset + normalizeOffset(additionalOffset));
    },
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

const indentContext = (base: RenderContext, step: number) => {
  const next = createContext(base.offset + step);
  Object.defineProperty(next, "getWidth", {
    value: () => Math.max(1, base.getWidth() - step),
    writable: false,
  });
  return next;
};

export const resolveRenderContext = (options: RenderOptions = {}) => {
  const base = options.renderContext === undefined ? getCurrentContext() : options.renderContext;
  assertRenderContext(base);
  if (options.offset === undefined) return base;
  assertNonNegativeFiniteNumber(options.offset, "offset");
  const offset = normalizeOffset(options.offset);
  return offset === 0 ? base : indentContext(base, offset);
};

export const increaseIndent = (amount = 2) => {
  assertNonNegativeFiniteNumber(amount, "indent amount");
  const step = normalizeOffset(amount);
  if (step === 0) return;
  const store = renderALS.getStore();
  if (store) {
    store.indentStack ??= [];
    store.indentStack.push(store.renderContext);
    store.renderContext = indentContext(store.renderContext, step);
    return;
  }
  const base = getCurrentContext();
  globalIndentStack.push(indentContext(base, step));
};

export const decreaseIndent = () => {
  const store = renderALS.getStore();
  const previous = store?.indentStack?.pop();
  if (store && previous) {
    store.renderContext = previous;
    return;
  }
  if (store) return;
  globalIndentStack.pop();
};
