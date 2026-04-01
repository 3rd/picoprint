import p from "@/.";
import { printExample } from "./_helpers";

printExample("Configuration Basics", [
  {
    title: "Reset to defaults",
    handler: () => {
      p.resetConfig();
      p({ message: "Config reset", value: 42 });
    },
  },
]);

printExample("Code Highlighting Config", [
  {
    title: "Enable bat and set custom theme",
    handler: () => {
      p.configure({
        code: {
          useBat: true,
          batTheme: "Monokai Extended",
        },
      });
      p.code('const hello = "world";', "javascript");
    },
  },
]);

printExample("Inspect Configuration", [
  {
    title: "Get current configuration",
    handler: () => {
      const config = p.getConfig();
      p(config);
    },
  },
  {
    title: "getConfig() returns current config",
    handler: () => {
      const currentConfig = p.getConfig();
      p(currentConfig);
    },
  },
]);
