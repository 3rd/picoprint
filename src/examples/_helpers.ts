import p from "@/.";

export type ExampleItem = { title: string; handler: Function };

export const printExample = (label: string, items: ExampleItem[]) => {
  p.box(
    () => {
      console.log("");
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
              background: p.bgHex("#242230"),
              title: "Code",
              window: "rounded",
              titleAlign: "left",
              borderColor: p.gray,
              lineNumbers: true,
            });
            console.log();
            handler();
          },
          {
            title,
            padding: 1,
            style: "rounded",
            color: p.gray,
          },
        );
        if (i < items.length - 1) {
          console.log();
        }
      }
    },
    {
      title: p.bold(label),
      style: "rounded",
      color: p.yellow,
      paddingX: 1,
    },
  );
  console.log("\n");
};
