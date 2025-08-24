import { colors } from "../colors";
import { getCurrentContext } from "../context";

export type DiffType = "added" | "deleted" | "modified" | "unchanged";

export interface DiffNode {
  type: DiffType;
  path: string[];
  key: string;
  value1?: unknown;
  value2?: unknown;
}

export interface DiffOptions {
  showUnchanged?: boolean;
  compact?: boolean;
  maxDepth?: number;
}

export interface DiffWordsOptions {
  ignoreCase?: boolean;
  ignoreWhitespace?: boolean;
  context?: number;
}

export interface CompareOptions {
  side?: "both" | "left" | "right";
  labels?: [string, string];
}

const formatValue = (value: unknown): string => {
  if (value === null) return colors.gray("null");
  if (value === undefined) return colors.gray("undefined");
  if (typeof value === "boolean") return colors.magenta(String(value));
  if (typeof value === "number") return colors.yellow(String(value));
  if (typeof value === "bigint") return colors.yellow(`${value}n`);
  if (value instanceof Date) return colors.cyan(value.toISOString());
  if (typeof value === "string") return colors.green(`"${value}"`);
  if (Array.isArray(value)) return colors.cyan(`[Array(${value.length})]`);
  if (typeof value === "object") return colors.cyan("[Object]");
  return String(value);
};

const isSimpleValue = (value: unknown): boolean => {
  return (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value instanceof Date
  );
};

const getType = (value: unknown): string => {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (Array.isArray(value)) return "array";
  return typeof value;
};

export const deepDiff = (
  obj1: unknown,
  obj2: unknown,
  path: string[] = [],
  seen?: WeakSet<object>,
): DiffNode[] => {
  const diffs: DiffNode[] = [];

  const seenSet = seen || new WeakSet<object>();

  if (obj1 === obj2) {
    return [];
  }

  if (typeof obj1 === "object" && obj1 !== null && seenSet.has(obj1)) {
    return [];
  }

  if (typeof obj2 === "object" && obj2 !== null && seenSet.has(obj2)) {
    return [];
  }

  if (typeof obj1 === "object" && obj1 !== null) {
    seenSet.add(obj1);
  }

  if (typeof obj2 === "object" && obj2 !== null) {
    seenSet.add(obj2);
  }

  const type1 = getType(obj1);
  const type2 = getType(obj2);

  if (type1 !== type2) {
    return [
      {
        type: "modified",
        path,
        key: path[path.length - 1] || "root",
        value1: obj1,
        value2: obj2,
      },
    ];
  }

  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    const maxLen = Math.max(obj1.length, obj2.length);
    for (let i = 0; i < maxLen; i++) {
      const newPath = [...path, `[${i}]`];
      if (i >= obj1.length) {
        diffs.push({
          type: "added",
          path: newPath,
          key: `[${i}]`,
          value2: obj2[i],
        });
      } else if (i >= obj2.length) {
        diffs.push({
          type: "deleted",
          path: newPath,
          key: `[${i}]`,
          value1: obj1[i],
        });
      } else {
        diffs.push(...deepDiff(obj1[i], obj2[i], newPath, seenSet));
      }
    }
    return diffs;
  }

  if (typeof obj1 === "object" && obj1 !== null && typeof obj2 === "object" && obj2 !== null) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    const allKeys = new Set([...keys1, ...keys2]);

    for (const key of allKeys) {
      const newPath = [...path, key];
      const hasKey1 = key in obj1;
      const hasKey2 = key in obj2;

      if (!hasKey1 && hasKey2) {
        diffs.push({
          type: "added",
          path: newPath,
          key,
          value2: (obj2 as Record<string, unknown>)[key],
        });
      } else if (hasKey1 && !hasKey2) {
        diffs.push({
          type: "deleted",
          path: newPath,
          key,
          value1: (obj1 as Record<string, unknown>)[key],
        });
      } else {
        diffs.push(
          ...deepDiff(
            (obj1 as Record<string, unknown>)[key],
            (obj2 as Record<string, unknown>)[key],
            newPath,
            seenSet,
          ),
        );
      }
    }
    return diffs;
  }

  if (obj1 !== obj2) {
    return [
      {
        type: "modified",
        path,
        key: path[path.length - 1] || "root",
        value1: obj1,
        value2: obj2,
      },
    ];
  }

  return diffs;
};

interface RenderDiffParams {
  obj1: unknown;
  obj2: unknown;
  diffs: DiffNode[];
  options: DiffOptions;
  prefix?: string;
  depth?: number;
}

