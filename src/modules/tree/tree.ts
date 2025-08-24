import { colors } from "../colors";
import { getCurrentContext } from "../context";

export interface TreeNode {
  name: string;
  children?: TreeNode[];
  value?: unknown;
  metadata?: Record<string, unknown>;
  expanded?: boolean;
}

export interface TreeOptions {
  style?: "ascii" | "bold" | "double" | "rounded" | "unicode";
  showValues?: boolean;
  showMetadata?: boolean;
  maxDepth?: number;
  filter?: (node: TreeNode) => boolean;
  sort?: (a: TreeNode, b: TreeNode) => number;
  collapseEmpty?: boolean;
  colors?: {
    node?: keyof typeof colors;
    value?: keyof typeof colors;
    metadata?: keyof typeof colors;
    connector?: keyof typeof colors;
  };
}

export interface DirectoryEntry {
  name: string;
  type: "directory" | "file";
  size?: number;
  children?: DirectoryEntry[];
  path?: string;
}

export interface DirectoryOptions {
  showSizes?: boolean;
  showPaths?: boolean;
  sortBy?: "name" | "size" | "type";
  fileIcons?: boolean;
  maxDepth?: number;
  filter?: (entry: DirectoryEntry) => boolean;
}

const BYTES_IN_KB = 1024;
const BYTES_IN_MB = 1024 * 1024;
const BYTES_IN_GB = 1024 * 1024 * 1024;

const DEFAULT_MAX_DEPTH = 10;

const treeStyles = {
  unicode: {
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
  bold: {
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
  style: typeof treeStyles.unicode;
  options: Required<TreeOptions>;
  depth?: number;
}): string[] => {
  if (depth > options.maxDepth) {
    return [`${prefix}${colors.dim("...")}`];
  }

  if (options.filter && depth > 0 && !options.filter(node)) {
    return [];
  }

  const lines = [];
  const nodeColor = (options.colors.node && colors[options.colors.node]) || colors.cyan;
  const valueColor = (options.colors.value && colors[options.colors.value]) || colors.yellow;
  const metadataColor = (options.colors.metadata && colors[options.colors.metadata]) || colors.dim;
  const connectorColor = (options.colors.connector && colors[options.colors.connector]) || colors.dim;

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
  const style = treeStyles.unicode;
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

export const tree = (treeNode: TreeNode, options: TreeOptions = {}) => {
  const opts = {
    style: "unicode",
    showValues: false,
    showMetadata: false,
    maxDepth: DEFAULT_MAX_DEPTH,
    filter: undefined,
    sort: undefined,
    collapseEmpty: false,
    colors: {
      node: "cyan",
      value: "yellow",
      metadata: "dim",
      connector: "dim",
    },
    ...options,
  } as Required<TreeOptions>;

  const lines = renderTreeNode({
    node: treeNode,
    prefix: "",
    isLast: true,
    style: treeStyles[opts.style],
    options: opts,
  });

  const ctx = getCurrentContext();
  const indent = " ".repeat(ctx.offset);

  for (const line of lines) console.log(indent + line);
};

export const treeMulti = (trees: (TreeNode | undefined)[], options: TreeOptions = {}) => {
  const ctx = getCurrentContext();
  const indent = " ".repeat(ctx.offset);

  for (const [i, treeNode] of trees.entries()) {
    if (!treeNode) continue;

    console.log(indent + colors.magenta(`Tree ${i + 1}: ${treeNode.name}`));

    const opts = {
      style: "unicode",
      showValues: false,
      showMetadata: false,
      maxDepth: DEFAULT_MAX_DEPTH,
      filter: undefined,
      sort: undefined,
      collapseEmpty: false,
      colors: {
        node: "cyan",
        value: "yellow",
        metadata: "dim",
        connector: "dim",
      },
      ...options,
    } as Required<TreeOptions>;

    const lines = renderTreeNode({
      node: treeNode,
      prefix: "",
      isLast: true,
      style: treeStyles[opts.style],
      options: opts,
    });
    for (const line of lines) console.log(indent + line);

    if (i < trees.length - 1) {
      console.log();
    }
  }
};

export const directory = (dir: DirectoryEntry, options: DirectoryOptions = {}) => {
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

  const ctx = getCurrentContext();
  const indent = " ".repeat(ctx.offset);

  for (const line of lines) console.log(indent + line);
};

const objectToTree = (obj: unknown, name: string): TreeNode => {
  if (obj === null || obj === undefined) {
    return { name, value: obj };
  }

  if (typeof obj !== "object") {
    return { name, value: obj };
  }

  if (Array.isArray(obj)) {
    return {
      name: `${name} [${obj.length}]`,
      children: obj.map((item, index) => objectToTree(item, `[${index}]`)),
    };
  }

  if (obj instanceof Date) {
    return { name, value: obj.toISOString() };
  }

  if (obj instanceof Map) {
    return {
      name: `${name} Map(${obj.size})`,
      children: Array.from(obj.entries()).map(([key, value]) => objectToTree(value, String(key))),
    };
  }

  if (obj instanceof Set) {
    return {
      name: `${name} Set(${obj.size})`,
      children: Array.from(obj).map((value, index) => objectToTree(value, `{${index}}`)),
    };
  }

  const entries = Object.entries(obj as Record<string, unknown>);

  return {
    name: `${name} {${entries.length}}`,
    children: entries.map(([key, value]) => objectToTree(value, key)),
  };
};

export const treeFromObject = (obj: unknown, name = "root", options: TreeOptions = {}) => {
  tree(objectToTree(obj, name), { showValues: true, ...options });
};

const isNodeMatchingSearch = (node: TreeNode, searchTerm: string): boolean => {
  const lowerSearchTerm = searchTerm.toLowerCase();
  const nameMatch = node.name.toLowerCase().includes(lowerSearchTerm);
  const valueMatch = node.value && String(node.value).toLowerCase().includes(lowerSearchTerm);
  const hasMatchingChild = node.children?.some((child) => child && isNodeMatchingSearch(child, searchTerm));

  return nameMatch || Boolean(valueMatch) || Boolean(hasMatchingChild);
};

export const treeSearch = (treeNode: TreeNode, searchTerm: string, options: TreeOptions = {}) => {
  tree(treeNode, {
    ...options,
    filter: (node) => isNodeMatchingSearch(node, searchTerm),
  });
};

export const treeStats = (treeNode: TreeNode) => {
  let nodeCount = 0;
  let leafCount = 0;
  let maxDepth = 0;
  let valueCount = 0;

  const traverse = (node: TreeNode, depth = 0) => {
    nodeCount++;
    maxDepth = Math.max(maxDepth, depth);

    if (node.value !== undefined) {
      valueCount++;
    }

    if (node.children && node.children.length > 0) {
      for (const child of node.children) traverse(child, depth + 1);
    } else {
      leafCount++;
    }
  };

  traverse(treeNode);

  const ctx2 = getCurrentContext();
  const indent2 = " ".repeat(ctx2.offset);
  console.log(`${indent2}${colors.gray("Total nodes:")} ${colors.yellow(nodeCount.toString())}`);
  console.log(`${indent2}${colors.gray("Leaf nodes:")} ${colors.green(leafCount.toString())}`);
  console.log(`${indent2}${colors.gray("Max depth:")} ${colors.blue(maxDepth.toString())}`);
  console.log(`${indent2}${colors.gray("Nodes with values:")} ${colors.magenta(valueCount.toString())}`);
  console.log(`${colors.gray("Tree name:")} ${colors.cyan(treeNode.name)}`);
};
