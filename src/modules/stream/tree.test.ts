import { afterEach, beforeEach, describe, expect, it, mock, Mock } from "bun:test";
import { stripAnsi } from "@/utils/ansi";
import { tree } from "./tree";

describe("stream.tree", () => {
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

  it("prints nodes and respects enter/leave depth", () => {
    const tr = tree();
    tr.node("root");
    tr.enter("branch");
    tr.node("leaf");
    tr.leave();
    tr.close();

    const clean = logOutput.map(stripAnsi);
    expect(clean[0]).toMatch(/•\s*root/);
    // after enter, subsequent node should include extra indent unit "│ " at least once
    expect(clean.some((l) => /│\s*•\s*leaf/.test(l))).toBeTrue();
  });

  it("kv prints compact array inline and large arrays as [Array(n)]", () => {
    const tr = tree();
    tr.kv("small", [1, 2, 3]);
    tr.kv("large", [1, 2, 3, 4, 5, 6]);

    const clean = logOutput.map(stripAnsi);
    expect(clean.find((l) => l.includes("small: ["))).toBeDefined();
    expect(clean.find((l) => l.includes("Array(6)"))).toBeDefined();
  });
});
