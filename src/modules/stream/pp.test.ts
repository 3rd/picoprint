import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { stripAnsi } from "@/utils/ansi";
import { _resetWriterStack, pushWriter } from "@/utils/writer";
import { pp } from "./pp";

describe("stream.pp", () => {
  let logOutput: string[];

  beforeEach(() => {
    logOutput = [];
    pushWriter((line) => logOutput.push(line));
  });

  afterEach(() => {
    _resetWriterStack();
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

  it("throws stable errors for invalid options", () => {
    expect(() => pp(null as never)).toThrow("picoprint stream.pp options must be an object");
    expect(() => pp(new Date() as never)).toThrow("picoprint stream.pp options must be an object");
    expect(() => pp({ maxDepth: -1 })).toThrow("picoprint maxDepth must be a non-negative integer");
    expect(() => pp({ compact: "yes" as never })).toThrow("picoprint compact must be a boolean");
    expect(logOutput).toHaveLength(0);
  });

  it("does not write more output after close", () => {
    const s = pp();
    s.text("before");
    s.close();
    const afterFirstClose = logOutput.length;

    s.close();
    s.text("after");
    s.text(123 as never);
    s.value({ after: true });

    expect(logOutput).toHaveLength(afterFirstClose);
    expect(logOutput.map(stripAnsi).join("\n")).not.toContain("after");
  });

  it("throws stable errors for invalid text arguments while open", () => {
    const s = pp();

    expect(() => s.text(123 as never)).toThrow("picoprint stream.pp text must be a string");
    expect(logOutput).toHaveLength(0);
  });
});
