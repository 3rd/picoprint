import p from "@/.";
import { printExample } from "./_helpers";

// Basic examples
printExample("Basic Table Examples", [
  {
    title: "Array of objects",
    handler: () => {
      const users = [
        { id: 1, name: "Alice Johnson", age: 30, city: "New York", active: true },
        { id: 2, name: "Bob Smith", age: 25, city: "London", active: false },
        { id: 3, name: "Charlie Brown", age: 35, city: "Paris", active: true },
        { id: 4, name: "Diana Prince", age: 28, city: "Tokyo", active: true },
      ];
      p.table(users);
    },
  },
  {
    title: "Simple array",
    handler: () => {
      const fruits = ["Apple", "Banana", "Cherry", "Date", "Elderberry"];
      p.table(fruits);
    },
  },
  {
    title: "Object as key-value pairs",
    handler: () => {
      const config = {
        host: "localhost",
        port: 3000,
        secure: true,
        timeout: 5000,
        maxConnections: 100,
      };
      p.table(config);
    },
  },
]);

// Table styles
printExample("Table Styles", [
  {
    title: "Single style",
    handler: () => {
      const data = [
        { style: "Single", description: "Default style" },
        { style: "Clean", description: "Simple lines" },
      ];
      p.table(data, { style: "single" });
    },
  },
  {
    title: "Double style",
    handler: () => {
      const data = [
        { style: "Double", description: "Double lines" },
        { style: "Strong", description: "Bold borders" },
      ];
      p.table(data, { style: "double" });
    },
  },
  {
    title: "Rounded style",
    handler: () => {
      const data = [
        { style: "Rounded", description: "Rounded corners" },
        { style: "Smooth", description: "Soft edges" },
      ];
      p.table(data, { style: "rounded" });
    },
  },
  {
    title: "Thick style",
    handler: () => {
      const data = [
        { style: "Thick", description: "Heavy lines" },
        { style: "Bold", description: "Strong borders" },
      ];
      p.table(data, { style: "thick" });
    },
  },
  {
    title: "ascii style",
    handler: () => {
      const data = [
        { style: "ascii", description: "Compatible" },
        { style: "Simple", description: "Universal" },
      ];
      p.table(data, { style: "ascii" });
    },
  },
]);

// Table options
printExample("Table Options", [
  {
    title: "Show index",
    handler: () => {
      const data = [
        { product: "Laptop", price: 999.99, quantity: 5, inStock: true },
        { product: "Mouse", price: 29.99, quantity: 50, inStock: true },
        { product: "Keyboard", price: 79.99, quantity: 0, inStock: false },
        { product: "Monitor", price: 299.99, quantity: 12, inStock: true },
      ];
      p.table(data, { showIndex: true });
    },
  },
  {
    title: "Custom columns",
    handler: () => {
      const data = [
        { product: "Laptop", price: 999.99, quantity: 5, inStock: true },
        { product: "Mouse", price: 29.99, quantity: 50, inStock: true },
        { product: "Keyboard", price: 79.99, quantity: 0, inStock: false },
        { product: "Monitor", price: 299.99, quantity: 12, inStock: true },
      ];
      p.table(data, { columns: ["product", "price", "inStock"] });
    },
  },
  {
    title: "Alignment",
    handler: () => {
      const data = [
        { product: "Laptop", price: 999.99, quantity: 5, inStock: true },
        { product: "Mouse", price: 29.99, quantity: 50, inStock: true },
        { product: "Keyboard", price: 79.99, quantity: 0, inStock: false },
        { product: "Monitor", price: 299.99, quantity: 12, inStock: true },
      ];
      p.table(data, {
        align: {
          product: "left",
          price: "right",
          quantity: "center",
          inStock: "center",
        },
      });
    },
  },
  {
    title: "Compact table",
    handler: () => {
      const data = [
        { product: "Laptop", price: 999.99, quantity: 5, inStock: true },
        { product: "Mouse", price: 29.99, quantity: 50, inStock: true },
        { product: "Keyboard", price: 79.99, quantity: 0, inStock: false },
        { product: "Monitor", price: 299.99, quantity: 12, inStock: true },
      ];
      p.table(data, { compact: true });
    },
  },
  {
    title: "Max width",
    handler: () => {
      const longData = [
        {
          title: "This is a very long title that should be truncated in the table display",
          description:
            "An even longer description that contains a lot of text and should definitely be cut off",
        },
      ];
      p.table(longData, { maxWidth: 20 });
    },
  },
]);

// Other features
printExample("Specialized Table Functions", [
  {
    title: "Array to table",
    handler: () => {
      const products = [
        { sku: "ABC123", name: "Widget", price: 19.99 },
        { sku: "DEF456", name: "Gadget", price: 39.99 },
        { sku: "GHI789", name: "Doohickey", price: 29.99 },
      ];
      p.table(products, { showIndex: true });
    },
  },
  {
    title: "Object to table",
    handler: () => {
      const systemInfo = {
        OS: "Linux",
        Node: "v20.10.0",
        CPU: "Intel i7-9700K",
        Memory: "32GB",
        Disk: "1TB SSD",
      };
      p.table(systemInfo);
    },
  },
  {
    title: "Map to table",
    handler: () => {
      const userRoles = new Map([
        ["admin", "Full system access"],
        ["editor", "Content management"],
        ["viewer", "Read-only access"],
        ["guest", "Limited access"],
      ]);
      p.table(userRoles);
    },
  },
  {
    title: "Compare objects",
    handler: () => {
      const configA = {
        port: 3000,
        host: "localhost",
        ssl: true,
        cache: false,
        timeout: 5000,
      };
      const configB = {
        port: 3000,
        host: "0.0.0.0",
        ssl: false,
        cache: false,
        debug: true,
      };
      p.table.compare(configA, configB);
    },
  },
]);

// Mixed data types
printExample("Different Data Types", [
  {
    title: "Mixed data types",
    handler: () => {
      const mixedData = [
        {
          string: "Hello World",
          number: 42,
          float: 3.141_59,
          boolean: true,
          null: null,
          undefined,
          date: new Date("2024-01-15T10:30:00"),
          object: { nested: "value" },
          array: [1, 2, 3],
        },
      ];
      p.table(mixedData);
    },
  },
  {
    title: "Empty & edge cases",
    handler: () => {
      console.log("Empty array:");
      p.table([]);

      console.log("\nEmpty object:");
      p.table({});
    },
  },
]);
