import type { RenderOptions } from "../context";
import { stringWidth } from "../../utils/ansi";
import { colors } from "../../utils/colors";
import { formatValueColored, safeStringify } from "../../utils/format-value";
import {
  assertBooleanOption,
  assertNonNegativeIntegerOption,
  assertPlainOptionsObject,
  assertStringArgument,
  assertStringTupleOption,
} from "../../utils/options";
import { getType, isSimpleValue } from "../../utils/value-helpers";
import { renderAndReturn, write } from "../../utils/writer";
import { resolveRenderContext } from "../context";

export type DiffPathSegment = { kind: "index"; index: number } | { kind: "key"; key: string };

export type DiffNode =
  | {
      type: "added";
      path: string[];
      pathSegments: DiffPathSegment[];
      key: string;
      value2: unknown;
    }
  | {
      type: "deleted";
      path: string[];
      pathSegments: DiffPathSegment[];
      key: string;
      value1: unknown;
    }
  | {
      type: "modified";
      path: string[];
      pathSegments: DiffPathSegment[];
      key: string;
      value1: unknown;
      value2: unknown;
    };

export interface DiffOptions {
  offset?: RenderOptions["offset"];
  showUnchanged?: boolean;
  compact?: boolean;
  maxDepth?: number;
  renderContext?: RenderOptions["renderContext"];
}

export interface DiffWordsOptions extends RenderOptions {
  ignoreCase?: boolean;
  ignoreWhitespace?: boolean;
}

export interface CompareOptions {
  offset?: RenderOptions["offset"];
  labels?: readonly [string, string];
  renderContext?: RenderOptions["renderContext"];
}

const QUOTE_STRINGS = { quoteStrings: true } as const;

const validateDiffOptions = (options: DiffOptions) => {
  assertPlainOptionsObject(options as unknown, "diff options");
  assertBooleanOption(options.showUnchanged, "showUnchanged");
  assertBooleanOption(options.compact, "compact");
  assertNonNegativeIntegerOption(options.maxDepth, "maxDepth");
};

const validateDiffWordsOptions = (text1: unknown, text2: unknown, options: DiffWordsOptions) => {
  assertStringArgument(text1, "diff.words first argument");
  assertStringArgument(text2, "diff.words second argument");
  assertPlainOptionsObject(options as unknown, "diff.words options");
  assertBooleanOption(options.ignoreCase, "ignoreCase");
  assertBooleanOption(options.ignoreWhitespace, "ignoreWhitespace");
};

const validateCompareOptions = (options: CompareOptions) => {
  assertPlainOptionsObject(options as unknown, "diff.compare options");
  assertStringTupleOption(options.labels, "labels", 2);
};

const getCyclePath = (value: unknown, stack: Map<object, string>) => {
  if (typeof value !== "object" || value === null) return undefined;
  return stack.get(value);
};

type DiffPathEntry = { label: string; segment: DiffPathSegment };

const arrayPathEntry = (index: number): DiffPathEntry => ({
  label: `[${index}]`,
  segment: { kind: "index", index },
});

const keyPathEntry = (key: string): DiffPathEntry => ({
  label: key,
  segment: { kind: "key", key },
});

const pathLabels = (path: readonly DiffPathEntry[]) => path.map((entry) => entry.label);
const pathSegments = (path: readonly DiffPathEntry[]) => path.map((entry) => entry.segment);
const pathNodeKey = (path: readonly DiffPathEntry[]) => path.at(-1)?.label ?? "root";
const cyclePathKey = (path: readonly DiffPathEntry[]) => JSON.stringify(pathSegments(path));

const addedNode = (value2: unknown, path: readonly DiffPathEntry[]): DiffNode => ({
  type: "added",
  path: pathLabels(path),
  pathSegments: pathSegments(path),
  key: pathNodeKey(path),
  value2,
});

const deletedNode = (value1: unknown, path: readonly DiffPathEntry[]): DiffNode => ({
  type: "deleted",
  path: pathLabels(path),
  pathSegments: pathSegments(path),
  key: pathNodeKey(path),
  value1,
});

