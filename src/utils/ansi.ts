// eslint-disable-next-line no-control-regex
const ANSI_REGEX = /\u001b\[[\d;]*m/g;

export const stripAnsi = (str: string) => str.replace(ANSI_REGEX, "");

// eslint-disable-next-line no-control-regex
export const COLOR_START_REGEX = /^(\u001b\[[\d;]*m)/;
export const RESET_COLOR = "\u001b[0m";
