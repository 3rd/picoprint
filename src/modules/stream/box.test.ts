import { afterEach, beforeEach, describe, expect, it, mock, Mock } from "bun:test";
import { stripAnsi } from "@/utils/ansi";
import { box } from "./box";

describe("stream.box", () => {
  let originalLog: typeof console.log;
  let logSpy: Mock<(...args: unknown[]) => void>;
  let logOutput: string[];

  beforeEach(() => {
    originalLog = console.log;
    logOutput = [];
    logSpy = mock((...args) => {
      logOutput.push(args.map(String).join(" "));
    });
    console.log = logSpy;
  });

  afterEach(() => {
    console.log = originalLog;
  });

  it("opens, writes, and closes with borders once", () => {
    const s = box({ width: 30, title: "demo" });
    s.writeln("hello");
    s.write("world");
    s.close();

    expect(logSpy.mock.calls.length).toBeGreaterThanOrEqual(3);
    const clean = logOutput.map(stripAnsi);
    expect(clean[0]).toMatch(/[+┌].*[+┐]/); // top border
    expect(clean[clean.length - 1]).toMatch(/[+└].*[+┘]/); // bottom border
  });

  it("applies vertical padding when specified", () => {
    const s = box({ width: 20, paddingY: 1 });
    s.write("line");
    s.close();
    // top + pad + content + pad + bottom
    expect(logSpy).toHaveBeenCalledTimes(5);
  });
});
