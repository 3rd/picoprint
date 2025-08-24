import p, { DirectoryEntry, TreeNode } from "@/.";
import { printExample } from "./_helpers";

// Basic tree
printExample("Basic Tree Examples", [
  {
    title: "Basic tree",
    handler: () => {
      const nestedTree: TreeNode = {
        name: "Organization",
        children: [
          {
            name: "Development",
            children: [
              {
                name: "Frontend",
                children: [{ name: "React Team" }, { name: "Vue Team" }],
              },
              {
                name: "Backend",
                children: [{ name: "Node.js Team" }, { name: "Python Team" }],
              },
              { name: "DevOps" },
            ],
          },
          {
            name: "Business",
            children: [{ name: "Sales" }, { name: "Marketing" }, { name: "Customer Success" }],
          },
        ],
      };
      p.tree(nestedTree);
    },
  },
  {
    title: "Tree with values",
    handler: () => {
      const treeWithValues: TreeNode = {
        name: "Metrics",
        value: 1000,
        children: [
          { name: "Revenue", value: 500_000 },
          { name: "Costs", value: 300_000 },
          { name: "Profit", value: 200_000 },
          {
            name: "Breakdown",
            children: [
              { name: "Q1", value: 50_000 },
              { name: "Q2", value: 60_000 },
              { name: "Q3", value: 45_000 },
              { name: "Q4", value: 45_000 },
            ],
          },
        ],
      };
      p.tree(treeWithValues, { showValues: true });
    },
  },
  {
    title: "Tree with metadata",
    handler: () => {
      const treeWithMetadata: TreeNode = {
        name: "System",
        metadata: { version: "1.0.0", status: "active" },
        children: [
          {
            name: "Database",
            metadata: { type: "PostgreSQL", size: "50GB" },
            children: [
              { name: "Users Table", metadata: { records: 10_000 } },
              { name: "Orders Table", metadata: { records: 50_000 } },
            ],
          },
          {
            name: "Cache",
            metadata: { type: "Redis", memory: "4GB" },
          },
        ],
      };
      p.tree(treeWithMetadata, { showMetadata: true });
    },
  },
]);

printExample("Tree Styles", [
  {
    title: "Unicode (default)",
    handler: () => {
      const styleTree: TreeNode = {
        name: "Root",
        children: [
          {
            name: "Branch 1",
            children: [{ name: "Leaf 1.1" }, { name: "Leaf 1.2" }],
          },
          {
            name: "Branch 2",
            children: [{ name: "Leaf 2.1" }],
          },
          { name: "Branch 3" },
        ],
      };
      p.tree(styleTree, { style: "unicode" });
    },
  },
  {
    // eslint-disable-next-line unicorn/text-encoding-identifier-case
    title: "ASCII",
    handler: () => {
      const styleTree: TreeNode = {
        name: "Root",
        children: [
          {
            name: "Branch 1",
            children: [{ name: "Leaf 1.1" }, { name: "Leaf 1.2" }],
          },
          {
            name: "Branch 2",
            children: [{ name: "Leaf 2.1" }],
          },
          { name: "Branch 3" },
        ],
      };
      p.tree(styleTree, { style: "ascii" });
    },
  },
  {
    title: "Rounded",
    handler: () => {
      const styleTree: TreeNode = {
        name: "Root",
        children: [
          {
            name: "Branch 1",
            children: [{ name: "Leaf 1.1" }, { name: "Leaf 1.2" }],
          },
          {
            name: "Branch 2",
            children: [{ name: "Leaf 2.1" }],
          },
          { name: "Branch 3" },
        ],
      };
      p.tree(styleTree, { style: "rounded" });
    },
  },
  {
    title: "Double",
    handler: () => {
      const styleTree: TreeNode = {
        name: "Root",
        children: [
          {
            name: "Branch 1",
            children: [{ name: "Leaf 1.1" }, { name: "Leaf 1.2" }],
          },
          {
            name: "Branch 2",
            children: [{ name: "Leaf 2.1" }],
          },
          { name: "Branch 3" },
        ],
      };
      p.tree(styleTree, { style: "double" });
    },
  },
  {
    title: "Bold",
    handler: () => {
      const styleTree: TreeNode = {
        name: "Root",
        children: [
          {
            name: "Branch 1",
            children: [{ name: "Leaf 1.1" }, { name: "Leaf 1.2" }],
          },
          {
            name: "Branch 2",
            children: [{ name: "Leaf 2.1" }],
          },
          { name: "Branch 3" },
        ],
      };
      p.tree(styleTree, { style: "bold" });
    },
  },
]);

