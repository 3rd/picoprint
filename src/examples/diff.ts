import p from "@/.";
import { printExample } from "./_helpers";

// Sample data
const userA = { name: "John", age: 30, city: "New York" };
const userB = { name: "John", age: 31, city: "Boston", country: "USA" };
const listA = ["apple", "banana", "cherry"];
const listB = ["apple", "banana", "date", "elderberry"];
const nestedA = {
  user: {
    name: "Alice",
    settings: { theme: "dark", notifications: true },
  },
};
const nestedB = {
  user: {
    name: "Alice",
    settings: { theme: "light", notifications: true, language: "en" },
  },
};
const codeV1 = "function add(a, b) { return a + b; }";
const codeV2 = "const add = (a, b) => a + b;";
const sentenceA = "The Quick brown fox jumps over the lazy Dog";
const sentenceB = "The quick brown fox jumps over the lazy dog";
const wsA = "The   quick    brown   fox";
const wsB = "The quick brown fox";

// Objects
printExample("Object Diff", [
  { title: "basic", handler: () => p.diff(userA, userB) },
  { title: "nested", handler: () => p.diff(nestedA, nestedB) },
  { title: "show unchanged", handler: () => p.diff(userA, userB, { showUnchanged: true }) },
  { title: "maxDepth: 1", handler: () => p.diff(nestedA, nestedB, { maxDepth: 1 }) },
]);

// Arrays
printExample("Array Diff", [
  { title: "basic", handler: () => p.diff(listA, listB) },
  { title: "show unchanged", handler: () => p.diff(listA, listB, { showUnchanged: true }) },
]);

// Words
printExample("Word Diff", [
  { title: "basic", handler: () => p.diffWords(codeV1, codeV2) },
  { title: "ignore case", handler: () => p.diffWords(sentenceA, sentenceB, { ignoreCase: true }) },
  { title: "ignore whitespace", handler: () => p.diffWords(wsA, wsB, { ignoreWhitespace: true }) },
]);

// Side-by-side
const configA = {
  host: "localhost",
  port: 3000,
  ssl: false,
  debug: true,
};
const configB = {
  host: "0.0.0.0",
  port: 8080,
  ssl: true,
  debug: false,
};
printExample("Compare (Side by Side)", [
  { title: "objects", handler: () => p.compare(configA, configB) },
  { title: "arrays", handler: () => p.compare(listA, listB) },
  { title: "custom labels", handler: () => p.compare(configA, configB, { labels: ["local", "prod"] }) },
]);

// Deep diff + formatted rendering
const stateA = {
  users: [
    { id: 1, name: "Alice", role: "admin" },
    { id: 2, name: "Bob", role: "user" },
  ],
  settings: { theme: "dark", language: "en" },
};
const stateB = {
  users: [
    { id: 1, name: "Alice", role: "superadmin" },
    { id: 2, name: "Bob", role: "user" },
    { id: 3, name: "Charlie", role: "user" },
  ],
  settings: { theme: "dark", language: "fr", notifications: true },
};
printExample("Deep Diff", [
  {
    title: "nodes + formatted",
    handler: () => {
      const nodes = p.deepDiff(stateA, stateB);
      console.log(p.cyan("changes:"));
      for (const d of nodes) {
        console.log(`  ${p.yellow(d.type)} ${d.path.join(".") || "root"}`);
      }
      console.log();
      p.diff(stateA, stateB);
    },
  },
]);
