import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const distDir = path.join(root, "dist");

const assert = (condition, message) => {
  if (!condition) throw new TypeError(message);
};

const require = createRequire(import.meta.url);
const required = require(root);

assert(typeof required === "function", "picoprint package require must return the callable p function");
assert(required.default === required, "picoprint package require must expose default as the callable p function");
assert(required.c === required.color, "picoprint package require must expose c as the color namespace alias");

const imported = await import(pathToFileURL(path.join(distDir, "index.mjs")).href);
assert(typeof imported.default === "function", "picoprint ESM build must export the callable p function");
assert(imported.c === imported.default.color, "picoprint ESM build must expose c as the color namespace alias");
assert(imported.default.c === imported.default.color, "picoprint default export must expose p.c as p.color");

const walk = (dir) => {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.name.endsWith(".d.ts")) files.push(full);
  }
  return files;
};

for (const file of walk(distDir)) {
  const content = fs.readFileSync(file, "utf8");
  assert(
    !content.includes('from "@/'),
    `declaration file contains unresolved path alias: ${path.relative(root, file)}`,
  );
  assert(
    !content.includes('import("@/'),
    `declaration file contains unresolved path alias: ${path.relative(root, file)}`,
  );
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "picoprint-package-smoke-"));

try {
  fs.mkdirSync(path.join(tempRoot, "node_modules"), { recursive: true });
  fs.symlinkSync(root, path.join(tempRoot, "node_modules", "picoprint"), "dir");
  fs.writeFileSync(path.join(tempRoot, "package.json"), JSON.stringify({ type: "module" }, undefined, 2));
  fs.writeFileSync(
    path.join(tempRoot, "consumer.mts"),
    `
import p, { c } from "picoprint";
import type { BoxOptions, PP } from "picoprint";

const output: string = p({ ok: true });
const panel: Promise<string> = p.box.panel("Async", async () => undefined);
const maybePanel: string | Promise<string> = p.box.panel("Maybe", (() => undefined) as () => void | Promise<void>);
const color: string = p.color.red("x");
const rootAlias: string = p.c.green("x");
const namedAlias: string = c.blue("x");
const options: BoxOptions = { title: "Box" };
const instance: PP = p;

void [output, panel, maybePanel, color, rootAlias, namedAlias, options, instance];
`,
  );
  fs.writeFileSync(
    path.join(tempRoot, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          module: "NodeNext",
          moduleResolution: "NodeNext",
          noEmit: true,
          skipLibCheck: true,
          strict: true,
          target: "ES2022",
        },
        include: ["consumer.mts"],
      },
      undefined,
      2,
    ),
  );

  const tscBin = path.join(root, "node_modules", "typescript", "bin", "tsc");
  const result = spawnSync(process.execPath, [tscBin, "--project", tempRoot], {
    cwd: tempRoot,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n");
    throw new Error(`picoprint package declarations failed NodeNext smoke test\n${output}`);
  }
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
