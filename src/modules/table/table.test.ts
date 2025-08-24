import { afterEach, beforeEach, describe, expect, it, mock, Mock } from "bun:test";
import { compareInTable, table } from "./table";

describe("table", () => {
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

  describe("basic table rendering", () => {
    it("should render an array of objects as a table", () => {
      const data = [
        { name: "Alice", age: 30, city: "New York" },
        { name: "Bob", age: 25, city: "London" },
      ];

      table(data);

      expect(logSpy).toHaveBeenCalled();
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

      expect(logSpy).toHaveBeenCalled();
      const output = logOutput.join("\n");
      expect(output).toContain("value");
      expect(output).toContain("apple");
      expect(output).toContain("banana");
      expect(output).toContain("cherry");
    });

    it("should render an object as a key-value table", () => {
      const data = {
        name: "Alice",
        age: 30,
        city: "New York",
      };

      table(data);

      expect(logSpy).toHaveBeenCalled();
      const output = logOutput.join("\n");
      expect(output).toContain("key");
      expect(output).toContain("value");
      expect(output).toContain("name");
      expect(output).toContain("Alice");
      expect(output).toContain("age");
      expect(output).toContain("30");
    });

    it("should handle empty arrays", () => {
      table([]);

      const output = logOutput.join("\n");
      expect(output).toContain("─");
    });

    it("should handle invalid data", () => {
      table("invalid");

      expect(logOutput.join("\n")).toContain("Error: Invalid data for table");
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

      expect(logSpy).toHaveBeenCalled();
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

      expect(logSpy).toHaveBeenCalled();
    });
  });

  describe("ppTable alias", () => {
    it("should work the same as table", () => {
      const data = [{ test: "value" }];

      table(data);

      expect(logSpy).toHaveBeenCalled();
      expect(logOutput.join("\n")).toContain("test");
    });
  });

  describe("compareInTable", () => {
    it("should compare two objects in a table", () => {
      const left = { a: 1, b: 2, c: 3 };
      const right = { a: 1, b: 5, d: 4 };

      compareInTable(left, right);

      const output = logOutput.join("\n");
      expect(output).toContain("key");
      expect(output).toContain("left");
      expect(output).toContain("right");
      expect(output).toContain("match");
      expect(output).toContain("✓");
      expect(output).toContain("✗");
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
