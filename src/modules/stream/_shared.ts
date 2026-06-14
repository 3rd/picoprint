import { applyTextWrapping } from "../../utils/string";

export { BORDER_WIDTH } from "../box/_shared";
export const TREE_MARGIN = 2;

export type Closable = { close: () => void };

export const wrapTo = (text: string, width: number) => applyTextWrapping(text, Math.max(0, width), "");
