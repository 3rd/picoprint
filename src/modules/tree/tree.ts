import type { RenderOptions } from "../context";
import { assertColorFunctionOption, colors } from "../../utils/colors";
import {
  assertBooleanOption,
  assertEnumOption,
  assertFunctionOption,
  assertNonNegativeIntegerOption,
  assertPlainOptionsObject,
  assertStringOption,
  isPlainRecord,
} from "../../utils/options";
import { renderAndReturn, write } from "../../utils/writer";
import { resolveRenderContext } from "../context";

export interface TreeNode {
  name: string;
  children?: readonly TreeNode[];
  value?: unknown;
  metadata?: Record<string, unknown>;
  expanded?: boolean;
}

export type TreeStyleName = "ascii" | "double" | "rounded" | "single" | "thick";

export interface TreeOptions {
  offset?: RenderOptions["offset"];
  style?: TreeStyleName;
  showValues?: boolean;
  showMetadata?: boolean;
  maxDepth?: number;
  filter?: (node: TreeNode) => boolean;
  sort?: (a: TreeNode, b: TreeNode) => number;
  collapseEmpty?: boolean;
  colors?: {
    node?: (s: string) => string;
    value?: (s: string) => string;
    metadata?: (s: string) => string;
    connector?: (s: string) => string;
  };
  renderContext?: RenderOptions["renderContext"];
}

interface ResolvedTreeOptions {
  style: TreeStyleName;
  showValues: boolean;
  showMetadata: boolean;
  maxDepth: number;
  filter: ((node: TreeNode) => boolean) | undefined;
  sort: ((a: TreeNode, b: TreeNode) => number) | undefined;
  collapseEmpty: boolean;
  colors: {
    node: (s: string) => string;
    value: (s: string) => string;
    metadata: (s: string) => string;
    connector: (s: string) => string;
  };
}

export interface DirectoryEntry {
  name: string;
  type: "directory" | "file";
  size?: number;
  children?: readonly DirectoryEntry[];
  path?: string;
}

export interface DirectoryOptions {
  offset?: RenderOptions["offset"];
  showSizes?: boolean;
  showPaths?: boolean;
  sortBy?: "name" | "size" | "type";
  fileIcons?: boolean;
  maxDepth?: number;
  filter?: (entry: DirectoryEntry) => boolean;
  renderContext?: RenderOptions["renderContext"];
}

const BYTES_IN_KB = 1024;
const BYTES_IN_MB = 1024 * 1024;
const BYTES_IN_GB = 1024 * 1024 * 1024;

const DEFAULT_MAX_DEPTH = 10;

const DEFAULT_TREE_OPTIONS: ResolvedTreeOptions = {
  style: "single",
  showValues: false,
  showMetadata: false,
  maxDepth: DEFAULT_MAX_DEPTH,
  filter: undefined,
  sort: undefined,
  collapseEmpty: false,
  colors: {
    node: colors.cyan,
    value: colors.yellow,
    metadata: colors.dim,
    connector: colors.dim,
  },
};

const TREE_STYLE_NAMES = ["ascii", "double", "rounded", "single", "thick"] as const;
const DIRECTORY_ENTRY_TYPES = ["directory", "file"] as const;
const DIRECTORY_SORT_NAMES = ["name", "size", "type"] as const;

const assertTreeStyleOption = (value: unknown, optionName: string) => {
  assertEnumOption(value, optionName, TREE_STYLE_NAMES);
};

const assertDirectorySortOption = (value: unknown, optionName: string) => {
  assertEnumOption(value, optionName, DIRECTORY_SORT_NAMES);
};

const assertDirectoryEntryType = (value: unknown, optionName: string) => {
  assertEnumOption(value, optionName, DIRECTORY_ENTRY_TYPES);
};

const assertRequiredString = (value: unknown, optionName: string) => {
  if (typeof value !== "string") throw new TypeError(`picoprint ${optionName} must be a string`);
};

function assertRequiredObject(value: unknown, optionName: string): asserts value is Record<string, unknown> {
  if (!isPlainRecord(value)) throw new TypeError(`picoprint ${optionName} must be an object`);
}

