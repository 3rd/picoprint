export interface FormatContext {
  depth: number;
  maxDepth: number;
  seen: WeakSet<object>;
  compact: boolean;
  terminalWidth: number;
  path: string[];
}
