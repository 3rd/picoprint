import { getTypeColor } from "@/utils/colors";

export interface FormatValueOptions {
  quoteStrings?: boolean;
}

export const formatValueColored = (value: unknown, options?: FormatValueOptions) => {
  if (value === null) return getTypeColor("null")("null");
  if (value === undefined) return getTypeColor("undefined")("undefined");
  if (typeof value === "boolean") return getTypeColor("boolean")(String(value));
  if (typeof value === "number") return getTypeColor("number")(String(value));
  if (typeof value === "bigint") return getTypeColor("bigint")(`${value}n`);
  if (value instanceof Date) return getTypeColor("date")(value.toISOString());
  if (typeof value === "string") {
    const c = getTypeColor("string");
    return options?.quoteStrings ? c(`"${value}"`) : c(value);
  }
  if (Array.isArray(value)) return getTypeColor("array")(`[Array(${value.length})]`);
  if (typeof value === "object") return getTypeColor("object")("[Object]");
  return String(value);
};
