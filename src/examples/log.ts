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
      p.yellow.log("warn:", "disk", 95, "%");
      p.bold.yellow.log("ready");
      p.bgBlue.white.log("INFO:", "server", "listening");
    },
  },
]);