printExample("Tree Options", [
  {
    title: "Max depth",
    handler: () => {
      const deepTree: TreeNode = {
        name: "Level 0",
        children: [
          {
            name: "Level 1",
            children: [
              {
                name: "Level 2",
                children: [
                  {
                    name: "Level 3",
                    children: [
                      {
                        name: "Level 4",
                        children: [{ name: "Level 5" }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };
      p.tree(deepTree, { maxDepth: 3 });
    },
  },
  {
    title: "Filtering",
    handler: () => {
      const filterTree: TreeNode = {
        name: "Documents",
        children: [
          { name: "report.pdf", value: "PDF" },
          { name: "data.csv", value: "CSV" },
          { name: "image.png", value: "PNG" },
          { name: "script.js", value: "JS" },
          { name: "style.css", value: "CSS" },
        ],
      };
      p.tree(filterTree, {
        showValues: true,
        filter: (node) => !node.name.includes(".css") && !node.name.includes(".png"),
      });
    },
  },
  {
    title: "Sorting",
    handler: () => {
      const sortTree: TreeNode = {
        name: "Alphabet",
        children: [
          { name: "Zebra" },
          { name: "Apple" },
          { name: "Mango" },
          { name: "Banana" },
          { name: "Cherry" },
        ],
      };
      p.tree(sortTree, {
        sort: (a, b) => a.name.localeCompare(b.name),
      });
    },
  },
  {
    title: "Collapse empty nodes",
    handler: () => {
      const emptyTree: TreeNode = {
        name: "Project",
        children: [
          { name: "EmptyFolder1" },
          { name: "src", children: [{ name: "index.js", value: "entry" }] },
          { name: "EmptyFolder2" },
          { name: "README.md", value: "docs" },
          { name: "EmptyFolder3" },
        ],
      };
      p.tree(emptyTree, {
        showValues: true,
        collapseEmpty: true,
      });
    },
  },
  {
    title: "Expanded/Collapsed",
    handler: () => {
      const expandTree: TreeNode = {
        name: "Application",
        children: [
          {
            name: "Expanded Section",
            expanded: true,
            children: [{ name: "Visible 1" }, { name: "Visible 2" }],
          },
          {
            name: "Collapsed Section",
            expanded: false,
            children: [{ name: "Hidden 1" }, { name: "Hidden 2" }],
          },
        ],
      };
      p.tree(expandTree);
    },
  },
]);

printExample("Directory Structure", [
  {
    title: "Basic directory",
    handler: () => {
      const projectDir: DirectoryEntry = {
        name: "my-project",
        type: "directory",
        children: [
          {
            name: "src",
            type: "directory",
            children: [
              { name: "index.ts", type: "file", size: 2048 },
              { name: "utils.ts", type: "file", size: 1536 },
              {
                name: "components",
                type: "directory",
                children: [
                  { name: "Button.tsx", type: "file", size: 1024 },
                  { name: "Input.tsx", type: "file", size: 896 },
                ],
              },
            ],
          },
          { name: "package.json", type: "file", size: 512 },
          { name: "README.md", type: "file", size: 4096 },
          { name: "tsconfig.json", type: "file", size: 256 },
          {
            name: "node_modules",
            type: "directory",
            children: [],
          },
        ],
      };
      p.tree.directory(projectDir);
    },
  },
  {
    title: "File icons",
    handler: () => {
      const iconDir: DirectoryEntry = {
        name: "assets",
        type: "directory",
        children: [
          {
            name: "images",
            type: "directory",
            children: [
              { name: "logo.png", type: "file", size: 15_360 },
              { name: "banner.jpg", type: "file", size: 25_600 },
            ],
          },
          {
            name: "styles",
            type: "directory",
            children: [
              { name: "main.css", type: "file", size: 8192 },
              { name: "theme.scss", type: "file", size: 10_240 },
            ],
          },
          {
            name: "scripts",
            type: "directory",
            children: [
              { name: "app.js", type: "file", size: 20_480 },
              { name: "utils.ts", type: "file", size: 5120 },
            ],
          },
          { name: "data.json", type: "file", size: 2048 },
          { name: "config.yaml", type: "file", size: 512 },
        ],
      };
      p.tree.directory(iconDir, { fileIcons: true, showSizes: true });
    },
  },
  {
    title: "Sort by type",
    handler: () => {
      const iconDir: DirectoryEntry = {
        name: "assets",
        type: "directory",
        children: [
          {
            name: "images",
            type: "directory",
            children: [
              { name: "logo.png", type: "file", size: 15_360 },
              { name: "banner.jpg", type: "file", size: 25_600 },
            ],
          },
          {
            name: "styles",
            type: "directory",
            children: [
              { name: "main.css", type: "file", size: 8192 },
              { name: "theme.scss", type: "file", size: 10_240 },
            ],
          },
          {
            name: "scripts",
            type: "directory",
            children: [
              { name: "app.js", type: "file", size: 20_480 },
              { name: "utils.ts", type: "file", size: 5120 },
            ],
          },
          { name: "data.json", type: "file", size: 2048 },
          { name: "config.yaml", type: "file", size: 512 },
        ],
      };
      p.tree.directory(iconDir, { sortBy: "type", fileIcons: true });
    },
  },
  {
    title: "Sort by size",
    handler: () => {
      const iconDir: DirectoryEntry = {
        name: "assets",
        type: "directory",
        children: [
          {
            name: "images",
            type: "directory",
            children: [
              { name: "logo.png", type: "file", size: 15_360 },
              { name: "banner.jpg", type: "file", size: 25_600 },
            ],
          },
          {
            name: "styles",
            type: "directory",
            children: [
              { name: "main.css", type: "file", size: 8192 },
              { name: "theme.scss", type: "file", size: 10_240 },
            ],
          },
          {
            name: "scripts",
            type: "directory",
            children: [
              { name: "app.js", type: "file", size: 20_480 },
              { name: "utils.ts", type: "file", size: 5120 },
            ],
          },
          { name: "data.json", type: "file", size: 2048 },
          { name: "config.yaml", type: "file", size: 512 },
        ],
      };
      p.tree.directory(iconDir, { sortBy: "size", showSizes: true });
    },
  },
  {
    title: "Show paths",
    handler: () => {
      const pathDir: DirectoryEntry = {
        name: "lib",
        type: "directory",
        path: "/usr/local",
        children: [
          { name: "bin", type: "directory", path: "/usr/local/lib" },
          { name: "include", type: "directory", path: "/usr/local/lib" },
          { name: "share", type: "directory", path: "/usr/local/lib" },
        ],
      };
      p.tree.directory(pathDir, { showPaths: true });
    },
  },
]);

printExample("Object to Tree Conversion", [
  {
    title: "Simple object",
    handler: () => {
      const simpleObj = {
        name: "John Doe",
        age: 30,
        email: "john@example.com",
        active: true,
      };
      p.tree.fromObject(simpleObj, "User");
    },
  },
  {
    title: "Nested object",
    handler: () => {
      const nestedObj = {
        config: {
          database: {
            host: "localhost",
            port: 5432,
            name: "mydb",
          },
          server: {
            port: 3000,
            ssl: true,
          },
        },
        features: ["auth", "api", "websocket"],
        version: "2.1.0",
      };
      p.tree.fromObject(nestedObj, "Application");
    },
  },
  {
    title: "Array",
    handler: () => {
      const array = [
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" },
        { id: 3, name: "Item 3" },
      ];
      p.tree.fromObject(array, "Items");
    },
  },
  {
    title: "Map",
    handler: () => {
      const map = new Map([
        ["key1", { value: "data1" }],
        ["key2", { value: "data2" }],
        ["key3", { value: "data3" }],
      ]);
      p.tree.fromObject(map, "MapData");
    },
  },
  {
    title: "Set",
    handler: () => {
      const set = new Set(["apple", "banana", "cherry"]);
      p.tree.fromObject(set, "Fruits");
    },
  },
  {
    title: "Mixed types",
    handler: () => {
      const mixedObj = {
        string: "Hello",
        number: 42,
        boolean: true,
        null: null,
        undefined,
        date: new Date("2024-01-01"),
        array: [1, 2, 3],
        nested: {
          a: 1,
          b: 2,
        },
      };
      p.tree.fromObject(mixedObj, "Mixed");
    },
  },
]);

printExample("Multiple Trees", [
  {
    title: "Multiple trees display",
    handler: () => {
      const trees: TreeNode[] = [
        {
          name: "Frontend",
          children: [{ name: "React" }, { name: "Vue" }, { name: "Angular" }],
        },
        {
          name: "Backend",
          children: [{ name: "Node.js" }, { name: "Python" }, { name: "Java" }],
        },
        {
          name: "Database",
          children: [{ name: "PostgreSQL" }, { name: "MongoDB" }, { name: "Redis" }],
        },
      ];
      p.tree.multi(trees);
    },
  },
  {
    title: "Multiple trees with options",
    handler: () => {
      const trees: TreeNode[] = [
        {
          name: "Frontend",
          children: [{ name: "React" }, { name: "Vue" }, { name: "Angular" }],
        },
        {
          name: "Backend",
          children: [{ name: "Node.js" }, { name: "Python" }, { name: "Java" }],
        },
        {
          name: "Database",
          children: [{ name: "PostgreSQL" }, { name: "MongoDB" }, { name: "Redis" }],
        },
      ];
      p.tree.multi(trees, { style: "rounded", showValues: false });
    },
  },
]);

printExample("Tree Search", [
  {
    title: "Search for 'Project'",
    handler: () => {
      const searchTree: TreeNode = {
        name: "Documents",
        children: [
          {
            name: "Projects",
            children: [
              { name: "ProjectAlpha", value: "alpha-docs" },
              { name: "ProjectBeta", value: "beta-docs" },
              { name: "ProjectGamma", value: "gamma-docs" },
            ],
          },
          {
            name: "Reports",
            children: [
              { name: "Q1Report", value: "q1-2024" },
              { name: "Q2Report", value: "q2-2024" },
              { name: "AnnualReport", value: "annual-2024" },
            ],
          },
          {
            name: "Templates",
            children: [
              { name: "ProjectTemplate", value: "template-project" },
              { name: "ReportTemplate", value: "template-report" },
            ],
          },
        ],
      };
      p.tree.search(searchTree, "Project", { showValues: true });
    },
  },
  {
    title: "Search for 'Report'",
    handler: () => {
      const searchTree: TreeNode = {
        name: "Documents",
        children: [
          {
            name: "Projects",
            children: [
              { name: "ProjectAlpha", value: "alpha-docs" },
              { name: "ProjectBeta", value: "beta-docs" },
              { name: "ProjectGamma", value: "gamma-docs" },
            ],
          },
          {
            name: "Reports",
            children: [
              { name: "Q1Report", value: "q1-2024" },
              { name: "Q2Report", value: "q2-2024" },
              { name: "AnnualReport", value: "annual-2024" },
            ],
          },
          {
            name: "Templates",
            children: [
              { name: "ProjectTemplate", value: "template-project" },
              { name: "ReportTemplate", value: "template-report" },
            ],
          },
        ],
      };
      p.tree.search(searchTree, "Report", { showValues: true });
    },
  },
  {
    title: "Search for 'q'",
    handler: () => {
      const searchTree: TreeNode = {
        name: "Documents",
        children: [
          {
            name: "Projects",
            children: [
              { name: "ProjectAlpha", value: "alpha-docs" },
              { name: "ProjectBeta", value: "beta-docs" },
              { name: "ProjectGamma", value: "gamma-docs" },
            ],
          },
          {
            name: "Reports",
            children: [
              { name: "Q1Report", value: "q1-2024" },
              { name: "Q2Report", value: "q2-2024" },
              { name: "AnnualReport", value: "annual-2024" },
            ],
          },
          {
            name: "Templates",
            children: [
              { name: "ProjectTemplate", value: "template-project" },
              { name: "ReportTemplate", value: "template-report" },
            ],
          },
        ],
      };
      p.tree.search(searchTree, "q", { showValues: true });
    },
  },
]);

printExample("Tree Statistics", [
  {
    title: "Simple stats",
    handler: () => {
      const simpleStatsTree: TreeNode = {
        name: "Root",
        children: [{ name: "Child1" }, { name: "Child2" }, { name: "Child3" }],
      };
      p.tree.stats(simpleStatsTree);
    },
  },
  {
    title: "Complex stats",
    handler: () => {
      const complexStatsTree: TreeNode = {
        name: "System",
        value: "root",
        children: [
          {
            name: "Services",
            value: "services",
            children: [
              {
                name: "API",
                value: "api-service",
                children: [
                  { name: "REST", value: "rest-api" },
                  { name: "GraphQL", value: "graphql-api" },
                ],
              },
              {
                name: "Database",
                value: "db-service",
                children: [
                  { name: "Primary", value: "primary-db" },
                  { name: "Replica", value: "replica-db" },
                ],
              },
            ],
          },
          {
            name: "Workers",
            children: [
              { name: "Queue", value: "queue-worker" },
              { name: "Scheduler", value: "scheduler-worker" },
              { name: "Processor", value: "processor-worker" },
            ],
          },
          {
            name: "Cache",
            value: "cache-layer",
          },
        ],
      };
      p.tree.stats(complexStatsTree);
    },
  },
]);

printExample("Advanced Scenarios", [
  {
    title: "Organization chart",
    handler: () => {
      const orgChart: TreeNode = {
        name: "CEO",
        metadata: { name: "Jane Smith", employees: 150 },
        children: [
          {
            name: "CTO",
            metadata: { name: "John Doe", employees: 50 },
            children: [
              {
                name: "VP Engineering",
                metadata: { employees: 30 },
                children: [
                  { name: "Frontend Lead", metadata: { employees: 10 } },
                  { name: "Backend Lead", metadata: { employees: 10 } },
                  { name: "DevOps Lead", metadata: { employees: 10 } },
                ],
              },
              {
                name: "VP Product",
                metadata: { employees: 20 },
                children: [
                  { name: "Product Manager", metadata: { employees: 5 } },
                  { name: "UX Lead", metadata: { employees: 8 } },
                  { name: "Data Analyst", metadata: { employees: 7 } },
                ],
              },
            ],
          },
          {
            name: "CFO",
            metadata: { name: "Alice Johnson", employees: 25 },
            children: [
              { name: "Accounting", metadata: { employees: 15 } },
              { name: "Finance", metadata: { employees: 10 } },
            ],
          },
          {
            name: "CMO",
            metadata: { name: "Bob Wilson", employees: 40 },
            children: [
              { name: "Marketing", metadata: { employees: 20 } },
              { name: "Sales", metadata: { employees: 20 } },
            ],
          },
        ],
      };
      p.tree(orgChart, { showMetadata: true, style: "rounded" });
    },
  },
  {
    title: "Dependency tree",
    handler: () => {
      const depTree: TreeNode = {
        name: "my-app@1.0.0",
        children: [
          {
            name: "react@18.2.0",
            children: [{ name: "loose-envify@1.4.0" }, { name: "js-tokens@4.0.0" }],
          },
          {
            name: "webpack@5.88.0",
            children: [
              { name: "enhanced-resolve@5.15.0" },
              { name: "tapable@2.2.1" },
              {
                name: "webpack-sources@3.2.3",
                children: [{ name: "source-map@0.6.1" }],
              },
            ],
          },
          {
            name: "typescript@5.1.6",
          },
        ],
      };
      p.tree(depTree, { style: "ascii" });
    },
  },
  {
    title: "File system simulation",
    handler: () => {
      const fileSystem: DirectoryEntry = {
        name: "home",
        type: "directory",
        children: [
          {
            name: "user",
            type: "directory",
            children: [
              {
                name: "Documents",
                type: "directory",
                children: [
                  { name: "report.pdf", type: "file", size: 1_048_576 },
                  { name: "notes.txt", type: "file", size: 2048 },
                ],
              },
              {
                name: "Downloads",
                type: "directory",
                children: [
                  { name: "installer.exe", type: "file", size: 52_428_800 },
                  { name: "image.jpg", type: "file", size: 2_097_152 },
                  { name: "archive.zip", type: "file", size: 10_485_760 },
                ],
              },
              {
                name: "Projects",
                type: "directory",
                children: [
                  {
                    name: "website",
                    type: "directory",
                    children: [
                      { name: "index.html", type: "file", size: 4096 },
                      { name: "style.css", type: "file", size: 2048 },
                      { name: "script.js", type: "file", size: 8192 },
                    ],
                  },
                  {
                    name: "app",
                    type: "directory",
                    children: [
                      { name: "main.py", type: "file", size: 10_240 },
                      { name: "requirements.txt", type: "file", size: 512 },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };
      p.tree.directory(fileSystem, {
        fileIcons: true,
        showSizes: true,
        sortBy: "type",
        maxDepth: 4,
      });
    },
  },
]);
