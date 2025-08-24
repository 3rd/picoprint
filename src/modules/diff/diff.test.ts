import { afterEach, beforeEach, describe, expect, it, mock, Mock } from "bun:test";
import { stripAnsi } from "@/utils/ansi";
import { compare, deepDiff, diff, diffWords } from "./diff";

describe("diff", () => {
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

  describe("deepDiff", () => {
    it("should find no differences for identical objects", () => {
      const obj = { a: 1, b: 2 };
      const diffs = deepDiff(obj, obj);
      expect(diffs).toEqual([]);
    });

    it("should detect added properties", () => {
      const obj1 = { a: 1 };
      const obj2 = { a: 1, b: 2 };
      const diffs = deepDiff(obj1, obj2);

      expect(diffs).toHaveLength(1);
      expect(diffs[0]).toEqual({
        type: "added",
        path: ["b"],
        key: "b",
        value2: 2,
      });
    });

    it("should detect deleted properties", () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1 };
      const diffs = deepDiff(obj1, obj2);

      expect(diffs).toHaveLength(1);
      expect(diffs[0]).toEqual({
        type: "deleted",
        path: ["b"],
        key: "b",
        value1: 2,
      });
    });

    it("should detect modified properties", () => {
      const obj1 = { a: 1 };
      const obj2 = { a: 2 };
      const diffs = deepDiff(obj1, obj2);

      expect(diffs).toHaveLength(1);
      expect(diffs[0]).toEqual({
        type: "modified",
        path: ["a"],
        key: "a",
        value1: 1,
        value2: 2,
      });
    });

    it("should handle nested objects", () => {
      const obj1 = { a: { b: 1 } };
      const obj2 = { a: { b: 2 } };
      const diffs = deepDiff(obj1, obj2);

      expect(diffs).toHaveLength(1);
      expect(diffs[0]?.path).toEqual(["a", "b"]);
      expect(diffs[0]?.type).toBe("modified");
    });

    it("should handle arrays", () => {
      const arr1 = [1, 2, 3];
      const arr2 = [1, 2, 4];
      const diffs = deepDiff(arr1, arr2);

      expect(diffs).toHaveLength(1);
      expect(diffs[0]).toEqual({
        type: "modified",
        path: ["[2]"],
        key: "[2]",
        value1: 3,
        value2: 4,
      });
    });

    it("should detect type changes", () => {
      const obj1 = { a: "string" };
      const obj2 = { a: 123 };
      const diffs = deepDiff(obj1, obj2);

      expect(diffs).toHaveLength(1);
      expect(diffs[0]?.type).toBe("modified");
    });
  });

  describe("diff", () => {
    it("should display differences between objects", () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 3, c: 4 };

      diff(obj1, obj2);

      expect(logSpy).toHaveBeenCalled();
      const output = logOutput.join("\n");
      expect(output).toContain("DIFF OUTPUT");
      expect(output).toContain("modified");
      expect(output).toContain("added");
    });

    it("should handle simple value differences", () => {
      diff("old value", "new value");

      const output = logOutput.join("\n");
      expect(output).toContain("-");
      expect(output).toContain("+");
      expect(output).toContain("old value");
      expect(output).toContain("new value");
    });

    it("should show unchanged values when showUnchanged is true", () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 3 };

      diff(obj1, obj2, { showUnchanged: true });

      const output = stripAnsi(logOutput.join("\n"));
      expect(output).toContain("a:");
    });

    it("should respect maxDepth option", () => {
      const obj1 = { a: { b: { c: { d: 1 } } } };
      const obj2 = { a: { b: { c: { d: 2 } } } };

      diff(obj1, obj2, { maxDepth: 2 });

      const output = logOutput.join("\n");
      expect(output).toContain("...");
    });
  });

  describe("diffWords", () => {
    it("should detect word differences", () => {
      diffWords("hello world", "hello universe");

      expect(logSpy).toHaveBeenCalled();
      const output = logOutput.join("\n");
      expect(output).toContain("WORD DIFF");
      expect(output).toContain("-world");
      expect(output).toContain("+universe");
    });

    it("should handle identical texts", () => {
      diffWords("same text", "same text");

      const output = logOutput.join("\n");
      expect(output).toContain("same");
      expect(output).toContain("text");
      expect(output).not.toContain("+");
      expect(output).not.toContain("-");
    });

    it("should ignore case when ignoreCase is true", () => {
      diffWords("Hello World", "hello world", { ignoreCase: true });

      const output = logOutput.join("\n");
      expect(output).not.toContain("+");
      expect(output).not.toContain("-");
    });

    it("should ignore whitespace when ignoreWhitespace is true", () => {
      diffWords("hello   world", "hello world", { ignoreWhitespace: true });

      const output = logOutput.join("\n");
      expect(output).not.toContain("+");
      expect(output).not.toContain("-");
    });

    it("should handle added words", () => {
      diffWords("hello", "hello world");

      const output = logOutput.join("\n");
      expect(output).toContain("+world");
    });

    it("should handle deleted words", () => {
      diffWords("hello world", "hello");

      const output = logOutput.join("\n");
      expect(output).toContain("-world");
    });
  });

  describe("compare", () => {
    it("should display side-by-side comparison", () => {
      const left = { a: 1, b: 2 };
      const right = { a: 1, b: 3 };

      compare(left, right);

      expect(logSpy).toHaveBeenCalled();
      const output = logOutput.join("\n");
      expect(output).toContain("Left");
      expect(output).toContain("Right");
      expect(output).toContain("│");
    });

    it("should use custom labels", () => {
      compare({ a: 1 }, { a: 2 }, { labels: ["Before", "After"] });

      const output = logOutput.join("\n");
      expect(output).toContain("Before");
      expect(output).toContain("After");
    });

    it("should handle arrays", () => {
      compare([1, 2, 3], [4, 5, 6]);

      const output = logOutput.join("\n");
      expect(output).toContain("[");
      expect(output).toContain("1");
      expect(output).toContain("4");
    });

    it("should handle primitive values", () => {
      compare("string", 123);

      const output = logOutput.join("\n");
      expect(output).toContain("string");
      expect(output).toContain("123");
    });
  });

  describe("edge cases", () => {
    it("should handle null and undefined", () => {
      diff(null, undefined);
      diff({ a: null }, { a: undefined });

      const output = logOutput.join("\n");
      expect(output).toContain("null");
      expect(output).toContain("undefined");
    });

    it("should handle empty objects and arrays", () => {
      diff({}, []);
      diff([], {});

      expect(logSpy).toHaveBeenCalled();
    });

    it("should handle Date objects", () => {
      const date1 = new Date("2024-01-01");
      const date2 = new Date("2024-01-02");

      diff(date1, date2);

      const output = logOutput.join("\n");
      expect(output).toContain("2024-01-01");
      expect(output).toContain("2024-01-02");
    });

    it("should handle deeply nested structures", () => {
      const deep1 = { a: { b: { c: { d: { e: 1 } } } } };
      const deep2 = { a: { b: { c: { d: { e: 2 } } } } };

      diff(deep1, deep2);

      expect(logSpy).toHaveBeenCalled();
    });

    it("should handle circular references gracefully", () => {
      interface CircularObj {
        a: number;
        self?: CircularObj;
      }
      const obj1: CircularObj = { a: 1 };
      obj1.self = obj1;

      const obj2: CircularObj = { a: 2 };
      obj2.self = obj2;

      expect(() => diff(obj1, obj2)).not.toThrow();
    });
  });
});
