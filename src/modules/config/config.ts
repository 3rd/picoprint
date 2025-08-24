export interface PicocprintConfig {
  code?: {
    useBat?: boolean;
    batTheme?: string;
    batOptions?: string[];
  };
}

const defaultConfig: PicocprintConfig = {
  code: {
    useBat: false, // opt-in
  },
};

let globalConfig: PicocprintConfig = {};

export const getConfig = (): PicocprintConfig => {
  return {
    ...defaultConfig,
    ...globalConfig,
    code: {
      ...defaultConfig.code,
      ...globalConfig.code,
    },
  };
};

export const resetConfig = (): void => {
  globalConfig = {};
};

export const getConfigValue = <K extends keyof PicocprintConfig>(key: K): PicocprintConfig[K] => {
  const config = getConfig();
  return config[key];
};

export const configure = (options?: Partial<PicocprintConfig>): PicocprintConfig => {
  if (!options) {
    return getConfig();
  }

  if (options.code) {
    globalConfig.code = {
      ...globalConfig.code,
      ...options.code,
    };
  }

  return getConfig();
};
