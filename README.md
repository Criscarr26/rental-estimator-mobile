# Tasador SD - Mobile

Mobile app (iOS/Android) for the [Santo Domingo rental price estimator](https://github.com/Criscarr26/rental-price-estimator-sd). Enter a property's sector, size and features and get an instant monthly rent estimate in DOP, with a confidence range and a comparison against the sector average. Every estimate is logged automatically to the cloud, keeping a searchable history of what each client looked for.

Built with Expo (React Native + TypeScript) and Supabase.

## How it works

- The trained scikit-learn pipeline (OneHotEncoder + StandardScaler + LinearRegression, R² 0.93 on the test split) is exported to `assets/model_params.json` by `scripts/export_model.py`. The app computes predictions **on device** — no inference server, works offline.
- `scripts/verify-model.mjs` checks the TypeScript port against reference predictions produced by the real Python pipeline.
- Supabase provides email/password auth and a `saved_estimates` table with Row Level Security, so each user only sees their own saved estimates. The Estimate tab works without any cloud configuration.

## Project structure

```
src/app/          expo-router screens: index (Estimar), saved (Guardadas)
src/lib/          model port, Supabase client, session context
src/components/   sector picker
assets/           model_params.json (exported model weights)
scripts/          export_model.py, verify-model.mjs
supabase/         schema.sql (table + RLS policies)
```

## Getting started

1. Install dependencies: `npm install`
2. Cloud setup (optional, needed only for saving):
   - Create a free project at [supabase.com](https://supabase.com).
   - Run `supabase/schema.sql` in the SQL Editor.
   - For quick testing, disable "Confirm email" under Authentication > Sign In / Up.
   - Copy `.env.example` to `.env` and fill in the Project URL and anon key.
3. Start the dev server: `npx expo start`
4. Scan the QR code with the [Expo Go](https://expo.dev/go) app (same Wi-Fi network).

## Verification

```
npx tsc --noEmit          # type check
node scripts/verify-model.mjs   # model port matches the Python pipeline
```

## Retraining

When the model is retrained in the estimator repo, re-export the weights:

```
python scripts/export_model.py <path-to-rental-price-estimator-sd>
```
