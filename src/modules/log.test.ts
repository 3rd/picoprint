import { afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { stripAnsi } from "@/utils/ansi";
import { _resetWriterStack, pushWriter } from "@/utils/writer";

let p: typeof import("@/.").default;

beforeAll(async () => {
  process.env.FORCE_COLOR = "1";
  const mod = await import("@/.");
  p = mod.default;
});

describe("p.log and chainable .log", () => {
  let output: string[];

  beforeEach(() => {
    output = [];
    pushWriter((line) => output.push(line));
    process.env.FORCE_COLOR = "1";
  });

  afterEach(() => {
    _resetWriterStack();
  });

  it("p.log prints any number of args and returns string", () => {
    const res = p.log("alpha", 42, true);
    expect(stripAnsi(res)).toBe("alpha 42 true");
    expect(output).toHaveLength(1);
    expect(stripAnsi(output[0] || "")).toContain("alpha 42 true");
  });

  it("p.log returns the exact rendered string including indentation", () => {
    p.indent(2);
    const res = p.log("alpha\nbeta");

    expect(stripAnsi(res)).toBe("  alpha\n  beta");
    expect(stripAnsi(output.join("\n"))).toBe(stripAnsi(res));

    p.dedent();
  });

  it("p.color.yellow.log styles all args and prints once", () => {
    const res = p.color.yellow.log("hello", 123);
    expect(typeof res).toBe("string");
    expect(output).toHaveLength(1);
    const first = stripAnsi(output[0] || "");
    expect(first).toContain("hello 123");
  });

  it("chainable color .log returns the exact rendered string including indentation", () => {
    p.indent(2);
    const res = p.color.yellow.log("hello\nworld");

    expect(stripAnsi(res)).toBe("  hello\n  world");
    expect(stripAnsi(output.join("\n"))).toBe(stripAnsi(res));

    p.dedent();
  });

  it("p.color.bold.yellow.log composes and styles", () => {
    const res = p.color.bold.yellow.log("X", "Y");
    expect(typeof res).toBe("string");
    expect(output).toHaveLength(1);
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
