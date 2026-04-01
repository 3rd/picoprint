/* eslint-disable sonarjs/no-nested-template-literals */
import p from "@/.";
import { printExample } from "./_helpers";

// Color support
console.log(p.color.bold("Color support:"));
if (p.color.isColorSupported()) {
  console.log(p.color.green("✓ Colors are supported in this terminal"));
} else {
  console.log("✗ Colors are not supported in this terminal");
}
console.log("FORCE_COLOR:", process.env.FORCE_COLOR || "not set");
console.log("NO_COLOR:", process.env.NO_COLOR || "not set");
console.log("TERM:", process.env.TERM || "not set");
console.log("TTY:", process.stdout?.isTTY ? "true" : "false");

// Colors
printExample("Colors", [
  {
    title: "Basic colors",
    handler: () => {
      p.log(p.color.bold("Basic colors:"));
      p.log(p.color.black("Black text"));
      p.log(p.color.red("Red text"));
      p.log(p.color.green("Green text"));
      p.log(p.color.yellow("Yellow text"));
      p.log(p.color.blue("Blue text"));
      p.log(p.color.magenta("Magenta text"));
      p.log(p.color.cyan("Cyan text"));
      p.log(p.color.white("White text"));
      p.log(p.color.gray("Gray text"));
      p.log(p.color.grey("Grey text (alias)"));
    },
  },
  {
    title: "Bright colors",
    handler: () => {
      p.log(p.color.bold("Bright colors:"));
      p.log(p.color.blackBright("Bright black text"));
      p.log(p.color.redBright("Bright red text"));
      p.log(p.color.greenBright("Bright green text"));
      p.log(p.color.yellowBright("Bright yellow text"));
      p.log(p.color.blueBright("Bright blue text"));
      p.log(p.color.magentaBright("Bright magenta text"));
      p.log(p.color.cyanBright("Bright cyan text"));
      p.log(p.color.whiteBright("Bright white text"));
    },
  },
  {
    title: "Text modifiers",
    handler: () => {
      p.log(p.color.bold("Text modifiers:"));
      p.log(p.color.bold("Bold text"));
      p.log(p.color.dim("Dim text"));
      p.log(p.color.italic("Italic text"));
      p.log(p.color.underline("Underlined text"));
      p.log(p.color.inverse("Inverse text"));
      p.log(p.color.strikethrough("Strikethrough text"));
      p.log(p.color.reset("Reset text"));
    },
  },
  {
    title: "Background colors",
    handler: () => {
      p.log(p.color.bold("Background colors:"));
      p.log(p.color.bgBlack.white("White on black background"));
      p.log(p.color.bgRed("Red background"));
      p.log(p.color.bgGreen("Green background"));
      p.log(p.color.bgYellow.black("Black on yellow background"));
      p.log(p.color.bgBlue.white("White on blue background"));
      p.log(p.color.bgMagenta("Magenta background"));
      p.log(p.color.bgCyan.black("Black on cyan background"));
      p.log(p.color.bgWhite.black("Black on white background"));
      p.log(p.color.bgGray("Gray background"));
    },
  },
  {
    title: "Bright background colors",
    handler: () => {
      p.log(p.color.bold("Bright background colors:"));
      p.log(p.color.bgBlackBright.white("White on bright black background"));
      p.log(p.color.bgRedBright.black("Black on bright red background"));
      p.log(p.color.bgGreenBright.black("Black on bright green background"));
      p.log(p.color.bgYellowBright.black("Black on bright yellow background"));
      p.log(p.color.bgBlueBright.white("White on bright blue background"));
      p.log(p.color.bgMagentaBright.white("White on bright magenta background"));
      p.log(p.color.bgCyanBright.black("Black on bright cyan background"));
      p.log(p.color.bgWhiteBright.black("Black on bright white background"));
    },
  },
]);

// 256 colors
printExample("256 Colors", [
  {
    title: "256 colors",
    handler: () => {
      p.log(p.color.bold("256 colors:"));
      const color256Examples = [16, 21, 51, 82, 118, 154, 190, 196, 202, 208, 214, 220, 226];
      p.log(`Foreground: ${color256Examples.map((col) => p.color.color256(col)(`■${col}`)).join(" ")}`);
      p.log(`Background: ${color256Examples.map((col) => p.color.bgColor256(col)(`${col}  `)).join(" ")}`);
    },
  },
]);

// RGB colors
printExample("RGB Colors", [
  {
    title: "RGB colors",
    handler: () => {
      p.log(p.color.bold("RGB colors:"));
      p.log(
        `${p.color.rgb(255, 0, 0)("Pure Red")} | ${p.color.rgb(0, 255, 0)("Pure Green")} | ${p.color.rgb(0, 0, 255)("Pure Blue")}`,
      );
      p.log(
        `${p.color.rgb(255, 12, 0)("Orange")} | ${p.color.rgb(12, 0, 255)("Purple")} | ${p.color.rgb(255, 0, 12)("Pink")}`,
      );
      p.log(`${p.color.bgRgb(64, 64, 64)(p.color.rgb(255, 255, 255)("White on dark gray RGB background"))}`);
    },
  },
]);