function assertTreeNode(
  value: unknown,
  optionName: string,
  seen = new WeakSet<object>(),
): asserts value is TreeNode {
  assertRequiredObject(value, optionName);
  const node = value;
  if (seen.has(node)) throw new TypeError(`picoprint ${optionName} contains a circular reference`);
  seen.add(node);
  assertRequiredString(node.name, `${optionName}.name`);
  assertBooleanOption(node.expanded, `${optionName}.expanded`);
  if (node.metadata !== undefined) assertPlainOptionsObject(node.metadata, `${optionName}.metadata`);
  try {
    if (node.children === undefined) return;
    if (!Array.isArray(node.children)) {
      throw new TypeError(`picoprint ${optionName}.children must be TreeNode[]`);
    }
    for (const [index, child] of node.children.entries()) {
      assertTreeNode(child, `${optionName}.children[${index}]`, seen);
    }
  } finally {
    seen.delete(node);
  }
}

function assertTreeNodeArray(
  value: unknown,
  optionName: string,
): asserts value is readonly (TreeNode | undefined)[] {
  if (!Array.isArray(value)) throw new TypeError(`picoprint ${optionName} must be TreeNode[]`);
  const seen = new WeakSet<object>();
  for (const [index, node] of value.entries()) {
    if (node !== undefined) assertTreeNode(node, `${optionName}[${index}]`, seen);
  }
}

function assertDirectoryEntry(
  value: unknown,
  optionName: string,
  seen = new WeakSet<object>(),
): asserts value is DirectoryEntry {
  assertRequiredObject(value, optionName);
  const entry = value;
  if (seen.has(entry)) throw new TypeError(`picoprint ${optionName} contains a circular reference`);
  seen.add(entry);
  assertRequiredString(entry.name, `${optionName}.name`);
  assertDirectoryEntryType(entry.type, `${optionName}.type`);
  assertNonNegativeIntegerOption(entry.size, `${optionName}.size`);
  assertStringOption(entry.path, `${optionName}.path`);
  try {
    if (entry.children === undefined) return;
    if (!Array.isArray(entry.children)) {
      throw new TypeError(`picoprint ${optionName}.children must be DirectoryEntry[]`);
    }
    for (const [index, child] of entry.children.entries()) {
      assertDirectoryEntry(child, `${optionName}.children[${index}]`, seen);
    }
  } finally {
    seen.delete(entry);
  }
}

const validateTreeOptions = (options: TreeOptions) => {
  assertPlainOptionsObject(options, "tree options");
  assertTreeStyleOption(options.style, "tree style");
  assertBooleanOption(options.showValues, "showValues");
  assertBooleanOption(options.showMetadata, "showMetadata");
  assertNonNegativeIntegerOption(options.maxDepth, "maxDepth");
  assertFunctionOption(options.filter, "filter");
  assertFunctionOption(options.sort, "sort");
  assertBooleanOption(options.collapseEmpty, "collapseEmpty");
  assertPlainOptionsObject(options.colors, "tree.colors");
  assertColorFunctionOption(options.colors?.node, "tree.colors.node");
  assertColorFunctionOption(options.colors?.value, "tree.colors.value");
  assertColorFunctionOption(options.colors?.metadata, "tree.colors.metadata");
  assertColorFunctionOption(options.colors?.connector, "tree.colors.connector");
};

const validateDirectoryOptions = (options: DirectoryOptions) => {
  assertPlainOptionsObject(options, "tree.directory options");
  assertBooleanOption(options.showSizes, "showSizes");
  assertBooleanOption(options.showPaths, "showPaths");
  assertBooleanOption(options.fileIcons, "fileIcons");
  assertNonNegativeIntegerOption(options.maxDepth, "maxDepth");
  assertFunctionOption(options.filter, "filter");
  assertDirectorySortOption(options.sortBy, "sortBy");
};

const treeStyles = {
  single: {
    branch: "├── ",
    lastBranch: "└── ",
    vertical: "│   ",
    empty: "    ",
  },
  ascii: {
    branch: "|-- ",
    lastBranch: "`-- ",
    vertical: "|   ",
    empty: "    ",
  },
  rounded: {
    branch: "├─ ",
    lastBranch: "╰─ ",
    vertical: "│  ",
    empty: "   ",
  },
  double: {
    branch: "╠══ ",
    lastBranch: "╚══ ",
    vertical: "║   ",
    empty: "    ",
  },
  thick: {
    branch: "┣━━ ",
    lastBranch: "┗━━ ",
    vertical: "┃   ",
    empty: "    ",
  },
};

