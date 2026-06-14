import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve("dist");

const walk = (dir) => {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.name.endsWith(".d.ts")) files.push(full);
  }
  return files;
};

const toSpecifier = (fromFile, targetDts) => {
  const targetJs = targetDts.replace(/\.d\.ts$/, ".js");
  let specifier = path.relative(path.dirname(fromFile), targetJs).replaceAll(path.sep, "/");
  if (!specifier.startsWith(".")) specifier = `./${specifier}`;
  return specifier;
};

const resolveDtsTarget = (fromFile, specifier) => {
  const base = path.resolve(path.dirname(fromFile), specifier);
  const direct = `${base}.d.ts`;
  if (fs.existsSync(direct)) return direct;

  const index = path.join(base, "index.d.ts");
  if (fs.existsSync(index)) return index;

  return undefined;
};

const rewriteSpecifier = (fromFile, specifier) => {
  if (!specifier.startsWith(".")) return specifier;
  if (specifier.endsWith(".js") || specifier.endsWith(".json")) return specifier;

  const target = resolveDtsTarget(fromFile, specifier);
  return target ? toSpecifier(fromFile, target) : specifier;
};

for (const file of walk(distDir)) {
  const before = fs.readFileSync(file, "utf8");
  const after = before
    .replace(/(from\s+["'])(\.[^"']*)(["'])/g, (_match, prefix, specifier, suffix) => {
      return `${prefix}${rewriteSpecifier(file, specifier)}${suffix}`;
    })
    .replace(/(import\(["'])(\.[^"']*)(["']\))/g, (_match, prefix, specifier, suffix) => {
      return `${prefix}${rewriteSpecifier(file, specifier)}${suffix}`;
    });

  if (after !== before) fs.writeFileSync(file, after);
}
