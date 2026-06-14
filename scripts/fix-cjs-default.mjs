import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const entry = path.resolve("dist/index.cjs");
const before = fs.readFileSync(entry, "utf8");

if (!before.includes("picoprintDefault = module.exports.default")) {
  const footer = `
const picoprintDefault = module.exports.default;
if (typeof picoprintDefault === "function") {
  Object.defineProperty(picoprintDefault, "default", {
    value: picoprintDefault,
    enumerable: false,
    configurable: true
  });
  module.exports = picoprintDefault;
}
`;

  fs.writeFileSync(entry, `${before.trimEnd()}\n${footer}`);
}

const require = createRequire(import.meta.url);
const exported = require(entry);

if (typeof exported !== "function") {
  throw new TypeError("picoprint CJS build must export the callable p function");
}

if (exported.default !== exported) {
  throw new TypeError("picoprint CJS build must preserve default destructuring compatibility");
}

if (exported.c !== exported.color) {
  throw new TypeError("picoprint CJS build must preserve the c color namespace");
}