const fileIcons = {
  directory: "📁",
  file: "📄",
  js: "📜",
  ts: "📘",
  json: "📋",
  md: "📝",
  txt: "📄",
  py: "🐍",
  html: "🌐",
  css: "🎨",
  image: "🖼️",
  video: "🎬",
  audio: "🎵",
  archive: "📦",
  config: "⚙️",
} as const;

const FILE_EXTENSION_ICONS = {
  js: fileIcons.js,
  ts: fileIcons.ts,
  tsx: fileIcons.ts,
  json: fileIcons.json,
  md: fileIcons.md,
  markdown: fileIcons.md,
  txt: fileIcons.txt,
  py: fileIcons.py,
  html: fileIcons.html,
  htm: fileIcons.html,
  css: fileIcons.css,
  scss: fileIcons.css,
  sass: fileIcons.css,
  png: fileIcons.image,
  jpg: fileIcons.image,
  jpeg: fileIcons.image,
  gif: fileIcons.image,
  svg: fileIcons.image,
  mp4: fileIcons.video,
  avi: fileIcons.video,
  mov: fileIcons.video,
  mkv: fileIcons.video,
  mp3: fileIcons.audio,
  wav: fileIcons.audio,
  flac: fileIcons.audio,
  ogg: fileIcons.audio,
  zip: fileIcons.archive,
  tar: fileIcons.archive,
  gz: fileIcons.archive,
  rar: fileIcons.archive,
  yml: fileIcons.config,
  yaml: fileIcons.config,
  toml: fileIcons.config,
  ini: fileIcons.config,
} as const satisfies Record<string, string>;

const getFileIcon = (entry: DirectoryEntry) => {
  if (entry.type === "directory") {
    return fileIcons.directory;
  }

  const ext = entry.name.split(".").pop()?.toLowerCase();
  if (!ext) return fileIcons.file;

  return FILE_EXTENSION_ICONS[ext as keyof typeof FILE_EXTENSION_ICONS] || fileIcons.file;
};

const formatSize = (bytes?: number) => {
  if (bytes === undefined) return "";

  if (bytes < BYTES_IN_KB) return `${bytes}B`;
  if (bytes < BYTES_IN_MB) return `${(bytes / BYTES_IN_KB).toFixed(1)}KB`;
  if (bytes < BYTES_IN_GB) return `${(bytes / BYTES_IN_MB).toFixed(1)}MB`;
  return `${(bytes / BYTES_IN_GB).toFixed(1)}GB`;
};

const renderTreeNode = ({
  node,
  prefix,
  isLast,
  style,
  options,
  depth = 0,
}: {
  node: TreeNode;
  prefix: string;
  isLast: boolean;
  style: typeof treeStyles.single;
  options: ResolvedTreeOptions;
  depth?: number;
}): string[] => {
  if (depth > options.maxDepth) {
    return [`${prefix}${colors.dim("...")}`];
  }

  if (options.filter && depth > 0 && !options.filter(node)) {
    return [];
  }

  const lines = [];
  const nodeColor = options.colors.node;
  const valueColor = options.colors.value;
  const metadataColor = options.colors.metadata;
  const connectorColor = options.colors.connector;

  const connector = connectorColor(isLast ? style.lastBranch : style.branch);

  let line = `${prefix}${connector}${nodeColor(node.name)}`;

  if (options.showValues && node.value !== undefined) {
    const valueStr = typeof node.value === "string" ? `"${node.value}"` : String(node.value);
    line += ` ${valueColor(valueStr)}`;
  }

  if (options.showMetadata && node.metadata) {
    const metaStr = Object.entries(node.metadata)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ");
    const coloredMetaStr = metadataColor(`{${metaStr}}`);
    line += ` ${coloredMetaStr}`;
  }

  lines.push(line);

  if (node.children && node.children.length > 0 && node.expanded !== false) {
    const nextPrefix = prefix + connectorColor(isLast ? style.empty : style.vertical);

    let children = [...node.children];
    if (options.sort) {
      children = children.sort(options.sort);
    }

    if (options.collapseEmpty) {
      children = children.filter(
        (child) =>
          (child.children && child.children.length > 0) ||
          child.value !== undefined ||
          (child.metadata && Object.keys(child.metadata).length > 0),
      );
    }

    const lastChildIndex = children.length - 1;
    for (const [i, child] of children.entries()) {
      if (child) {
        const isLastChild = i === lastChildIndex;
        const childLines: string[] = renderTreeNode({
          node: child,
          prefix: nextPrefix,
          isLast: isLastChild,
          style,
          options,
          depth: depth + 1,
        });
        lines.push(...childLines);
      }
    }
  }

  return lines;
};

