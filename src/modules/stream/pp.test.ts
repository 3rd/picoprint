import { afterEach, beforeEach, describe, expect, it, mock, Mock } from "bun:test";
import { stripAnsi } from "@/utils/ansi";
import { pp } from "./pp";

describe("stream.pp", () => {
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

  it("prints simple primitive", () => {
    const s = pp();
    s.value("hello");
    const out = stripAnsi(logOutput[0] || "");
    expect(out).toContain('"hello"');
  });

  it("prints compact object inline when small", () => {
    const s = pp({ compact: true });
    s.value({ a: 1, b: true });
    const out = stripAnsi(logOutput[0] || "");
    expect(out).toContain("{");
    expect(out).toContain("a");
    expect(out).toContain("b");
  });

  it("prints multi-line tree for nested object", () => {
    const s = pp({ compact: true });
    s.value({ user: { id: 1, name: "Ada" }, arr: [1, 2, { n: 3 }] });
    expect(logOutput.length).toBeGreaterThan(1);
  });

  it("prints raw text with wrapping applied", () => {
    const s = pp();
    s.text("Some text to print");
    const out = stripAnsi(logOutput[0] || "");
    expect(out).toContain("Some text to print");
  });
});
