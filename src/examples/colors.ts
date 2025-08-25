/* eslint-disable sonarjs/no-nested-template-literals */
import p from "@/.";
import { printExample } from "./_helpers";

// Color support
console.log(p.bold("Color support:"));
if (p.isColorSupported()) {
  console.log(p.green("✓ Colors are supported in this terminal"));
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
      console.log(p.bold("Basic colors:"));
      console.log(p.black("Black text"));
      console.log(p.red("Red text"));
      console.log(p.green("Green text"));
      console.log(p.yellow("Yellow text"));
      console.log(p.blue("Blue text"));
      console.log(p.magenta("Magenta text"));
      console.log(p.cyan("Cyan text"));
      console.log(p.white("White text"));
      console.log(p.gray("Gray text"));
      console.log(p.grey("Grey text (alias)"));
    },
  },
  {
    title: "Bright colors",
    handler: () => {
      console.log(p.bold("Bright colors:"));
      console.log(p.blackBright("Bright black text"));
      console.log(p.redBright("Bright red text"));
      console.log(p.greenBright("Bright green text"));
      console.log(p.yellowBright("Bright yellow text"));
      console.log(p.blueBright("Bright blue text"));
      console.log(p.magentaBright("Bright magenta text"));
      console.log(p.cyanBright("Bright cyan text"));
      console.log(p.whiteBright("Bright white text"));
    },
  },
  {
    title: "Text modifiers",
    handler: () => {
      console.log(p.bold("Text modifiers:"));
      console.log(p.bold("Bold text"));
      console.log(p.dim("Dim text"));
      console.log(p.italic("Italic text"));
      console.log(p.underline("Underlined text"));
      console.log(p.inverse("Inverse text"));
      console.log(p.strikethrough("Strikethrough text"));
      console.log(p.reset("Reset text"));
    },
  },
  {
    title: "Background colors",
    handler: () => {
      console.log(p.bold("Background colors:"));
      console.log(p.bgBlack.white("White on black background"));
      console.log(p.bgRed("Red background"));
      console.log(p.bgGreen("Green background"));
      console.log(p.bgYellow.black("Black on yellow background"));
      console.log(p.bgBlue.white("White on blue background"));
      console.log(p.bgMagenta("Magenta background"));
      console.log(p.bgCyan.black("Black on cyan background"));
      console.log(p.bgWhite.black("Black on white background"));
      console.log(p.bgGray("Gray background"));
    },
  },
  {
    title: "Bright background colors",
    handler: () => {
      console.log(p.bold("Bright background colors:"));
      console.log(p.bgBlackBright.white("White on bright black background"));
      console.log(p.bgRedBright.black("Black on bright red background"));
      console.log(p.bgGreenBright.black("Black on bright green background"));
      console.log(p.bgYellowBright.black("Black on bright yellow background"));
      console.log(p.bgBlueBright.white("White on bright blue background"));
      console.log(p.bgMagentaBright.white("White on bright magenta background"));
      console.log(p.bgCyanBright.black("Black on bright cyan background"));
      console.log(p.bgWhiteBright.black("Black on bright white background"));
    },
  },
]);

// 256 colors
printExample("256 Colors", [
  {
    title: "256 colors",
    handler: () => {
      console.log(p.bold("256 colors:"));
      const color256Examples = [16, 21, 51, 82, 118, 154, 190, 196, 202, 208, 214, 220, 226];
      console.log(`Foreground: ${color256Examples.map((col) => p.color256(col)(`■${col}`)).join(" ")}`);
      console.log(`Background: ${color256Examples.map((col) => p.bgColor256(col)(`${col}  `)).join(" ")}`);
    },
  },
]);

// RGB colors
printExample("RGB Colors", [
  {
    title: "RGB colors",
    handler: () => {
      console.log(p.bold("RGB colors:"));
      console.log(
        `${p.rgb(255, 0, 0)("Pure Red")} | ${p.rgb(0, 255, 0)("Pure Green")} | ${p.rgb(0, 0, 255)("Pure Blue")}`,
      );
      console.log(
        `${p.rgb(255, 12, 0)("Orange")} | ${p.rgb(12, 0, 255)("Purple")} | ${p.rgb(255, 0, 12)("Pink")}`,
      );
      console.log(`${p.bgRgb(64, 64, 64)(p.rgb(255, 255, 255)("White on dark gray RGB background"))}`);
    },
  },
]);