const renderDirectoryEntry = (
  entry: DirectoryEntry,
  prefix: string,
  isLast: boolean,
  options: Required<DirectoryOptions>,
  depth = 0,
): string[] => {
  if (depth > options.maxDepth) {
    return [`${prefix}${colors.dim("...")}`];
  }

  if (options.filter && depth > 0 && !options.filter(entry)) {
    return [];
  }

  const lines = [];
  const style = treeStyles.single;
  const connector = colors.dim(isLast ? style.lastBranch : style.branch);

  let line = `${prefix}${connector}`;

  if (options.fileIcons) {
    line += `${getFileIcon(entry)} `;
  }

  const nameColor = entry.type === "directory" ? colors.cyan : colors.white;
  line += nameColor(entry.name);

  if (options.showSizes && entry.size !== undefined) {
    const formattedSize = colors.dim(`(${formatSize(entry.size)})`);
    line += ` ${formattedSize}`;
  }

  if (options.showPaths && entry.path) {
    line += ` ${colors.gray(entry.path)}`;
  }

  lines.push(line);

  if (entry.children && entry.children.length > 0) {
    const nextPrefix = prefix + colors.dim(isLast ? style.empty : style.vertical);

    let children = [...entry.children];

    if (options.sortBy === "name") {
      children = children.sort((a, b) => a.name.localeCompare(b.name));
    } else if (options.sortBy === "size") {
      children = children.sort((a, b) => (b.size || 0) - (a.size || 0));
    } else if (options.sortBy === "type") {
      children = children.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === "directory" ? -1 : 1;
      });
    }

    const lastChildIndex = children.length - 1;
    for (const [i, child] of children.entries()) {
      if (child) {
        const isLastChild = i === lastChildIndex;
        const childLines: string[] = renderDirectoryEntry(child, nextPrefix, isLastChild, options, depth + 1);
        lines.push(...childLines);
      }
    }
  }

  return lines;
};

const resolveTreeOptions = (options: TreeOptions): ResolvedTreeOptions => ({
  ...DEFAULT_TREE_OPTIONS,
  ...options,
  colors: { ...DEFAULT_TREE_OPTIONS.colors, ...options.colors },
});

export const tree = (treeNode: TreeNode, options: TreeOptions = {}) =>
  renderAndReturn(() => {
    assertTreeNode(treeNode, "tree node");
    validateTreeOptions(options);
    const opts = resolveTreeOptions(options);

    const lines = renderTreeNode({
      node: treeNode,
      prefix: "",
      isLast: true,
      style: treeStyles[opts.style],
      options: opts,
    });

    const ctx = resolveRenderContext(options);
    const indent = " ".repeat(ctx.offset);

    for (const line of lines) write(indent + line);
  });

export const treeMulti = (trees: readonly (TreeNode | undefined)[], options: TreeOptions = {}) =>
  renderAndReturn(() => {
    assertTreeNodeArray(trees, "tree.multi nodes");
    validateTreeOptions(options);
    const ctx = resolveRenderContext(options);
    const indent = " ".repeat(ctx.offset);

    const visibleTrees = trees.filter((treeNode): treeNode is TreeNode => treeNode !== undefined);

    for (const [i, treeNode] of visibleTrees.entries()) {
      write(indent + colors.magenta(`Tree ${i + 1}: ${treeNode.name}`));

      const opts = resolveTreeOptions(options);

      const lines = renderTreeNode({
        node: treeNode,
        prefix: "",
        isLast: true,
        style: treeStyles[opts.style],
        options: opts,
      });
      for (const line of lines) write(indent + line);

      if (i < visibleTrees.length - 1) {
        write("");
      }
    }
  });

