import { afterEach, beforeAll, beforeEach, describe, expect, it, mock, Mock } from "bun:test";
import { stripAnsi } from "@/utils/ansi";

let p: typeof import("@/.").default;

beforeAll(async () => {
  process.env.FORCE_COLOR = "1";
  const mod = await import("@/.");
  p = mod.default;
});

describe("p.log and chainable .log", () => {
  let originalLog: typeof console.log;
  let logSpy: Mock<(...args: unknown[]) => void>;
  let output: string[];

  beforeEach(() => {
    originalLog = console.log;
    output = [];
    logSpy = mock((...args) => {
      output.push(args.map(String).join(" "));
    });
    console.log = logSpy;
    process.env.FORCE_COLOR = "1";
  });

  afterEach(() => {
    console.log = originalLog;
  });

  it("p.log prints any number of args and returns string", () => {
    const res = p.log("alpha", 42, true);
    expect(stripAnsi(res)).toBe("alpha 42 true");
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(stripAnsi(output[0] || "")).toContain("alpha 42 true");
  });

  it("p.yellow.log styles all args and prints once", () => {
    const res = p.yellow.log("hello", 123);
    expect(typeof res).toBe("string");
    expect(logSpy).toHaveBeenCalledTimes(1);
    const first = stripAnsi(output[0] || "");
    expect(first).toContain("hello 123");
  });

  it("p.bold.yellow.log composes and styles", () => {
    const res = p.bold.yellow.log("X", "Y");
    expect(typeof res).toBe("string");
    expect(logSpy).toHaveBeenCalledTimes(1);
    const first = stripAnsi(output[0] || "");
    expect(first).toContain("X Y");
  });

  it("p.log prints objects (not [object Object])", () => {
    const obj = { a: 1, b: { c: 2 } };
    const res = p.log(obj);
    const clean = stripAnsi(res);
    expect(clean).toMatch(/a\s*:/);
    expect(clean).toMatch(/b\s*:/);
    expect(clean).toContain("2");
    expect(clean).not.toContain("[object Object]");
  });
});
