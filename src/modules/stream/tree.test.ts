import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { stripAnsi } from "@/utils/ansi";
import { _resetWriterStack, pushWriter } from "@/utils/writer";
import { tree } from "./tree";

describe("stream.tree", () => {
  let logOutput: string[];

  beforeEach(() => {
    logOutput = [];
    pushWriter((line) => logOutput.push(line));
  });

  afterEach(() => {
    _resetWriterStack();
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

  it("prints provided empty enter labels and omits absent labels", () => {
    const tr = tree();
    tr.enter("");
    tr.node("child");
    tr.leave();
    tr.enter();
    tr.node("other child");

    const clean = logOutput.map(stripAnsi);
    expect(clean[0]).toMatch(/^•\s*$/);
    expect(clean[1]).toMatch(/│\s*•\s*child/);
    expect(clean[2]).toMatch(/│\s*•\s*other child/);
  });

  it("kv prints compact array inline and large arrays as [Array(n)]", () => {
    const tr = tree();
    tr.kv("small", [1, 2, 3]);
    tr.kv("large", [1, 2, 3, 4, 5, 6]);

    const clean = logOutput.map(stripAnsi);
    expect(clean.find((l) => l.includes("small: ["))).toBeDefined();
    expect(clean.find((l) => l.includes("Array(6)"))).toBeDefined();
  });

  it("does not write more output after close", () => {
    const tr = tree();
    tr.node("before");
    tr.close();
    const afterFirstClose = logOutput.length;

    tr.close();
    tr.node("after");
    tr.node(123 as never);
    tr.enter("after");
    tr.enter(123 as never);
    tr.kv("after", true);
    tr.kv(123 as never, true);
    tr.leave();
    tr.leave("1" as never);

    expect(logOutput).toHaveLength(afterFirstClose);
    expect(logOutput.map(stripAnsi).join("\n")).not.toContain("after");
  });

  it("throws stable errors for invalid method arguments while open", () => {
    const tr = tree();

    expect(() => tr.node(123 as never)).toThrow("picoprint stream.tree node text must be a string");
    expect(() => tr.enter(123 as never)).toThrow("picoprint stream.tree enter text must be a string");
    expect(() => tr.kv(123 as never, true)).toThrow("picoprint stream.tree kv key must be a string");
    expect(() => tr.leave("1" as never)).toThrow(
      "picoprint stream.tree leave count must be a non-negative integer",
    );
    expect(() => tr.leave(-1)).toThrow("picoprint stream.tree leave count must be a non-negative integer");
    expect(logOutput).toHaveLength(0);
  });

  it("throws stable errors for invalid color options", () => {
    expect(() => tree(null as never)).toThrow("picoprint stream.tree options must be an object");
    expect(() => tree(new Date() as never)).toThrow("picoprint stream.tree options must be an object");
    expect(() => tree({ bullet: 1 as never })).toThrow("picoprint bullet must be a string");
    expect(() => tree({ indent: 1 as never })).toThrow("picoprint indent must be a string");
    expect(() => tree({ colors: "cyan" as never })).toThrow("picoprint stream.tree colors must be an object");
    expect(() => tree({ colors: { node: "cyan" as never } })).toThrow(
      "picoprint stream.tree colors.node must be a function",
    );
    expect(logOutput).toHaveLength(0);
  });

  it("accepts nested color options", () => {
    const tr = tree({
      colors: { node: (text) => `<node:${text}>` },
    });
    tr.node("root");

    const output = logOutput.map(stripAnsi).join("\n");
    expect(output).toContain("<node:root>");
  });
});
