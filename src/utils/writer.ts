import { getCurrentContext } from "@/modules/context";
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

export const renderAndReturn = (fn: () => void): string => {
  const { lines } = captureLines(fn);
  for (const l of lines) write(l);
  return lines.join("\n");
};

export const format = (fn: () => void) => {
  const { lines } = captureLines(fn);
  return lines.join("\n");
};

// reset for testing
export const _resetWriterStack = () => {
  fallbackWriterStack.length = 0;
};
