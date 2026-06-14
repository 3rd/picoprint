const DEFAULT_TERMINAL_WIDTH = 80;

export const getTerminalWidth = () => {
  return process.stdout?.columns || DEFAULT_TERMINAL_WIDTH;
};
