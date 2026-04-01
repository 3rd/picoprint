import { stripAnsi } from "@/utils/ansi";
import { applyTextWrapping } from "@/utils/string";

export { BORDER_WIDTH } from "@/modules/box/_shared";
export const TREE_MARGIN = 2;

export type Closable = { close: () => void };

export const wrapTo = (text: string, width: number) => applyTextWrapping(text, Math.max(0, width), "");
export const visibleLen = (s: string) => stripAnsi(s).length;
