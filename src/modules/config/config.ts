import type { LineStyleName } from "../../utils/line-styles";
import { assertLineStyleOption } from "../../utils/line-styles";
import {
  assertBooleanOption,
  assertNonNegativeIntegerOption,
  assertPlainOptionsObject,
  assertStringArrayOption,
  assertStringOption,
  isPlainRecord,
} from "../../utils/options";

export interface PicocprintConfig {
  defaults?: {
    style?: LineStyleName;
    compact?: boolean;
    maxDepth?: number;
  };
  code?: {
    useBat?: boolean;
    batTheme?: string;
    batOptions?: readonly string[];
  };
}

type RequireConfigSection<T> = {
  [K in keyof T]-?: Partial<Omit<T, K>> & { [P in K]-?: NonNullable<T[P]> };
}[keyof T];

export type ConfigureOptions = RequireConfigSection<PicocprintConfig>;

const defaultConfig: PicocprintConfig = {
  defaults: {},
  code: {
    useBat: false, // opt-in
  },
};

let globalConfig: PicocprintConfig = {};

const cloneCodeConfig = (code: PicocprintConfig["code"]) => {
  if (!code) return undefined;
  return {
    ...code,
    batOptions: code.batOptions ? [...code.batOptions] : undefined,
  };
};

export const getConfig = (): PicocprintConfig => ({
  defaults: { ...defaultConfig.defaults, ...globalConfig.defaults },
  code: cloneCodeConfig({ ...defaultConfig.code, ...globalConfig.code }),
});

export const resetConfig = () => {
  globalConfig = {};
};

export const configure = (options: ConfigureOptions) => {
  if (!options) {
    throw new TypeError("picoprint configure() requires options. Use getConfig() to read config.");
  }
  if (!isPlainRecord(options)) {
    throw new TypeError("picoprint configure() requires an options object. Use getConfig() to read config.");
  }
  if (Object.keys(options).length === 0) {
    throw new TypeError("picoprint configure() requires options. Use getConfig() to read config.");
  }

  assertPlainOptionsObject(options.defaults, "defaults");
  assertPlainOptionsObject(options.code, "code");

  assertLineStyleOption(options.defaults?.style, "defaults.style");
  assertBooleanOption(options.defaults?.compact, "defaults.compact");
  assertNonNegativeIntegerOption(options.defaults?.maxDepth, "defaults.maxDepth");
  assertBooleanOption(options.code?.useBat, "code.useBat");
  assertStringOption(options.code?.batTheme, "code.batTheme");
  assertStringArrayOption(options.code?.batOptions, "code.batOptions");

  if (options.defaults) {
    globalConfig.defaults = { ...globalConfig.defaults, ...options.defaults };
  }
  if (options.code) {
    globalConfig.code = cloneCodeConfig({ ...globalConfig.code, ...options.code });
  }
};
