import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { stripAnsi } from "@/utils/ansi";
import { _resetWriterStack, pushWriter } from "@/utils/writer";
import { box } from "./box";

describe("stream.box", () => {
  let logOutput: string[];

  beforeEach(() => {
    logOutput = [];
    pushWriter((line) => logOutput.push(line));
  });

  afterEach(() => {
    _resetWriterStack();
  });

  it("opens, writes, and closes with borders once", () => {
    const s = box({ width: 30, title: "demo" });
    s.writeln("hello");
    s.write("world");
    s.close();

    expect(logOutput.length).toBeGreaterThanOrEqual(3);
    const clean = logOutput.map(stripAnsi);
    expect(clean[0]).toMatch(/[+┌].*[+┐]/); // top border
    expect(clean[clean.length - 1]).toMatch(/[+└].*[+┘]/); // bottom border
  });

  it("applies vertical padding when specified", () => {
    const s = box({ width: 20, paddingY: 1 });
    s.write("line");
    s.close();
    // top + pad + content + pad + bottom
    expect(logOutput).toHaveLength(5);
  });
});
