import { afterEach, beforeEach, describe, expect, it, mock, Mock } from "bun:test";
import { stripAnsi } from "@/utils/ansi";
import {
  directory,
  DirectoryEntry,
  tree,
  treeFromObject,
  treeMulti,
  TreeNode,
  treeSearch,
  treeStats,
} from "./tree";

describe("tree", () => {
  let originalLog: typeof console.log;
  let logSpy: Mock<(...args: unknown[]) => void>;
  let logOutput: string[];

  beforeEach(() => {
    originalLog = console.log;
    logOutput = [];
    logSpy = mock((...args) => {
      logOutput.push(args.map(String).join(" "));
    });
    console.log = logSpy;
  });

  afterEach(() => {
    console.log = originalLog;
  });

  describe("basic tree rendering", () => {
    it("should render a simple tree", () => {
      const treeNode: TreeNode = {
        name: "root",
        children: [{ name: "child1" }, { name: "child2" }, { name: "child3" }],
      };

      tree(treeNode);

      expect(logSpy).toHaveBeenCalled();
      const output = logOutput.join("\n");
      expect(output).toContain("root");
      expect(output).toContain("child1");
      expect(output).toContain("child2");
      expect(output).toContain("child3");
      expect(output).toContain("├──");
      expect(output).toContain("└──");
    });

    it("should render nested trees", () => {
      const treeNode: TreeNode = {
        name: "root",
        children: [
          {
            name: "parent1",
            children: [{ name: "child1.1" }, { name: "child1.2" }],
          },
          {
            name: "parent2",
            children: [{ name: "child2.1" }],
          },
        ],
      };

      tree(treeNode);

      const output = logOutput.join("\n");
      expect(output).toContain("root");
      expect(output).toContain("parent1");
      expect(output).toContain("child1.1");
      expect(output).toContain("child1.2");
      expect(output).toContain("parent2");
      expect(output).toContain("child2.1");
    });

    it("should handle empty tree", () => {
      const treeNode: TreeNode = {
        name: "root",
      };

      tree(treeNode);

      expect(logOutput.join("\n")).toContain("root");
    });

    it("should render tree with values", () => {
      const treeNode: TreeNode = {
        name: "root",
        value: 100,
        children: [
          { name: "child1", value: "text" },
          { name: "child2", value: true },
        ],
      };

      tree(treeNode, { showValues: true });

      const output = logOutput.join("\n");
      expect(output).toContain("100");
      expect(output).toContain('"text"');
      expect(output).toContain("true");
    });

    it("should render tree with metadata", () => {
      const treeNode: TreeNode = {
        name: "root",
        metadata: { type: "folder", size: 1024 },
        children: [{ name: "child", metadata: { type: "file" } }],
      };

      tree(treeNode, { showMetadata: true });

      const output = logOutput.join("\n");
      expect(output).toContain("type=folder");
      expect(output).toContain("size=1024");
      expect(output).toContain("type=file");
    });
  });

  describe("tree styles", () => {
    const treeNode: TreeNode = {
      name: "root",
      children: [{ name: "child1" }, { name: "child2" }],
    };

    it("should render with unicode style (default)", () => {
      tree(treeNode, { style: "unicode" });

      const output = stripAnsi(logOutput.join("\n"));
      expect(output).toContain("├──");
      expect(output).toContain("└──");
    });

    it("should render with ascii style", () => {
      tree(treeNode, { style: "ascii" });

      const output = stripAnsi(logOutput.join("\n"));
      expect(output).toContain("|--");
      expect(output).toContain("`--");
    });

    it("should render with rounded style", () => {
      tree(treeNode, { style: "rounded" });

      const output = stripAnsi(logOutput.join("\n"));
      expect(output).toContain("├─");
      expect(output).toContain("╰─");
    });

    it("should render with double style", () => {
      tree(treeNode, { style: "double" });

      const output = stripAnsi(logOutput.join("\n"));
      expect(output).toContain("╠══");
      expect(output).toContain("╚══");
    });

    it("should render with bold style", () => {
      tree(treeNode, { style: "bold" });

      const output = stripAnsi(logOutput.join("\n"));
      expect(output).toContain("┣━━");
      expect(output).toContain("┗━━");
    });
  });

  describe("tree options", () => {
    it("should respect maxDepth", () => {
      const deepTree: TreeNode = {
        name: "root",
        children: [
          {
            name: "level1",
            children: [
              {
                name: "level2",
                children: [
                  {
                    name: "level3",
                    children: [{ name: "level4" }],
                  },
                ],
              },
            ],
          },
        ],
      };

      tree(deepTree, { maxDepth: 2 });

      const output = logOutput.join("\n");
      expect(output).toContain("root");
      expect(output).toContain("level1");
      expect(output).toContain("level2");
      expect(output).toContain("...");
      expect(output).not.toContain("level3");
      expect(output).not.toContain("level4");
    });

    it("should filter nodes", () => {
      const treeNode: TreeNode = {
        name: "root",
        children: [{ name: "show1" }, { name: "hide" }, { name: "show2" }],
      };

      tree(treeNode, {
        filter: (node) => !node.name.includes("hide"),
      });

      const output = logOutput.join("\n");
      expect(output).toContain("show1");
      expect(output).toContain("show2");
      expect(output).not.toContain("hide");
    });

    it("should sort nodes", () => {
      const treeNode: TreeNode = {
        name: "root",
        children: [{ name: "zebra" }, { name: "apple" }, { name: "banana" }],
      };

      tree(treeNode, {
        sort: (a, b) => a.name.localeCompare(b.name),
      });

      const output = logOutput.join("\n");
      const appleIndex = output.indexOf("apple");
      const bananaIndex = output.indexOf("banana");
      const zebraIndex = output.indexOf("zebra");

      expect(appleIndex).toBeLessThan(bananaIndex);
      expect(bananaIndex).toBeLessThan(zebraIndex);
    });

    it("should collapse empty nodes when collapseEmpty is true", () => {
      const treeNode: TreeNode = {
        name: "root",
        children: [
          { name: "empty1" },
          { name: "withValue", value: 123 },
          { name: "empty2" },
          { name: "withChildren", children: [{ name: "child" }] },
        ],
      };

      tree(treeNode, { collapseEmpty: true });

      const output = logOutput.join("\n");
      expect(output).not.toContain("empty1");
      expect(output).not.toContain("empty2");
      expect(output).toContain("withValue");
      expect(output).toContain("withChildren");
    });

    it("should handle collapsed nodes", () => {
      const treeNode: TreeNode = {
        name: "root",
        children: [
          {
            name: "expanded",
            expanded: true,
            children: [{ name: "visible" }],
          },
          {
            name: "collapsed",
            expanded: false,
            children: [{ name: "hidden" }],
          },
        ],
      };

      tree(treeNode);

      const output = logOutput.join("\n");
      expect(output).toContain("expanded");
      expect(output).toContain("visible");
      expect(output).toContain("collapsed");
      expect(output).not.toContain("hidden");
    });
  });

  describe("ppTree alias", () => {
    it("should work the same as tree", () => {
      const treeNode: TreeNode = {
        name: "test",
      };

      tree(treeNode);

      expect(logSpy).toHaveBeenCalled();
      expect(logOutput.join("\n")).toContain("test");
    });
  });

  describe("treeMulti", () => {
    it("should render multiple trees", () => {
      const trees: TreeNode[] = [
        { name: "tree1", children: [{ name: "child1" }] },
        { name: "tree2", children: [{ name: "child2" }] },
        { name: "tree3", children: [{ name: "child3" }] },
      ];

      treeMulti(trees);

      const output = logOutput.join("\n");
      expect(output).toContain("Tree 1:");
      expect(output).toContain("tree1");
      expect(output).toContain("Tree 2:");
      expect(output).toContain("tree2");
      expect(output).toContain("Tree 3:");
      expect(output).toContain("tree3");
    });

    it("should skip undefined trees", () => {
      const trees = [{ name: "tree1" }, undefined, { name: "tree2" }];

      treeMulti(trees);

      const output = logOutput.join("\n");
      expect(output).toContain("tree1");
      expect(output).toContain("tree2");
    });
  });

  describe("directory", () => {
    it("should render directory structure", () => {
      const dir: DirectoryEntry = {
        name: "project",
        type: "directory",
        children: [
          { name: "src", type: "directory", children: [] },
          { name: "index.js", type: "file", size: 1024 },
          { name: "README.md", type: "file", size: 2048 },
        ],
      };

      directory(dir);

      const output = logOutput.join("\n");
      expect(output).toContain("project");
      expect(output).toContain("src");
      expect(output).toContain("index.js");
      expect(output).toContain("README.md");
    });

    it("should show file sizes", () => {
      const dir: DirectoryEntry = {
        name: "root",
        type: "directory",
        children: [
          { name: "small.txt", type: "file", size: 500 },
          { name: "medium.txt", type: "file", size: 5000 },
          { name: "large.txt", type: "file", size: 5_000_000 },
        ],
      };

      directory(dir, { showSizes: true });

      const output = logOutput.join("\n");
      expect(output).toContain("500B");
      expect(output).toContain("4.9KB");
      expect(output).toContain("4.8MB");
    });

    it("should show file icons", () => {
      const dir: DirectoryEntry = {
        name: "root",
        type: "directory",
        children: [
          { name: "folder", type: "directory" },
          { name: "script.js", type: "file" },
          { name: "styles.css", type: "file" },
          { name: "data.json", type: "file" },
        ],
      };

      directory(dir, { fileIcons: true });

      const output = logOutput.join("\n");
      expect(output).toContain("📁");
      expect(output).toContain("📜");
      expect(output).toContain("🎨");
      expect(output).toContain("📋");
    });

    it("should sort by name", () => {
      const dir: DirectoryEntry = {
        name: "root",
        type: "directory",
        children: [
          { name: "zebra.txt", type: "file" },
          { name: "apple.txt", type: "file" },
          { name: "banana.txt", type: "file" },
        ],
      };

      directory(dir, { sortBy: "name" });

      const output = logOutput.join("\n");
      const appleIndex = output.indexOf("apple");
      const bananaIndex = output.indexOf("banana");
      const zebraIndex = output.indexOf("zebra");

      expect(appleIndex).toBeLessThan(bananaIndex);
      expect(bananaIndex).toBeLessThan(zebraIndex);
    });

    it("should sort by type", () => {
      const dir: DirectoryEntry = {
        name: "root",
        type: "directory",
        children: [
          { name: "file1.txt", type: "file" },
          { name: "folder1", type: "directory" },
          { name: "file2.txt", type: "file" },
          { name: "folder2", type: "directory" },
        ],
      };

      directory(dir, { sortBy: "type" });

      const output = logOutput.join("\n");
      const folder1Index = output.indexOf("folder1");
      const folder2Index = output.indexOf("folder2");
      const file1Index = output.indexOf("file1");

      expect(folder1Index).toBeLessThan(file1Index);
      expect(folder2Index).toBeLessThan(file1Index);
    });
  });

  describe("ppDirectory alias", () => {
    it("should work the same as directory", () => {
      const dir: DirectoryEntry = {
        name: "test",
        type: "directory",
      };

      directory(dir);

      expect(logSpy).toHaveBeenCalled();
      expect(logOutput.join("\n")).toContain("test");
    });
  });

  describe("treeFromObject", () => {
    it("should convert object to tree", () => {
      const obj = {
        a: 1,
        b: {
          c: 2,
          d: 3,
        },
        e: [4, 5, 6],
      };

      treeFromObject(obj);

      const output = logOutput.join("\n");
      expect(output).toContain("root");
      expect(output).toContain("a");
      expect(output).toContain("b");
      expect(output).toContain("c");
      expect(output).toContain("d");
      expect(output).toContain("e");
      expect(output).toContain("[0]");
      expect(output).toContain("[1]");
      expect(output).toContain("[2]");
    });

    it("should handle arrays", () => {
      const arr = [1, 2, { nested: true }];

      treeFromObject(arr, "array");

      const output = logOutput.join("\n");
      expect(output).toContain("array [3]");
      expect(output).toContain("[0]");
      expect(output).toContain("[1]");
      expect(output).toContain("[2]");
      expect(output).toContain("nested");
    });

    it("should handle Maps", () => {
      const map = new Map([
        ["key1", "value1"],
        ["key2", "value2"],
      ]);

      treeFromObject(map, "map");

      const output = logOutput.join("\n");
      expect(output).toContain("map Map(2)");
      expect(output).toContain("key1");
      expect(output).toContain("key2");
    });

    it("should handle Sets", () => {
      const set = new Set(["a", "b", "c"]);

      treeFromObject(set, "set");

      const output = logOutput.join("\n");
      expect(output).toContain("set Set(3)");
      expect(output).toContain("{0}");
      expect(output).toContain("{1}");
      expect(output).toContain("{2}");
    });

    it("should handle Dates", () => {
      const date = new Date("2024-01-01T00:00:00Z");

      treeFromObject(date, "date");

      const output = logOutput.join("\n");
      expect(output).toContain("date");
      expect(output).toContain("2024-01-01");
    });

    it("should handle primitive values", () => {
      treeFromObject(42, "number");
      treeFromObject("text", "string");
      treeFromObject(true, "boolean");
      treeFromObject(null, "null");
      treeFromObject(undefined, "undefined");

      const output = logOutput.join("\n");
      expect(output).toContain("42");
      expect(output).toContain("text");
      expect(output).toContain("true");
      expect(output).toContain("null");
      expect(output).toContain("undefined");
    });
  });

  describe("ppTreeFromObject alias", () => {
    it("should work the same as treeFromObject", () => {
      const obj = { test: "value" };

      treeFromObject(obj);

      expect(logSpy).toHaveBeenCalled();
      expect(logOutput.join("\n")).toContain("test");
    });
  });

  describe("treeSearch", () => {
    it("should filter tree based on search term", () => {
      const treeNode: TreeNode = {
        name: "root",
        children: [{ name: "apple" }, { name: "banana" }, { name: "application" }, { name: "orange" }],
      };

      treeSearch(treeNode, "app");

      const output = logOutput.join("\n");
      expect(output).toContain("apple");
      expect(output).toContain("application");
      expect(output).not.toContain("banana");
      expect(output).not.toContain("orange");
    });

    it("should search in values", () => {
      const treeNode: TreeNode = {
        name: "root",
        children: [
          { name: "item1", value: "apple" },
          { name: "item2", value: "banana" },
        ],
      };

      treeSearch(treeNode, "apple");

      const output = logOutput.join("\n");
      expect(output).toContain("item1");
      expect(output).not.toContain("item2");
    });

    it("should include parent if child matches", () => {
      const treeNode: TreeNode = {
        name: "root",
        children: [
          {
            name: "parent1",
            children: [{ name: "target" }],
          },
          {
            name: "parent2",
            children: [{ name: "other" }],
          },
        ],
      };

      treeSearch(treeNode, "target");

      const output = logOutput.join("\n");
      expect(output).toContain("parent1");
      expect(output).toContain("target");
      expect(output).not.toContain("parent2");
      expect(output).not.toContain("other");
    });
  });

  describe("ppTreeSearch alias", () => {
    it("should work the same as treeSearch", () => {
      const treeNode: TreeNode = {
        name: "test",
      };

      treeSearch(treeNode, "test");

      expect(logSpy).toHaveBeenCalled();
      expect(logOutput.join("\n")).toContain("test");
    });
  });

  describe("treeStats", () => {
    it("should calculate tree statistics", () => {
      const treeNode: TreeNode = {
        name: "root",
        value: 1,
        children: [
          {
            name: "branch1",
            children: [
              { name: "leaf1", value: 2 },
              { name: "leaf2", value: 3 },
            ],
          },
          {
            name: "branch2",
            children: [
              {
                name: "subbranch",
                children: [{ name: "deepleaf", value: 4 }],
              },
            ],
          },
          { name: "leaf3" },
        ],
      };

      treeStats(treeNode);

      const output = logOutput.join("\n");
      expect(output).toContain("Total nodes:");
      expect(output).toContain("8");
      expect(output).toContain("Leaf nodes:");
      expect(output).toContain("4");
      expect(output).toContain("Max depth:");
      expect(output).toContain("3");
      expect(output).toContain("Nodes with values:");
      expect(output).toContain("4");
      expect(output).toContain("Tree name:");
      expect(output).toContain("root");
    });

    it("should handle single node tree", () => {
      const treeNode: TreeNode = {
        name: "single",
        value: 42,
      };

      treeStats(treeNode);

      const output = logOutput.join("\n");
      expect(output).toContain("Total nodes:");
      expect(output).toContain("1");
      expect(output).toContain("Leaf nodes:");
      expect(output).toContain("1");
      expect(output).toContain("Max depth:");
      expect(output).toContain("0");
    });
  });

  describe("ppTreeStats alias", () => {
    it("should work the same as treeStats", () => {
      const treeNode: TreeNode = {
        name: "test",
      };

      treeStats(treeNode);

      expect(logSpy).toHaveBeenCalled();
      expect(logOutput.join("\n")).toContain("test");
    });
  });
});