const modifiedNode = (value1: unknown, value2: unknown, path: readonly DiffPathEntry[]): DiffNode => ({
  type: "modified",
  path: pathLabels(path),
  pathSegments: pathSegments(path),
  key: pathNodeKey(path),
  value1,
  value2,
});

const sameLeafValue = (obj1: unknown, obj2: unknown, type: ReturnType<typeof getType>) => {
  if (type === "date") return (obj1 as Date).getTime() === (obj2 as Date).getTime();
  if (type === "regexp") {
    const left = obj1 as RegExp;
    const right = obj2 as RegExp;
    return left.source === right.source && left.flags === right.flags;
  }
  if (type === "error") {
    const left = obj1 as Error;
    const right = obj2 as Error;
    return left.name === right.name && left.message === right.message;
  }
  return obj1 === obj2;
};

const isLeafDiffType = (type: ReturnType<typeof getType>) => {
  return type !== "array" && type !== "object";
};

const normalizeDiffCollection = (value: unknown) => {
  if (value instanceof Map) return Array.from(value.entries());
  if (value instanceof Set) return Array.from(value.values());
  return value;
};

// cycle tracking uses active recursion paths on both sides so shared
// non-circular references are still diffed, while changed cycle edges surface
const walkDiff = (
  obj1: unknown,
  obj2: unknown,
  path: DiffPathEntry[],
  stack1: Map<object, string>,
  stack2: Map<object, string>,
): DiffNode[] => {
  if (obj1 === obj2) return [];

  const cyclePath1 = getCyclePath(obj1, stack1);
  const cyclePath2 = getCyclePath(obj2, stack2);

  if (cyclePath1 !== undefined || cyclePath2 !== undefined) {
    if (cyclePath1 !== undefined && cyclePath1 === cyclePath2) return [];
    return [modifiedNode(obj1, obj2, path)];
  }

  const trackCycle1 = typeof obj1 === "object" && obj1 !== null;
  const trackCycle2 = typeof obj2 === "object" && obj2 !== null;
  if (trackCycle1) stack1.set(obj1 as object, cyclePathKey(path));
  if (trackCycle2) stack2.set(obj2 as object, cyclePathKey(path));

  try {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define -- mutual recursion
    return compareValues(obj1, obj2, path, stack1, stack2);
  } finally {
    if (trackCycle1) stack1.delete(obj1 as object);
    if (trackCycle2) stack2.delete(obj2 as object);
  }
};

const compareValues = (
  obj1: unknown,
  obj2: unknown,
  path: DiffPathEntry[],
  stack1: Map<object, string>,
  stack2: Map<object, string>,
): DiffNode[] => {
  const diffs: DiffNode[] = [];

  const type1 = getType(obj1);
  const type2 = getType(obj2);

  if (type1 !== type2) {
    return [modifiedNode(obj1, obj2, path)];
  }

  if (obj1 instanceof Map && obj2 instanceof Map) {
    return walkDiff(Array.from(obj1.entries()), Array.from(obj2.entries()), path, stack1, stack2);
  }

  if (obj1 instanceof Set && obj2 instanceof Set) {
    return walkDiff(Array.from(obj1.values()), Array.from(obj2.values()), path, stack1, stack2);
  }

  if (isLeafDiffType(type1)) {
    return sameLeafValue(obj1, obj2, type1) ? [] : [modifiedNode(obj1, obj2, path)];
  }

  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    const maxLen = Math.max(obj1.length, obj2.length);
    for (let i = 0; i < maxLen; i++) {
      const newPath = [...path, arrayPathEntry(i)];
      if (i >= obj1.length) {
        diffs.push(addedNode(obj2[i], newPath));
      } else if (i >= obj2.length) {
        diffs.push(deletedNode(obj1[i], newPath));
      } else {
        diffs.push(...walkDiff(obj1[i], obj2[i], newPath, stack1, stack2));
      }
    }
    return diffs;
  }

  if (typeof obj1 === "object" && obj1 !== null && typeof obj2 === "object" && obj2 !== null) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    const allKeys = new Set([...keys1, ...keys2]);

    for (const key of allKeys) {
      const newPath = [...path, keyPathEntry(key)];
      const hasKey1 = key in obj1;
      const hasKey2 = key in obj2;

      if (!hasKey1 && hasKey2) {
        diffs.push(addedNode((obj2 as Record<string, unknown>)[key], newPath));
      } else if (hasKey1 && !hasKey2) {
        diffs.push(deletedNode((obj1 as Record<string, unknown>)[key], newPath));
      } else {
        diffs.push(
          ...walkDiff(
            (obj1 as Record<string, unknown>)[key],
            (obj2 as Record<string, unknown>)[key],
            newPath,
            stack1,
            stack2,
          ),
        );
      }
    }
    return diffs;
  }

  if (obj1 !== obj2) {
    return [modifiedNode(obj1, obj2, path)];
  }

  return diffs;
};

