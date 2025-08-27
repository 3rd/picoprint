import p from "@/.";
import { printExample } from "./_helpers";

printExample("Indent & Dedent", [
  {
    title: "basic indent/dedent",
    handler: () => {
      p.log("start");
      p.indent();
      p.log("level +2");
      p.indent(3);
      p.log("level +5");
      p.dedent();
      p.log("back to +2");
      p.dedent();
      p.log("back to +0");
    },
  },
  {
    title: "with box() capture",
    handler: () => {
      p.indent();
      p.log("outer: before");
      p.box(
        () => {
          p.log("inner: a");
          p.indent();
          p.log("inner: b");
          p.dedent();
          p.log("inner: c");
        },
        { title: "box", style: "rounded", color: p.gray, padding: 0 },
      );
      p.log("outer: after");
      p.dedent();
    },
  },
  {
    title: "over-dedent is a no-op",
    handler: () => {
      p.log("zero");
      p.dedent();
      p.log("still zero");
      p.indent(4);
      p.log("four spaces");
      p.dedent();
      p.dedent();
      p.log("back to zero");
    },
  },
  {
    title: "multiple dedents (pop multiple levels)",
    handler: () => {
      p.log("start");
      p.indent(); // +2
      p.indent(3); // +5
      p.log("deep");
      p.dedent();
      p.dedent();
      p.log("back to zero");
    },
  },
]);
