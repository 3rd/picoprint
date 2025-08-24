import p from "@/.";
import { printExample } from "./_helpers";

printExample("Streaming Box", [
  {
    title: "Basic streaming box",
    handler: () => {
      const s = p.stream.box({ title: "streaming", width: 40, style: "rounded", color: p.gray });
      s.writeln("hello world");
      s.write("this is a long line that will wrap across the inner width");
      s.close();
    },
  },
  {
    title: "Box with padding + bg",
    handler: () => {
      const s = p.stream.box({ width: 42, padding: 1, background: p.bgGray, title: "with bg" });
      s.writeln("a");
      s.writeln("b");
      s.close();
    },
  },
]);

printExample("Streaming Table", [
  {
    title: "Header then rows",
    handler: () => {
      const t = p.stream.table({ columns: ["name", "age"], showIndex: true });
      t.row({ name: "Alice", age: 30 });
      t.row({ name: "Bob", age: 42 });
      t.close();
    },
  },
]);

printExample("Streaming Pretty Print", [
  {
    title: "Values incrementally",
    handler: () => {
      const s = p.stream.pp({ compact: true });
      s.value({ a: 1, b: true, s: "str" });
      s.value({ users: ["a", "b", "c"], count: 3 });
      s.text("literal text is wrapped");
    },
  },
]);

printExample("Streaming Tree", [
  {
    title: "live hierarchical logging",
    handler: () => {
      const tr = p.stream.tree();
      tr.node("root");
      tr.enter("branch");
      tr.kv("key", [1, 2, 3]);
      tr.node("message that should wrap under the bullet and keep indent nicely across lines");
      tr.leave();
      tr.close();
    },
  },
]);