// structural diff of two values as data, no printing
export const deepDiff = (obj1: unknown, obj2: unknown): DiffNode[] =>
  walkDiff(obj1, obj2, [], new Map(), new Map());

interface RenderDiffParams {
  obj1: unknown;
  obj2: unknown;
  diffs: DiffNode[];
  options: DiffOptions;
  prefix?: string;
  depth?: number;
}

const diffPathSegmentKey = (segment: DiffPathSegment) => {
  return segment.kind === "index" ? `index:${segment.index}` : `key:${segment.key}`;
};

const arrayDiffSegmentKey = (index: number) => diffPathSegmentKey({ kind: "index", index });
const objectDiffSegmentKey = (key: string) => diffPathSegmentKey({ kind: "key", key });

const buildDiffLookup = (diffs: readonly DiffNode[], depth: number) => {
  const direct = new Map<string, DiffNode>();
  const nested = new Map<string, DiffNode[]>();

  for (const diffNode of diffs) {
    const segment = diffNode.pathSegments[depth];
    if (!segment) continue;

    const key = diffPathSegmentKey(segment);
    if (diffNode.pathSegments.length === depth + 1) {
      direct.set(key, diffNode);
      continue;
    }

    const childDiffs = nested.get(key);
    if (childDiffs) childDiffs.push(diffNode);
    else nested.set(key, [diffNode]);
  }

  return { direct, nested };
};

