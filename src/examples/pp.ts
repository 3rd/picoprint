import p from "@/.";
import { printExample } from "./_helpers";

// Primitive values
printExample("Primitive Values", [
  { title: "string", handler: () => p("Hello, world!") },
  { title: "number", handler: () => p(42) },
  { title: "boolean", handler: () => p(true) },
  { title: "null", handler: () => p(null) },
  { title: "undefined", handler: () => p(undefined) },
  { title: "symbol", handler: () => p(Symbol("test")) },
  { title: "global symbol", handler: () => p(Symbol.for("global")) },
  { title: "bigint (literal)", handler: () => p(BigInt(123_456_789)) },
  { title: "bigint (string)", handler: () => p(BigInt("9007199254740992")) },
]);

// Arrays
printExample("Arrays", [
  { title: "simple array", handler: () => p([1, 2, 3, 4, 5]) },
  { title: "mixed array", handler: () => p(["string", 123, true, null, undefined]) },
  {
    title: "nested array",
    handler: () =>
      p([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ]),
  },
  {
    title: "array of objects",
    handler: () =>
      p([
        { id: 1, name: "Alice", active: true },
        { id: 2, name: "Bob", active: false },
        { id: 3, name: "Charlie", active: true },
      ]),
  },
  { title: "empty array", handler: () => p([]) },
]);

// Objects
printExample("Objects", [
  { title: "simple object", handler: () => p({ name: "John", age: 30, city: "New York" }) },
  {
    title: "nested object",
    handler: () =>
      p({
        user: {
          id: 1,
          profile: {
            name: "Alice",
            email: "alice@example.com",
            preferences: {
              theme: "dark",
              notifications: true,
            },
          },
        },
      }),
  },
  {
    title: "various types",
    handler: () =>
      p({
        string: "text",
        number: 42,
        boolean: true,
        null: null,
        undefined,
        array: [1, 2, 3],
        nested: { key: "value" },
      }),
  },
  { title: "empty object", handler: () => p({}) },
]);

// Special types
printExample("Special Types", [
  { title: "date (now)", handler: () => p(new Date()) },
  { title: "date (fixed)", handler: () => p(new Date("2023-01-01")) },
  { title: "date (UTC)", handler: () => p(new Date("2025-12-31T23:59:59Z")) },
  { title: "regexp simple", handler: () => p(/test/) },
  { title: "regexp flags", handler: () => p(/^[a-z]+$/gi) },
  { title: "regexp digits", handler: () => p(/\d+/g) },
  { title: "Error", handler: () => p(new Error("Something went wrong")) },
  { title: "TypeError", handler: () => p(new TypeError("Invalid type")) },
  { title: "RangeError", handler: () => p(new RangeError("Out of range")) },
  { title: "function", handler: () => p(() => {}) },
  { title: "arrow function", handler: () => p(() => console.log("arrow function")) },
  { title: "async generator", handler: () => p(async function* asyncGenerator() {}) },
]);

// Circular references
printExample("Circular References", [
  {
    title: "object self-reference",
    handler: () => {
      const obj = { name: "Circular object" };
      // @ts-expect-error
      obj.self = obj;
      p(obj);
    },
  },
  {
    title: "array self-reference",
    handler: () => {
      const arr = [1, 2, 3];
      // @ts-expect-error
      arr.push(arr);
      p(arr);
    },
  },
  {
    title: "complex circular structure",
    handler: () => {
      const parent = { name: "parent", children: [] };
      const child = { name: "child", parent };
      // @ts-expect-error
      parent.children.push(child);
      p(parent);
    },
  },
]);

// Complex structures
printExample("Complex Structures", [
  {
    title: "API response simulation",
    handler: () =>
      p({
        status: 200,
        success: true,
        data: {
          users: [
            {
              id: 1,
              username: "alice123",
              email: "alice@example.com",
              created: new Date("2023-01-15"),
              roles: ["admin", "user"],
              settings: {
                notifications: {
                  email: true,
                  push: false,
                  sms: false,
                },
                privacy: {
                  profileVisible: true,
                  showEmail: false,
                },
              },
            },
            {
              id: 2,
              username: "bob456",
              email: "bob@example.com",
              created: new Date("2023-02-20"),
              roles: ["user"],
              settings: {
                notifications: {
                  email: false,
                  push: true,
                  sms: false,
                },
                privacy: {
                  profileVisible: false,
                  showEmail: false,
                },
              },
            },
          ],
          pagination: {
            page: 1,
            perPage: 10,
            total: 2,
            totalPages: 1,
          },
        },
        timestamp: new Date(),
      }),
  },
]);

// Deep objects
const deepObject = {
  level1: {
    level2: {
      level3: {
        level4: {
          level5: {
            level6: {
              level7: {
                level8: {
                  level9: {
                    level10: {
                      level11: "deep value",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
printExample("Depth", [
  { title: "default depth", handler: () => p(deepObject) },
  { title: "limited depth", handler: () => p(deepObject, { maxDepth: 3 }) },
]);

// Compact mode
const compactData = {
  items: [1, 2, 3, 4, 5],
  config: {
    enabled: true,
    timeout: 5000,
    retries: 3,
  },
  stats: {
    count: 42,
    average: 3.14,
    max: 10,
    min: 1,
  },
};
printExample("Compact Mode", [
  { title: "compact (default)", handler: () => p(compactData) },
  { title: "expanded", handler: () => p(compactData, { compact: false }) },
]);

// Text wrapping
const longText =
  "This is a very long string that should demonstrate the text wrapping functionality " +
  "of the pretty printer. It will be wrapped according to the terminal width to ensure " +
  "proper formatting and readability. The wrapping should preserve indentation and tree " +
  "structure while breaking long lines appropriately.";
printExample("Text Wrapping", [
  {
    title: "basic text",
    handler: () =>
      p({
        title: "Long Text Example",
        description: longText,
        metadata: {
          author: "Test Author",
          created: new Date(),
          tags: ["example", "wrapping", "formatting"],
        },
      }),
  },
]);

// Edge cases
printExample("Edge Cases", [
  {
    title: "special keys",
    handler: () =>
      p({
        "key with spaces": "value",
        123: "numeric key",
        "": "empty key",
        "🚀": "emoji key",
      }),
  },
  {
    title: "mixed nesting",
    handler: () =>
      p({
        arrays: [
          [1, 2],
          [3, 4],
          [5, 6],
        ],
        objects: [{ a: 1 }, { b: 2 }, { c: 3 }],
        mixed: [{ items: [1, 2, 3] }, [{ nested: true }], "string", 42],
      }),
  },
]);
