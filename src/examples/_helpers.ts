import p from "@/.";

export type ExampleItem = { title: string; handler: () => unknown };

export const printExample = (label: string, items: ExampleItem[]) => {
  p.box(
    () => {
      p.log("");
      for (let i = 0; i < items.length; i++) {
        const { handler, title } = items[i]!;

        p.configure({
          code: {
            useBat: true,
            batTheme: "TwoDark",
          },
        });

        p.box(
          () => {
            p.code(handler.toString(), {
              language: "js",
              background: p.color.bgHex("#242230"),
              title: "Code",
              frame: "rounded",
              titleAlign: "left",
              borderColor: p.color.gray,
              lineNumbers: true,
            });
            p.log("");
            handler();
          },
          {
            title,
            padding: 1,
            style: "rounded",
            borderColor: p.color.gray,
          },
        );
        if (i < items.length - 1) {
          p.log("");
        }
      }
    },
    {
      title: p.color.bold(label),
      style: "rounded",
      borderColor: p.color.yellow,
      paddingX: 1,
    },
  );
  console.log("\n");
};