// Hex colors
printExample("Hex Colors", [
  {
    title: "Hex colors",
    handler: () => {
      console.log(p.bold("Hex colors:"));
      console.log(`${p.hex("#FF5733")("#FF5733 Coral")}`);
      console.log(`${p.hex("#33FF57")("#33FF57 Lime")}`);
      console.log(`${p.hex("#3357FF")("#3357FF Royal Blue")}`);
      console.log(`${p.hex("#FF33F5")("#FF33F5 Hot Pink")}`);
      console.log(`${p.bgHex("#2C3E50")(p.hex("#ECF0F1")("#ECF0F1 on #2C3E50 background"))}`);
    },
  },
]);

// Combined styles
printExample("Combined Styles", [
  {
    title: "Combined styles",
    handler: () => {
      console.log(p.bold("Combined styles:"));
      console.log(`${p.bold.red("Bold red text")}`);
      console.log(`${p.underline.green("Underlined green text")}`);
      console.log(`${p.italic.blue("Italic blue text")}`);
      console.log(`${p.bgYellow.bold.red("Bold red on yellow")}`);
      console.log(`${p.inverse.cyan("Inverted cyan text")}`);
      console.log(`${p.dim.strikethrough("Dim strikethrough text")}`);
    },
  },
]);

// Rainbow text
printExample("Rainbow Text", [
  {
    title: "Rainbow text",
    handler: () => {
      console.log(p.bold("Rainbow text:"));
      console.log(`${p.rainbow("This is rainbow colored text! 🌈")}`);
      console.log(`${p.rainbow("ABCDEFGHIJKLMNOPQRSTUVWXYZ")}`);
      console.log(`${p.rainbow("0123456789 !@#$%^&*()")}`);
    },
  },
]);

// Gradient text
printExample("Gradient Text", [
  {
    title: "Standard colors",
    handler: () => {
      console.log(p.bold("Gradient text (standard colors):"));
      console.log(
        `${p.gradient("Smooth gradient from red to blue with proper interpolation", p.red, p.blue)}`,
      );
      console.log(
        `${p.gradient("Gradient from green to magenta - notice the smooth transition", p.green, p.magenta)}`,
      );
      console.log(
        `${p.gradient("Yellow to cyan gradient with character-by-character color change", p.yellow, p.cyan)}`,
      );
      console.log(
        `${p.gradient("Black to white gradient creates a grayscale effect", p.black, p.white)}`,
      );
    },
  },
  {
    title: "RGB gradients",
    handler: () => {
      console.log(p.bold("Gradient text (RGB):"));
      console.log(
        `${p.gradientRgb("Custom RGB gradient from orange to purple", { r: 255, g: 127, b: 0 }, { r: 127, g: 0, b: 255 })}`,
      );
      console.log(
        `${p.gradientRgb("Sunset gradient from red-orange to deep purple", { r: 255, g: 94, b: 77 }, { r: 84, g: 74, b: 125 })}`,
      );
    },
  },
  {
    title: "Hex gradients",
    handler: () => {
      console.log(p.bold("Gradient text (Hex colors):"));
      console.log(`${p.gradientHex("Oceanic gradient from teal to deep blue", "#20B2AA", "#000080")}`);
      console.log(`${p.gradientHex("Fire gradient from bright yellow to deep red", "#FFD700", "#8B0000")}`);
      console.log(`${p.gradientHex("Nature gradient from forest green to sky blue", "#228B22", "#87CEEB")}`);
    },
  },
  {
    title: "Long text gradient",
    handler: () => {
      console.log(p.bold("Long text gradient demonstration:"));
      const longText =
        "This is a longer text to demonstrate how the gradient smoothly transitions across many characters.";
      console.log(`${p.gradientHex(longText, "#FF1493", "#00CED1")}`);
    },
  },
]);

// Color palettes
printExample("Color Palettes", [
  {
    title: "Palettes",
    handler: () => {
      console.log(p.bold("Color palettes:"));
      const palette1 = p.palette("#FF0000", 7);
      console.log(
        `Red palette:     ${palette1.map((col) => p.hex(col)("██")).join(" ")}\n  ${palette1.join(" ")}`,
      );
      const palette2 = p.palette("#00FF00", 7);
      console.log(
        `Green palette:   ${palette2.map((col) => p.hex(col)("██")).join(" ")}\n  ${palette2.join(" ")}`,
      );
      const palette3 = p.palette("#0000FF", 7);
      console.log(
        `Blue palette:    ${palette3.map((col) => p.hex(col)("██")).join(" ")}\n  ${palette3.join(" ")}`,
      );
    },
  },
]);

// Type colors
printExample("Type Colors", [
  {
    title: "Type colors",
    handler: () => {
      console.log(p.bold("Type colors:"));
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
        const colorFn = p.typeColor(type);
        console.log(`${type.padEnd(10)} → ${colorFn(type)}`);
      }
    },
  },
]);
