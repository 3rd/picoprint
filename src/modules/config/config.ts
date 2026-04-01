import type { LineStyleName } from "@/utils/line-styles";

export interface PicocprintConfig {
  defaults?: {
    style?: LineStyleName;
    compact?: boolean;
    maxDepth?: number;
  };
  code?: {
    useBat?: boolean;
    batTheme?: string;
    batOptions?: string[];
  };
}

const defaultConfig: PicocprintConfig = {
  defaults: {},
  code: {
    useBat: false, // opt-in
  },
};

let globalConfig: PicocprintConfig = {};

export const getConfig = (): PicocprintConfig => ({
  defaults: { ...defaultConfig.defaults, ...globalConfig.defaults },
  code: { ...defaultConfig.code, ...globalConfig.code },
});

export const resetConfig = () => {
  globalConfig = {};
};

export const getConfigValue = <K extends keyof PicocprintConfig>(key: K): PicocprintConfig[K] => {
  const config = getConfig();
  return config[key];
};

export const configure = (options: Partial<PicocprintConfig>) => {
  if (!options || Object.keys(options).length === 0) {
    throw new Error("configure() requires options. Use getConfig() to read config.");
  }

  if (options.defaults) {
    globalConfig.defaults = { ...globalConfig.defaults, ...options.defaults };
  }
  if (options.code) {
    globalConfig.code = { ...globalConfig.code, ...options.code };
  }
};
