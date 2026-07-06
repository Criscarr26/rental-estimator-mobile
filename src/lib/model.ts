// Client-side port of the trained sklearn pipeline
// (OneHotEncoder on sector + StandardScaler on numerics + LinearRegression).
// The fitted parameters live in assets/model_params.json, exported by
// scripts/export_model.py from the real rental_model.pkl.

export interface EstimateInput {
  sector: string;
  area_m2: number;
  bedrooms: number;
  bathrooms: number;
  parking_spots: number;
  furnished: number; // 1 = furnished, 0 = not
  age_years: number;
}

export interface ModelParams {
  sectors: string[];
  numeric_features: string[];
  scaler_mean: number[];
  scaler_scale: number[];
  coef: number[]; // sector one-hots first, then scaled numerics
  intercept: number;
  metrics: { mae: number; rmse: number; r2: number };
  avg_price_by_sector: Record<string, number>;
  reference_cases: { input: EstimateInput; expected: number }[];
}

export function predictPrice(params: ModelParams, input: EstimateInput): number {
  const sectorIdx = params.sectors.indexOf(input.sector);
  if (sectorIdx === -1) {
    throw new Error(`Unknown sector: ${input.sector}`);
  }

  let price = params.intercept + params.coef[sectorIdx];

  const nSectors = params.sectors.length;
  params.numeric_features.forEach((feature, i) => {
    const raw = input[feature as keyof EstimateInput] as number;
    const scaled = (raw - params.scaler_mean[i]) / params.scaler_scale[i];
    price += params.coef[nSectors + i] * scaled;
  });

  return price;
}

export function formatDOP(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? '-' : '';
  const digits = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}RD$ ${digits}`;
}