// eslint-disable-next-line sonarjs/cognitive-complexity
const renderDiff = (params: RenderDiffParams): string[] => {
  const { obj1, obj2, diffs, options, prefix = "", depth = 0 } = params;
  const lines: string[] = [];
  const maxDepth = options.maxDepth ?? 10;
  const renderObj1 = normalizeDiffCollection(obj1);
  const renderObj2 = normalizeDiffCollection(obj2);

  if (depth >= maxDepth) {
    const hasDeepDiffs = diffs.some((d) => d.pathSegments.length > depth);
    if (hasDeepDiffs) {
      lines.push(`${prefix}${colors.dim("...")}`);
    }
    return lines;
  }

  if (isSimpleValue(renderObj1) && isSimpleValue(renderObj2)) {
    const type1 = getType(renderObj1);
    const type2 = getType(renderObj2);
    if (type1 !== type2 || !sameLeafValue(renderObj1, renderObj2, type1)) {
      lines.push(`${prefix}${colors.red("-")} ${formatValueColored(renderObj1, QUOTE_STRINGS)}`);
      lines.push(`${prefix}${colors.green("+")} ${formatValueColored(renderObj2, QUOTE_STRINGS)}`);
    } else if (options.showUnchanged) {
      lines.push(`${prefix}  ${formatValueColored(renderObj1, QUOTE_STRINGS)}`);
    }
    return lines;
  }

  const renderAsLeaf = isLeafDiffType(getType(renderObj1)) || isLeafDiffType(getType(renderObj2));
  if (renderAsLeaf) {
    if (diffs.length > 0) {
      lines.push(`${prefix}${colors.red("-")} ${formatValueColored(renderObj1, QUOTE_STRINGS)}`);
      lines.push(`${prefix}${colors.green("+")} ${formatValueColored(renderObj2, QUOTE_STRINGS)}`);
    } else if (options.showUnchanged) {
      lines.push(`${prefix}  ${formatValueColored(renderObj1, QUOTE_STRINGS)}`);
    }
    return lines;
  }

  const diffLookup = buildDiffLookup(diffs, depth);

  if (Array.isArray(renderObj1) && Array.isArray(renderObj2)) {
    const maxLen = Math.max(renderObj1.length, renderObj2.length);
    for (let i = 0; i < maxLen; i++) {
      const segmentKey = arrayDiffSegmentKey(i);
      const itemDiff = diffLookup.direct.get(segmentKey);
      const nestedDiffs = diffLookup.nested.get(segmentKey);

      if (itemDiff) {
        if (itemDiff.type === "added") {
          lines.push(
            `${prefix}${colors.green("+")} [${i}]: ${formatValueColored(renderObj2[i], QUOTE_STRINGS)}`,
          );
        } else if (itemDiff.type === "deleted") {
          lines.push(
            `${prefix}${colors.red("-")} [${i}]: ${formatValueColored(renderObj1[i], QUOTE_STRINGS)}`,
          );
        } else if (itemDiff.type === "modified") {
          lines.push(`${prefix}${colors.yellow("~")} [${i}]:`);
          if (depth + 1 >= (options.maxDepth ?? 10)) {
            lines.push(`${prefix}  ${colors.dim("...")}`);
          } else {
            const subLines = renderDiff({
              obj1: renderObj1[i],
              obj2: renderObj2[i],
              diffs: nestedDiffs ?? [itemDiff],
              options,
              prefix: `${prefix}  `,
              depth: depth + 1,
            });
            lines.push(...subLines);
          }
        }
      } else if (nestedDiffs) {
        lines.push(`${prefix}${colors.yellow("~")} [${i}]:`);
        if (depth + 1 >= (options.maxDepth ?? 10)) {
          lines.push(`${prefix}  ${colors.dim("...")}`);
        } else {
          const subLines = renderDiff({
            obj1: renderObj1[i],
            obj2: renderObj2[i],
            diffs: nestedDiffs,
            options,
            prefix: `${prefix}  `,
            depth: depth + 1,
          });
          lines.push(...subLines);
        }
      } else if (options.showUnchanged && i < renderObj1.length && i < renderObj2.length) {
        lines.push(`${prefix}  [${i}]: ${formatValueColored(renderObj1[i], QUOTE_STRINGS)}`);
      }
    }
  } else if (
    typeof renderObj1 === "object" &&
    renderObj1 !== null &&
    typeof renderObj2 === "object" &&
    renderObj2 !== null
  ) {
    const keys1 = Object.keys(renderObj1);
    const keys2 = Object.keys(renderObj2);
    const allKeys = new Set([...keys1, ...keys2]);

    for (const key of allKeys) {
      const segmentKey = objectDiffSegmentKey(key);
      const keyDiff = diffLookup.direct.get(segmentKey);
      const nestedDiffs = diffLookup.nested.get(segmentKey);

      if (keyDiff) {
        if (keyDiff.type === "added") {
          lines.push(
            `${prefix}${colors.green("+")} ${colors.cyan(key)}: ${formatValueColored((renderObj2 as Record<string, unknown>)[key], QUOTE_STRINGS)}`,
          );
        } else if (keyDiff.type === "deleted") {
          lines.push(
            `${prefix}${colors.red("-")} ${colors.cyan(key)}: ${formatValueColored((renderObj1 as Record<string, unknown>)[key], QUOTE_STRINGS)}`,
          );
        } else if (keyDiff.type === "modified") {
          const val1 = (renderObj1 as Record<string, unknown>)[key];
          const val2 = (renderObj2 as Record<string, unknown>)[key];

          if (isSimpleValue(val1) && isSimpleValue(val2)) {
            lines.push(`${prefix}${colors.yellow("~")} ${colors.cyan(key)}:`);
            lines.push(`${prefix}  ${colors.red("-")} ${formatValueColored(val1, QUOTE_STRINGS)}`);
            lines.push(`${prefix}  ${colors.green("+")} ${formatValueColored(val2, QUOTE_STRINGS)}`);
          } else {
            lines.push(`${prefix}${colors.yellow("~")} ${colors.cyan(key)}:`);
            if (depth + 1 >= (options.maxDepth ?? 10)) {
              lines.push(`${prefix}  ${colors.dim("...")}`);
            } else {
              const subLines = renderDiff({
                obj1: val1,
                obj2: val2,
                diffs: nestedDiffs ?? [keyDiff],
                options,
                prefix: `${prefix}  `,
                depth: depth + 1,
              });
              lines.push(...subLines);
            }
          }
        }
      } else if (nestedDiffs) {
        const val1 = (renderObj1 as Record<string, unknown>)[key];
        const val2 = (renderObj2 as Record<string, unknown>)[key];
        lines.push(`${prefix}${colors.yellow("~")} ${colors.cyan(key)}:`);
        if (depth + 1 >= (options.maxDepth ?? 10)) {
          lines.push(`${prefix}  ${colors.dim("...")}`);
        } else {
          const subLines = renderDiff({
            obj1: val1,
            obj2: val2,
            diffs: nestedDiffs,
            options,
            prefix: `${prefix}  `,
            depth: depth + 1,
          });
          lines.push(...subLines);
        }
      } else if (options.showUnchanged && key in renderObj1 && key in renderObj2) {
        lines.push(
          `${prefix}  ${colors.cyan(key)}: ${formatValueColored((renderObj1 as Record<string, unknown>)[key], QUOTE_STRINGS)}`,
        );
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
  const renderObj1 = normalizeDiffCollection(obj1);
  const renderObj2 = normalizeDiffCollection(obj2);

  if (depth >= maxDepth) {
    const hasDeepDiffs = diffs.some((d) => d.pathSegments.length > depth);
    if (hasDeepDiffs) {
      lines.push(`${prefix}${colors.dim("...")}`);
    }
    return lines;
  }

  const diffLookup = buildDiffLookup(diffs, depth);

  if (Array.isArray(renderObj1) && Array.isArray(renderObj2)) {
    const maxLen = Math.max(renderObj1.length, renderObj2.length);
    for (let i = 0; i < maxLen; i++) {
      const segmentKey = arrayDiffSegmentKey(i);
      const directDiff = diffLookup.direct.get(segmentKey);
      const segmentDiffs = diffLookup.nested.get(segmentKey) ?? (directDiff ? [directDiff] : undefined);
      if (!segmentDiffs) continue;

      lines.push(`${prefix}${colors.yellow("~")} [${i}]:`);
      if (depth + 1 >= maxDepth) {
        lines.push(`${prefix}  ${colors.dim("...")}`);
      } else {
        const subLines = renderDiffWithDepth({
          obj1: renderObj1[i],
          obj2: renderObj2[i],
          diffs: segmentDiffs,
          options,
          prefix: `${prefix}  `,
          depth: depth + 1,
        });
        lines.push(...subLines);
      }
    }
  } else if (
    typeof renderObj1 === "object" &&
    renderObj1 !== null &&
    typeof renderObj2 === "object" &&
    renderObj2 !== null
  ) {
    const keys1 = Object.keys(renderObj1);
    const keys2 = Object.keys(renderObj2);
    const allKeys = new Set([...keys1, ...keys2]);

    for (const key of allKeys) {
      const segmentKey = objectDiffSegmentKey(key);
      const directDiff = diffLookup.direct.get(segmentKey);
      const segmentDiffs = diffLookup.nested.get(segmentKey) ?? (directDiff ? [directDiff] : undefined);
      if (segmentDiffs) {
        lines.push(`${prefix}${colors.yellow("~")} ${colors.cyan(key)}:`);
        if (depth + 1 >= maxDepth) {
          lines.push(`${prefix}  ${colors.dim("...")}`);
        } else {
          const val1 = (renderObj1 as Record<string, unknown>)[key];
          const val2 = (renderObj2 as Record<string, unknown>)[key];
          const subLines = renderDiffWithDepth({
            obj1: val1,
            obj2: val2,
            diffs: segmentDiffs,
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

const WORD_DIFF_LCS_CELL_LIMIT = 250_000;

type WordDiffItem = { type: "added" | "deleted" | "unchanged"; word: string };

const buildLcsWordDiffs = (
  words1: readonly string[],
  words2: readonly string[],
  keys1: readonly string[],
  keys2: readonly string[],
): WordDiffItem[] => {
  const lengths: number[][] = Array.from({ length: keys1.length + 1 }, () =>
    Array.from({ length: keys2.length + 1 }, () => 0),
  );
  for (let i = keys1.length - 1; i >= 0; i--) {
    for (let j = keys2.length - 1; j >= 0; j--) {
      lengths[i]![j] =
        keys1[i] === keys2[j] ?
          lengths[i + 1]![j + 1]! + 1
        : Math.max(lengths[i + 1]![j]!, lengths[i]![j + 1]!);
    }
  }

  const diffs: WordDiffItem[] = [];
  let i = 0;
  let j = 0;
  while (i < words1.length || j < words2.length) {
    if (i < words1.length && j < words2.length && keys1[i] === keys2[j]) {
      diffs.push({ type: "unchanged", word: words1[i]! });
      i++;
      j++;
    } else if (j < words2.length && (i === words1.length || lengths[i]![j + 1]! >= lengths[i + 1]![j]!)) {
      diffs.push({ type: "added", word: words2[j]! });
      j++;
    } else if (i < words1.length) {
      diffs.push({ type: "deleted", word: words1[i]! });
      i++;
    }
  }
  return diffs;
};

const buildPositionalWordDiffs = (
  words1: readonly string[],
  words2: readonly string[],
  keys1: readonly string[],
  keys2: readonly string[],
): WordDiffItem[] => {
  const diffs: WordDiffItem[] = [];
  const maxLen = Math.max(words1.length, words2.length);
  for (let i = 0; i < maxLen; i++) {
    if (i >= words1.length) {
      diffs.push({ type: "added", word: words2[i]! });
    } else if (i >= words2.length) {
      diffs.push({ type: "deleted", word: words1[i]! });
    } else if (keys1[i] === keys2[i]) {
      diffs.push({ type: "unchanged", word: words1[i]! });
    } else {
      diffs.push({ type: "deleted", word: words1[i]! });
      diffs.push({ type: "added", word: words2[i]! });
    }
  }
  return diffs;
};

const buildWordDiffs = (
  words1: readonly string[],
  words2: readonly string[],
  keys1: readonly string[],
  keys2: readonly string[],
): WordDiffItem[] => {
  const diffs: WordDiffItem[] = [];
  let start = 0;
  while (start < keys1.length && start < keys2.length && keys1[start] === keys2[start]) {
    diffs.push({ type: "unchanged", word: words1[start]! });
    start++;
  }

  let end1 = keys1.length - 1;
  let end2 = keys2.length - 1;
  while (end1 >= start && end2 >= start && keys1[end1] === keys2[end2]) {
    end1--;
    end2--;
  }

  const middleWords1 = words1.slice(start, end1 + 1);
  const middleWords2 = words2.slice(start, end2 + 1);
  const middleKeys1 = keys1.slice(start, end1 + 1);
  const middleKeys2 = keys2.slice(start, end2 + 1);
  const middleCells = (middleKeys1.length + 1) * (middleKeys2.length + 1);

  diffs.push(
    ...(middleCells <= WORD_DIFF_LCS_CELL_LIMIT ?
      buildLcsWordDiffs(middleWords1, middleWords2, middleKeys1, middleKeys2)
    : buildPositionalWordDiffs(middleWords1, middleWords2, middleKeys1, middleKeys2)),
  );

  for (let i = end1 + 1; i < words1.length; i++) {
    diffs.push({ type: "unchanged", word: words1[i]! });
  }

  return diffs;
};

export const diff = (obj1: unknown, obj2: unknown, options: DiffOptions = {}) =>
  renderAndReturn(() => {
    validateDiffOptions(options);
    const ctx = resolveRenderContext(options);
    const width = ctx.getWidth();
    const indent = " ".repeat(ctx.offset);

    write(indent + colors.dim("━".repeat(width)));
    write(indent + colors.cyan("  DIFF OUTPUT"));
    write(indent + colors.dim("  - deleted  ~ modified  + added"));
    write(indent + colors.dim("━".repeat(width)));
    write("");

    const diffs = deepDiff(obj1, obj2);

    // if there are no diffs, or all diffs are beyond maxDepth, we need to still show structure
    if (diffs.length > 0 && options.maxDepth !== undefined) {
      // check if all diffs are beyond maxDepth
      const allBeyondDepth = diffs.every((d) => d.pathSegments.length > options.maxDepth!);
      if (allBeyondDepth) {
        // show the structure up to maxDepth
        const lines = renderDiffWithDepth({ obj1, obj2, diffs, options });
        for (const line of lines) {
          write(indent + line);
        }
        write("");
        write(indent + colors.dim("━".repeat(width)));
        return;
      }
    }

    const lines = renderDiff({ obj1, obj2, diffs, options });

    for (const line of lines) {
      write(indent + line);
    }

    write("");
    write(indent + colors.dim("━".repeat(width)));
  });

export const diffWords = (text1: string, text2: string, options: DiffWordsOptions = {}) =>
  renderAndReturn(() => {
    validateDiffWordsOptions(text1, text2, options);
    const { ignoreCase = false, ignoreWhitespace = false } = options;

    const normalizeText = (text: string) => (ignoreWhitespace ? text.replace(/\s+/g, " ").trim() : text);
    const toWords = (text: string) => {
      const normalized = normalizeText(text).trim();
      return normalized ? normalized.split(/\s+/) : [];
    };
    const words1 = toWords(text1);
    const words2 = toWords(text2);
    const keys1 = ignoreCase ? words1.map((word) => word.toLowerCase()) : words1;
    const keys2 = ignoreCase ? words2.map((word) => word.toLowerCase()) : words2;

    const diffs = buildWordDiffs(words1, words2, keys1, keys2);

    const ctx = resolveRenderContext(options);
    const width = ctx.getWidth();
    const indent = " ".repeat(ctx.offset);

    write(indent + colors.dim("━".repeat(width)));
    write(indent + colors.cyan("  WORD DIFF"));
    write(indent + colors.dim("━".repeat(width)));
    write("");

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

      if (stringWidth(line) + stringWidth(wordStr) > Math.max(1, width - 10)) {
        write(indent + line);
        line = `${wordStr} `;
      } else {
        line += `${wordStr} `;
      }
    }

    if (line.trim()) {
      write(indent + line);
    }

    write("");
    write(indent + colors.dim("━".repeat(width)));
  });

export const compare = (left: unknown, right: unknown, options: CompareOptions = {}) =>
  renderAndReturn(() => {
    validateCompareOptions(options);
    const { labels = ["Left", "Right"] } = options;
    const ctx = resolveRenderContext(options);
    const width = ctx.getWidth();
    const indent = " ".repeat(ctx.offset);
    const columnWidth = Math.floor((width - 5) / 2);

    write(indent + colors.dim("━".repeat(width)));
    write(indent + colors.cyan(`  ${labels[0].padEnd(columnWidth)} │ ${labels[1]}`));
    write(indent + colors.dim("━".repeat(width)));

    const leftLines = safeStringify(left).split("\n");
    const rightLines = safeStringify(right).split("\n");

    const maxLines = Math.max(leftLines.length, rightLines.length);

    for (let i = 0; i < maxLines; i++) {
      const leftLine = (leftLines[i] || "").slice(0, Math.max(0, columnWidth)).padEnd(columnWidth);
      const rightLine = (rightLines[i] || "").slice(0, Math.max(0, columnWidth));

      write(`${indent}${leftLine} │ ${rightLine}`);
    }

    write(indent + colors.dim("━".repeat(width)));
  });
