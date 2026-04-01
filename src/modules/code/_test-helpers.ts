import { _batState } from "./code";

export const _resetBatCache = () => {
  _batState.available = undefined;
};

export const _setBatAvailable = (value: boolean) => {
  _batState.available = value;
};
