import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { stripAnsi } from "@/utils/ansi";
import { colors } from "@/utils/colors";
import { _resetWriterStack, pushWriter } from "@/utils/writer";
import { configure, resetConfig } from "../config";
import { box } from "./box";

describe("stream.box", () => {
  let logOutput: string[];

  beforeEach(() => {
    logOutput = [];
    pushWriter((line) => logOutput.push(line));
  });

  afterEach(() => {
    _resetWriterStack();
    resetConfig();
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

  it("uses the configured default style", () => {
    configure({ defaults: { style: "rounded" } });
    const s = box({ width: 20 });
    s.write("line");
    s.close();

    expect(stripAnsi(logOutput[0] ?? "")).toContain("╭");
  });

  it("indents the full stream with offset", () => {
    const s = box({ width: 20, offset: 3 });
    s.write("line");
    s.close();

    expect(logOutput.length).toBeGreaterThan(0);
    for (const line of logOutput) expect(line).toMatch(/^ {3}/);
  });

  it("does not write more output after close", () => {
    const s = box({ width: 20 });
    s.write("before");
    s.close();
    const afterFirstClose = logOutput.length;

    s.close();
    s.write("after");
    s.writeln("after");
    s.write(123 as never);
    s.writeln(123 as never);

    expect(logOutput).toHaveLength(afterFirstClose);
    expect(logOutput.map(stripAnsi).join("\n")).not.toContain("after");
  });

  it("throws stable errors for invalid write arguments while open", () => {
    const s = box({ width: 20 });

    expect(() => s.write(123 as never)).toThrow("picoprint stream.box write text must be a string");
    expect(() => s.writeln(123 as never)).toThrow("picoprint stream.box writeln text must be a string");
  });

  it("throws stable errors for invalid color options", () => {
    expect(() => box(null as never)).toThrow("picoprint stream.box options must be an object");
    expect(() => box(new Date() as never)).toThrow("picoprint stream.box options must be an object");
    expect(() => box({ width: -1 })).toThrow("picoprint width must be a non-negative integer");
    expect(() => box({ width: 2 })).toThrow("picoprint width must be at least 3");
    expect(() => box({ width: 4, paddingX: 1 })).toThrow(
      "picoprint width must be at least 5 for paddingX 1",
    );
    expect(() => box({ padding: -1 })).toThrow("picoprint padding must be a non-negative integer");
    expect(() => box({ paddingX: -1 })).toThrow("picoprint paddingX must be a non-negative integer");
    expect(() => box({ paddingY: -1 })).toThrow("picoprint paddingY must be a non-negative integer");
    expect(() => box({ title: 12 as never })).toThrow("picoprint title must be a string");
    expect(() => box({ titleAlign: "middle" as never })).toThrow(
      "picoprint titleAlign must be one of:",
    );
    expect(() => box({ borderColor: "cyan" as never })).toThrow(
      "picoprint borderColor must be a function",
    );
    expect(() => box({ background: "cyan" as never })).toThrow(
      "picoprint background must be a function",
    );
    expect(() => box({ background: colors.blue as never })).toThrow(
      "picoprint background must be a background color function, got a foreground color function",
    );
    expect(() => box({ title: "Title", titleColor: "cyan" as never })).toThrow(
      "picoprint titleColor must be a function",
    );
    expect(logOutput).toHaveLength(0);
  });
});
