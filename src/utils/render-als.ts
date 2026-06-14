import { AsyncLocalStorage } from "node:async_hooks";
import type { RenderContext } from "../modules/context";

export type Writer = (line: string) => void;

export interface RenderAsyncLocalStorage {
  writer: Writer;
  renderContext: RenderContext;
  indentStack?: RenderContext[];
}

export const renderALS = new AsyncLocalStorage<RenderAsyncLocalStorage>();
