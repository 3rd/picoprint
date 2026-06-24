import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { stripAnsi } from "@/utils/ansi";
import { _resetWriterStack, pushWriter } from "@/utils/writer";
import { compare, deepDiff, diff, diffWords } from "./diff";

describe("diff", () => {
  let logOutput: string[];

  beforeEach(() => {
    logOutput = [];
    pushWriter((line) => logOutput.push(line));
  });

  afterEach(() => {
    _resetWriterStack();
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
        pathSegments: [{ kind: "key", key: "b" }],
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
        pathSegments: [{ kind: "key", key: "b" }],
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
        pathSegments: [{ kind: "key", key: "a" }],
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
        pathSegments: [{ kind: "index", index: 2 }],
        key: "[2]",
        value1: 3,
        value2: 4,
      });
    });

    it("should detect changed built-in object values", () => {
      expect(deepDiff(new Date("2024-01-01"), new Date("2024-01-02"))).toEqual([
        {
          type: "modified",
          path: [],
          pathSegments: [],
          key: "root",
          value1: new Date("2024-01-01"),
          value2: new Date("2024-01-02"),
        },
      ]);
      expect(deepDiff(new Map([["a", 1]]), new Map([["a", 2]]))).toEqual([
        {
          type: "modified",
          path: ["[0]", "[1]"],
          pathSegments: [
            { kind: "index", index: 0 },
            { kind: "index", index: 1 },
          ],
          key: "[1]",
          value1: 1,
          value2: 2,
        },
      ]);
      expect(deepDiff(new Set([1]), new Set([2]))).toEqual([
        {
          type: "modified",
          path: ["[0]"],
          pathSegments: [{ kind: "index", index: 0 }],
          key: "[0]",
          value1: 1,
          value2: 2,
        },
      ]);
    });

    it("should detect type changes", () => {
      const obj1 = { a: "string" };
      const obj2 = { a: 123 };
      const diffs = deepDiff(obj1, obj2);

      expect(diffs).toHaveLength(1);
      expect(diffs[0]?.type).toBe("modified");
    });

    it("should not report matching self-references as differences", () => {
      interface CircularObj {
        name: string;
        self?: CircularObj;
      }
      const obj1: CircularObj = { name: "same" };
      obj1.self = obj1;

      const obj2: CircularObj = { name: "same" };
      obj2.self = obj2;

      expect(deepDiff(obj1, obj2)).toEqual([]);
    });

    it("should report when a self-reference changes to another value", () => {
      interface CircularObj {
        name: string;
        self?: CircularObj;
      }
      const obj1: CircularObj = { name: "same" };
      obj1.self = obj1;
      const obj2 = { name: "same", self: 42 };

      const diffs = deepDiff(obj1, obj2);

      expect(diffs).toHaveLength(1);
      const [diffNode] = diffs;
      if (diffNode?.type !== "modified") throw new Error("expected a modified diff node");
      expect(diffNode.path).toEqual(["self"]);
      expect(diffNode.pathSegments).toEqual([{ kind: "key", key: "self" }]);
      expect(diffNode.key).toBe("self");
      expect(diffNode.value1).toBe(obj1);
      expect(diffNode.value2).toBe(42);
    });

    it("should expose non-lossy path segments alongside display paths", () => {
      const objectKeyDiff = deepDiff({ "[0]": "old" }, { "[0]": "new" });
      expect(objectKeyDiff[0]?.path).toEqual(["[0]"]);
      expect(objectKeyDiff[0]?.pathSegments).toEqual([{ kind: "key", key: "[0]" }]);

      const arrayIndexDiff = deepDiff(["old"], ["new"]);
      expect(arrayIndexDiff[0]?.path).toEqual(["[0]"]);
      expect(arrayIndexDiff[0]?.pathSegments).toEqual([{ kind: "index", index: 0 }]);
    });
  });

  describe("diff", () => {
    it("should display differences between objects", () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 3, c: 4 };

      diff(obj1, obj2);

      expect(logOutput.length).toBeGreaterThan(0);
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

    it("should not show changes for equal root leaf objects", () => {
      const cases: [unknown, unknown][] = [
        [new Date("2024-01-01T00:00:00Z"), new Date("2024-01-01T00:00:00Z")],
        [/ok/i, /ok/i],
        [new Error("same"), new Error("same")],
      ];

      for (const [left, right] of cases) {
        logOutput = [];
        diff(left, right);

        const output = stripAnsi(logOutput.join("\n"));
        expect(output).not.toMatch(/^[+-] /m);
      }
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

    it("should show Map entry changes in visual diffs", () => {
      diff(new Map([["a", 1]]), new Map([["a", 2]]));

      const output = stripAnsi(logOutput.join("\n"));
      expect(output).toContain("~ [0]:");
      expect(output).toContain("~ [1]:");
      expect(output).toContain("- 1");
      expect(output).toContain("+ 2");
      expect(output).not.toContain("[Object]");
    });

    it("should show Set entry changes in visual diffs", () => {
      diff(new Set([1]), new Set([2]));

      const output = stripAnsi(logOutput.join("\n"));
      expect(output).toContain("~ [0]:");
      expect(output).toContain("- 1");
      expect(output).toContain("+ 2");
      expect(output).not.toContain("[Object]");
    });

    it("should throw stable errors for invalid diff options", () => {
      expect(() => diff({ a: 1 }, { a: 2 }, 12 as never)).toThrow("picoprint diff options must be an object");
      expect(() => diff({ a: 1 }, { a: 2 }, null as never)).toThrow(
        "picoprint diff options must be an object",
      );
      expect(() => diff({ a: 1 }, { a: 2 }, new Date() as never)).toThrow(
        "picoprint diff options must be an object",
      );
      expect(() => diff({ a: 1 }, { a: 2 }, { showUnchanged: "yes" as never })).toThrow(
        "picoprint showUnchanged must be a boolean",
      );
      expect(() => diff({ a: 1 }, { a: 2 }, { compact: "yes" as never })).toThrow(
        "picoprint compact must be a boolean",
      );
      expect(() => diff({ a: 1 }, { a: 2 }, { maxDepth: -1 })).toThrow(
        "picoprint maxDepth must be a non-negative integer",
      );
      expect(logOutput).toHaveLength(0);
    });
  });

  describe("diffWords", () => {
    it("should detect word differences", () => {
      diffWords("hello world", "hello universe");

      expect(logOutput.length).toBeGreaterThan(0);
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

    it("should keep shifted unchanged words unchanged", () => {
      diffWords("hello world", "hello beautiful world");

      const output = logOutput.join("\n");
      expect(output).toContain("+beautiful");
      expect(output).toContain("world");
      expect(output).not.toContain("-world");
      expect(output).not.toContain("+world");
    });

    it("should handle deleted words", () => {
      diffWords("hello world", "hello");

      const output = logOutput.join("\n");
      expect(output).toContain("-world");
    });

    it("should indent word diffs with offset", () => {
      diffWords("hello world", "hello universe", { offset: 3 });

      expect(logOutput.length).toBeGreaterThan(0);
      for (const line of logOutput.filter(Boolean)) expect(line).toMatch(/^ {3}/);
    });

    it("should diff large unrelated word inputs without requiring an unbounded LCS matrix", () => {
      const left = Array.from({ length: 600 }, (_, index) => `left-${index}`);
      const right = Array.from({ length: 600 }, (_, index) => `right-${index}`);

      diffWords(left.join(" "), right.join(" "));

      const output = stripAnsi(logOutput.join("\n"));
      expect(output).toContain("-left-0");
      expect(output).toContain("+right-0");
      expect(output).toContain("-left-599");
      expect(output).toContain("+right-599");
    });

    it("should throw stable errors for invalid word diff options", () => {
      expect(() => diffWords(undefined as never, "two")).toThrow(
        "picoprint diff.words first argument must be a string",
      );
      expect(() => diffWords(1 as never, "two")).toThrow(
        "picoprint diff.words first argument must be a string",
      );
      expect(() => diffWords("one", undefined as never)).toThrow(
        "picoprint diff.words second argument must be a string",
      );
      expect(() => diffWords("one", 2 as never)).toThrow(
        "picoprint diff.words second argument must be a string",
      );
      expect(() => diffWords("A", "a", 12 as never)).toThrow(
        "picoprint diff.words options must be an object",
      );
      expect(() => diffWords("A", "a", /bad/ as never)).toThrow(
        "picoprint diff.words options must be an object",
      );
      expect(() => diffWords("A", "a", { ignoreCase: "yes" as never })).toThrow(
        "picoprint ignoreCase must be a boolean",
      );
      expect(() => diffWords("a b", "ab", { ignoreWhitespace: "yes" as never })).toThrow(
        "picoprint ignoreWhitespace must be a boolean",
      );
      expect(logOutput).toHaveLength(0);
    });
  });

  describe("compare", () => {
    it("should display side-by-side comparison", () => {
      const left = { a: 1, b: 2 };
      const right = { a: 1, b: 3 };

      compare(left, right);

      expect(logOutput.length).toBeGreaterThan(0);
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

    it("should throw stable errors for invalid compare options", () => {
      expect(() => compare({ a: 1 }, { a: 2 }, 12 as never)).toThrow(
        "picoprint diff.compare options must be an object",
      );
      expect(() => compare({ a: 1 }, { a: 2 }, new Date() as never)).toThrow(
        "picoprint diff.compare options must be an object",
      );
      expect(() => compare({ a: 1 }, { a: 2 }, { labels: ["Only one"] as never })).toThrow(
        "picoprint labels must be a tuple of 2 strings",
      );
      expect(() => compare({ a: 1 }, { a: 2 }, { labels: ["Left", 12] as never })).toThrow(
        "picoprint labels must be a tuple of 2 strings",
      );
      expect(logOutput).toHaveLength(0);
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

      expect(logOutput.length).toBeGreaterThan(0);
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

      expect(logOutput.length).toBeGreaterThan(0);
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

  describe("shared references and unsafe values", () => {
    it("should diff shared (non-circular) sub-object references", () => {
      const shared = { x: 1 };
      const nodes = deepDiff({ a: shared, b: shared }, { a: { x: 1 }, b: { x: 99 } });

      expect(nodes).toHaveLength(1);
      expect(nodes[0]?.type).toBe("modified");
      expect(nodes[0]?.path).toEqual(["b", "x"]);
      expect(nodes[0]?.key).toBe("x");
    });

    it("should not throw when compare receives BigInt values", () => {
      expect(() => compare({ n: 10n }, { n: 20n })).not.toThrow();
    });

    it("should not throw when compare receives circular structures", () => {
      const left: Record<string, unknown> = { a: 1 };
      left.self = left;

      expect(() => compare(left, { a: 2 })).not.toThrow();
    });

    it("should not throw when compare receives undefined", () => {
      expect(() => compare(undefined, { a: 1 })).not.toThrow();
    });

    it("should render shared non-circular references in compare output", () => {
      const shared = { x: 1 };
      compare({ a: shared, b: shared }, { a: shared, b: shared });

      expect(logOutput.join("\n")).not.toContain("[Circular]");
    });
  });
});
