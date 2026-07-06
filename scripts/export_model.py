"""Export the fitted sklearn pipeline to plain JSON for the mobile app.

Usage (run inside the rental-sd venv, which has sklearn/joblib/pandas):
    python scripts/export_model.py <path-to-rental-price-estimator-sd-repo>

Reads models/rental_model.pkl (OneHotEncoder + StandardScaler + LinearRegression)
and models/metrics.json, and writes assets/model_params.json with everything the
app needs to predict client-side. It also embeds 3 reference predictions so
scripts/verify-model.mjs can check the TypeScript port against the real pipeline.

Re-run this whenever the model is retrained.
"""

import json
import sys
from pathlib import Path

import joblib
import pandas as pd

if len(sys.argv) < 2:
    sys.exit("Usage: python scripts/export_model.py <path-to-rental-price-estimator-sd-repo>")

PROJECT = Path(sys.argv[1])
OUT = Path(__file__).resolve().parent.parent / "assets" / "model_params.json"

NUMERIC = ["area_m2", "bedrooms", "bathrooms", "parking_spots", "furnished", "age_years"]

pipeline = joblib.load(PROJECT / "models" / "rental_model.pkl")
pre = pipeline.named_steps["preprocess"]
ohe = pre.named_transformers_["sector"]
scaler = pre.named_transformers_["numeric"]
model = pipeline.named_steps["model"]

with open(PROJECT / "models" / "metrics.json", encoding="utf-8") as fh:
    metrics = json.load(fh)

sectors = ohe.categories_[0].tolist()

# Coefficient order in the pipeline output: sector one-hots first, numeric after.
params = {
    "sectors": sectors,
    "numeric_features": NUMERIC,
    "scaler_mean": scaler.mean_.tolist(),
    "scaler_scale": scaler.scale_.tolist(),
    "coef": model.coef_.tolist(),
    "intercept": float(model.intercept_),
    "metrics": {"mae": metrics["mae"], "rmse": metrics["rmse"], "r2": metrics["r2"]},
    "avg_price_by_sector": metrics["avg_price_by_sector"],
}

# Reference cases so the TypeScript implementation can be checked exactly.
cases = [
    {"sector": "Piantini", "area_m2": 120, "bedrooms": 3, "bathrooms": 2, "parking_spots": 2, "furnished": 1, "age_years": 5},
    {"sector": "Villa Mella", "area_m2": 70, "bedrooms": 2, "bathrooms": 1, "parking_spots": 1, "furnished": 0, "age_years": 15},
    {"sector": "Gazcue", "area_m2": 95, "bedrooms": 2, "bathrooms": 2, "parking_spots": 1, "furnished": 1, "age_years": 30},
]
df = pd.DataFrame(cases)[["sector"] + NUMERIC]
preds = pipeline.predict(df)
params["reference_cases"] = [
    {"input": case, "expected": float(pred)} for case, pred in zip(cases, preds)
]

with open(OUT, "w", encoding="utf-8") as fh:
    json.dump(params, fh, ensure_ascii=False, indent=2)

print(f"Sectors: {len(sectors)}, coefs: {len(model.coef_)}, intercept: {model.intercept_:.2f}")
for case, pred in zip(cases, preds):
    print(f"  {case['sector']:<12} -> RD$ {pred:,.2f}")
print(f"Saved: {OUT}")