export const directory = (dir: DirectoryEntry, options: DirectoryOptions = {}) =>
  renderAndReturn(() => {
    assertDirectoryEntry(dir, "tree.directory entry");
    validateDirectoryOptions(options);
    const opts = {
      showSizes: true,
      showPaths: false,
      sortBy: "type",
      fileIcons: true,
      maxDepth: DEFAULT_MAX_DEPTH,
      filter: undefined,
      ...options,
    } as Required<DirectoryOptions>;

    const lines = renderDirectoryEntry(dir, "", true, opts);

    const ctx = resolveRenderContext(options);
    const indent = " ".repeat(ctx.offset);

    for (const line of lines) write(indent + line);
  });

const objectToTree = (obj: unknown, name: string, seen: WeakSet<object> = new WeakSet()): TreeNode => {
  if (obj === null || obj === undefined) {
    return { name, value: obj };
  }

  if (typeof obj !== "object") {
    return { name, value: obj };
  }

  if (obj instanceof Date) {
    return { name, value: obj.toISOString() };
  }

  if (seen.has(obj)) return { name, value: "[Circular]" };
  seen.add(obj);

  try {
    if (Array.isArray(obj)) {
      return {
        name: `${name} [${obj.length}]`,
        children: obj.map((item, index) => objectToTree(item, `[${index}]`, seen)),
      };
    }

    if (obj instanceof Map) {
      return {
        name: `${name} Map(${obj.size})`,
        children: Array.from(obj.entries()).map(([key, value]) => objectToTree(value, String(key), seen)),
      };
    }

    if (obj instanceof Set) {
      return {
        name: `${name} Set(${obj.size})`,
        children: Array.from(obj).map((value, index) => objectToTree(value, `{${index}}`, seen)),
      };
    }

    const entries = Object.entries(obj as Record<string, unknown>);

    return {
      name: `${name} {${entries.length}}`,
      children: entries.map(([key, value]) => objectToTree(value, key, seen)),
    };
  } finally {
    seen.delete(obj);
  }
};

const resolveTreeFromObjectArgs = (nameOrOptions: unknown, options: TreeOptions) => {
  if (nameOrOptions === undefined) return { name: "root", options };
  if (typeof nameOrOptions === "string") return { name: nameOrOptions, options };
  if (isPlainRecord(nameOrOptions)) {
    return { name: "root", options: nameOrOptions as TreeOptions };
  }
  throw new TypeError("picoprint tree.fromObject second argument must be a name string or options object");
};

export function treeFromObject(obj: unknown, options?: TreeOptions): string;
export function treeFromObject(obj: unknown, name?: string, options?: TreeOptions): string;
export function treeFromObject(
  obj: unknown,
  nameOrOptions: TreeOptions | string = "root",
  options: TreeOptions = {},
) {
  const resolved = resolveTreeFromObjectArgs(nameOrOptions, options);
  validateTreeOptions(resolved.options);
  return tree(objectToTree(obj, resolved.name), {
    showValues: true,
    ...resolved.options,
  });
}

const isNodeMatchingSearch = (node: TreeNode, searchTerm: string): boolean => {
  const lowerSearchTerm = searchTerm.toLowerCase();
  const nameMatch = node.name.toLowerCase().includes(lowerSearchTerm);
  const valueMatch = node.value !== undefined && String(node.value).toLowerCase().includes(lowerSearchTerm);
  const hasMatchingChild = node.children?.some((child) => child && isNodeMatchingSearch(child, searchTerm));

  return nameMatch || Boolean(valueMatch) || Boolean(hasMatchingChild);
};

export const treeSearch = (treeNode: TreeNode, searchTerm: string, options: TreeOptions = {}) => {
  assertTreeNode(treeNode, "tree.search node");
  assertRequiredString(searchTerm, "tree.search query");
  assertPlainOptionsObject(options as unknown, "tree.search options");
  validateTreeOptions(options);
  const userFilter = options.filter;
  return tree(treeNode, {
    ...options,
    filter: (node) => isNodeMatchingSearch(node, searchTerm) && (!userFilter || userFilter(node)),
  });
};
