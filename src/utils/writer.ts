import { getCurrentContext } from "../modules/context";
import { renderALS, type Writer } from "./render-als";

export type { Writer } from "./render-als";

// fallback stack for imperative push/pop (used by tests)
const fallbackWriterStack: Writer[] = [];

export const write = (line: string) => {
  const store = renderALS.getStore();
  if (store) {
    store.writer(line);
    return;
  }
  const fw = fallbackWriterStack.at(-1);
  if (fw) {
    fw(line);
    return;
  }
  console.log(line);
};

export const pushWriter = (writer: Writer) => {
  fallbackWriterStack.push(writer);
};

export const popWriter = () => {
  fallbackWriterStack.pop();
};

export const captureLines = <T>(fn: () => T) => {
  const buffer: string[] = [];
  const parentContext = renderALS.getStore()?.renderContext ?? getCurrentContext();
  const store = { writer: (line: string) => buffer.push(line), renderContext: parentContext };
  const result = renderALS.run(store, fn);
  return { lines: buffer, result };
};

export const captureLinesAsync = async <T>(fn: () => Promise<T>) => {
  const buffer: string[] = [];
  const parentContext = renderALS.getStore()?.renderContext ?? getCurrentContext();
  const store = { writer: (line: string) => buffer.push(line), renderContext: parentContext };
  const result = await renderALS.run(store, fn);
  return { lines: buffer, result };
};

// shared by p.log and the chainable color .log: format args inline, join, write indent-aware
export const writeLog = (args: unknown[], formatArg: (arg: unknown) => string) => {
  const indent = " ".repeat(getCurrentContext().offset);
  const combined = args.map(formatArg).join(" ");
  const rendered = combined
    .split(/\r?\n/)
    .map((line) => indent + line)
    .join("\n");
  for (const line of rendered.split("\n")) write(line);
  return rendered;
};

export const renderAndReturn = (fn: () => void): string => {
  const { lines } = captureLines(fn);
  for (const l of lines) write(l);
  return lines.join("\n");
};

export type MaybeAsyncString<T> = T extends PromiseLike<unknown> ? Promise<string> : string;

export const isPromiseLike = (value: unknown): value is PromiseLike<unknown> => {
  return (
    value !== null && typeof value === "object" && typeof (value as { then?: unknown }).then === "function"
  );
};

export function format<T>(fn: () => T): MaybeAsyncString<T>;
export function format(fn: () => unknown): Promise<string> | string {
  if (typeof fn !== "function") throw new TypeError("picoprint format callback must be a function");
  const { lines, result } = captureLines(() => {
    const callbackResult = fn();
    return isPromiseLike(callbackResult) ? Promise.resolve(callbackResult) : callbackResult;
  });
  if (isPromiseLike(result)) return Promise.resolve(result).then(() => lines.join("\n"));
  return lines.join("\n");
}

// reset for testing
export const _resetWriterStack = () => {
  fallbackWriterStack.length = 0;
};