// eslint-disable-next-line sonarjs/cognitive-complexity
const renderDiff = (params: RenderDiffParams): string[] => {
  const { obj1, obj2, diffs, options, prefix = "", depth = 0 } = params;
  const lines: string[] = [];
  const maxDepth = options.maxDepth ?? 10;

  if (depth >= maxDepth) {
    const hasDeepDiffs = diffs.some((d) => d.path.length > depth);
    if (hasDeepDiffs) {
      lines.push(`${prefix}${colors.dim("...")}`);
    }
    return lines;
  }

  const relevantDiffs = diffs.filter((d) => d.path.length === depth + 1);

  if (isSimpleValue(obj1) && isSimpleValue(obj2)) {
    if (obj1 !== obj2) {
      lines.push(`${prefix}${colors.red("-")} ${formatValue(obj1)}`);
      lines.push(`${prefix}${colors.green("+")} ${formatValue(obj2)}`);
    } else if (options.showUnchanged) {
      lines.push(`${prefix}  ${formatValue(obj1)}`);
    }
    return lines;
  }

  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    const maxLen = Math.max(obj1.length, obj2.length);
    for (let i = 0; i < maxLen; i++) {
      const itemDiff = relevantDiffs.find((d) => d.key === `[${i}]`);

      if (itemDiff) {
        if (itemDiff.type === "added") {
          lines.push(`${prefix}${colors.green("+")} [${i}]: ${formatValue(obj2[i])}`);
        } else if (itemDiff.type === "deleted") {
          lines.push(`${prefix}${colors.red("-")} [${i}]: ${formatValue(obj1[i])}`);
        } else if (itemDiff.type === "modified") {
          lines.push(`${prefix}${colors.yellow("~")} [${i}]:`);
          if (depth + 1 >= (options.maxDepth ?? 10)) {
            lines.push(`${prefix}  ${colors.dim("...")}`);
          } else {
            const subLines = renderDiff({
              obj1: obj1[i],
              obj2: obj2[i],
              diffs,
              options,
              prefix: `${prefix}  `,
              depth: depth + 1,
            });
            lines.push(...subLines);
          }
        }
      } else if (options.showUnchanged && i < obj1.length && i < obj2.length) {
        lines.push(`${prefix}  [${i}]: ${formatValue(obj1[i])}`);
      }
    }
  } else if (typeof obj1 === "object" && obj1 !== null && typeof obj2 === "object" && obj2 !== null) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    const allKeys = new Set([...keys1, ...keys2]);

    for (const key of allKeys) {
      const keyDiff = relevantDiffs.find((d) => d.key === key);

      if (keyDiff) {
        if (keyDiff.type === "added") {
          lines.push(
            `${prefix}${colors.green("+")} ${colors.cyan(key)}: ${formatValue((obj2 as Record<string, unknown>)[key])}`,
          );
        } else if (keyDiff.type === "deleted") {
          lines.push(
            `${prefix}${colors.red("-")} ${colors.cyan(key)}: ${formatValue((obj1 as Record<string, unknown>)[key])}`,
          );
        } else if (keyDiff.type === "modified") {
          const val1 = (obj1 as Record<string, unknown>)[key];
          const val2 = (obj2 as Record<string, unknown>)[key];

          if (isSimpleValue(val1) && isSimpleValue(val2)) {
            lines.push(`${prefix}${colors.yellow("~")} ${colors.cyan(key)}:`);
            lines.push(`${prefix}  ${colors.red("-")} ${formatValue(val1)}`);
            lines.push(`${prefix}  ${colors.green("+")} ${formatValue(val2)}`);
          } else {
            lines.push(`${prefix}${colors.yellow("~")} ${colors.cyan(key)}:`);
            if (depth + 1 >= (options.maxDepth ?? 10)) {
              lines.push(`${prefix}  ${colors.dim("...")}`);
            } else {
              const subLines = renderDiff({
                obj1: val1,
                obj2: val2,
                diffs,
                options,
                prefix: `${prefix}  `,
                depth: depth + 1,
              });
              lines.push(...subLines);
            }
          }
        }
      } else if (options.showUnchanged && key in obj1 && key in obj2) {
        lines.push(`${prefix}  ${colors.cyan(key)}: ${formatValue((obj1 as Record<string, unknown>)[key])}`);
      }
    }
  }

  return lines;
};

interface RenderDiffWithDepthParams {
  obj1: unknown;
  obj2: unknown;
  diffs: DiffNode[];
  options: DiffOptions;
  prefix?: string;
  depth?: number;
}

const renderDiffWithDepth = (params: RenderDiffWithDepthParams): string[] => {
  const { obj1, obj2, diffs, options, prefix = "", depth = 0 } = params;
  const lines: string[] = [];
  const maxDepth = options.maxDepth ?? 10;

  if (depth >= maxDepth) {
    const hasDeepDiffs = diffs.some((d) => d.path.length > depth);
    if (hasDeepDiffs) {
      lines.push(`${prefix}${colors.dim("...")}`);
    }
    return lines;
  }

  // for objects show structure
  if (typeof obj1 === "object" && obj1 !== null && typeof obj2 === "object" && obj2 !== null) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    const allKeys = new Set([...keys1, ...keys2]);

    for (const key of allKeys) {
      const hasDiffInPath = diffs.some((d) => d.path[depth] === key);
      if (hasDiffInPath) {
        lines.push(`${prefix}${colors.yellow("~")} ${colors.cyan(key)}:`);
        if (depth + 1 >= maxDepth) {
          lines.push(`${prefix}  ${colors.dim("...")}`);
        } else {
          const val1 = (obj1 as Record<string, unknown>)[key];
          const val2 = (obj2 as Record<string, unknown>)[key];
          const subLines = renderDiffWithDepth({
            obj1: val1,
            obj2: val2,
            diffs,
            options,
            prefix: `${prefix}  `,
            depth: depth + 1,
          });
          lines.push(...subLines);
        }
      }
    }
  }

  return lines;
};

