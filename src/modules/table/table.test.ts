import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { _resetWriterStack, pushWriter } from "@/utils/writer";
import { compareInTable, table } from "./table";

describe("table", () => {
  let logOutput: string[];

  beforeEach(() => {
    logOutput = [];
    pushWriter((line) => logOutput.push(line));
  });

  afterEach(() => {
    _resetWriterStack();
  });

  describe("basic table rendering", () => {
    it("should render an array of objects as a table", () => {
      const data = [
        { name: "Alice", age: 30, city: "New York" },
        { name: "Bob", age: 25, city: "London" },
      ];

      table(data);

      expect(logOutput.length).toBeGreaterThan(0);
      const output = logOutput.join("\n");
      expect(output).toContain("name");
      expect(output).toContain("age");
      expect(output).toContain("city");
      expect(output).toContain("Alice");
      expect(output).toContain("30");
      expect(output).toContain("New York");
      expect(output).toContain("Bob");
      expect(output).toContain("25");
      expect(output).toContain("London");
    });

    it("should render a simple array as a single column table", () => {
      const data = ["apple", "banana", "cherry"];

      table(data);

      expect(logOutput.length).toBeGreaterThan(0);
      const output = logOutput.join("\n");
      expect(output).toContain("value");
      expect(output).toContain("apple");
      expect(output).toContain("banana");
      expect(output).toContain("cherry");
    });

    it("should infer columns from all object rows", () => {
      const data = [{ name: "Alice" }, { age: 30 }, { city: "London" }];

      table(data);

      const output = logOutput.join("\n");
      expect(output).toContain("name");
      expect(output).toContain("age");
      expect(output).toContain("city");
      expect(output).toContain("Alice");
      expect(output).toContain("30");
      expect(output).toContain("London");
    });

    it("should render a Map as a key-value table", () => {
      const data = new Map<string, unknown>([
        ["name", "Alice"],
        ["age", 30],
      ]);

      table(data);

      expect(logOutput.length).toBeGreaterThan(0);
      const output = logOutput.join("\n");
      expect(output).toContain("key");
      expect(output).toContain("value");
      expect(output).toContain("name");
      expect(output).toContain("Alice");
      expect(output).toContain("age");
      expect(output).toContain("30");
    });

    it("should render an object as a key-value table", () => {
      const data = {
        name: "Alice",
        age: 30,
        city: "New York",
      };

      table(data);

      expect(logOutput.length).toBeGreaterThan(0);
      const output = logOutput.join("\n");
      expect(output).toContain("key");
      expect(output).toContain("value");
      expect(output).toContain("name");
      expect(output).toContain("Alice");
      expect(output).toContain("age");
      expect(output).toContain("30");
    });

    it("should render a null-prototype plain object as a key-value table", () => {
      const data = Object.assign(Object.create(null) as Record<string, unknown>, { name: "Alice" });

      table(data);

      const output = logOutput.join("\n");
      expect(output).toContain("key");
      expect(output).toContain("value");
      expect(output).toContain("name");
      expect(output).toContain("Alice");
    });

    it("should render arrays of non-record values as a single value column", () => {
      table([new Date("2024-01-01"), "ok"]);

      const output = logOutput.join("\n");
      expect(output).toContain("value");
      expect(output).toContain("2024-01-01");
      expect(output).toContain("ok");
    });

    it("should render regexp and error cells by value", () => {
      table([{ pattern: /ok/i, failure: new Error("boom") }]);

      const output = logOutput.join("\n");
      expect(output).toContain("/ok/i");
      expect(output).toContain("[Error: boom]");
      expect(output).not.toContain("[Object]");
    });

    it("should handle empty arrays", () => {
      table([]);

      const output = logOutput.join("\n");
      expect(output).toContain("─");
    });

    it("should reject invalid table data", () => {
      expect(() => table("invalid" as never)).toThrow(
        "picoprint table data must be an array, plain object, or Map",
      );
    });
  });

  describe("table options", () => {
    it("should show index when showIndex is true", () => {
      const data = ["a", "b", "c"];

      table(data, { showIndex: true });

      const output = logOutput.join("\n");
      expect(output).toContain("#");
      expect(output).toContain("1");
      expect(output).toContain("2");
      expect(output).toContain("3");
    });

    it("should respect custom columns", () => {
      const data = [
        { name: "Alice", age: 30, city: "New York", country: "USA" },
        { name: "Bob", age: 25, city: "London", country: "UK" },
      ];

      table(data, { columns: ["name", "city"] });

      const output = logOutput.join("\n");
      expect(output).toContain("name");
      expect(output).toContain("city");
      expect(output).not.toContain("age");
      expect(output).not.toContain("country");
    });

    it("should handle column alignment", () => {
      const data = [{ left: "L", center: "C", right: "R" }];

      table(data, {
        align: {
          left: "left",
          center: "center",
          right: "right",
        },
      });

      expect(logOutput.length).toBeGreaterThan(0);
      const output = logOutput.join("\n");
      expect(output).toContain("L");
      expect(output).toContain("C");
      expect(output).toContain("R");
    });

    it("should truncate long content with maxWidth", () => {
      const data = [{ text: "This is a very long text that should be truncated" }];

      table(data, { maxWidth: 10 });

      const output = logOutput.join("\n");
      expect(output).toContain("...");
    });

    it("should handle compact mode", () => {
      const data = [{ a: 1, b: 2 }];

      table(data, { compact: true });

      expect(logOutput.length).toBeGreaterThan(0);
    });

    it("should throw stable errors for invalid table options", () => {
      const data = [{ a: 1 }];

      expect(() => table(null as never)).toThrow(
        "picoprint table data must be an array, plain object, or Map",
      );
      expect(() => table(new Date("2024-01-01") as never)).toThrow(
        "picoprint table data must be an array, plain object, or Map",
      );
      expect(() => table(/ok/ as never)).toThrow(
        "picoprint table data must be an array, plain object, or Map",
      );
      expect(() => table(new Set([1]) as never)).toThrow(
        "picoprint table data must be an array, plain object, or Map",
      );
      expect(() => table([{ a: 1 }, new Date("2024-01-01")] as never)).toThrow(
        "picoprint table data rows[1] must be a plain object",
      );
      expect(() => table(data, 12 as never)).toThrow("picoprint table options must be an object");
      expect(() => table(data, null as never)).toThrow("picoprint table options must be an object");
      expect(() => table(data, new Date() as never)).toThrow("picoprint table options must be an object");
      expect(() => table(data, { columns: "a" as never })).toThrow("picoprint columns must be string[]");
      expect(() => table(data, { maxWidth: -1 })).toThrow(
        "picoprint maxWidth must be a non-negative integer",
      );
      expect(() => table(data, { align: { a: "middle" as never } })).toThrow(
        "picoprint align.a must be one of:",
      );
      expect(() => table(data, { align: new Date() as never })).toThrow("picoprint align must be an object");
      expect(() => table(data, { showIndex: "yes" as never })).toThrow(
        "picoprint showIndex must be a boolean",
      );
      expect(() => table(data, { compact: "yes" as never })).toThrow("picoprint compact must be a boolean");
      expect(logOutput).toHaveLength(0);
    });
  });

  describe("compareInTable", () => {
    it("should compare two objects in a table", () => {
      const left = { a: 1, b: 2, c: 3 };
      const right = { a: 1, b: 5, d: 4 };
      const options: NonNullable<Parameters<typeof compareInTable>[2]> = { maxWidth: 12 };

      compareInTable(left, right, options);

      const output = logOutput.join("\n");
      expect(output).toContain("key");
      expect(output).toContain("left");
      expect(output).toContain("right");
      expect(output).toContain("match");
      expect(output).toContain("✓");
      expect(output).toContain("✗");
    });

    it("should keep comparison columns even when unsafe options include columns", () => {
      const options = { columns: ["key"] } as never;

      compareInTable({ a: 1 }, { a: 2 }, options);

      const output = logOutput.join("\n");
      expect(output).toContain("key");
      expect(output).toContain("left");
      expect(output).toContain("right");
      expect(output).toContain("match");
    });

    it("should throw stable errors for invalid compare options", () => {
      expect(() => compareInTable(null as never, { a: 1 })).toThrow(
        "picoprint table.compare left must be a plain object",
      );
      expect(() => compareInTable([] as never, { a: 1 })).toThrow(
        "picoprint table.compare left must be a plain object",
      );
      expect(() => compareInTable(new Date("2024-01-01") as never, { a: 1 })).toThrow(
        "picoprint table.compare left must be a plain object",
      );
      expect(() => compareInTable({ a: 1 }, null as never)).toThrow(
        "picoprint table.compare right must be a plain object",
      );
      expect(() => compareInTable({ a: 1 }, [] as never)).toThrow(
        "picoprint table.compare right must be a plain object",
      );
      expect(() => compareInTable({ a: 1 }, { a: 2 }, 12 as never)).toThrow(
        "picoprint table.compare options must be an object",
      );
      expect(() => compareInTable({ a: 1 }, { a: 2 }, new Date() as never)).toThrow(
        "picoprint table.compare options must be an object",
      );
      expect(logOutput).toHaveLength(0);
    });
  });

  describe("data type formatting", () => {
    it("should format different data types with colors", () => {
      const data = [
        {
          string: "text",
          number: 42,
          boolean: true,
          null: null,
          undefined,
          date: new Date("2024-01-01"),
          object: { nested: true },
        },
      ];

      table(data);

      const output = logOutput.join("\n");
      expect(output).toContain("text");
      expect(output).toContain("42");
      expect(output).toContain("true");
      expect(output).toContain("null");
      expect(output).toContain("undefined");
      expect(output).toContain("2024-01-01");
      expect(output).toContain("[Object]");
    });
  });
});
