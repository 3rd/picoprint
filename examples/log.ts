import p from "@/.";
import { printExample } from "./_helpers";

printExample("Logging", [
  {
    title: "basic p.log",
    handler: () => {
      p.log("plain message", 123, true);
      p.log("multi", "args", { ok: true });
    },
  },
  {
    title: "chainable .log",
    handler: () => {
      p.color.yellow.log("warn:", "disk", 95, "%");
      p.color.bold.yellow.log("ready");
      p.color.bgBlue.white.log("INFO:", "server", "listening");
    },
  },
]);
