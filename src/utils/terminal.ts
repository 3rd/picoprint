const DEFAULT_TERMINAL_WIDTH = 80;
const DEFAULT_TERMINAL_HEIGHT = 24;

const ESCAPE_SEQUENCES = {
  CLEAR_LINE: "\r\u001b[K",
  HIDE_CURSOR: "\u001b[?25l",
  SHOW_CURSOR: "\u001b[?25h",
  CLEAR_SCREEN: "\u001b[2J\u001b[H",
} as const;

export const getTerminalWidth = () => {
  return process.stdout?.columns || DEFAULT_TERMINAL_WIDTH;
};

export const getTerminalHeight = () => {
  return process.stdout?.rows || DEFAULT_TERMINAL_HEIGHT;
};

export const clearLine = () => {
  process.stdout?.write(ESCAPE_SEQUENCES.CLEAR_LINE);
};

export const clearScreen = () => {
  process.stdout?.write(ESCAPE_SEQUENCES.CLEAR_SCREEN);
};

export const moveCursor = (x: number, y: number) => {
  process.stdout?.write(`\u001b[${y};${x}H`);
};

export const hideCursor = () => {
  process.stdout?.write(ESCAPE_SEQUENCES.HIDE_CURSOR);
};

export const showCursor = () => {
  process.stdout?.write(ESCAPE_SEQUENCES.SHOW_CURSOR);
};
