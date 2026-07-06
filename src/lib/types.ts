export interface SavedEstimate {
  id: string;
  user_id: string;
  label: string;
  sector: string;
  area_m2: number;
  bedrooms: number;
  bathrooms: number;
  parking_spots: number;
  furnished: boolean;
  age_years: number;
  predicted_price: number;
  created_at: string;
}
