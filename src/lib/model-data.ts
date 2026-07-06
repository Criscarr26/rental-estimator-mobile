import rawParams from '@/assets/model_params.json';

import { EstimateInput, ModelParams, predictPrice } from './model';

export const MODEL = rawParams as unknown as ModelParams;

export function estimate(input: EstimateInput): number {
  return predictPrice(MODEL, input);
}