// Hex colors
printExample("Hex Colors", [
  {
    title: "Hex colors",
    handler: () => {
      p.log(p.color.bold("Hex colors:"));
      p.log(`${p.color.hex("#FF5733")("#FF5733 Coral")}`);
      p.log(`${p.color.hex("#33FF57")("#33FF57 Lime")}`);
      p.log(`${p.color.hex("#3357FF")("#3357FF Royal Blue")}`);
      p.log(`${p.color.hex("#FF33F5")("#FF33F5 Hot Pink")}`);
      p.log(`${p.color.bgHex("#2C3E50")(p.color.hex("#ECF0F1")("#ECF0F1 on #2C3E50 background"))}`);
    },
  },
]);

// Combined styles
printExample("Combined Styles", [
  {
    title: "Combined styles",
    handler: () => {
      p.log(p.color.bold("Combined styles:"));
      p.log(`${p.color.bold.red("Bold red text")}`);
      p.log(`${p.color.underline.green("Underlined green text")}`);
      p.log(`${p.color.italic.blue("Italic blue text")}`);
      p.log(`${p.color.bgYellow.bold.red("Bold red on yellow")}`);
      p.log(`${p.color.inverse.cyan("Inverted cyan text")}`);
      p.log(`${p.color.dim.strikethrough("Dim strikethrough text")}`);
    },
  },
]);

// Rainbow text
printExample("Rainbow Text", [
  {
    title: "Rainbow text",
    handler: () => {
      p.log(p.color.bold("Rainbow text:"));
      p.log(`${p.color.rainbow("This is rainbow colored text! 🌈")}`);
      p.log(`${p.color.rainbow("ABCDEFGHIJKLMNOPQRSTUVWXYZ")}`);
      p.log(`${p.color.rainbow("0123456789 !@#$%^&*()")}`);
    },
  },
]);

// Gradient text
printExample("Gradient Text", [
  {
    title: "Standard colors",
    handler: () => {
      p.log(p.color.bold("Gradient text (standard colors):"));
      p.log(
        `${p.color.gradient("Smooth gradient from red to blue with proper interpolation", p.color.red, p.color.blue)}`,
      );
      p.log(
        `${p.color.gradient("Gradient from green to magenta - notice the smooth transition", p.color.green, p.color.magenta)}`,
      );
      p.log(
        `${p.color.gradient("Yellow to cyan gradient with character-by-character color change", p.color.yellow, p.color.cyan)}`,
      );
      p.log(
        `${p.color.gradient("Black to white gradient creates a grayscale effect", p.color.black, p.color.white)}`,
      );
    },
  },
  {
    title: "RGB gradients",
    handler: () => {
      p.log(p.color.bold("Gradient text (RGB):"));
      p.log(
        `${p.color.gradientRgb("Custom RGB gradient from orange to purple", { r: 255, g: 127, b: 0 }, { r: 127, g: 0, b: 255 })}`,
      );
      p.log(
        `${p.color.gradientRgb("Sunset gradient from red-orange to deep purple", { r: 255, g: 94, b: 77 }, { r: 84, g: 74, b: 125 })}`,
      );
    },
  },
  {
    title: "Hex gradients",
    handler: () => {
      p.log(p.color.bold("Gradient text (Hex colors):"));
      p.log(`${p.color.gradientHex("Oceanic gradient from teal to deep blue", "#20B2AA", "#000080")}`);
      p.log(`${p.color.gradientHex("Fire gradient from bright yellow to deep red", "#FFD700", "#8B0000")}`);
      p.log(`${p.color.gradientHex("Nature gradient from forest green to sky blue", "#228B22", "#87CEEB")}`);
    },
  },
  {
    title: "Long text gradient",
    handler: () => {
      p.log(p.color.bold("Long text gradient demonstration:"));
      const longText =
        "This is a longer text to demonstrate how the gradient smoothly transitions across many characters.";
      p.log(`${p.color.gradientHex(longText, "#FF1493", "#00CED1")}`);
    },
  },
]);

// Color palettes
printExample("Color Palettes", [
  {
    title: "Palettes",
    handler: () => {
      p.log(p.color.bold("Color palettes:"));
      const palette1 = p.color.palette("#FF0000", 7);
      p.log(
        `Red palette:     ${palette1.map((col) => p.color.hex(col)("██")).join(" ")}\n  ${palette1.join(" ")}`,
      );
      const palette2 = p.color.palette("#00FF00", 7);
      p.log(
        `Green palette:   ${palette2.map((col) => p.color.hex(col)("██")).join(" ")}\n  ${palette2.join(" ")}`,
      );
      const palette3 = p.color.palette("#0000FF", 7);
      p.log(
        `Blue palette:    ${palette3.map((col) => p.color.hex(col)("██")).join(" ")}\n  ${palette3.join(" ")}`,
      );
    },
  },
]);

// Type colors
printExample("Type Colors", [
  {
    title: "Type colors",
    handler: () => {
      p.log(p.color.bold("Type colors:"));
      const types = [
        "string",
        "number",
        "boolean",
        "null",
        "undefined",
        "symbol",
        "function",
        "date",
        "regexp",
        "error",
        "array",
        "object",
      ];
      for (const type of types) {
        const colorFn = p.color.typeColor(type);
        p.log(`${type.padEnd(10)} → ${colorFn(type)}`);
      }
    },
  },
]);