export const diff = (obj1: unknown, obj2: unknown, options: DiffOptions = {}) => {
  const ctx = getCurrentContext();
  const width = ctx.getWidth();
  const indent = " ".repeat(ctx.offset);

  console.log(indent + colors.dim("━".repeat(width)));
  console.log(indent + colors.cyan("  DIFF OUTPUT"));
  console.log(indent + colors.dim("  - deleted  ~ modified  + added"));
  console.log(indent + colors.dim("━".repeat(width)));
  console.log();

  const diffs = deepDiff(obj1, obj2);

  // if there are no diffs, or all diffs are beyond maxDepth, we need to still show structure
  if (diffs.length > 0 && options.maxDepth !== undefined) {
    // check if all diffs are beyond maxDepth
    const allBeyondDepth = diffs.every((d) => d.path.length > options.maxDepth!);
    if (allBeyondDepth) {
      // show the structure up to maxDepth
      const lines = renderDiffWithDepth({ obj1, obj2, diffs, options });
      for (const line of lines) {
        console.log(indent + line);
      }
      console.log();
      console.log(indent + colors.dim("━".repeat(width)));
      return;
    }
  }

  const lines = renderDiff({ obj1, obj2, diffs, options });

  for (const line of lines) {
    console.log(indent + line);
  }

  console.log();
  console.log(indent + colors.dim("━".repeat(width)));
};

export const diffWords = (text1: string, text2: string, options: DiffWordsOptions = {}) => {
  const { ignoreCase = false, ignoreWhitespace = false } = options;

  let str1 = text1;
  let str2 = text2;

  if (ignoreCase) {
    str1 = str1.toLowerCase();
    str2 = str2.toLowerCase();
  }

  if (ignoreWhitespace) {
    str1 = str1.replace(/\s+/g, " ").trim();
    str2 = str2.replace(/\s+/g, " ").trim();
  }

  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);

  const maxLen = Math.max(words1.length, words2.length);
  const diffs: { type: string; word: string; index: number }[] = [];

  for (let i = 0; i < maxLen; i++) {
    const word1 = words1[i];
    const word2 = words2[i];

    if (word1 === word2) {
      diffs.push({ type: "unchanged", word: word1 || "", index: i });
    } else if (word2 && !word1) {
      diffs.push({ type: "added", word: word2, index: i });
    } else if (word1 && !word2) {
      diffs.push({ type: "deleted", word: word1, index: i });
    } else {
      diffs.push({ type: "deleted", word: word1 || "", index: i });
      diffs.push({ type: "added", word: word2 || "", index: i });
    }
  }

  const ctx = getCurrentContext();
  const width = ctx.getWidth();
  const indent = " ".repeat(ctx.offset);

  console.log(indent + colors.dim("━".repeat(width)));
  console.log(indent + colors.cyan("  WORD DIFF"));
  console.log(indent + colors.dim("━".repeat(width)));
  console.log();

  let line = "";
  for (const diffItem of diffs) {
    let wordStr = "";
    switch (diffItem.type) {
      case "added": {
        wordStr = colors.green(`+${diffItem.word}`);
        break;
      }
      case "deleted": {
        wordStr = colors.red(`-${diffItem.word}`);
        break;
      }
      case "unchanged": {
        wordStr = diffItem.word;
        break;
      }
      default: {
        wordStr = diffItem.word;
        break;
      }
    }

    if (line.length + wordStr.length > width - 10) {
      console.log(indent + line);
      line = `${wordStr} `;
    } else {
      line += `${wordStr} `;
    }
  }

  if (line.trim()) {
    console.log(indent + line);
  }

  console.log();
  console.log(indent + colors.dim("━".repeat(width)));
};

export const compare = (left: unknown, right: unknown, options: CompareOptions = {}) => {
  const { labels = ["Left", "Right"] } = options;
  const ctx = getCurrentContext();
  const width = ctx.getWidth();
  const indent = " ".repeat(ctx.offset);
  const columnWidth = Math.floor((width - 5) / 2);

  console.log(indent + colors.dim("━".repeat(width)));
  console.log(indent + colors.cyan(`  ${labels[0].padEnd(columnWidth)} │ ${labels[1]}`));
  console.log(indent + colors.dim("━".repeat(width)));

  const leftLines = JSON.stringify(left, null, 2).split("\n");
  const rightLines = JSON.stringify(right, null, 2).split("\n");

  const maxLines = Math.max(leftLines.length, rightLines.length);

  for (let i = 0; i < maxLines; i++) {
    const leftLine = (leftLines[i] || "").slice(0, Math.max(0, columnWidth)).padEnd(columnWidth);
    const rightLine = (rightLines[i] || "").slice(0, Math.max(0, columnWidth));

    console.log(`${indent}${leftLine} │ ${rightLine}`);
  }

  console.log(indent + colors.dim("━".repeat(width)));
};
